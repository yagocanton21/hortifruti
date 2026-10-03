from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.models.produto import Produto, UnidadeVenda
from app.models.usuario import PerfilUsuario, Usuario
from app.services.auth_service import criar_token_acesso, gerar_hash_senha


@pytest.fixture
def auth_headers_gerente(db_session):
    usuario = Usuario(
        nome="Gerente Teste",
        username="gerente_estoque",
        senha_hash=gerar_hash_senha("senha123"),
        perfil=PerfilUsuario.GERENTE,
        ativo=True,
    )
    db_session.add(usuario)
    db_session.commit()
    db_session.refresh(usuario)
    token = criar_token_acesso(usuario)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_operador(db_session):
    usuario = Usuario(
        nome="Operador Teste",
        username="operador_estoque",
        senha_hash=gerar_hash_senha("senha123"),
        perfil=PerfilUsuario.OPERADOR,
        ativo=True,
    )
    db_session.add(usuario)
    db_session.commit()
    db_session.refresh(usuario)
    token = criar_token_acesso(usuario)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def produto_banana(db_session):
    p = Produto(
        codigo_interno="0010",
        nome="Banana Prata",
        unidade_venda=UnidadeVenda.KG,
        preco_atual=Decimal("6.99"),
        estoque_atual=Decimal("20.000"),
        estoque_minimo=Decimal("5.000"),
        controla_estoque=True,
        ativo=True,
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


def test_movimentacao_entrada_e_perda(client: TestClient, auth_headers_gerente, produto_banana):
    # Entrada de 15.5 kg
    resp = client.post(
        "/api/estoque/movimentacao",
        headers=auth_headers_gerente,
        json={
            "produto_id": produto_banana.id,
            "tipo": "ENTRADA",
            "quantidade": 15.5,
            "motivo": "Compra Ceasa",
        },
    )
    assert resp.status_code == 201
    dados = resp.json()
    assert float(dados["estoque_anterior"]) == 20.0
    assert float(dados["estoque_posterior"]) == 35.5

    # Perda de 2.5 kg (hortifruti estragado)
    resp_perda = client.post(
        "/api/estoque/movimentacao",
        headers=auth_headers_gerente,
        json={
            "produto_id": produto_banana.id,
            "tipo": "PERDA",
            "quantidade": 2.5,
            "motivo": "Maduras demais e machucadas",
        },
    )
    assert resp_perda.status_code == 201
    dados_perda = resp_perda.json()
    assert float(dados_perda["estoque_posterior"]) == 33.0


def test_baixa_automatica_na_venda_e_estorno(client: TestClient, auth_headers_gerente, produto_banana):
    # Venda de 4.0 kg no PDV
    venda_payload = {
        "forma_pagamento": "DINHEIRO",
        "valor_pago": 50.00,
        "desconto": 0.00,
        "itens": [
            {
                "produto_id": produto_banana.id,
                "codigo_interno": produto_banana.codigo_interno,
                "nome": produto_banana.nome,
                "unidade_venda": produto_banana.unidade_venda.value,
                "quantidade_ou_peso": 4.000,
                "preco_unitario": 6.99,
            }
        ],
    }

    resp_venda = client.post("/api/vendas", headers=auth_headers_gerente, json=venda_payload)
    assert resp_venda.status_code == 201
    venda_id = resp_venda.json()["id"]

    # Verifica se o estoque baixou de 20 para 16
    resp_estoque = client.get("/api/estoque", headers=auth_headers_gerente, params={"busca": "Banana"})
    assert resp_estoque.status_code == 200
    item = resp_estoque.json()[0]
    assert float(item["estoque_atual"]) == 16.0
    assert item["status_estoque"] == "NORMAL"

    # Cancela a venda e verifica se o estoque voltou para 20
    resp_canc = client.post(
        f"/api/vendas/{venda_id}/cancelar",
        headers=auth_headers_gerente,
        json={"motivo": "Desistência do cliente"},
    )
    assert resp_canc.status_code == 200

    resp_estoque_pos = client.get("/api/estoque", headers=auth_headers_gerente, params={"busca": "Banana"})
    item_pos = resp_estoque_pos.json()[0]
    assert float(item_pos["estoque_atual"]) == 20.0


def test_operador_nao_pode_ajustar_estoque(client: TestClient, auth_headers_operador, produto_banana):
    resp = client.post(
        "/api/estoque/movimentacao",
        headers=auth_headers_operador,
        json={
            "produto_id": produto_banana.id,
            "tipo": "ENTRADA",
            "quantidade": 10.0,
        },
    )
    assert resp.status_code == 403
