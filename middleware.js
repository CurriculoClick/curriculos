/**
 * CurriculoClick – Vercel Edge Middleware: middleware.js
 * 
 * Intercepta requisições para a raiz e injeta metatags dinâmicas.
 * Versão simplificada (sem dependências externas de build).
 */

export default async function middleware(req) {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    // Se não houver ID, deixa passar para o arquivo estático
    if (!id) {
        return; 
    }

    // Normaliza o ID
    const idNormalizado = id.replace(/^curriculo[_-]/i, '').replace(/_/g, '-');

    try {
        // Busca o index.html original
        const indexRes = await fetch(new URL('/index.html', url.origin));
        if (!indexRes.ok) return;
        
        let html = await indexRes.text();

        // Dados padrão
        let titulo = 'Currículo Click – Currículo Profissional';
        let descricao = 'Confira este currículo profissional criado com Currículo Click.';
        let fotoUrl = `${url.origin}/ativos/imagens/og-default.png`;

        // Busca o JSON dos dados do candidato
        const jsonUrl = `${url.origin}/dados/${idNormalizado}.json`;
        const jsonRes = await fetch(jsonUrl);

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
    <meta property="og:title" content="${esc(titulo)}">
    <meta property="og:description" content="${esc(descricao)}">
    <meta property="og:image" content="${esc(fotoUrl)}">
    <meta property="og:url" content="${url.toString()}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(titulo)}">
    <meta name="twitter:description" content="${esc(descricao)}">
    <meta name="twitter:image" content="${esc(fotoUrl)}">`;

        const htmlModificado = html
            .replace(/<meta id="og-title"[\s\S]*?<meta id="tw-image"[^>]*>/i, '') 
            .replace('</head>', `${ogBlock}\n</head>`);

        return new Response(htmlModificado, {
            headers: { 'content-type': 'text/html; charset=utf-8' },
        });

    } catch (e) {
        console.error('Erro no Middleware:', e);
        return;
    }
}

export const config = {
    matcher: '/',
};
