/**
 * CurriculoClick - Loader Dinâmico
 */

// Detecção IMEDIATA de Preview para evitar "piscada" de elementos indesejados
if (window.self !== window.top) {
    document.documentElement.classList.add('is-preview');
}

// Indicador para ativar logs de depuração em desenvolvimento
const DEBUG = false;

// Função para verificar se existe um ID na URL
function obterIdDaUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Função alternativa síncrona para carregamento local de JSON via XHR (file://)
function carregarDadosLocal(id) {
    try {
        const path = `dados/${id}.json?t=${Date.now()}`;
        const xhr = new XMLHttpRequest();
        xhr.overrideMimeType('application/json');
        xhr.open('GET', path, false); // síncrono
        xhr.send(null);
        if (xhr.status === 200 || xhr.status === 0) {
            const dados = JSON.parse(xhr.responseText);
            aplicarDadosAoCurriculo(dados);
            return true;
        } else {
            console.error('Erro XHR local, status:', xhr.status);
            return false;
        }
    } catch (e) {
        console.error('Erro no JSON local:', e);
        return false;
    }
}

// Função para carregar os dados do currículo a partir do JSON
async function carregarDadosCliente(id) {
    try {
        // Carrega JSON pelo path relativo estático com cache-buster para evitar 404 persistente
        const path = `dados/${id}.json?t=${Date.now()}`;
        if (DEBUG) console.log(`Carregando currículo (fetch estático): ${path}`);
        const resposta = await fetch(path);
        
        if (!resposta.ok) {
            if (DEBUG) console.warn(`Falha na rota estática (404). Acionando Smart Fallback Dinâmico na API public...`);
            
            // Fallback via API (Bypassa o tempo de build do GitHub Pages)
            const fallbackRepo = localStorage.getItem('cc_github_repo') || 'CurriculoClick/curriculos';
            const apiRes = await fetch(`https://api.github.com/repos/${fallbackRepo}/contents/dados/${id}.json?t=${Date.now()}`);
            
            if (!apiRes.ok) throw new Error("Fallback Dinâmico também falhou. Arquivo inexistente em todas as instâncias.");
            
            const fileData = await apiRes.json();
            const cleanedBase64 = fileData.content.replace(/\n|\r/g, ''); // Limpa quebras do repositório
            const dadosApi = JSON.parse(decodeURIComponent(escape(atob(cleanedBase64))));
            aplicarDadosAoCurriculo(dadosApi);
            return true;
        }
        
        // Se a estática der certo de primeira
        const dados = await resposta.json();
        aplicarDadosAoCurriculo(dados);
        return true;
    } catch (erro) {
        console.error("Erro absoluto ao tentar carregar dados do currículo:", erro);
        alert("O currículo acessado não encontra-se na base ou acabou de ser escrito e está propagando na rede online. O modelo genérico de amostragem será ativado.");
        return false;
    }
}

// Função para aplicar os dados do JSON ao HTML
function aplicarDadosAoCurriculo(dados) {
    // INÍCIO
    try {
        if (dados.inicio) {
            // ... (bloco inicio) ...
            const nomeParts = dados.inicio.nome.split(' ');
            const nomeFormatado = nomeParts.map((parte, idx) => idx % 2 === 1 ? `<b>${parte}</b>` : parte).join(' ');
            document.title = `Currículo Click | ${dados.inicio.nome}`;
            const tituloEl = document.querySelector('.inicio_titulo');
            if (tituloEl) tituloEl.innerHTML = nomeFormatado;
            const logoEl = document.querySelector('.navegacao_logo');
            if (logoEl) logoEl.textContent = dados.inicio.nome;
            if (dados.inicio.profissao) {
                const profissaoEl = document.querySelector('.inicio_profissao');
                if (profissaoEl) animateProfession(profissaoEl, dados.inicio.profissao);
            }
            if (dados.inicio.botao_baixar) {
                const botaoEl = document.getElementById('botao-download');
                if (botaoEl) botaoEl.textContent = dados.inicio.botao_baixar;
            }
            if (dados.inicio.foto_perfil) {
                const fotoEl = document.getElementById('inicio-imagem');
                if (fotoEl) {
                    const basePath = dados.inicio.foto_perfil.replace(/^\/+/, '');
                    fotoEl.src = `${basePath}?v=${Date.now()}`;
                    fotoEl.onerror = () => { fotoEl.onerror = null; fotoEl.src = 'ativos/imagens/placeholder.png'; };
                }
            }
            atualizarMetaTagsOG(dados);
            const idadeEl = document.getElementById('idade');
            if (dados.inicio.idade || dados.inicio.estado_civil) {
                if (idadeEl) {
                    let content = '';
                    if (dados.inicio.idade) content += `<i class="fa-solid fa-cake-candles inicio_icone"></i> ${dados.inicio.idade}`;
                    if (dados.inicio.estado_civil) {
                        content += (content ? ' ' : '') + `<i class="fa-solid fa-user inicio_icone"></i> ${dados.inicio.estado_civil}`;
                    }
                    idadeEl.innerHTML = content;
                    idadeEl.style.display = '';
                }
            }
            const cnhEl = document.getElementById('cnh');
            if (cnhEl && dados.inicio.cnh) {
                cnhEl.innerHTML = `<i class="fa-solid fa-id-card inicio_icone"></i> CNH Cat. ${dados.inicio.cnh}`;
                cnhEl.style.display = '';
            }
            const endereco = dados.inicio.endereco || dados.inicio.localizacao;
            if (endereco) {
                const localizacaoEl = document.getElementById('localizacao');
                if (localizacaoEl) localizacaoEl.innerHTML = `<i class="fa-solid fa-location-dot inicio_icone"></i> ${endereco}`;
            }
            if (dados.inicio.email) {
                const emailAnchor = document.querySelector('#email a');
                if (emailAnchor) {
                    emailAnchor.href = `mailto:${dados.inicio.email}`;
                    emailAnchor.innerHTML = `<i class="fa-solid fa-envelope inicio_icone"></i> ${dados.inicio.email}`;
                }
            }
            if (dados.inicio.telefone) {
                const telefoneAnchor = document.querySelector('#telefone a');
                if (telefoneAnchor) {
                    telefoneAnchor.href = `tel:${dados.inicio.telefone.replace(/\D/g, '')}`;
                    telefoneAnchor.innerHTML = `<i class="fa-solid fa-phone inicio_icone"></i> ${dados.inicio.telefone}`;
                }
            }
        }
    } catch (e) { console.error('Erro na seção Inicio:', e); }
    
    // REDES SOCIAIS
    const socialData = dados.social;
    if (socialData) {
        const socialContainer = document.querySelector('.redes-sociais_container');
        if (socialContainer) {
            socialContainer.innerHTML = '';
            
            function criarLinkSocial(url, label, iconClass) {
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.className = 'redes-sociais_link';
                link.innerHTML = `<i class="${iconClass} redes-sociais_icone"></i> ${label}`;
                socialContainer.appendChild(link);
            }

            const redesArray = [];

            // Suporte para FORMATO NOVO (Array)
            if (Array.isArray(socialData)) {
                socialData.forEach(item => redesArray.push(item));
            } 
            // Suporte para FORMATO LEGADO (Objeto com campos fixos do Netlify CMS)
            else if (typeof socialData === 'object') {
                // Mapeamento de campos conhecidos do config.yml
                const mapeamento = [
                    { key: 'instagram', label: 'Instagram', icon: 'fa-brands fa-instagram' },
                    { key: 'facebook', label: 'Facebook', icon: 'fa-brands fa-facebook' },
                    { key: 'linkedin', label: 'LinkedIn', icon: 'fa-brands fa-linkedin' },
                    { key: 'whatsapp', label: 'WhatsApp', icon: 'fa-brands fa-whatsapp' },
                    { key: 'youtube', label: 'YouTube', icon: 'fa-brands fa-youtube' },
                    { key: 'tiktok', label: 'TikTok', icon: 'fa-brands fa-tiktok' },
                    { key: 'github', label: 'GitHub', icon: 'fa-brands fa-github' },
                    { key: 'twitter', label: 'Twitter/X', icon: 'fa-brands fa-x' },
                    { key: 'telegram', label: 'Telegram', icon: 'fa-brands fa-telegram' },
                    { key: 'discord', label: 'Discord', icon: 'fa-brands fa-discord' }
                ];

                mapeamento.forEach(m => {
                    // Tenta encontrar URL e Label no objeto (padrao: nomeRedeUrl e nomeRedeLabel ou apenas nomeRede)
                    const url = socialData[m.key] || socialData[`${m.key}Url`];
                    const label = socialData[`${m.key}Label`] || (url && (url.startsWith('@') ? url : '@' + m.label.toLowerCase()));
                    if (url) {
                        redesArray.push({
                            rede: m.label,
                            url: url,
                            label: label,
                            iconClass: m.icon
                        });
                    }
                });
                
                // Chamada personalizada
                if (socialData.customCallUrl) {
                    redesArray.push({
                        rede: 'Link',
                        url: socialData.customCallUrl,
                        label: socialData.customCallLabel || 'Meu Link',
                        iconClass: 'fa-solid fa-link'
                    });
                }
            }

            redesArray.slice(0, 4).forEach(item => {
                const rede = item.rede || '';
                const raw = item.url || '';
                const link = item.link || '';
                const customLabel = item.label || '';
                const customIconClass = item.iconClass || '';

                if (!raw && !link) return;

                // Define texto a exibir e URL real
                let displayUser = raw;
                if (!customLabel && raw && /^https?:\/\//i.test(raw)) {
                    // Extrai usuário da URL (remove domínio e query params)
                    try {
                        const urlObj = new URL(raw);
                        displayUser = urlObj.pathname.split('/').filter(p => p && p !== 'in' && p !== '@').pop();
                        if (displayUser) displayUser = '@' + displayUser;
                        else displayUser = raw; // fallback se não conseguir extrair
                    } catch (e) {
                        displayUser = raw;
                    }
                } else if (!customLabel && !raw.startsWith('@')) {
                    displayUser = '@' + raw;
                }

                const displayName = customLabel || displayUser;
                let actualUrl;
                if (link) {
                    actualUrl = link;
                } else if (/^https?:\/\//i.test(raw)) {
                    actualUrl = raw;
                } else {
                    let baseUrl = '';
                    switch (rede) {
                        case 'GitHub': baseUrl = 'https://github.com/'; break;
                        case 'YouTube': baseUrl = 'https://www.youtube.com/'; break;
                        case 'Facebook': baseUrl = 'https://www.facebook.com/'; break;
                        case 'WhatsApp': baseUrl = 'https://wa.me/'; break;
                        case 'Instagram': baseUrl = 'https://www.instagram.com/'; break;
                        case 'TikTok': baseUrl = 'https://www.tiktok.com/@'; break;
                        case 'LinkedIn': baseUrl = 'https://www.linkedin.com/in/'; break;
                        default: break;
                    }
                    actualUrl = baseUrl + raw.replace(/^@/, '');
                }

                // Define classe de ícone
                const iconClass = customIconClass || (() => {
                    switch (rede) {
                        case 'GitHub': return 'fa-brands fa-github';
                        case 'YouTube': return 'fa-brands fa-youtube';
                        case 'Facebook': return 'fa-brands fa-facebook';
                        case 'WhatsApp': return 'fa-brands fa-whatsapp';
                        case 'Instagram': return 'fa-brands fa-instagram';
                        case 'TikTok': return 'fa-brands fa-tiktok';
                        case 'WeChat': return 'fa-brands fa-weixin';
                        case 'Facebook Messenger': return 'fa-brands fa-facebook-messenger';
                        case 'Snapchat': return 'fa-brands fa-snapchat';
                        case 'Telegram': return 'fa-brands fa-telegram';
                        case 'Twitter/X': return 'fa-brands fa-x';
                        case 'Twitch': return 'fa-brands fa-twitch';
                        case 'Slack': return 'fa-brands fa-slack';
                        case 'Spotify': return 'fa-brands fa-spotify';
                        case 'Medium': return 'fa-brands fa-medium';
                        case 'Stack Overflow': return 'fa-brands fa-stack-overflow';
                        case 'Tumblr': return 'fa-brands fa-tumblr';
                        case 'Weibo': return 'fa-brands fa-weibo';
                        case 'QQ': return 'fa-brands fa-qq';
                        case 'Pinterest': return 'fa-brands fa-pinterest';
                        case 'Reddit': return 'fa-brands fa-reddit';
                        case 'LinkedIn': return 'fa-brands fa-linkedin';
                        case 'Discord': return 'fa-brands fa-discord';
                        default: return 'fa-solid fa-link';
                    }
                })();

                if (actualUrl) {
                    try {
                        criarLinkSocial(actualUrl, displayName, iconClass);
                    } catch (e) {
                        console.warn('Erro ao criar link social:', e);
                    }
                }
            });
            
            const secaoSocial = document.querySelector('.redes-sociais');
            if (secaoSocial) secaoSocial.style.display = redesArray.length > 0 ? 'block' : 'none';
        }
    }
    
    // PERFIL
    if (dados.perfil) {
        // Tenta encontrar o título pelo ID exclusivo (mais confiável)
        const perfilTituloEl = document.getElementById('perfil-titulo-texto');
        if (perfilTituloEl && dados.perfil.titulo) {
            perfilTituloEl.textContent = dados.perfil.titulo;
        }

        const perfilDesc = document.querySelector('.perfil_descricao');
        if (perfilDesc && dados.perfil.descricao) {
            perfilDesc.textContent = dados.perfil.descricao;
        }
        
        // Ocultar seção se não houver descrição
        const secaoPerfil = document.getElementById('perfil');
        if (secaoPerfil) {
            secaoPerfil.style.display = 
                (dados.perfil.descricao && dados.perfil.descricao.trim() !== '') ? 'block' : 'none';
        }
    }
    
    // Armazena cor inicial de JSON (campo dados.inicio.corHex e dados.inicio.corNome)
    if (dados.inicio && dados.inicio.corHex) {
        window.initialColorHex = dados.inicio.corHex;
        window.initialColorName = dados.inicio.corNome;
    }
    
    // HABILIDADES
    const habData = dados.habilidades;
    const habItens = Array.isArray(habData) ? habData : (habData?.itens || []);
    const habTitulo = (typeof habData === 'object' && !Array.isArray(habData)) ? (habData.titulo || 'Habilidades') : 'Habilidades';
    
    if (document.getElementById('habilidades-titulo-texto')) document.getElementById('habilidades-titulo-texto').textContent = habTitulo;

    if (habItens && habItens.length > 0) {
        const habilidadesContainer = document.querySelector('.habilidades_conteudo');
        if (habilidadesContainer) {
            habilidadesContainer.innerHTML = '';
            
            habItens.forEach(habilidade => {
                if (!habilidade || !habilidade.nome) return;
                const div = document.createElement('div');
                div.className = 'habilidades_nome';
                div.innerHTML = `
                    <span class="habilidades_texto">${habilidade.nome}</span>
                    <div class="habilidades_barra">
                        <span class="habilidades_progresso" style="width: ${habilidade.nivel || 80}%;"></span>
                    </div>
                `;
                habilidadesContainer.appendChild(div);
            });
        }
        
        // Mostrar seção
        const secaoHabilidades = document.getElementById('habilidades');
        if (secaoHabilidades) {
            secaoHabilidades.style.display = 'block';
        }
    } else {
        // Ocultar seção se não houver habilidades
        const secaoHabilidades = document.getElementById('habilidades');
        if (secaoHabilidades) {
            secaoHabilidades.style.display = 'none';
        }
    }
    
    // IDIOMAS
    const idData = dados.idiomas;
    const idItens = Array.isArray(idData) ? idData : (idData?.itens || []);
    const idTitulo = (typeof idData === 'object' && !Array.isArray(idData)) ? (idData.titulo || 'Idiomas') : 'Idiomas';

    if (document.getElementById('idiomas-titulo-texto')) document.getElementById('idiomas-titulo-texto').textContent = idTitulo;

    if (idItens && idItens.length > 0) {
        const idiomasContainer = document.querySelector('.idiomas_conteudo');
        if (idiomasContainer) {
            idiomasContainer.innerHTML = '';
            
            idItens.forEach(idioma => {
                if (!idioma || !idioma.nome) return;
                const li = document.createElement('li');
                li.className = 'idiomas_nome';
                
                let estrelas = '';
                const numEstrelas = parseInt(idioma.estrelas) || 0;
                for (let i = 1; i <= 5; i++) {
                    if (i <= numEstrelas) {
                        estrelas += '<i class="fa-solid fa-star"></i>';
                    } else {
                        estrelas += '<i class="fa-regular fa-star idiomas_estrelas_desmarcado"></i>';
                    }
                }
                
                li.innerHTML = `
                    <span class="idiomas_texto">${idioma.nome}</span>
                    <span class="idiomas_estrelas">
                        ${estrelas}
                    </span>
                `;
                idiomasContainer.appendChild(li);
            });
        }
        
        // Mostrar seção
        const secaoIdiomas = document.getElementById('idiomas');
        if (secaoIdiomas) {
            secaoIdiomas.style.display = 'block';
        }
    } else {
        // Ocultar seção se não houver idiomas
        const secaoIdiomas = document.getElementById('idiomas');
        if (secaoIdiomas) {
            secaoIdiomas.style.display = 'none';
        }
    }
    
    // EXPERIÊNCIA PROFISSIONAL
    const expDataRaw = dados.experiencia_profissional;
    const expItens = Array.isArray(expDataRaw) ? expDataRaw : (expDataRaw?.itens || []);
    const expTitulo = (typeof expDataRaw === 'object' && !Array.isArray(expDataRaw)) ? (expDataRaw.titulo || 'Experiência Profissional') : 'Experiência Profissional';

    if (document.getElementById('experiencia-titulo-texto')) document.getElementById('experiencia-titulo-texto').textContent = expTitulo;

    if (expDataRaw) {
        const experienciaContainer = document.querySelector('.experiencia_container');
        if (experienciaContainer) {
            experienciaContainer.innerHTML = '';
            
            if (Array.isArray(expItens) && expItens.length > 0) {
                expItens.forEach((exp, index) => {
                    if (!exp) return;
                    const div = document.createElement('div');
                    div.className = 'experiencia_conteudo';
                    const temLinha = index < expItens.length - 1;
                    div.innerHTML = `
                        <div class="experiencia_tempo">
                            <span class="experiencia_circulo"></span>
                            ${temLinha ? '<span class="experiencia_linha"></span>' : ''}
                        </div>
                        <div class="experiencia_dados bd-grid">
                            <h3 class="experiencia_titulo">${exp.cargo || exp.titulo || ''}</h3>
                            <span class="experiencia_empresa">${exp.empresa || ''}</span>
                            <span class="experiencia_ano">${exp.periodo || exp.data || ''}</span>
                            <p class="experiencia_descricao">
                                ${exp.descricao || ''}
                            </p>
                        </div>
                    `;
                    experienciaContainer.appendChild(div);
                });
            } else if (typeof expDataRaw === 'string' && expDataRaw.trim() !== '') {
                // Legado ou texto livre
                const div = document.createElement('div');
                div.className = 'experiencia_conteudo';
                div.innerHTML = `
                    <div class="experiencia_tempo"><span class="experiencia_circulo"></span></div>
                    <div class="experiencia_dados bd-grid">
                        <p class="experiencia_descricao" style="white-space: pre-wrap;">${expDataRaw}</p>
                    </div>
                `;
                experienciaContainer.appendChild(div);
            }
        }
        
        const secaoExperiencia = document.getElementById('experiencia');
        if (secaoExperiencia) secaoExperiencia.style.display = (typeof expDataRaw === 'string' ? expDataRaw.trim() !== '' : expItens.length > 0) ? 'block' : 'none';
    }
    
    // CERTIFICADOS
    const certDataRaw = dados.certificados || dados.certificacoes;
    const certItens = Array.isArray(certDataRaw) ? certDataRaw : (certDataRaw?.itens || []);
    const certTitulo = (typeof certDataRaw === 'object' && !Array.isArray(certDataRaw)) ? (certDataRaw.titulo || 'Certificados') : 'Certificados';

    if (document.getElementById('certificados-titulo-texto')) document.getElementById('certificados-titulo-texto').textContent = certTitulo;

    if (certDataRaw) {
        const certificadosContainer = document.querySelector('.certificados_container');
        if (certificadosContainer) {
            certificadosContainer.innerHTML = '';
            if (Array.isArray(certItens) && certItens.length > 0) {
                certItens.slice(0, 3).forEach(cert => {
                    if (!cert) return;
                    const div = document.createElement('div');
                    div.className = 'certificados_conteudo';
                    div.innerHTML = `
                        <div class="certificados_item"><span class="certificados_circulo"></span></div>
                        <div class="certificados_dados bd-grid">
                            <h3 class="certificados_ano">${cert.ano || ''}</h3>
                            <span class="certificados_titulo">${cert.titulo || cert.nome || ''}</span>
                        </div>
                    `;
                    certificadosContainer.appendChild(div);
                });
            } else if (typeof certDataRaw === 'string' && certDataRaw.trim() !== '') {
                const div = document.createElement('div');
                div.className = 'certificados_conteudo';
                div.innerHTML = `
                    <div class="certificados_item"><span class="certificados_circulo"></span></div>
                    <div class="certificados_dados bd-grid">
                        <p class="experiencia_descricao" style="white-space: pre-wrap;">${certDataRaw}</p>
                    </div>
                `;
                certificadosContainer.appendChild(div);
            }
        }
        const secaoCertificados = document.getElementById('certificados');
        if (secaoCertificados) secaoCertificados.style.display = (typeof certDataRaw === 'string' ? certDataRaw.trim() !== '' : certItens.length > 0) ? 'block' : 'none';
    }
    
    // EDUCAÇÃO
    const eduDataRaw = dados.educacao;
    const eduItens = Array.isArray(eduDataRaw) ? eduDataRaw : (eduDataRaw?.itens || []);
    const eduTitulo = (typeof eduDataRaw === 'object' && !Array.isArray(eduDataRaw)) ? (eduDataRaw.titulo || 'Educação') : 'Educação';

    if (document.getElementById('educacao-titulo-texto')) document.getElementById('educacao-titulo-texto').textContent = eduTitulo;

    if (eduDataRaw) {
        const educacaoContainer = document.querySelector('.educacao_container');
        if (educacaoContainer) {
            educacaoContainer.innerHTML = '';
            if (Array.isArray(eduItens) && eduItens.length > 0) {
                eduItens.slice(0, 3).forEach((edu, index) => {
                    if (!edu) return;
                    const div = document.createElement('div');
                    div.className = 'educacao_conteudo';
                    const temLinha = index < eduItens.length - 1;
                    div.innerHTML = `
                        <div class="educacao_tempo">
                            <span class="educacao_circulo"></span>
                            ${temLinha ? '<span class="educacao_linha"></span>' : ''}
                        </div>
                        <div class="educacao_dados bd-grid">
                            <h3 class="educacao_titulo">${edu.curso || edu.titulo || ''}</h3>
                            <span class="educacao_estudos">${edu.instituicao || ''}</span>
                            <span class="educacao_ano">${edu.periodo || edu.ano || ''}</span>
                        </div>
                    `;
                    educacaoContainer.appendChild(div);
                });
            } else if (typeof eduDataRaw === 'string' && eduDataRaw.trim() !== '') {
                const div = document.createElement('div');
                div.className = 'educacao_conteudo';
                div.innerHTML = `
                    <div class="educacao_tempo"><span class="educacao_circulo"></span></div>
                    <div class="educacao_dados bd-grid">
                        <p class="experiencia_descricao" style="white-space: pre-wrap;">${eduDataRaw}</p>
                    </div>
                `;
                educacaoContainer.appendChild(div);
            }
        }
        const secaoEducacao = document.getElementById('educacao');
        if (secaoEducacao) secaoEducacao.style.display = (typeof eduDataRaw === 'string' ? eduDataRaw.trim() !== '' : eduItens.length > 0) ? 'block' : 'none';
    }
    
    // INTERESSES
    const intDataRaw = dados.interesses;
    const intItens = Array.isArray(intDataRaw) ? intDataRaw : (intDataRaw?.itens || []);
    const intTitulo = (typeof intDataRaw === 'object' && !Array.isArray(intDataRaw)) ? (intDataRaw.titulo || 'Interesses') : 'Interesses';

    if (document.getElementById('interesses-titulo-texto')) document.getElementById('interesses-titulo-texto').textContent = intTitulo;

    if (intItens && intItens.length > 0) {
        const interessesContainer = document.querySelector('.interesses_container');
        if (interessesContainer) {
            interessesContainer.innerHTML = '';
            
            intItens.forEach(interesse => {
                if (!interesse) return;
                const div = document.createElement('div');
                div.className = 'interesses_conteudo';
                
                // Determinar o ícone com base no interesse (poderia ser configurável no JSON)
                let icone = 'fa-star'; // Ícone padrão
                
                // Lista de possíveis interesses e seus ícones
                const icones = {
                    'pets': 'fa-paw',
                    'natureza': 'fa-leaf',
                    'viagens': 'fa-plane',
                    'vídeo game': 'fa-gamepad',
                    'filmes': 'fa-film',
                    'séries': 'fa-film',
                    'culinária': 'fa-utensils',
                    'esportes': 'fa-futbol',
                    'leitura': 'fa-book',
                    'música': 'fa-music',
                    'fotografia': 'fa-camera',
                    'voluntariado': 'fa-hands-helping',
                    'tecnologia': 'fa-laptop',
                    'jardinagem': 'fa-seedling',
                    'arte': 'fa-palette',
                    'escrita': 'fa-pen-nib',
                    'festa': 'fa-cocktail',
                    'dança': 'fa-theater-masks',
                    'show': 'fa-cocktail',
                    'evento': 'fa-cocktail',
                    'meditação': 'fa-spa',
                    'moda': 'fa-tshirt',
                    'história': 'fa-scroll',
                    'idiomas': 'fa-language',
                    'astronomia': 'fa-satellite',
                    'xadrez': 'fa-chess',
                    'podcast': 'fa-podcast',
                    'ciclismo': 'fa-bicycle',
                    'colecionismo': 'fa-box-open',
                    'customizável': 'fa-star',
                    'maternidade': 'fa-baby',
                    'filhos': 'fa-baby',
                    'família': 'fa-users',
                    'programação': 'fa-code',
                    'internet': 'fa-globe',
                    'redes sociais': 'fa-hashtag',
                    'blogar': 'fa-blog',
                    'praia': 'fa-umbrella-beach',
                    'shopping': 'fa-shopping-bag',
                    'shows/eventos': 'fa-cocktail',
                    'aprendizagem': 'fa-brain',
                    'open source': 'fa-code-branch',
                    'mentoria': 'fa-user-tie',
                    'networking': 'fa-handshake-angle',
                    'projetos': 'fa-folder-open',
                    'saúde e beleza': 'fa-heart-pulse',
                    'religião': 'fa-praying-hands',
                    'piscina': 'fa-swimmer',
                    'montanha': 'fa-mountain',
                    'automotivos': 'fa-car',
                    'motociclismo': 'fa-motorcycle',
                    'casamento': 'fa-ring',
                    'novelas': 'fa-tv',
                    'cachoeira': 'fa-water',
                    'trilhas': 'fa-hiking',
                    'política': 'fa-landmark',
                    'notícias': 'fa-newspaper',
                    'computador': 'fa-desktop'
                };
                
                // Verificar se o interesse corresponde a algum ícone conhecido
                for (const [chave, valorIcone] of Object.entries(icones)) {
                    if (interesse.toLowerCase().includes(chave)) {
                        icone = valorIcone;
                        break;
                    }
                }
                
                div.innerHTML = `
                    <i class="fa-solid ${icone} interesses_icone"></i>
                    <span class="interesses_nome">${interesse}</span>
                `;
                interessesContainer.appendChild(div);
            });
        }
        
        // Mostrar seção
        const secaoInteresses = document.getElementById('interesses');
        if (secaoInteresses) {
            secaoInteresses.style.display = 'block';
        }
    } else {
        // Ocultar seção se não houver interesses
        const secaoInteresses = document.getElementById('interesses');
        if (secaoInteresses) {
            secaoInteresses.style.display = 'none';
    }

    // WHATSAPP
    configurarWhatsApp(dados);
}

function configurarWhatsApp(dados) {
    const waWidget = document.getElementById('whatsapp-widget');
    if (!waWidget) return;
    
    const waData = dados.whatsapp;
    if (waData && waData.numero) {
        let numero = (typeof waData === 'object') ? waData.numero : waData;
        numero = numero.toString().replace(/\D/g, '');
        if (numero.length === 11 && !numero.startsWith('55')) numero = '55' + numero;
        
        const msgStr = waData.mensagemPosCumprimento || 'Olá! Vi seu currículo no CurrículoClick e gostaria de conversar.';
        const msg = encodeURIComponent(msgStr);
        waWidget.href = `https://wa.me/${numero}?text=${msg}`;
        waWidget.style.display = 'flex';
    } else {
        waWidget.style.display = 'none';
    }
}

// Quando o DOM estiver pronto, carrega JSON do ID e aplica os dados
document.addEventListener('DOMContentLoaded', async () => {
    let idParam = obterIdDaUrl();
    // Normaliza o ID ou usa 'modelo' se não existir
    const id = idParam ? idParam.replace(/^curriculo[_-]/i, '').replace(/_/g, '-') : 'modelo';
    try {
        if (window.location.protocol === 'file:') {
            // Carregamento local via XHR
            if (DEBUG) console.log('Carregando local via XHR:', id);
            const sucessoLocal = carregarDadosLocal(id);
            if (!sucessoLocal) {
                if (DEBUG) console.warn("Leitura da pasta local falhou. Tentando baixar do Repositório via API...");
                await carregarDadosCliente(id);
            }
        } else {
            // Carregamento via fetch HTTP
            if (DEBUG) console.log('Carregando via fetch HTTP:', id);
            await carregarDadosCliente(id);
        }
    } catch (e) {
        console.warn('Falha no carregamento local, mantendo HTML estático', e);
    }
    // Remove a classe de loading para exibir o conteúdo atualizado
    document.body.classList.remove('js-loading');

    // Aplica cor customizada se definida
    if (window.initialColorHex && window.innerWidth > 968) {
        window.applyCustomColor(window.initialColorHex, window.initialColorName);
    }
});

// Função para animar profissão com Typed.js, simulando erro aleatório e correção
function animateProfession(profissaoEl, finalText) {
    if (window.currentTyped) {
        window.currentTyped.destroy();
        window.currentTyped = null;
    }
    
    // Se for um update rápido (Live Preview), talvez seja melhor pular a animação de erro
    if (window.isLivePreview) {
        profissaoEl.textContent = finalText;
        return;
    }

    window.finalProfissao = finalText;
    let typoArray = finalText.split('');
    const swaps = Math.min(typoArray.length - 1, Math.random() < 0.5 ? 2 : 3);
    for (let i = 0; i < swaps; i++) {
        const idx = Math.floor(Math.random() * (typoArray.length - 1));
        [typoArray[idx], typoArray[idx + 1]] = [typoArray[idx + 1], typoArray[idx]];
    }
    const typoText = typoArray.join('');
    profissaoEl.textContent = '';
    
    if (window.Typed) {
        window.currentTyped = new Typed(profissaoEl, {
            strings: [typoText, finalText],
            typeSpeed: 100,
            backSpeed: 100,
            startDelay: 300,
            backDelay: 800,
            loop: false,
            smartBackspace: true,
            showCursor: false,
            onComplete: () => { profissaoEl.textContent = finalText; }
        });
    } else {
        profissaoEl.textContent = finalText;
    }
}

/**
 * Atualiza as meta tags Open Graph e Twitter Card no browser
 * com os dados reais do candidato após o carregamento do JSON.
 * Importante: Isso funciona para usuários que copiam o link do browser.
 * Para crawlers (WhatsApp, LinkedIn, etc.) o Edge Function é responsável.
 */
function atualizarMetaTagsOG(dados) {
    try {
        if (!dados || !dados.inicio) return;

        const nome = dados.inicio.nome || 'Currículo Profissional';
        const profissao = dados.inicio.profissao || '';
        const fotoPerfil = dados.inicio.foto_perfil || '';
        const descricaoPerfil = (dados.perfil && dados.perfil.descricao) || `Confira o currículo profissional de ${nome}.`;

        // Monta URL absoluta da foto de perfil
        const origin = window.location.origin;
        let fotoAbsoluta;
        if (fotoPerfil) {
            const basePath = fotoPerfil.replace(/^\/+/, '');
            fotoAbsoluta = `${origin}/${basePath}`;
        } else {
            fotoAbsoluta = `${origin}/ativos/imagens/og-default.png`;
        }

        const titulo = profissao
            ? `${nome} | ${profissao} – Currículo Click`
            : `${nome} – Currículo Click`;
        const descricao = descricaoPerfil.length > 160
            ? descricaoPerfil.substring(0, 157) + '...'
            : descricaoPerfil;
        const paginaUrl = window.location.href;

        // Helper para setar content de meta pelo id
        function setMeta(id, value) {
            const el = document.getElementById(id);
            if (el) el.setAttribute('content', value);
        }

        // Atualizar título da página
        document.title = `Currículo Click | ${nome}`;

        // Open Graph
        setMeta('og-url',         paginaUrl);
        setMeta('og-title',       titulo);
        setMeta('og-description', descricao);
        setMeta('og-image',       fotoAbsoluta);

        // Twitter Card
        setMeta('tw-title',       titulo);
        setMeta('tw-description', descricao);
        setMeta('tw-image',       fotoAbsoluta);

        if (DEBUG) console.log('[OG] Meta tags atualizadas:', { titulo, fotoAbsoluta, descricao });
    } catch (e) {
        console.warn('[OG] Erro ao atualizar meta tags:', e);
    }
}

// Suporte para Live Preview (Dashboard)
window.addEventListener('message', (event) => {
    // Detectar se está dentro de um iframe (Preview do Painel)
    if (window.self !== window.top) {
        document.body.classList.add('is-preview');
    }

    if (event.data && (event.data.type === 'LIVE_PREVIEW_UPDATE' || event.data.type === 'sync')) {
        console.log('Recebendo update em tempo real...');
        window.isLivePreview = true;
        document.body.classList.add('is-preview');
        // Usa a função correta que definimos acima
        aplicarDadosAoCurriculo(event.data.dados || event.data.data);
        
        setTimeout(() => { window.isLivePreview = false; }, 2000);
    }
});