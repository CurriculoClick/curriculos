export default async function handler(req, res) {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const origin = `${proto}://${host}`;

    const { id } = req.query;

    // Busca o index.html original da própria Vercel
    let html = '';
    try {
        const indexRes = await fetch(`${origin}/index.html`);
        if (indexRes.ok) {
            html = await indexRes.text();
        } else {
            return res.status(500).send('Erro ao carregar HTML base');
        }
    } catch(err) {
        return res.status(500).send('Falha de rede ao carregar HTML base');
    }

    if (!id) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
        return res.status(200).send(html);
    }

    const idNormalizado = id.replace(/^curriculo[_-]/i, '').replace(/_/g, '-');

    let titulo = 'Currículo Click – Currículo Profissional';
    let descricao = 'Confira este currículo profissional criado com Currículo Click.';
    let fotoUrl = `${origin}/ativos/imagens/og-default.png`;

    try {
        const localUrl = `${origin}/dados/${idNormalizado}.json`;
        const localRes = await fetch(localUrl);
        
        if (localRes.ok) {
            const dados = await localRes.json();
            const nome = (dados.inicio && dados.inicio.nome) || 'Currículo Profissional';
            const profissao = (dados.inicio && dados.inicio.profissao) || '';
            const foto = (dados.inicio && dados.inicio.foto_perfil) || '';
            const perfil = (dados.perfil && dados.perfil.descricao) || '';

            titulo = profissao ? `${nome} | ${profissao} – Currículo Click` : `${nome} – Currículo Click`;
            descricao = (perfil || `Confira o currículo profissional de ${nome}`).substring(0, 160);
            
            if (foto) {
                fotoUrl = `${origin}/${foto.replace(/^\/+/, '')}`;
            }
        }
    } catch (e) {
        console.error('Erro ao buscar metadados JSON:', e);
    }

    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
    const ogBlock = `
    <meta property="og:type" content="profile">
    <meta property="og:title" content="${esc(titulo)}">
    <meta property="og:description" content="${esc(descricao)}">
    <meta property="og:image" content="${esc(fotoUrl)}">
    <meta property="og:image:width" content="800">
    <meta property="og:image:height" content="800">
    <meta property="og:url" content="${origin}/?id=${id}">
    <meta property="og:site_name" content="Currículo Click">
    <meta property="og:locale" content="pt_BR">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(titulo)}">
    <meta name="twitter:description" content="${esc(descricao)}">
    <meta name="twitter:image" content="${esc(fotoUrl)}">`;

    // Remove tags OG e Twitter antigas para não duplicar, independentemente da ordem dos atributos
    const htmlModificado = html
        .replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(titulo)}</title>`)
        .replace(/<meta[^>]*property=["']og:[^>]*>/gi, '')
        .replace(/<meta[^>]*name=["']twitter:[^>]*>/gi, '')
        .replace('</head>', `${ogBlock}\n</head>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).send(htmlModificado);
}
