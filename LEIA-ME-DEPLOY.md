# Guia de Deploy - Curriculo Click

## Estrutura Correta dos Arquivos

- Todos os arquivos e pastas do projeto devem estar na raiz do repositório.
- A pasta `private` pode ser enviada normalmente, desde que não contenha dados sensíveis.
- Não é necessário excluir nenhum arquivo ou pasta do build.
- O arquivo `package.json` deve conter o script de build conforme abaixo.

## Script de Build Padrão (package.json)

```
"scripts": {
  "build": "rm -rf public && mkdir public && cpx \"**/*\" public",
  "dev": "echo 'Desenvolvimento local: abra o index.html no navegador'"
}
```

- O comando `build` remove a pasta `public` (se existir), cria novamente e copia todo o conteúdo do projeto para dentro dela.
- O comando `dev` é apenas informativo para desenvolvimento local.

## Configuração do Netlify

- O arquivo `netlify.toml` deve conter:

```
[build]
  command = "npm run build"
  publish = "public"

[build.environment]
  NODE_VERSION = "14"
```

- O diretório de publicação deve ser `public`.
- O comando de build deve ser `npm run build`.
- O branch padrão para deploy deve ser `main`.

## Dependências Obrigatórias

- O projeto deve ter o pacote `cpx` instalado como dependência de desenvolvimento:
  - Instale com: `npm install --save-dev cpx`

## Dicas para Deploy sem Erros

- Certifique-se de que não há arquivos sensíveis na pasta `private` antes de enviar para o repositório.
- Sempre faça commit e push das alterações para o branch `main`.
- O Netlify irá rodar o comando de build e publicar o conteúdo da pasta `public`.
- Se ocorrer erro de build, verifique se o script de build está igual ao informado acima e se o `cpx` está instalado.
- Não adicione restrições de exclusão no script de build, a menos que seja realmente necessário.

## Resumo das Configurações Atuais (Padrão)
- Script de build: `rm -rf public && mkdir public && cpx "**/*" public`
- Diretório de publicação: `public`
- Comando de build: `npm run build`
- Branch de deploy: `main`
- Node.js: versão 14
- Dependência: `cpx` como devDependency

---

Sempre que for solicitado um deploy, siga este guia. Se houver erro, revise este arquivo antes de tentar outras soluções. 