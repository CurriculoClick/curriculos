export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) {
        // Se não tem ID, serve o index.html original como se fosse o Vercel padrão
        const fallbackRes = await fetch(`https://${req.headers.host}/index.html`);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(await fallbackRes.text());
    }

    const idNormalizado = id.replace(/^curriculo[_-]/i, '').replace(/_/g, '-');
    
    // Busca o index.html original da própria Vercel
    let html = '';
    try {
        const indexRes = await fetch(`https://${req.headers.host}/index.html`);
        if (indexRes.ok) {
            html = await indexRes.text();
        } else {
            return res.status(500).send('Error loading index HTML');
        }
    } catch(err) {
        return res.status(500).send('Error fetching index HTML');
    }

    let titulo = 'Currículo Click – Currículo Profissional';
    let descricao = 'Confira este currículo profissional criado com Currículo Click.';
    let fotoUrl = `https://${req.headers.host}/ativos/imagens/og-default.png`;

    try {
        const localUrl = `https://${req.headers.host}/dados/${idNormalizado}.json`;
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
                fotoUrl = `https://${req.headers.host}/${foto.replace(/^\/+/, '')}`;
            }
        } else {
            console.error('Erro na resposta do localUrl:', localRes.status, localRes.statusText);
            titulo = `Erro de Resposta: ${localRes.status}`; // Para forçar a exibição no teste
        }
    } catch (e) {
        console.error('Exceção ao buscar metadados JSON:', e.message);
        titulo = `Exceção: ${e.message}`; // Exibir no OG tag para debugar
    }

    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
    const ogBlock = `
    <!-- Metatags Dinâmicas Injetadas via Vercel Serverless Function -->
    <meta property="og:type" content="profile">
    <meta property="og:title" content="${esc(titulo)}">
    <meta property="og:description" content="${esc(descricao)}">
    <meta property="og:image" content="${esc(fotoUrl)}">
    <meta property="og:url" content="https://${req.headers.host}/?id=${id}">
    <meta property="og:site_name" content="Currículo Click">
    <meta property="og:locale" content="pt_BR">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(titulo)}">
    <meta name="twitter:description" content="${esc(descricao)}">
    <meta name="twitter:image" content="${esc(fotoUrl)}">`;

    const htmlModificado = html
        .replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(titulo)}</title>`)
        .replace(/<meta id="og-type"[\s\S]*?<meta id="tw-image"[^>]*>/i, '') 
        .replace('</head>', `${ogBlock}\n</head>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // Cache da resposta no edge e no browser por 1 minuto
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).send(htmlModificado);
}
