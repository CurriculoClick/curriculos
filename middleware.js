export default async function middleware(req) {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    // Se não houver ID, deixa passar para servir o index.html original
    if (!id) {
        return new Response(null, { headers: { 'x-middleware-next': '1' } });
    }

    const idNormalizado = id.replace(/^curriculo[_-]/i, '').replace(/_/g, '-');

    try {
        // Usa o request original no fetch. A Vercel entende que isso significa
        // buscar o recurso estático subjacente sem engatilhar o middleware novamente.
        const indexRes = await fetch(req);
        if (!indexRes.ok) return new Response(null, { headers: { 'x-middleware-next': '1' } });
        
        let html = await indexRes.text();

        // Buscar dados do JSON localmente via Vercel Edge Network
        const jsonUrl = new URL(`/dados/${idNormalizado}.json`, req.url);
        const jsonRes = await fetch(jsonUrl);

        // Dados padrão caso o JSON falhe ou não seja encontrado
        let titulo = 'Currículo Click – Currículo Profissional';
        let descricao = 'Confira este currículo profissional criado com Currículo Click.';
        let fotoUrl = `${url.origin}/ativos/imagens/og-default.png`;

        if (jsonRes.ok) {
            const dados = await jsonRes.json();
            const nome = (dados.inicio && dados.inicio.nome) || 'Currículo Profissional';
            const profissao = (dados.inicio && dados.inicio.profissao) || '';
            const foto = (dados.inicio && dados.inicio.foto_perfil) || '';
            const perfil = (dados.perfil && dados.perfil.descricao) || '';

            titulo = profissao ? `${nome} | ${profissao} – Currículo Click` : `${nome} – Currículo Click`;
            descricao = (perfil || `Confira o currículo profissional de ${nome}`).substring(0, 160);
            
            if (foto) {
                fotoUrl = `${url.origin}/${foto.replace(/^\/+/, '')}`;
            }
        }

        // Injeção de metatags
        const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            
        const ogBlock = `
    <!-- Metatags Dinâmicas Injetadas via Vercel Edge Middleware -->
    <meta property="og:type" content="profile">
    <meta property="og:title" content="${esc(titulo)}">
    <meta property="og:description" content="${esc(descricao)}">
    <meta property="og:image" content="${esc(fotoUrl)}">
    <meta property="og:url" content="${url.toString()}">
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

        return new Response(htmlModificado, {
            headers: { 'content-type': 'text/html; charset=utf-8' },
        });

    } catch (e) {
        console.error('Erro no Middleware:', e);
        return new Response(null, { headers: { 'x-middleware-next': '1' } });
    }
}

export const config = {
    matcher: ['/', '/index.html'],
};
