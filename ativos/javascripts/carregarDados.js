/**
 * Sistema Currículos Top - Carregamento Dinâmico de Dados
 * Este arquivo contém as funções para carregar os dados do currículo
 * dinamicamente a partir de um arquivo JSON.
 */

// Função para verificar se existe um ID na URL
function obterIdDaUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Função para carregar os dados do currículo a partir do JSON
async function carregarDadosCliente(id) {
    try {
        // Busca o JSON pelo slug (arquivo id.json)
        const resposta = await fetch(`dados/${id}.json`);
        if (!resposta.ok) {
            throw new Error(`Não foi possível carregar o currículo (ID: ${id})`);
        }
        const dados = await resposta.json();
        aplicarDadosAoCurriculo(dados);
        return true;
    } catch (erro) {
        console.error("Erro ao carregar dados do currículo:", erro);
        alert("Não foi possível carregar os dados do currículo. O modelo padrão será exibido.");
        return false;
    }
}

// Função para aplicar os dados do JSON ao HTML
function aplicarDadosAoCurriculo(dados) {
    // INÍCIO
    if (dados.inicio) {
        // Nome completo
        const nomeFormatado = dados.inicio.nome;
        
        document.title = `Currículo Click | ${dados.inicio.nome}`;
        const nomeEl = document.getElementById('inicio-nome');
        if (nomeEl) nomeEl.innerHTML = nomeFormatado;
        
        const logoEl = document.querySelector('.navegacao_logo');
        if (logoEl) logoEl.textContent = dados.inicio.nome;
        
        // Profissão
        if (dados.inicio.profissao) {
            const profissaoEl = document.getElementById('inicio-profissao');
            if (profissaoEl) profissaoEl.textContent = dados.inicio.profissao;
        }
        
        // Texto do botão Baixar
        if (dados.inicio.botao_baixar) {
            const botaoEl = document.getElementById('botao-download');
            if (botaoEl) botaoEl.textContent = dados.inicio.botao_baixar;
        }
        
        // Foto de perfil
        if (dados.inicio.foto_perfil) {
            const fotoEl = document.getElementById('inicio-imagem');
            if (fotoEl) {
                fotoEl.src = dados.inicio.foto_perfil;
                fotoEl.onerror = () => fotoEl.src = 'ativos/imagens/placeholder.png';
            }
        }
        
        // Idade
        const idadeEl = document.getElementById('inicio-idade');
        if (idadeEl && dados.inicio.idade) {
            idadeEl.innerHTML = `<i class="fa-solid fa-cake-candles inicio_icone"></i> ${dados.inicio.idade}`;
        }
        // Estado civil
        const estadoEl = document.getElementById('inicio-estado');
        if (estadoEl && dados.inicio.estado_civil) {
            const key = dados.inicio.estado_civil.toLowerCase();
            const mapIcon = {
                solteiro: 'fa-user',
                namorando: 'fa-heart',
                noivo: 'fa-ring',
                casado: 'fa-ring',
                separado: 'fa-user-times',
                divorciado: 'fa-user-slash',
                viuvo: 'fa-user-injured'
            };
            const ic = mapIcon[key.replace(/\(a\)$/,'')] || 'fa-user';
            estadoEl.innerHTML = `<i class="fa-solid ${ic} inicio_icone"></i> ${dados.inicio.estado_civil}`;
        }
        
        // Localização
        const locEl = document.getElementById('inicio-localizacao');
        if (locEl && dados.inicio.localizacao) locEl.innerHTML = `<i class="fa-solid fa-location-dot inicio_icone"></i> ${dados.inicio.localizacao}`;
        
        // Email
        const emailEl = document.getElementById('inicio-email');
        if (emailEl && dados.inicio.email) {
            emailEl.innerHTML = `<a href="mailto:${dados.inicio.email}" class="inicio_link"><i class="fa-solid fa-envelope inicio_icone"></i> ${dados.inicio.email}</a>`;
        }
        
        // Telefone
        const telEl = document.getElementById('inicio-telefone');
        if (telEl && dados.inicio.telefone) {
            telEl.innerHTML = `<a href="tel:${dados.inicio.telefone.replace(/\D/g,'')}" class="inicio_link"><i class="fa-solid fa-phone inicio_icone"></i> ${dados.inicio.telefone}</a>`;
        }
    }
    
    // REDES SOCIAIS
    if (dados.social) {
        const socialContainer = document.querySelector('.redes-sociais_container');
        if (socialContainer) {
            // Converte objeto em array, se necessário
            const lista = Array.isArray(dados.social)
                ? dados.social
                : Object.entries(dados.social).map(([rede, url]) => ({rede, url}));
            socialContainer.innerHTML = '';
            const iconMap = {
                youtube: 'fab fa-youtube', facebook: 'fab fa-facebook', instagram: 'fab fa-instagram',
                tiktok: 'fab fa-tiktok', wechat: 'fab fa-weixin', 'facebook-messenger': 'fab fa-facebook-messenger',
                twitter: 'fab fa-twitter', linkedin: 'fab fa-linkedin', discord: 'fab fa-discord',
                snapchat: 'fab fa-snapchat', telegram: 'fab fa-telegram', douyin: 'fa-solid fa-music',
                kuaishou: 'fa-solid fa-video', weibo: 'fab fa-weibo', qq: 'fab fa-qq', pinterest: 'fab fa-pinterest',
                reddit: 'fab fa-reddit', custom: 'fa-solid fa-globe'
            };
            lista.forEach(item => {
                const link = document.createElement('a');
                link.href = item.url;
                link.target = '_blank';
                link.className = 'redes-sociais_link';
                const icClass = iconMap[item.rede] || 'fa-solid fa-link';
                link.innerHTML = `<i class="${icClass} redes-sociais_icone"></i> ${item.url}`;
                socialContainer.appendChild(link);
            });
            // Oculta seção se vazia
            const secao = document.querySelector('.redes-sociais');
            if (secao) secao.style.display = lista.length ? 'block' : 'none';
        }
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
    if (dados.experiencia_profissional && dados.experiencia_profissional.length > 0) {
        const experienciaContainer = document.querySelector('.experiencia_container');
        if (experienciaContainer) {
            experienciaContainer.innerHTML = '';
            
            dados.experiencia_profissional.forEach((exp, index) => {
                const div = document.createElement('div');
                div.className = 'experiencia_conteudo';
                
                // Determinar se é o último item para não renderizar a linha
                const temLinha = index < dados.experiencia_profissional.length - 1;
                
                div.innerHTML = `
                    <div class="experiencia_tempo">
                        <span class="experiencia_circulo"></span>
                        ${temLinha ? '<span class="experiencia_linha"></span>' : ''}
                    </div>
                    <div class="experiencia_dados bd-grid">
                        <h3 class="experiencia_titulo">${exp.cargo}</h3>
                        <span class="experiencia_empresa">${exp.empresa}</span>
                        <span class="experiencia_ano">${exp.periodo}</span>
                        <p class="experiencia_descricao">
                            ${exp.descricao}
                        </p>
                    </div>
                `;
                experienciaContainer.appendChild(div);
            });
        }
        
        // Mostrar seção
        const secaoExperiencia = document.getElementById('experiencia');
        if (secaoExperiencia) {
            secaoExperiencia.style.display = 'block';
        }
    } else {
        // Ocultar seção se não houver experiências
        const secaoExperiencia = document.getElementById('experiencia');
        if (secaoExperiencia) {
            secaoExperiencia.style.display = 'none';
        }
    }
    
    // CERTIFICADOS
    if (dados.certificacoes && dados.certificacoes.length > 0) {
        const certificadosContainer = document.querySelector('.certificados_container');
        if (certificadosContainer) {
            certificadosContainer.innerHTML = '';
            
            dados.certificacoes.forEach(cert => {
                const div = document.createElement('div');
                div.className = 'certificados_conteudo';
                
                let conteudoDetalhes = '';
                if (cert.detalhes) {
                    conteudoDetalhes = `
                        <span class="certificados_honras">${cert.detalhes}</span>
                    `;
                }
                
                div.innerHTML = `
                    <div class="certificados_item">
                        <span class="certificados_circulo"></span>
                    </div>
                    <div class="certificados_dados bd-grid">
                        <h3 class="certificados_ano">${cert.ano}</h3>
                        <span class="certificados_titulo">${cert.titulo}
                            ${conteudoDetalhes}
                        </span>
                    </div>
                `;
                certificadosContainer.appendChild(div);
            });
        }
        
        // Mostrar seção
        const secaoCertificados = document.getElementById('certificados');
        if (secaoCertificados) {
            secaoCertificados.style.display = 'block';
        }
    } else {
        // Ocultar seção se não houver certificados
        const secaoCertificados = document.getElementById('certificados');
        if (secaoCertificados) {
            secaoCertificados.style.display = 'none';
        }
    }
    
    // EDUCAÇÃO
    if (dados.educacao && dados.educacao.length > 0) {
        const educacaoContainer = document.querySelector('.educacao_container');
        if (educacaoContainer) {
            educacaoContainer.innerHTML = '';
            
            dados.educacao.forEach((edu, index) => {
                const div = document.createElement('div');
                div.className = 'educacao_conteudo';
                
                // Determinar se é o último item para não renderizar a linha
                const temLinha = index < dados.educacao.length - 1;
                
                div.innerHTML = `
                    <div class="educacao_tempo">
                        <span class="educacao_circulo"></span>
                        ${temLinha ? '<span class="educacao_linha"></span>' : ''}
                    </div>
                    <div class="educacao_dados bd-grid">
                        <h3 class="educacao_titulo">${edu.titulo}</h3>
                        <span class="educacao_estudos">${edu.instituicao}</span>
                        <span class="educacao_ano">${edu.periodo}</span>
                    </div>
                `;
                educacaoContainer.appendChild(div);
            });
        }
        
        // Mostrar seção
        const secaoEducacao = document.getElementById('educacao');
        if (secaoEducacao) {
            secaoEducacao.style.display = 'block';
        }
    } else {
        // Ocultar seção se não houver educação
        const secaoEducacao = document.getElementById('educacao');
        if (secaoEducacao) {
            secaoEducacao.style.display = 'none';
        }
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
                    'viagens': 'fa-suitcase',
                    'filmes': 'fa-film',
                    'séries': 'fa-film',
                    'natureza': 'fa-leaf',
                    'culinária': 'fa-utensils',
                    'vídeo games': 'fa-gamepad',
                    'games': 'fa-gamepad',
                    'livros': 'fa-book',
                    'música': 'fa-music',
                    'arte': 'fa-palette',
                    'esportes': 'fa-futbol',
                    'fotografia': 'fa-camera',
                    'tecnologia': 'fa-laptop',
                    'dança': 'fa-person-dancing'
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

// Inicializa o carregamento do currículo, usando 'modelo' por padrão
document.addEventListener('DOMContentLoaded', () => {
    let id = obterIdDaUrl();
    if (!id) {
        id = 'modelo';
        console.log('Sem ID na URL, carregando modelo padrão.');
    } else {
        console.log(`Carregando currículo com ID: ${id}`);
    }
    carregarDadosCliente(id);
    // Aplica cor customizada se definida (qualquer caso)
    if (window.initialColorHex && window.innerWidth > 968) {
        window.applyCustomColor(window.initialColorHex, window.initialColorName);
    }
});

// Função para animar profissão com Typed.js, simulando erro aleatório e correção
function animateProfession(profissaoEl, finalText) {
    let typoArray = finalText.split('');
    // Executa 2 ou 3 swaps aleatórios de letras
    const swaps = Math.min(typoArray.length - 1, Math.random() < 0.5 ? 2 : 3);
    for (let i = 0; i < swaps; i++) {
        const idx = Math.floor(Math.random() * (typoArray.length - 1));
        [typoArray[idx], typoArray[idx + 1]] = [typoArray[idx + 1], typoArray[idx]];
    }
    const typoText = typoArray.join('');
    profissaoEl.textContent = '';
    if (window.Typed) {
        new Typed(profissaoEl, {
            strings: [typoText, finalText],
            typeSpeed: 100,
            backSpeed: 100,
            startDelay: 300,
            backDelay: 800,
            loop: false,
            smartBackspace: false,
            showCursor: false,
            onComplete: () => { profissaoEl.textContent = finalText; }
        });
    } else {
        profissaoEl.textContent = finalText;
    }
}