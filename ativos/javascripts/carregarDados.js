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
        const resposta = await fetch(`dados/curriculo_${id}.json`);
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
        // Nome (alternando normal e negrito em cada parte)
        const nomeParts = dados.inicio.nome.split(' ');
        const nomeFormatado = nomeParts.map((parte, idx) => idx % 2 === 1 ? `<b>${parte}</b>` : parte).join(' ');
        
        // Atualizar título da página com o nome do candidato
        document.title = `Currículos Top | ${dados.inicio.nome}`;
        
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
                fotoEl.src = dados.inicio.foto_perfil;
                fotoEl.onerror = function() {
                    this.src = 'ativos/imagens/placeholder.png';
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
        
        // Localização
        if (dados.inicio.localizacao) {
            const localizacaoEl = document.getElementById('localizacao');
            if (localizacaoEl) localizacaoEl.innerHTML = `<i class="fa-solid fa-location-dot inicio_icone"></i> ${dados.inicio.localizacao}`;
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
    if (dados.social) {
        const socialContainer = document.querySelector('.redes-sociais_container');
        if (socialContainer) {
            socialContainer.innerHTML = '';
            
            // Facebook
            if (dados.social.facebook) {
                const linkFacebook = document.createElement('a');
                linkFacebook.href = dados.social.facebook;
                linkFacebook.target = '_blank';
                linkFacebook.className = 'redes-sociais_link';
                linkFacebook.innerHTML = '<i class="fa-brands fa-facebook redes-sociais_icone"></i> ' + 
                    dados.social.facebook.split('/').pop();
                socialContainer.appendChild(linkFacebook);
            }
            
            // Instagram
            if (dados.social.instagram) {
                const linkInstagram = document.createElement('a');
                linkInstagram.href = dados.social.instagram;
                linkInstagram.target = '_blank';
                linkInstagram.className = 'redes-sociais_link';
                linkInstagram.innerHTML = '<i class="fa-brands fa-instagram redes-sociais_icone"></i> ' + 
                    dados.social.instagram.split('/').pop();
                socialContainer.appendChild(linkInstagram);
            }
            
            // LinkedIn
            if (dados.social.linkedin) {
                const linkLinkedin = document.createElement('a');
                linkLinkedin.href = dados.social.linkedin;
                linkLinkedin.target = '_blank';
                linkLinkedin.className = 'redes-sociais_link';
                linkLinkedin.innerHTML = '<i class="fa-brands fa-linkedin redes-sociais_icone"></i> ' + 
                    dados.social.linkedin.split('/').pop();
                socialContainer.appendChild(linkLinkedin);
            }
            
            // Ocultar seção se não houver redes sociais
            const secaoSocial = document.querySelector('.redes-sociais');
            if (secaoSocial) {
                secaoSocial.style.display = 
                    socialContainer.children.length === 0 ? 'none' : 'block';
            }
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

// Quando o DOM estiver pronto, carrega JSON do ID e aplica os dados
document.addEventListener('DOMContentLoaded', async () => {
    const id = obterIdDaUrl();
    if (id) {
        console.log(`Carregando currículo com ID: ${id}`);
        await carregarDadosCliente(id);
    } else {
        // Sem ID: usa o HTML estático (Milena) e aplica animação na profissão
        const profissaoEl = document.querySelector('.inicio_profissao');
        if (profissaoEl) {
            const finalText = profissaoEl.textContent.trim();
            animateProfession(profissaoEl, finalText);
        }
    }
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