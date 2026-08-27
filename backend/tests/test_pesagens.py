from decimal import Decimal
import re

from app.models.produto import Produto, UnidadeVenda
from app.services.pesagem_service import calcular_pesagem


def test_calculo_da_pesagem_usa_arredondamento_comercial():
    produto = Produto(
        id=1,
        codigo_interno="0001",
        nome="Tomate Italiano",
        unidade_venda=UnidadeVenda.KG,
        preco_atual=Decimal("14.90"),
        ativo=True,
    )

    resultado = calcular_pesagem(produto, Decimal("0.850"))

    assert resultado.total == Decimal("12.67")


def test_endpoint_calcula_pesagem_com_dados_do_banco(client):
    produto = client.post(
        "/api/produtos",
        json={
            "codigo_interno": "PESO01",
            "nome": "Produto Pesável",
            "unidade_venda": "KG",
            "preco_atual": "14.90",
            "ativo": True,
        },
    ).json()

    response = client.post(
        "/api/pesagens/calcular",
        json={"produto_id": produto["id"], "peso_kg": "0.850"},
    )

    assert response.status_code == 200
    assert response.json()["total"] == "12.67"


def test_endpoint_confirma_e_persiste_pesagem(client):
    produto = client.post(
        "/api/produtos",
        json={
            "codigo_interno": "PESO02",
            "nome": "Produto para confirmar",
            "unidade_venda": "KG",
            "preco_atual": "10.00",
            "ativo": True,
        },
    ).json()

    response = client.post(
        "/api/pesagens",
        json={"produto_id": produto["id"], "peso_kg": "1.250"},
    )

    assert response.status_code == 201
    assert response.json()["codigo_interno"] == "PESO02"
    assert response.json()["peso_kg"] == "1.250"
    assert response.json()["preco_kg"] == "10.00"
    assert response.json()["total"] == "12.50"
    assert response.json()["status"] == "PENDENTE"
    assert re.fullmatch(r"P\d{12}", response.json()["codigo_pesagem"])
    assert response.json()["codigo_pesagem"] != response.json()["codigo_interno"]

    consulta = client.get(f"/api/pesagens/{response.json()['id']}")
    assert consulta.status_code == 200
    assert consulta.json()["codigo_pesagem"] == response.json()["codigo_pesagem"]

    cancelamento = client.patch(f"/api/pesagens/{response.json()['id']}/cancelar")
    assert cancelamento.status_code == 200
    assert cancelamento.json()["status"] == "CANCELADA"

    novo_cancelamento = client.patch(f"/api/pesagens/{response.json()['id']}/cancelar")
    assert novo_cancelamento.status_code == 409


def test_produto_inativo_nao_pode_ser_pesado():
    produto = Produto(
        id=1,
        codigo_interno="0001",
        nome="Tomate Italiano",
        unidade_venda=UnidadeVenda.KG,
        preco_atual=Decimal("14.90"),
        ativo=False,
    )

    try:
        calcular_pesagem(produto, Decimal("1.000"))
        assert False, "deveria rejeitar produto inativo"
    except ValueError as error:
        assert "inativo" in str(error)


def test_produto_por_unidade_nao_pode_ser_pesado():
    produto = Produto(
        id=1,
        codigo_interno="0002",
        nome="Alface",
        unidade_venda=UnidadeVenda.UN,
        preco_atual=Decimal("4.50"),
        ativo=True,
    )

    try:
        calcular_pesagem(produto, Decimal("1.000"))
        assert False, "deveria rejeitar produto vendido por unidade"
    except ValueError as error:
        assert "KG" in str(error)
