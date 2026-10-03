@echo off
chcp 65001 > nul
title Hortifruti - Inicializador do Sistema

echo ===================================================
echo             HORTIFRUTI - INICIALIZANDO
echo ===================================================
echo.

docker info >nul 2>&1
if errorlevel 1 (
    echo [ERRO] O Docker Desktop não está rodando!
    echo Por favor, abra o Docker Desktop e tente novamente.
    echo.
    pause
    exit /b 1
)

echo [1/3] Subindo serviços locais (Banco, API e Frente de Caixa)...
docker compose up -d

echo.
echo [2/3] Aplicando migrações e atualizações...
docker compose exec -T backend alembic upgrade head >nul 2>&1

echo.
echo [3/3] Abrindo o sistema no navegador...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ===================================================
echo       SISTEMA PRONTO E DISPONÍVEL!
echo ===================================================
echo.
echo  Acesse pelo navegador: http://localhost:5173
echo.
echo  CREDENCIAIS PADRÃO:
echo   - GERENTE:
echo       Usuário: admin
echo       Senha:   admin
echo.
echo   - OPERADOR DE CAIXA:
echo       Usuário: caixa
echo       Senha:   123
echo.
echo ===================================================
echo  Pressione qualquer tecla para encerrar esta janela.
pause > nul
