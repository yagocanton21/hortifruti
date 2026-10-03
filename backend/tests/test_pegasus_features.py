from decimal import Decimal
import pytest


def obter_token_admin(client):
    res = client.post("/api/auth/login", json={"username": "admin", "senha": "admin"})
    return res.json()["access_token"]


def test_fluxo_clientes_e_fiados(client):
    token = obter_token_admin(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Cadastra cliente
    cliente_dados = {
        "nome": "Dona Maria da Silva",
        "cpf_cnpj": "123.456.789-00",
        "telefone": "(11) 98765-4321",
        "endereco": "Rua das Flores, 120",
        "limite_credito": "200.00",
    }
    res_cliente = client.post("/api/clientes", json=cliente_dados, headers=headers)
    assert res_cliente.status_code == 201
    cliente = res_cliente.json()
    assert cliente["saldo_devedor"] == "0.00"

    # 2. Realiza venda na modalidade FIADO
    venda_dados = {
        "forma_pagamento": "FIADO",
        "valor_pago": "0.00",
        "desconto": "0.00",
        "cliente_id": cliente["id"],
        "itens": [
            {
                "codigo_interno": "BAN01",
                "nome": "Banana Nanica",
                "unidade_venda": "KG",
                "quantidade_ou_peso": "2.000",
                "preco_unitario": "15.00",
            }
        ],
    }
    res_venda = client.post("/api/vendas", json=venda_dados, headers=headers)
    assert res_venda.status_code == 201
    venda = res_venda.json()
    assert venda["forma_pagamento"] == "FIADO"

    # 3. Verifica saldo devedor do cliente (deve ser 30.00)
    cliente_atualizado = client.get(f"/api/clientes/{cliente['id']}", headers=headers).json()
    assert Decimal(cliente_atualizado["saldo_devedor"]) == Decimal("30.00")

    # 4. Tenta compra que excede o limite de crédito (limite era 200, já usou 30, tenta comprar 250)
    venda_excesso = {
        "forma_pagamento": "FIADO",
        "valor_pago": "0.00",
        "desconto": "0.00",
        "cliente_id": cliente["id"],
        "itens": [
            {
                "codigo_interno": "PROD_CARO",
                "nome": "Cesta Especial",
                "unidade_venda": "UN",
                "quantidade_ou_peso": "1.000",
                "preco_unitario": "250.00",
            }
        ],
    }
    res_excesso = client.post("/api/vendas", json=venda_excesso, headers=headers)
    assert res_excesso.status_code == 422
    assert "Limite de crédito excedido" in res_excesso.json()["detail"]

    # 5. Cliente paga R$ 20,00 da conta
    res_pag = client.post(
        f"/api/clientes/{cliente['id']}/pagamento",
        json={"valor": "20.00", "observacao": "Pagamento parcial na sexta"},
        headers=headers,
    )
    assert res_pag.status_code == 200

    # 6. Saldo devedor deve ter caído para R$ 10,00
    cliente_final = client.get(f"/api/clientes/{cliente['id']}", headers=headers).json()
    assert Decimal(cliente_final["saldo_devedor"]) == Decimal("10.00")

    # 7. Consulta extrato de lançamentos
    res_extrato = client.get(f"/api/clientes/{cliente['id']}/extrato", headers=headers)
    assert res_extrato.status_code == 200
    extrato = res_extrato.json()
    assert len(extrato) >= 2


def test_cancelamento_de_venda_com_estorno(client):
    token = obter_token_admin(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Cria uma venda
    venda_dados = {
        "forma_pagamento": "DINHEIRO",
        "valor_pago": "50.00",
        "desconto": "0.00",
        "itens": [
            {
                "codigo_interno": "ITEM_CANC",
                "nome": "Produto para Cancelar",
                "unidade_venda": "UN",
                "quantidade_ou_peso": "1.000",
                "preco_unitario": "40.00",
            }
        ],
    }
    venda = client.post("/api/vendas", json=venda_dados, headers=headers).json()

    # 2. Cancela a venda informando motivo
    res_canc = client.post(
        f"/api/vendas/{venda['id']}/cancelar",
        json={"motivo": "Cliente desistiu antes de embalar"},
        headers=headers,
    )
    assert res_canc.status_code == 200
    venda_cancelada = res_canc.json()
    assert venda_cancelada["status"] == "CANCELADA"
    assert venda_cancelada["motivo_cancelamento"] == "Cliente desistiu antes de embalar"

    # 3. Tentar cancelar de novo deve falhar
    res_dup = client.post(
        f"/api/vendas/{venda['id']}/cancelar",
        json={"motivo": "Outro motivo"},
        headers=headers,
    )
    assert res_dup.status_code == 400


def test_promocoes_produtos(client):
    token = obter_token_admin(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Cadastra produto
    produto = client.post(
        "/api/produtos",
        json={
            "codigo_interno": "PROM01",
            "nome": "Melancia Comprida",
            "unidade_venda": "KG",
            "preco_atual": "4.99",
            "ativo": True,
        },
        headers=headers,
    ).json()

    # 2. Cadastra promoção
    promocao_dados = {
        "nome": "Quarta da Feira - Melancia",
        "produto_id": produto["id"],
        "preco_promocional": "2.99",
        "ativa": True,
    }
    res_promo = client.post("/api/promocoes", json=promocao_dados, headers=headers)
    assert res_promo.status_code == 201
    promocao = res_promo.json()
    assert promocao["preco_promocional"] == "2.99"

    # 3. Listar promoções
    lista = client.get("/api/promocoes", headers=headers).json()
    assert len(lista) >= 1

    # 4. Alternar status da promoção
    res_status = client.post(f"/api/promocoes/{promocao['id']}/alternar-status", headers=headers)
    assert res_status.status_code == 200
