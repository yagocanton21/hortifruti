def test_login_sucesso(client):
    response = client.post("/api/auth/login", json={"username": "admin", "senha": "admin"})
    assert response.status_code == 200
    dados = response.json()
    assert "access_token" in dados
    assert dados["usuario"]["username"] == "admin"
    assert dados["usuario"]["perfil"] == "GERENTE"


def test_login_senha_invalida(client):
    response = client.post("/api/auth/login", json={"username": "admin", "senha": "senha_errada"})
    assert response.status_code == 401


def test_login_usuario_inexistente(client):
    response = client.post("/api/auth/login", json={"username": "naoexiste", "senha": "123"})
    assert response.status_code == 401


def test_auth_me_com_token(client):
    login = client.post("/api/auth/login", json={"username": "admin", "senha": "admin"}).json()
    token = login["access_token"]

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["username"] == "admin"


def test_auth_me_sem_token_retorna_401(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_gerente_pode_listar_criar_e_atualizar_usuario(client):
    token_admin = client.post("/api/auth/login", json={"username": "admin", "senha": "admin"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token_admin}"}

    # 1. Listar usuários
    res_list = client.get("/api/auth/usuarios", headers=headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 2

    # 2. Criar novo operador
    novo_user = {
        "nome": "Maria do Caixa 1",
        "username": "maria_caixa",
        "senha": "senha123maria",
        "perfil": "OPERADOR",
        "ativo": True,
    }
    res_create = client.post("/api/auth/usuarios", json=novo_user, headers=headers)
    assert res_create.status_code == 201
    criado = res_create.json()
    assert criado["username"] == "maria_caixa"
    assert criado["nome"] == "Maria do Caixa 1"

    # 3. Tentar criar duplicado -> 409
    res_dup = client.post("/api/auth/usuarios", json=novo_user, headers=headers)
    assert res_dup.status_code == 409

    # 4. Atualizar nome e desativar usuário
    res_patch = client.patch(
        f"/api/auth/usuarios/{criado['id']}",
        json={"nome": "Maria Silva", "ativo": False},
        headers=headers,
    )
    assert res_patch.status_code == 200
    assert res_patch.json()["nome"] == "Maria Silva"
    assert res_patch.json()["ativo"] is False


def test_operador_nao_pode_gerenciar_usuarios(client):
    token_caixa = client.post("/api/auth/login", json={"username": "caixa", "senha": "123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token_caixa}"}

    res = client.get("/api/auth/usuarios", headers=headers)
    assert res.status_code == 403

