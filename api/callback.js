// api/callback.js
export default async function handler(req, res) {
  const { code } = req.query;
  const client_id = process.env.OAUTH_CLIENT_ID;
  const client_secret = process.env.OAUTH_CLIENT_SECRET;

  try {
    // Usando fetch nativo para evitar dependências externas
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code,
      }),
    });

    const data = await response.json();
    const { access_token, error } = data;

    if (error) {
      return res.status(400).send(`Erro do GitHub: ${error}`);
    }

    // Scripts para enviar o token de volta para a janela do CMS
    const content = `
      <html>
        <body>
          <script>
            (function() {
              function receiveMessage(e) {
                console.log("Recebendo mensagem do host: ", e.origin);
                window.opener.postMessage(
                  'authorization:github:success:${JSON.stringify({
                    token: access_token,
                    provider: 'github',
                  })}',
                  e.origin
                );
              }
              window.addEventListener("message", receiveMessage, false);
              window.opener.postMessage("authorizing:github", "*");
            })()
          </script>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(content);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro interno ao processar autenticação.');
  }
}
