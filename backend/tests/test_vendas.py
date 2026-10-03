def test_criar_e_listar_venda(client):
    produto = client.post(
        "/api/produtos",
        json={
            "codigo_interno": "VND01",
            "nome": "Manga Palmer",
            "unidade_venda": "KG",
            "preco_atual": "10.00",
            "ativo": True,
        },
    ).json()

    venda_dados = {
        "forma_pagamento": "DINHEIRO",
        "valor_pago": "20.00",
        "desconto": "0.00",
        "itens": [
            {
                "produto_id": produto["id"],
                "codigo_interno": produto["codigo_interno"],
                "nome": produto["nome"],
                "unidade_venda": produto["unidade_venda"],
                "quantidade_ou_peso": "1.500",
                "preco_unitario": "10.00",
            }
        ],
    }

    response = client.post("/api/vendas", json=venda_dados)
    assert response.status_code == 201
    venda = response.json()

    assert venda["subtotal"] == "15.00"
    assert venda["total"] == "15.00"
    assert venda["valor_pago"] == "20.00"
    assert venda["troco"] == "5.00"
    assert venda["forma_pagamento"] == "DINHEIRO"
    assert venda["status"] == "FINALIZADA"
    assert len(venda["itens"]) == 1
    assert venda["itens"][0]["nome"] == "Manga Palmer"
    assert venda["itens"][0]["subtotal"] == "15.00"

    # buscar venda
    busca = client.get(f"/api/vendas/{venda['id']}")
    assert busca.status_code == 200
    assert busca.json()["codigo_venda"] == venda["codigo_venda"]

    # listar vendas
    lista = client.get("/api/vendas")
    assert lista.status_code == 200
    assert len(lista.json()) >= 1


def test_venda_valor_pago_insuficiente_retorna_422(client):
    venda_dados = {
        "forma_pagamento": "DINHEIRO",
        "valor_pago": "5.00",
        "desconto": "0.00",
        "itens": [
            {
                "codigo_interno": "0001",
                "nome": "Produto Teste",
                "unidade_venda": "UN",
                "quantidade_ou_peso": "1.000",
                "preco_unitario": "10.00",
            }
        ],
    }

    response = client.post("/api/vendas", json=venda_dados)
    assert response.status_code == 422


def test_resumo_de_vendas_e_filtros(client):
    res_resumo = client.get("/api/vendas/resumo")
    assert res_resumo.status_code == 200
    dados = res_resumo.json()
    assert "total_faturado" in dados
    assert "ticket_medio" in dados
    assert "total_vendas" in dados

    res_filtro = client.get("/api/vendas?forma_pagamento=DINHEIRO&limite=10")
    assert res_filtro.status_code == 200
    assert isinstance(res_filtro.json(), list)

