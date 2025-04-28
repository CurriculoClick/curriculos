# Regras de Deploy e Versionamento

## Atualização do Changelog

Sempre que um deploy for realizado, é obrigatório seguir estas etapas:

1. **Atualizar o CHANGELOG.md**:
   - Adicionar uma nova seção com a versão seguindo o padrão:
     ```markdown
     ## [X.Y.Z] - YYYY-MM-DD
     ### Adicionado
     - Lista de novos arquivos/funcionalidades
     
     ### Alterado
     - Lista de arquivos modificados
     
     ### Deploy
     - Informações sobre o deploy (branch, repositório, etc.)
     ```

2. **Atualizar o README.md**:
   - Atualizar a tag `**Versão atual: X.Y.Z**` no início do arquivo

3. **Versionamento**:
   - Seguir o [Semantic Versioning](https://semver.org/):
     - **MAJOR**: mudanças incompatíveis
     - **MINOR**: novas funcionalidades sem quebra
     - **PATCH**: correções e ajustes

4. **Commit e Push**:
   - Fazer commit das alterações no CHANGELOG.md e README.md
   - Mensagem do commit deve seguir o padrão: "Atualização da documentação: versão X.Y.Z"
   - Fazer push para o repositório remoto

## Exemplo de Fluxo

```bash
# 1. Atualizar CHANGELOG.md
# 2. Atualizar README.md
# 3. Adicionar arquivos modificados
git add CHANGELOG.md README.md

# 4. Fazer commit
git commit -m "Atualização da documentação: versão X.Y.Z"

# 5. Fazer push
git push origin <branch>
```

## Verificação

Antes de finalizar o deploy, verifique se:
- [ ] O CHANGELOG.md foi atualizado
- [ ] O README.md foi atualizado
- [ ] A versão foi incrementada corretamente
- [ ] As alterações foram commitadas e enviadas 