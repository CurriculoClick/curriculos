@echo off
echo ====================================================
echo SISTEMA DE ENVIO SEGURO - CURRICULOCLICK
echo ====================================================
echo.
echo Sincronizando dados dos curriculos com a nuvem...
echo.

git pull origin main --rebase
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERRO CRITICO] Ocorreu um erro ao tentar baixar os novos curriculos.
    echo Por favor, avise ao suporte antes de enviar qualquer atualizacao de codigo!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Sucesso! Os ultimos curriculos foram baixados em seguranca para a sua maquina.
echo Agora o codigo sera enviado para a nuvem.
echo.

git add .
set /p mensagem="Digite o que voce alterou no site (ex: mudanca de cor): "
git commit -m "%mensagem%"
git push origin main
git push vercel main

echo.
echo ====================================================
echo ENVIO CONCLUIDO COM SUCESSO!
echo ====================================================
pause
