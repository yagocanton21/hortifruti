# Hortifruti

Fundação do sistema local com React, FastAPI e PostgreSQL em serviços separados.

## Pré-requisito

- Docker Desktop com Docker Compose

## Executar

1. Copie `.env.example` para `.env` e ajuste a senha (o repositório já inclui um `.env` de desenvolvimento local).
2. Inicie os serviços:

   ```bash
   docker compose up --build
   ```

3. Abra:

   - Frontend: http://localhost:5173
   - Documentação da API: http://localhost:8000/docs
   - Saúde da API e banco: http://localhost:8000/api/health

Encerre com `docker compose down`. Os dados permanecem no volume nomeado `hortifruti_postgres_data`. Apenas `docker compose down -v` remove o volume e seus dados.

## Diagnóstico

```bash
docker compose ps
docker compose logs backend
docker compose logs db
docker compose logs frontend
```

Se uma porta estiver ocupada, encerre o programa que usa `5173` ou `8000`, ou altere o mapeamento correspondente no `docker-compose.yml`.

## Alembic

O Alembic já está configurado, mas ainda não existe tabela nesta etapa. Quando o modelo de produtos for criado:

```bash
docker compose exec backend alembic revision --autogenerate -m "cria tabela produtos"
docker compose exec backend alembic upgrade head
```

## Persistência, backup e migração

O PostgreSQL grava em `/var/lib/postgresql/data` dentro do volume Docker `hortifruti_postgres_data`. O volume preserva os dados entre `down` e `up`, mas não substitui backup.

Backup lógico:

```bash
docker compose exec -T db pg_dump -U hortifruti -d hortifruti > hortifruti.sql
```

Restauração em um banco vazio:

```bash
docker compose exec -T db psql -U hortifruti -d hortifruti < hortifruti.sql
```

O arquivo gerado pelo `pg_dump` pode ser copiado para outro servidor e restaurado com uma versão compatível do PostgreSQL.
