# Curriculo Click

**Versão atual: 1.0.0**

## Descrição
Sistema de currículo web estático e dinâmico com suporte a Netlify CMS.

## Estrutura de Pastas
- **src/**: fonte do projeto (HTML, CSS, JS, dados, admin etc.).
- **public/**: saída do build, usada para deploy.
- **recursos/**: templates e arquivos auxiliares (não serão publicados).

> **Regra**: sempre que o projeto mudar alguma função ou fluxo de trabalho, atualize o CHANGELOG e incremente a versão acima.

## Pré-requisitos
- Node.js (v14+)
- npm ou Yarn
- PowerShell (Windows)

## Instalação e Desenvolvimento
1. Clone o repositório:
   ```bash
   git clone <repo-url>
   cd <diretório-do-projeto>
   ```
2. Mova todo o conteúdo atual para a pasta `src/`:
   ```bash
   mkdir src
   mv index.html src/
   mv ativos/ src/
   mv dados/ src/
   mv admin/ src/
   mv netlify.toml src/
   mv .gitignore src/
   mv local.config.example.json src/
   # ajuste conforme necessário
   ```
3. Instale dependências:
   ```bash
   npm install
   ```
4. Abra em modo de desenvolvimento (live reload):
   ```bash
   npm run dev
   ```

## Build e Deploy
1. Gere o build:
   ```bash
   npm run build
   ```
2. O comando de build limpa `public/`, copia `src/` para `public/` ignorando a pasta `recursos/`, e produz os assets finais.
3. Configure o Netlify para usar `public/` como diretório de publicação (ver `netlify.toml`).

## Variáveis de Ambiente
Defina no Netlify (Settings → Build & deploy → Environment) ou em um arquivo `.env`:
- **NETLIFY_SITE_ID**: ID do site no Netlify
- **NETLIFY_DEPLOY_TOKEN**: token para deploy automatizado

## Credenciais e Segredos
Arquivos de credenciais devem ficar na pasta `recursos/` (ou em `src/recursos/`) e serem incluídos no `.gitignore`. Como `recursos/` não é copiado ao build, essas chaves não serão publicadas.

## Versionamento e Changelog
Veja o [CHANGELOG.md](./CHANGELOG.md) para o histórico de versões. Utilize [Semantic Versioning](https://semver.org/):
```
MAJOR.MINOR.PATCH
```
- Incrementar **MAJOR** ao fazer mudanças incompatíveis.
- Incrementar **MINOR** ao adicionar funcionalidade sem quebra.
- Incrementar **PATCH** para correções e ajustes.

Toda mudança deve ser documentada no CHANGELOG e refletida na versão deste README.

## Contribuição
1. Crie uma branch: `feature/vX.Y.Z-descricao`
2. Faça as alterações e atualize `CHANGELOG.md` e a versão no README.
3. Abra um Pull Request com descrição clara do que foi alterado.
4. Após revisão e merge, a pipeline de CI publicará em `public/`. 