/**
 * Sistema Currículos Top - Carregamento Dinâmico de Dados
 * Este arquivo contém as funções para carregar os dados do currículo
 * dinamicamente a partir de um arquivo JSON.
 */

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
        const path = `dados/${id}.json`;
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
        // Carrega JSON pelo path relativo
        const path = `dados/${id}.json`;
        if (DEBUG) console.log(`Carregando currículo (fetch): ${path}`);
        const resposta = await fetch(path);
        if (!resposta.ok) {
            throw new Error(`Não foi possível carregar o currículo (ID: ${id})`);
        }
        const dados = await resposta.json();
        aplicarDadosAoCurriculo(dados);
        return true;
    } catch (erro) {
        console.error("Erro ao carregar dados do currículo via fetch:", erro);
        alert("Não foi possível carregar os dados do currículo. O modelo padrão será exibido.");
        return false;
    }
}

// Função para aplicar os dados do JSON ao HTML
function aplicarDadosAoCurriculo(dados) {
    // INÍCIO
    if (dados.inicio) {
        // Nome (alternando normal e negrito em cada parte)
        const nomeParts = dados.inicio.nome.split(' ');
        const nomeFormatado = nomeParts.map((parte, idx) => idx % 2 === 1 ? `<b>${parte}</b>` : parte).join(' ');
        
        // Atualizar título da página com o nome do candidato
        document.title = `Currículo Click | ${dados.inicio.nome}`;
        
        const tituloEl = document.querySelector('.inicio_titulo');
        if (tituloEl) {
            tituloEl.innerHTML = nomeFormatado;
        }
        
        // Atualizar também o logo da navegação
        const logoEl = document.querySelector('.navegacao_logo');
        if (logoEl) {
            logoEl.textContent = dados.inicio.nome;
        }
        
        // Profissão (anima com Typed.js simulando erro e correção)
        if (dados.inicio.profissao) {
            const profissaoEl = document.querySelector('.inicio_profissao');
            if (profissaoEl) {
                animateProfession(profissaoEl, dados.inicio.profissao);
            }
        }
        
        // Botão Baixar
        if (dados.inicio.botao_baixar) {
            const botaoEl = document.getElementById('botao-download');
            if (botaoEl) botaoEl.textContent = dados.inicio.botao_baixar;
        }
        
        // Foto de perfil
        if (dados.inicio.foto_perfil) {
            const fotoEl = document.getElementById('inicio-imagem');
            if (fotoEl) {
                // Usa sempre caminho relativo sem barra inicial
                const basePath = dados.inicio.foto_perfil.replace(/^\/+/, '');
                const fotoUrl = `${basePath}?v=${Date.now()}`;
                fotoEl.src = fotoUrl;
                fotoEl.onerror = function() {
                    // Fallback direto para placeholder
                    fotoEl.onerror = null;
                    fotoEl.src = 'ativos/imagens/placeholder.png';
                };
            }
        }
        
        // Idade e estado civil
        if (dados.inicio.idade) {
            const idadeEl = document.getElementById('idade');
            if (idadeEl) {
                let content = `<i class="fa-solid fa-cake-candles inicio_icone"></i> ${dados.inicio.idade}`;
                if (dados.inicio.estado_civil) {
                    const status = dados.inicio.estado_civil.toLowerCase();
                    let icone = 'fa-user';
                    if (status.includes('noiva') || status.includes('noivo')) {
                        icone = 'fa-ring';
                    } else if (status.includes('casad')) {
                        icone = 'fa-heart';
                    }
                    content += ` <i class="fa-solid ${icone} inicio_icone" style="margin-left:calc(0.75rem + 5px)"></i> ${dados.inicio.estado_civil}`;
                }
                idadeEl.innerHTML = content;
            }
        }
        
        // Endereço / Localização
        const endereco = dados.inicio.endereco || dados.inicio.localizacao;
        if (endereco) {
            const localizacaoEl = document.getElementById('localizacao');
            if (localizacaoEl) localizacaoEl.innerHTML = `<i class="fa-solid fa-location-dot inicio_icone"></i> ${endereco}`;
        }
        
        // Email
        if (dados.inicio.email) {
            const emailAnchor = document.querySelector('#email a');
            if (emailAnchor) {
                emailAnchor.href = `mailto:${dados.inicio.email}`;
                emailAnchor.innerHTML = `<i class="fa-solid fa-envelope inicio_icone"></i> ${dados.inicio.email}`;
            }
        }
        
        // Telefone
        if (dados.inicio.telefone) {
            const telefoneAnchor = document.querySelector('#telefone a');
            if (telefoneAnchor) {
                telefoneAnchor.href = `tel:${dados.inicio.telefone.replace(/\D/g, '')}`;
                telefoneAnchor.innerHTML = `<i class="fa-solid fa-phone inicio_icone"></i> ${dados.inicio.telefone}`;
            }
        }
    }
    
    // REDES SOCIAIS
    if (Array.isArray(dados.social) && dados.social.length > 0) {
        const socialContainer = document.querySelector('.redes-sociais_container');
        socialContainer.innerHTML = '';
        function criarLinkSocial(url, label, iconClass) {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.className = 'redes-sociais_link';
            link.innerHTML = `<i class="${iconClass} redes-sociais_icone"></i> ${label}`;
            socialContainer.appendChild(link);
        }
        dados.social.forEach(item => {
            const rede = item.rede;
            const raw = item.url;
            const link = item.link;
            const customLabel = item.label;
            const customIconClass = item.iconClass;

            // Define texto a exibir e URL real
            const displayName = customLabel || (raw.startsWith('@') ? raw : '@' + raw);
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

            if (actualUrl) criarLinkSocial(actualUrl, displayName, iconClass);
        });
        document.querySelector('.redes-sociais').style.display = 'block';
    }
    
    // PERFIL
    if (dados.perfil) {
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
    if (dados.habilidades && dados.habilidades.length > 0) {
        const habilidadesContainer = document.querySelector('.habilidades_conteudo');
        if (habilidadesContainer) {
            habilidadesContainer.innerHTML = '';
            
            dados.habilidades.forEach(habilidade => {
                const div = document.createElement('div');
                div.className = 'habilidades_nome';
                div.innerHTML = `
                    <span class="habilidades_texto">${habilidade.nome}</span>
                    <div class="habilidades_barra">
                        <span class="habilidades_progresso" style="width: ${habilidade.nivel}%;"></span>
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
    if (dados.idiomas && dados.idiomas.length > 0) {
        const idiomasContainer = document.querySelector('.idiomas_conteudo');
        if (idiomasContainer) {
            idiomasContainer.innerHTML = '';
            
            dados.idiomas.forEach(idioma => {
                const li = document.createElement('li');
                li.className = 'idiomas_nome';
                
                let estrelas = '';
                for (let i = 1; i <= 5; i++) {
                    if (i <= idioma.estrelas) {
                        estrelas += '<i class="fa-solid fa-star"></i>';
                    } else {
                        estrelas += '<i class="fa-solid fa-star idiomas_estrelas_desmarcado"></i>';
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
    const expData = dados.experiencia_profissional;
    if (expData) {
        const experienciaContainer = document.querySelector('.experiencia_container');
        if (experienciaContainer) {
            experienciaContainer.innerHTML = '';
            
            if (Array.isArray(expData) && expData.length > 0) {
                expData.forEach((exp, index) => {
                    const div = document.createElement('div');
                    div.className = 'experiencia_conteudo';
                    const temLinha = index < expData.length - 1;
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
            } else if (typeof expData === 'string' && expData.trim() !== '') {
                // Legado ou texto livre
                const div = document.createElement('div');
                div.className = 'experiencia_conteudo';
                div.innerHTML = `
                    <div class="experiencia_tempo"><span class="experiencia_circulo"></span></div>
                    <div class="experiencia_dados bd-grid">
                        <p class="experiencia_descricao" style="white-space: pre-wrap;">${expData}</p>
                    </div>
                `;
                experienciaContainer.appendChild(div);
            }
        }
        
        const secaoExperiencia = document.getElementById('experiencia');
        if (secaoExperiencia) secaoExperiencia.style.display = (typeof expData === 'string' ? expData.trim() !== '' : expData.length > 0) ? 'block' : 'none';
    }
    
    // CERTIFICADOS
    const certData = dados.certificados || dados.certificacoes;
    if (certData) {
        const certificadosContainer = document.querySelector('.certificados_container');
        if (certificadosContainer) {
            certificadosContainer.innerHTML = '';
            if (Array.isArray(certData) && certData.length > 0) {
                certData.slice(0, 3).forEach(cert => {
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
            } else if (typeof certData === 'string' && certData.trim() !== '') {
                const div = document.createElement('div');
                div.className = 'certificados_conteudo';
                div.innerHTML = `
                    <div class="certificados_item"><span class="certificados_circulo"></span></div>
                    <div class="certificados_dados bd-grid">
                        <p class="experiencia_descricao" style="white-space: pre-wrap;">${certData}</p>
                    </div>
                `;
                certificadosContainer.appendChild(div);
            }
        }
        const secaoCertificados = document.getElementById('certificados');
        if (secaoCertificados) secaoCertificados.style.display = (typeof certData === 'string' ? certData.trim() !== '' : certData.length > 0) ? 'block' : 'none';
    }
    
    // EDUCAÇÃO
    const eduData = dados.educacao;
    if (eduData) {
        const educacaoContainer = document.querySelector('.educacao_container');
        if (educacaoContainer) {
            educacaoContainer.innerHTML = '';
            if (Array.isArray(eduData) && eduData.length > 0) {
                eduData.slice(0, 3).forEach((edu, index) => {
                    const div = document.createElement('div');
                    div.className = 'educacao_conteudo';
                    const temLinha = index < eduData.length - 1;
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
            } else if (typeof eduData === 'string' && eduData.trim() !== '') {
                const div = document.createElement('div');
                div.className = 'educacao_conteudo';
                div.innerHTML = `
                    <div class="educacao_tempo"><span class="educacao_circulo"></span></div>
                    <div class="educacao_dados bd-grid">
                        <p class="experiencia_descricao" style="white-space: pre-wrap;">${eduData}</p>
                    </div>
                `;
                educacaoContainer.appendChild(div);
            }
        }
        const secaoEducacao = document.getElementById('educacao');
        if (secaoEducacao) secaoEducacao.style.display = (typeof eduData === 'string' ? eduData.trim() !== '' : eduData.length > 0) ? 'block' : 'none';
    }
    
    // INTERESSES
    if (dados.interesses && dados.interesses.length > 0) {
        const interessesContainer = document.querySelector('.interesses_container');
        if (interessesContainer) {
            interessesContainer.innerHTML = '';
            
            dados.interesses.forEach(interesse => {
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
    }
}

// Quando o DOM estiver pronto, carrega JSON do ID e aplica os dados
document.addEventListener('DOMContentLoaded', async () => {
    // Se estiver rodando via file://, apenas remove o loading e mantém HTML estático
    if (window.location.protocol === 'file:') {
        if (DEBUG) console.log('file:// detectado, mantendo conteúdo estático');
        document.body.classList.remove('js-loading');
        return;
    }
    let idParam = obterIdDaUrl();
    // Normaliza o ID ou usa 'modelo' se não existir
    const id = idParam ? idParam.replace(/^curriculo[_-]/i, '').replace(/_/g, '-') : 'modelo';
    try {
        if (window.location.protocol === 'file:') {
            // Carregamento local via XHR
            if (DEBUG) console.log('Carregando local via XHR:', id);
            await carregarDadosLocal(id);
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

// Suporte para Live Preview (Dashboard)
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'LIVE_PREVIEW_UPDATE') {
        if (DEBUG) console.log('Recebendo update em tempo real...');
        window.isLivePreview = true;
        aplicarDadosAoCurriculo(event.data.dados);
        
        // Resetar flag após um tempo para permitir animação no próximo carregamento "real"
        setTimeout(() => { window.isLivePreview = false; }, 2000);
    }
});