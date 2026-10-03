from decimal import Decimal
import pytest


def test_leigo_tenta_cadastrar_produto_com_espacos_ou_nome_vazio(client):
    # Produto com nome vazio ou só espaços
    res = client.post(
        "/api/produtos",
        json={
            "codigo_interno": "LEIGO01",
            "nome": "   ",
            "unidade_venda": "KG",
            "preco_atual": "5.00",
            "ativo": True,
        },
    )
    assert res.status_code == 422


def test_leigo_tenta_cadastrar_produto_com_preco_negativo(client):
    res = client.post(
        "/api/produtos",
        json={
            "codigo_interno": "LEIGO02",
            "nome": "Banana Negativa",
            "unidade_venda": "KG",
            "preco_atual": "-10.00",
            "ativo": True,
        },
    )
    assert res.status_code == 422


def test_leigo_tenta_cadastrar_produto_com_codigo_duplicado(client):
    produto = {
        "codigo_interno": "DUP01",
        "nome": "Produto Original",
        "unidade_venda": "UN",
        "preco_atual": "3.50",
        "ativo": True,
    }
    res1 = client.post("/api/produtos", json=produto)
    assert res1.status_code == 201

    res2 = client.post("/api/produtos", json=produto)
    assert res2.status_code == 409
    assert "código interno" in res2.json()["detail"].lower()


def test_leigo_tenta_venda_sem_itens(client):
    res = client.post(
        "/api/vendas",
        json={
            "forma_pagamento": "DINHEIRO",
            "valor_pago": "50.00",
            "desconto": "0.00",
            "itens": [],
        },
    )
    assert res.status_code == 422


def test_leigo_tenta_venda_com_valor_insuficiente(client):
    res = client.post(
        "/api/vendas",
        json={
            "forma_pagamento": "DINHEIRO",
            "valor_pago": "5.00",
            "desconto": "0.00",
            "itens": [
                {
                    "codigo_interno": "2003",
                    "nome": "Abacaxi",
                    "unidade_venda": "UN",
                    "quantidade_ou_peso": "1.000",
                    "preco_unitario": "10.00",
                }
            ],
        },
    )
    assert res.status_code == 422
    assert "menor que o total" in res.json()["detail"]


def test_leigo_tenta_venda_com_desconto_negativo(client):
    res = client.post(
        "/api/vendas",
        json={
            "forma_pagamento": "DINHEIRO",
            "valor_pago": "10.00",
            "desconto": "-5.00",
            "itens": [
                {
                    "codigo_interno": "2003",
                    "nome": "Abacaxi",
                    "unidade_venda": "UN",
                    "quantidade_ou_peso": "1.000",
                    "preco_unitario": "10.00",
                }
            ],
        },
    )
    assert res.status_code == 422


def test_leigo_login_com_usuario_inexistente_ou_senha_errada(client):
    res1 = client.post("/api/auth/login", json={"username": "leigo_sem_noção", "senha": "123"})
    assert res1.status_code == 401

    res2 = client.post("/api/auth/login", json={"username": "admin", "senha": "senha_totalmente_errada"})
    assert res2.status_code == 401


def test_leigo_operador_tenta_acessar_funcao_de_gerente(client):
    # Loga como operador caixa
    login_caixa = client.post("/api/auth/login", json={"username": "caixa", "senha": "123"}).json()
    token = login_caixa["access_token"]

    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["perfil"] == "OPERADOR"


def test_leigo_tenta_desconto_maior_que_subtotal(client):
    res = client.post(
        "/api/vendas",
        json={
            "forma_pagamento": "DINHEIRO",
            "valor_pago": "50.00",
            "desconto": "25.00",
            "itens": [
                {
                    "codigo_interno": "2003",
                    "nome": "Abacaxi",
                    "unidade_venda": "UN",
                    "quantidade_ou_peso": "1.000",
                    "preco_unitario": "10.00",
                }
            ],
        },
    )
    assert res.status_code == 422
    assert "maior que o subtotal" in res.json()["detail"]


def test_leigo_tenta_venda_com_quantidade_zero_ou_negativa(client):
    res_zero = client.post(
        "/api/vendas",
        json={
            "forma_pagamento": "DINHEIRO",
            "valor_pago": "10.00",
            "desconto": "0.00",
            "itens": [
                {
                    "codigo_interno": "2003",
                    "nome": "Abacaxi",
                    "unidade_venda": "UN",
                    "quantidade_ou_peso": "0.000",
                    "preco_unitario": "10.00",
                }
            ],
        },
    )
    assert res_zero.status_code == 422

    res_neg = client.post(
        "/api/vendas",
        json={
            "forma_pagamento": "DINHEIRO",
            "valor_pago": "10.00",
            "desconto": "0.00",
            "itens": [
                {
                    "codigo_interno": "2003",
                    "nome": "Abacaxi",
                    "unidade_venda": "UN",
                    "quantidade_ou_peso": "-3.500",
                    "preco_unitario": "10.00",
                }
            ],
        },
    )
    assert res_neg.status_code == 422


def test_leigo_tenta_forma_pagamento_inexistente(client):
    res = client.post(
        "/api/vendas",
        json={
            "forma_pagamento": "FIADO_NA_CADERNETA",
            "valor_pago": "10.00",
            "desconto": "0.00",
            "itens": [
                {
                    "codigo_interno": "2003",
                    "nome": "Abacaxi",
                    "unidade_venda": "UN",
                    "quantidade_ou_peso": "1.000",
                    "preco_unitario": "10.00",
                }
            ],
        },
    )
    assert res.status_code == 422


def test_leigo_injecao_ou_caracteres_estranhos_nao_quebram_sistema(client):
    # SQL injection simples no login
    res_login = client.post(
        "/api/auth/login",
        json={"username": "' OR '1'='1' --", "senha": "password"},
    )
    assert res_login.status_code == 401

    # Busca com tags HTML ou script
    res_busca = client.get("/api/produtos?pesquisa=<script>alert('hack')</script>")
    assert res_busca.status_code == 200
    assert len(res_busca.json()) == 0

