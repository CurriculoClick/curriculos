# Script PowerShell para versionar configurações do Netlify CMS

# Navegue até a raiz do projeto antes de executar:
# cd "C:\Users\thiag\OneDrive\Área de Trabalho\Projeto Currículo Online\meu-curriculo-online-1.9.1-Cursor"

# 1) Adicionar arquivos ao staging
git add admin/index.html admin/config.yml netlify.toml

# 2) Commitar com mensagem descritiva
git commit -m "Configura Netlify CMS para Currículos Top"

# 3) Enviar para a branch principal (main)
git push origin main 