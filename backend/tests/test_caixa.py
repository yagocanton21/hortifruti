from decimal import Decimal
import pytest


def obter_token_admin(client):
    res = client.post("/api/auth/login", json={"username": "admin", "senha": "admin"})
    return res.json()["access_token"]


def test_status_caixa_inicialmente_fechado_ou_aberto(client):
    res = client.get("/api/caixa/status")
    assert res.status_code == 200
    dados = res.json()
    assert "aberto" in dados


def test_ciclo_completo_de_caixa(client):
    token = obter_token_admin(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Se houver caixa aberto de teste anterior, fecha primeiro
    status_res = client.get("/api/caixa/status").json()
    if status_res["aberto"]:
        client.post(
            "/api/caixa/fechar",
            json={"saldo_informado_gaveta": "0.00"},
            headers=headers,
        )

    # 2. Abrir caixa com R$ 100 de fundo de troco
    res_abrir = client.post(
        "/api/caixa/abrir",
        json={"saldo_inicial": "100.00"},
        headers=headers,
    )
    assert res_abrir.status_code == 201
    turno = res_abrir.json()
    assert turno["status"] == "ABERTO"
    assert Decimal(turno["saldo_inicial"]) == Decimal("100.00")

    # 3. Tentar abrir de novo deve retornar 400
    res_duplicado = client.post(
        "/api/caixa/abrir",
        json={"saldo_inicial": "50.00"},
        headers=headers,
    )
    assert res_duplicado.status_code == 400
    assert "Já existe um caixa aberto" in res_duplicado.json()["detail"]

    # 4. Realizar uma venda em dinheiro de R$ 25,00
    res_venda = client.post(
        "/api/vendas",
        json={
            "forma_pagamento": "DINHEIRO",
            "valor_pago": "30.00",
            "desconto": "0.00",
            "itens": [
                {
                    "codigo_interno": "TEST_CX",
                    "nome": "Produto Teste Caixa",
                    "unidade_venda": "UN",
                    "quantidade_ou_peso": "1.000",
                    "preco_unitario": "25.00",
                }
            ],
        },
        headers=headers,
    )
    assert res_venda.status_code == 201

    # 5. Verificar que o status do caixa agora tem R$ 125,00 (100 inicial + 25 venda)
    status_pos_venda = client.get("/api/caixa/status").json()
    assert status_pos_venda["aberto"] is True
    assert Decimal(status_pos_venda["saldo_atual_gaveta"]) == Decimal("125.00")

    # 6. Realizar Suprimento de R$ 50,00 (troco adicional)
    res_sup = client.post(
        "/api/caixa/movimentacoes",
        json={
            "tipo": "SUPRIMENTO",
            "valor": "50.00",
            "motivo": "Troco adicional em moedas",
        },
        headers=headers,
    )
    assert res_sup.status_code == 201

    # Gaveta agora deve ser R$ 175,00
    status_pos_sup = client.get("/api/caixa/status").json()
    assert Decimal(status_pos_sup["saldo_atual_gaveta"]) == Decimal("175.00")

    # 7. Tentar Sangria de valor maior que a gaveta (ex: R$ 300) -> deve barrar
    res_sangria_invalida = client.post(
        "/api/caixa/movimentacoes",
        json={
            "tipo": "SANGRIA",
            "valor": "300.00",
            "motivo": "Tentativa sangria excessiva",
        },
        headers=headers,
    )
    assert res_sangria_invalida.status_code == 400

    # 8. Sangria válida de R$ 75,00 (recolhimento para o cofre)
    res_sangria = client.post(
        "/api/caixa/movimentacoes",
        json={
            "tipo": "SANGRIA",
            "valor": "75.00",
            "motivo": "Recolhimento malote da tarde",
        },
        headers=headers,
    )
    assert res_sangria.status_code == 201

    # Gaveta agora deve ser R$ 100,00 (175 - 75)
    status_pos_sangria = client.get("/api/caixa/status").json()
    assert Decimal(status_pos_sangria["saldo_atual_gaveta"]) == Decimal("100.00")

    # 9. Fechamento de Caixa com contagem de R$ 100,00 (sem sobra nem falta)
    res_fechar = client.post(
        "/api/caixa/fechar",
        json={
            "saldo_informado_gaveta": "100.00",
            "observacoes": "Fechamento regular do turno",
        },
        headers=headers,
    )
    assert res_fechar.status_code == 200
    turno_fechado = res_fechar.json()
    assert turno_fechado["status"] == "FECHADO"
    assert Decimal(turno_fechado["diferenca_gaveta"]) == Decimal("0.00")

    # 10. Consulta relatório do turno
    res_relatorio = client.get(f"/api/caixa/relatorio/{turno_fechado['id']}")
    assert res_relatorio.status_code == 200
    assert res_relatorio.json()["id"] == turno_fechado["id"]
