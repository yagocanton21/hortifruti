PRODUTO = {
    "codigo_interno": "T9001",
    "nome": "Produto de Teste",
    "unidade_venda": "KG",
    "preco_atual": "10.50",
    "ativo": True,
}


def cadastrar(client, dados=None):
    response = client.post("/api/produtos", json=dados or PRODUTO)
    assert response.status_code == 201
    return response.json()


def test_cadastrar_e_buscar_produto(client):
    criado = cadastrar(client)

    response = client.get(f"/api/produtos/{criado['id']}")

    assert response.status_code == 200
    assert response.json()["codigo_interno"] == "T9001"
    assert response.json()["preco_atual"] == "10.50"

    historico = client.get(f"/api/produtos/{criado['id']}/historico-precos")
    assert historico.status_code == 200
    assert [item["preco"] for item in historico.json()["itens"]] == ["10.50"]
    assert historico.json()["total"] == 1


def test_codigo_interno_duplicado_retorna_409(client):
    cadastrar(client)

    response = client.post("/api/produtos", json=PRODUTO)

    assert response.status_code == 409


def test_put_substitui_todos_os_dados(client):
    criado = cadastrar(client)
    novos_dados = {
        "codigo_interno": "T9002",
        "nome": "Produto Substituído",
        "unidade_venda": "UN",
        "preco_atual": "8.75",
        "ativo": False,
    }

    response = client.put(f"/api/produtos/{criado['id']}", json=novos_dados)

    assert response.status_code == 200
    assert response.json()["nome"] == "Produto Substituído"
    assert response.json()["ativo"] is False


def test_patch_altera_somente_campos_enviados(client):
    criado = cadastrar(client)

    response = client.patch(
        f"/api/produtos/{criado['id']}",
        json={"preco_atual": "12.90", "ativo": False},
    )

    assert response.status_code == 200
    assert response.json()["codigo_interno"] == "T9001"
    assert response.json()["preco_atual"] == "12.90"
    assert response.json()["ativo"] is False

    historico = client.get(f"/api/produtos/{criado['id']}/historico-precos")
    assert [item["preco"] for item in historico.json()["itens"]] == ["12.90", "10.50"]


def test_alteracao_sem_mudar_preco_nao_duplica_historico(client):
    criado = cadastrar(client)

    response = client.patch(
        f"/api/produtos/{criado['id']}",
        json={"nome": "Novo nome"},
    )

    assert response.status_code == 200
    historico = client.get(f"/api/produtos/{criado['id']}/historico-precos")
    assert len(historico.json()["itens"]) == 1


def test_historico_de_precos_e_paginado(client):
    criado = cadastrar(client)
    for preco in ("11.00", "12.00", "13.00"):
        response = client.patch(
            f"/api/produtos/{criado['id']}",
            json={"preco_atual": preco},
        )
        assert response.status_code == 200

    response = client.get(
        f"/api/produtos/{criado['id']}/historico-precos?pagina=2&tamanho=2"
    )

    assert response.status_code == 200
    assert response.json()["pagina"] == 2
    assert response.json()["total"] == 4
    assert response.json()["total_paginas"] == 2
    assert [item["preco"] for item in response.json()["itens"]] == ["11.00", "10.50"]


def test_patch_vazio_ou_nulo_retorna_422(client):
    criado = cadastrar(client)

    assert client.patch(f"/api/produtos/{criado['id']}", json={}).status_code == 422
    assert (
        client.patch(f"/api/produtos/{criado['id']}", json={"nome": None}).status_code
        == 422
    )


def test_produto_inexistente_retorna_404(client):
    response = client.get("/api/produtos/999999999")

    assert response.status_code == 404
