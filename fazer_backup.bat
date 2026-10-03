@echo off
title Hortifruti - Backup do Banco de Dados

echo ===================================================
echo         HORTIFRUTI - BACKUP DE SEGURANCA
echo ===================================================
echo.

if not exist "backups" mkdir backups

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set dt=%%I
if defined dt (
    set TIMESTAMP=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%_%dt:~8,2%h%dt:~10,2%m
) else (
    set TIMESTAMP=%date:~6,4%-%date:~3,2%-%date:~0,2%
)

set ARQUIVO=backups\backup_hortifruti_%TIMESTAMP%.sql
set ARQUIVO=%ARQUIVO: =0%

echo Gerando copia de seguranca em: %ARQUIVO%...
docker compose exec -T db pg_dump -U hortifruti hortifruti > "%ARQUIVO%"

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao gerar o arquivo de backup!
    pause
    exit /b 1
)

echo.
echo ===================================================
echo      BACKUP REALIZADO COM SUCESSO!
echo ===================================================
echo Arquivo salvo em: %ARQUIVO%
echo.
echo Guarde este arquivo em um pendrive ou local seguro.
echo.
pause
