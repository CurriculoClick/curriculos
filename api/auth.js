// api/auth.js
export default function handler(req, res) {
  const client_id = process.env.OAUTH_CLIENT_ID;
  if (!client_id) {
    return res.status(500).send('Erro: OAUTH_CLIENT_ID não configurado na Vercel.');
  }

  const url = `https://github.com/login/oauth/authorize?client_id=${client_id}&scope=repo,user`;
  res.redirect(url);
}
