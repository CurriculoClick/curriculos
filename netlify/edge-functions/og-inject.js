/**
 * CurriculoClick – Netlify Edge Function: og-inject.js
 *
 * Intercepta toda requisição para a página principal (?id=...) e injeta
 * as meta tags Open Graph e Twitter Card corretas no HTML *antes* de
 * entregar a resposta — permitindo que crawlers do WhatsApp, LinkedIn,
 * Facebook e Twitter enxerguem a foto e o nome real do candidato.
 *
 * Deploy automático via Netlify (sem necessidade de servidor).
 */

export default async (request, context) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    // Sem parâmetro ?id= → serve normalmente sem modificação
    if (!id) {
        return context.next();
    }

    // Normaliza o id (igual ao carregarDados.js)
    const idNormalizado = id.replace(/^curriculo[_-]/i, '').replace(/_/g, '-');

    // Pega o HTML original da página
    const response = await context.next();
    const html = await response.text();

    // Valores padrão (caso o JSON não seja encontrado)
    let titulo     = 'Currículo Click – Currículo Profissional';
    let descricao  = 'Confira este currículo profissional criado com Currículo Click.';
    let fotoUrl    = `${url.origin}/ativos/imagens/og-default.png`;
    let paginaUrl  = url.toString();

    try {
        // Carrega o JSON do candidato a partir do próprio site
        const jsonUrl = `${url.origin}/dados/${idNormalizado}.json`;
        const jsonRes = await fetch(jsonUrl, { headers: { 'Cache-Control': 'no-cache' } });

        if (jsonRes.ok) {
            const dados = await jsonRes.json();

            const nome      = (dados.inicio && dados.inicio.nome)      || 'Currículo Profissional';
            const profissao = (dados.inicio && dados.inicio.profissao) || '';
            const foto      = (dados.inicio && dados.inicio.foto_perfil) || '';
            const perfil    = (dados.perfil && dados.perfil.descricao)  || '';

            // Monta título
            titulo = profissao
                ? `${nome} | ${profissao} – Currículo Click`
                : `${nome} – Currículo Click`;

            // Monta descrição (máx. 160 caracteres)
            const descBruta = perfil || `Confira o currículo profissional de ${nome}.`;
            descricao = descBruta.length > 160
                ? descBruta.substring(0, 157) + '...'
                : descBruta;

            // Monta URL absoluta da foto
            if (foto) {
                const basePath = foto.replace(/^\/+/, '');
                fotoUrl = `${url.origin}/${basePath}`;
            }
        }
    } catch (e) {
        // Erro ao buscar JSON — usa valores padrão, não quebra a requisição
        console.error('[OG Inject] Erro ao carregar JSON do candidato:', e);
    }

    // Escapa caracteres especiais para uso seguro em atributos HTML
    function esc(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // Bloco de meta tags a injetar no <head>
    const ogBlock = `
    <!-- ====================================================
         Open Graph / Social Meta Tags — geradas pelo Edge Function
         Injetadas server-side para suporte a crawlers de redes sociais
    ===================================================== -->
    <meta property="og:type"         content="profile">
    <meta property="og:url"          content="${esc(paginaUrl)}">
    <meta property="og:title"        content="${esc(titulo)}">
    <meta property="og:description"  content="${esc(descricao)}">
    <meta property="og:image"        content="${esc(fotoUrl)}">
    <meta property="og:image:width"  content="400">
    <meta property="og:image:height" content="400">
    <meta property="og:locale"       content="pt_BR">
    <meta property="og:site_name"    content="Currículo Click">
    <!-- Twitter / X Card -->
    <meta name="twitter:card"        content="summary">
    <meta name="twitter:title"       content="${esc(titulo)}">
    <meta name="twitter:description" content="${esc(descricao)}">
    <meta name="twitter:image"       content="${esc(fotoUrl)}">`;

    // Substitui as meta tags estáticas já existentes no HTML (mantém compatibilidade)
    // e injeta o bloco dinâmico logo antes do </head>
    const htmlModificado = html
        // Remove bloco og estático do index.html para não duplicar
        .replace(/<!-- ={3,}[\s\S]*?Open Graph[\s\S]*?={3,} -->[\s\S]*?<meta id="tw-image"[^>]*>/i, '')
        // Injeta bloco dinâmico antes do fechamento do <head>
        .replace('</head>', `${ogBlock}\n    </head>`);

    return new Response(htmlModificado, {
        status:  response.status,
        headers: {
            ...Object.fromEntries(response.headers.entries()),
            'content-type': 'text/html; charset=utf-8',
        },
    });
};

// Ativa este Edge Function apenas na rota raiz (o currículo)
export const config = { path: '/' };
