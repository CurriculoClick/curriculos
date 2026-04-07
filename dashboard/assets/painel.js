/**
 * CurriculoClick Dashboard Engine v3.7
 * Foco: Depuração em Tempo Real, Preenchimento Total e Anti-Cache.
 */

const GITHUB_API = 'https://api.github.com';
let githubToken = localStorage.getItem('cc_github_token');
let githubRepo = localStorage.getItem('cc_github_repo') || 'thiagodelgado/curriculoclick';

// State & Limits
let currentData = null;
let currentSlug = '';
let isManualSlug = false;
let syncTimeout = null;
let cropperInstance = null;
const LIMIT_HABILIDADES = 5;
const LIMIT_IDIOMAS = 3;
const LIMIT_EXPERIENCIA = 3;
const LIMIT_EDUCACAO = 3;
const LIMIT_CERTIFICADOS = 3;

document.addEventListener('DOMContentLoaded', async () => {
    if (!githubToken) { window.location.href = 'configuracao.html'; return; }
    setupCoreEvents();
    renderIconSelectors();
    await listarCurriculos();
    limparFormulario();
});

function setupCoreEvents() {
    const photoUploader = document.getElementById('photoUploader');
    const photoInput = document.getElementById('photoInput');
    const photoPreview = document.getElementById('photoPreview');
    if (photoUploader) photoUploader.addEventListener('click', () => photoInput?.click());
    if (photoInput) photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => { 
                // Abre a janela do Cropper em vez de colocar na tela direto
                abrirCropper(ev.target.result);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = ''; // Reset para permitir reconversão
    });

    const pubBtn = document.getElementById('publishBtn');
    if (pubBtn) pubBtn.addEventListener('click', publicarCurriculo);
    
    // UI Events
    const form = document.getElementById('cvForm');
    if (form) form.addEventListener('input', debouncedSync);

    // Slug Logic
    const nameInput = document.getElementById('nome');
    const surnameInput = document.getElementById('sobrenome');
    const slugInput = document.getElementById('slug');

    if (nameInput && surnameInput && slugInput) {
        const updateSlug = () => {
            if (isManualSlug) return;
            const val = `${nameInput.value}-${surnameInput.value}`.trim()
                .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            slugInput.value = val;
            updateUrlDisplay(val);
        };
        nameInput.addEventListener('input', updateSlug);
        surnameInput.addEventListener('input', updateSlug);
        slugInput.addEventListener('input', () => { isManualSlug = true; updateUrlDisplay(slugInput.value); });
    }

    const importInput = document.getElementById('importJsonInput');
    if (importInput) {
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const json = JSON.parse(ev.target.result);
                    let nomeSlug = file.name.replace('.json', '');
                    if (nomeSlug.toLowerCase() === 'modelo-de-dados-cms' || nomeSlug.toLowerCase() === 'modelo') nomeSlug = '';
                    preencherFormulario(json, nomeSlug);
                    alert("✅ Currículo importado com sucesso do seu PC! Agora você pode editar todas as informações.");
                } catch(err) {
                    console.error("Erro JSON:", err);
                    alert("Erro ao ler o arquivo JSON: O arquivo não possui uma estrutura de dados válida.");
                }
                importInput.value = ''; // Limpar input para poder re-enviar caso necessário no futuro
            };
            reader.readAsText(file);
        });
    }
    
    // Filtro de Busca de Currículos
    const searchInput = document.getElementById('searchCurriculo');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            const items = document.querySelectorAll('#clientesList .menu-item');
            items.forEach(item => {
                const name = item.textContent.toLowerCase();
                if (name.includes(term)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
}

function updateUrlDisplay(slug) {
    const display = document.getElementById('urlDisplay');
    if (!display) return;
    const baseUrl = window.location.origin + window.location.pathname.replace('dashboard/', '');
    display.textContent = `${baseUrl}?id=${slug}`;
}

function debouncedSync() {
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(syncPreview, 300);
}

function syncPreview() {
    const iframe = document.getElementById('previewFrame');
    if (!iframe || !iframe.contentWindow) return;
    const data = collectData();
    const localImg = document.getElementById('photoPreview');
    if (localImg && localImg.src && localImg.src.startsWith('data:')) {
        data.inicio.foto_perfil = localImg.src;
    }
    iframe.contentWindow.postMessage({ type: 'LIVE_PREVIEW_UPDATE', dados: data }, '*');
}

function renderIconSelectors() {
    const grid = document.getElementById('interestIcons');
    if (!grid) return;
    grid.innerHTML = '';
    const icons = { 'pets': 'fa-paw', 'natureza': 'fa-leaf', 'viagens': 'fa-plane', 'vídeo game': 'fa-gamepad', 'filmes': 'fa-film', 'séries': 'fa-film', 'culinária': 'fa-utensils', 'esportes': 'fa-futbol', 'leitura': 'fa-book', 'música': 'fa-music', 'fotografia': 'fa-camera', 'voluntariado': 'fa-hands-helping', 'tecnologia': 'fa-laptop', 'jardinagem': 'fa-seedling', 'arte': 'fa-palette', 'escrita': 'fa-pen-nib', 'festa': 'fa-cocktail', 'dança': 'fa-theater-masks', 'astronomia': 'fa-satellite', 'xadrez': 'fa-chess', 'podcast': 'fa-podcast', 'ciclismo': 'fa-bicycle', 'maternidade': 'fa-baby', 'família': 'fa-users', 'programação': 'fa-code', 'internet': 'fa-globe', 'redes sociais': 'fa-hashtag', 'praia': 'fa-umbrella-beach', 'saúde e beleza': 'fa-heart-pulse', 'notícias': 'fa-newspaper' };
    Object.entries(icons).forEach(([name, icon]) => {
        const item = document.createElement('div');
        item.className = 'icon-item';
        item.innerHTML = `<i class="fa-solid ${icon}"></i>`;
        item.title = name;
        item.onclick = () => { 
            if (!item.classList.contains('selected') && document.querySelectorAll('.icon-item.selected').length >= 8) {
                alert("Você só pode selecionar até 8 ícones de interesses.");
                return;
            }
            item.classList.toggle('selected'); 
            syncPreview(); 
        };
        grid.appendChild(item);
    });
}

// --- Listagem e Carregamento ---

async function listarCurriculos() {
    const listEl = document.getElementById('clientesList');
    if (!listEl) return;
    try {
        const res = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/dados?t=${Date.now()}`, {
            headers: { 'Authorization': `token ${githubToken}` }
        });
        const files = await res.json();
        listEl.innerHTML = '';
        if (Array.isArray(files)) {
            files.filter(f => f.name.endsWith('.json') && f.name !== 'modelo.json').forEach(file => {
                const btn = document.createElement('div');
                btn.className = 'menu-item';
                btn.innerHTML = `<i class="fa-solid fa-circle-user"></i> <span>${file.name.replace('.json', '')}</span>`;
                btn.onclick = () => carregarCurriculo(file.name.replace('.json', ''));
                listEl.appendChild(btn);
            });
        }
    } catch (e) { listEl.innerHTML = '<small>Erro ao listar</small>'; }
}

async function carregarCurriculo(slug) {
    showLoader(true);
    try {
        const response = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/dados/${slug}.json?t=${Date.now()}`, {
            headers: { 'Authorization': `token ${githubToken}` }
        });
        const fileData = await response.json();
        const cleanedBase64 = fileData.content.replace(/\n|\r/g, ''); // Remover chunk breaks
        const json = JSON.parse(decodeURIComponent(escape(atob(cleanedBase64))));
        preencherFormulario(json, slug);
    } catch (e) { 
        console.error(e);
        alert("Falha ao carregar arquivo de dados. Verifique sua conexão ou token."); 
    }
    finally { showLoader(false); }
}

function preencherFormulario(data, slug) {
    try {
        limparFormulario(false);
        currentSlug = slug;
        currentData = data;
        isManualSlug = true;

        // Identidade
        const partesNome = (data.inicio?.nome || slug).split(' ');
        if (document.getElementById('nome')) document.getElementById('nome').value = partesNome[0] || '';
        if (document.getElementById('sobrenome')) document.getElementById('sobrenome').value = partesNome.slice(1).join(' ') || '';
        if (document.getElementById('slug')) document.getElementById('slug').value = slug;
        updateUrlDisplay(slug);
        
        if (document.getElementById('profissao')) document.getElementById('profissao').value = data.inicio?.profissao || '';
        if (document.getElementById('endereco')) document.getElementById('endereco').value = data.inicio?.endereco || data.inicio?.localizacao || '';
        if (document.getElementById('email')) document.getElementById('email').value = data.inicio?.email || '';
        if (document.getElementById('telefone')) document.getElementById('telefone').value = data.inicio?.telefone || '';
        if (document.getElementById('idade')) document.getElementById('idade').value = data.inicio?.idade || '';
        // Normaliza o estado civil para bater com os valores do <select>
        const ecEl = document.getElementById('estado_civil');
        if (ecEl && data.inicio?.estado_civil) {
            const ecRaw = data.inicio.estado_civil.toLowerCase().trim();
            let ecNorm = '';
            if (ecRaw.includes('solteiro') || ecRaw.includes('solteira')) ecNorm = 'Solteiro(a)';
            else if (ecRaw.includes('noivo') || ecRaw.includes('noiva')) ecNorm = 'Noivo(a)';
            else if (ecRaw.includes('casado') || ecRaw.includes('casada')) ecNorm = 'Casado(a)';
            else if (ecRaw.includes('divorciado') || ecRaw.includes('divorciada')) ecNorm = 'Divorciado(a)';
            else if (ecRaw.includes('vi\u00favo') || ecRaw.includes('vi\u00fava')) ecNorm = 'Vi\u00favo(a)';
            else if (ecRaw.includes('uni\u00e3o') || ecRaw.includes('est\u00e1vel')) ecNorm = 'Uni\u00e3o Est\u00e1vel';
            else ecNorm = data.inicio.estado_civil; // usa o valor original como fallback
            ecEl.value = ecNorm;
        }
        if (document.getElementById('cnh')) document.getElementById('cnh').value = data.inicio?.cnh || '';
        
        const photo = document.getElementById('photoPreview');
        if (data.inicio?.foto_perfil && photo) {
            photo.src = `../${data.inicio.foto_perfil}?t=${Date.now()}`;
            photo.style.display = 'block';
        }
        
        if (document.getElementById('descricao')) document.getElementById('descricao').value = data.perfil?.descricao || '';
        
        // REDES SOCIAIS
        if (data.social) {
            if (Array.isArray(data.social)) {
                data.social.forEach(s => adicionarSocial(s));
            } else if (typeof data.social === 'object') {
                Object.entries(data.social).forEach(([rede, url]) => {
                    if (url && url !== "") {
                        const redeFormatada = rede.charAt(0).toUpperCase() + rede.slice(1);
                        adicionarSocial({ rede: redeFormatada, url: url });
                    }
                });
            }
        }
        
        // HABILIDADES
        if (Array.isArray(data.habilidades)) data.habilidades.forEach(h => adicionarHabilidade(h));
        
        // IDIOMAS
        if (Array.isArray(data.idiomas)) {
            data.idiomas.forEach(i => {
                let estrelas = i.estrelas;
                if (!estrelas && i.nivel) {
                    // Tenta traduzir legados de texto para estrelas
                    const nivelLow = i.nivel.toLowerCase();
                    if (nivelLow.includes('básico')) estrelas = 1;
                    else if (nivelLow.includes('intermediário')) estrelas = 2;
                    else if (nivelLow.includes('avançado')) estrelas = 3;
                    else if (nivelLow.includes('fluente')) estrelas = 4;
                    else if (nivelLow.includes('nativo')) estrelas = 5;
                }
                adicionarIdioma({ nome: i.nome, estrelas: estrelas || 5 });
            });
        }
        
        // TRAJETÓRIA
        const exps = data.experiencia_profissional;
        if (Array.isArray(exps)) exps.forEach(e => adicionarExperiencia(e));
        else if (typeof exps === 'string' && exps.trim() !== "") adicionarExperiencia(exps);

        const edus = data.educacao;
        if (Array.isArray(edus)) edus.forEach(e => {
            // Suporte a formatos antigos onde educacao era diferente
            if (typeof e === 'object') adicionarEducacao(e);
            else if (typeof e === 'string') adicionarEducacao(e);
        });
        else if (typeof edus === 'string' && edus.trim() !== "") adicionarEducacao(edus);

        const certs = data.certificados || data.certificacoes;
        if (Array.isArray(certs)) certs.forEach(c => {
            if (typeof c === 'object') adicionarCertificado(c);
            else if (typeof c === 'string') adicionarCertificado(c);
        });
        else if (typeof certs === 'string' && certs.trim() !== "") adicionarCertificado(certs);

        // ÍCONES
        if (Array.isArray(data.interesses)) {
            data.interesses.forEach(int => {
                const lowInt = int.toLowerCase().trim();
                const icon = document.querySelector(`.icon-item[title="${lowInt}"]`);
                if (icon) icon.classList.add('selected');
            });
        }
        
        // WHATSAPP
        const waEl = document.getElementById('wa_numero');
        if (waEl && data.whatsapp) { 
            waEl.value = (typeof data.whatsapp === 'object') ? (data.whatsapp.numero || '') : (typeof data.whatsapp === 'string' ? data.whatsapp : ''); 
        }
        const waMsgEl = document.getElementById('wa_mensagem_pos');
        if (waMsgEl && data.whatsapp) {
            waMsgEl.value = data.whatsapp.mensagemPosCumprimento || '';
        }
        
        console.log("Formulário preenchido com sucesso para:", slug);
        atualizarPreview(slug);

    } catch (err) {
        console.error("Erro ao preencher formulário:", err);
        alert("Ocorreu um erro ao processar os dados deste currículo. Verifique o console ou tente novamente.");
    }
}

// --- Dynamic Fields ---
function adicionarSocial(d=null) { 
    const l = document.getElementById('socialList'); if (!l) return;
    const div = document.createElement('div'); div.className = 'dynamic-item form-row'; 
    const redes = ['WhatsApp','Instagram','LinkedIn','Facebook','TikTok','GitHub','Site','Twitter','YouTube'];
    div.innerHTML = `<button type="button" class="btn-remove" onclick="this.parentElement.remove(); syncPreview()">×</button><div class="field-item"><select class="input-pro s-rede">${redes.map(r => `<option value="${r}" ${d?.rede === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div><div class="field-item"><input type="text" class="input-pro s-url" placeholder="Ex: instagram.com/milena" value="${d?.url || ''}"></div>`; 
    l.appendChild(div); if(!d) syncPreview(); 
}

function adicionarHabilidade(d=null) { 
    const l = document.getElementById('habilidadesList'); if (!l) return;
    if (l.children.length >= LIMIT_HABILIDADES && !d) return alert(`Limite: ${LIMIT_HABILIDADES}`); 
    const div = document.createElement('div'); div.className = 'dynamic-item form-row'; 
    div.innerHTML = `<button type="button" class="btn-remove" onclick="this.parentElement.remove(); syncPreview()">×</button><div class="field-item"><input type="text" class="input-pro h-nome" placeholder="Ex: Power Point" value="${d?.nome || ''}"></div><div class="field-item"><input type="number" class="input-pro h-nivel" placeholder="0 a 100" value="${d?.nivel || 80}"></div>`; 
    l.appendChild(div); if(!d) syncPreview(); 
}

function adicionarIdioma(d=null) { 
    const l = document.getElementById('idiomasList'); if (!l) return;
    if (l.children.length >= LIMIT_IDIOMAS && !d) return alert(`Limite: ${LIMIT_IDIOMAS}`); 
    const div = document.createElement('div'); div.className = 'dynamic-item form-row'; 
    const s1 = d?.estrelas == 1 ? 'selected' : '';
    const s2 = d?.estrelas == 2 ? 'selected' : '';
    const s3 = d?.estrelas == 3 ? 'selected' : '';
    const s4 = d?.estrelas == 4 ? 'selected' : '';
    const s5 = (d?.estrelas == 5 || !d) ? 'selected' : '';
    div.innerHTML = `<button type="button" class="btn-remove" onclick="this.parentElement.remove(); syncPreview()">×</button><div class="field-item"><input type="text" class="input-pro i-nome" placeholder="Ex: Inglês" value="${d?.nome || ''}"></div><div class="field-item"><select class="input-pro i-estrelas"><option value="1" ${s1}>1 Estrela</option><option value="2" ${s2}>2 Estrelas</option><option value="3" ${s3}>3 Estrelas</option><option value="4" ${s4}>4 Estrelas</option><option value="5" ${s5}>5 Estrelas</option></select></div>`; 
    l.appendChild(div); if(!d) syncPreview(); 
}

function adicionarExperiencia(d=null) { 
    const l = document.getElementById('experienciasList'); if (!l) return;
    if (l.children.length >= LIMIT_EXPERIENCIA && !d) return alert(`Limite: ${LIMIT_EXPERIENCIA}`); 
    const div = document.createElement('div'); div.className = 'dynamic-item'; 
    const isL = typeof d === 'string';
    const cargo = isL ? '' : (d?.cargo || d?.titulo || '');
    const emp = isL ? '' : (d?.empresa || '');
    const per = isL ? '' : (d?.periodo || d?.data || '');
    const desc = isL ? d : (d?.descricao || '');
    div.innerHTML = `<button type="button" class="btn-remove" onclick="this.parentElement.remove(); syncPreview()">×</button><div class="form-row"><div class="field-item"><label>Cargo</label><input type="text" class="input-pro e-cargo" placeholder="Ex: Administradora Financeira" value="${cargo}"></div><div class="field-item"><label>Empresa</label><input type="text" class="input-pro e-empresa" placeholder="Ex: Pizza Hunt - Brasil" value="${emp}"></div></div><div class="field-item"><label>Período</label><input type="text" class="input-pro e-periodo" placeholder="Ex: Janeiro 2022 - Atual" value="${per}"></div><div class="field-item"><label>Atividades</label><textarea class="textarea-pro e-desc" rows="2" placeholder="Ex: Planejamento financeiro, controle financeiro e tomada de decisões financeiras estratégicas...">${desc}</textarea></div>`; 
    l.appendChild(div); if(!d) syncPreview(); 
}

function adicionarEducacao(d=null) { 
    const l = document.getElementById('educacaoList'); if (!l) return;
    if (l.children.length >= LIMIT_EDUCACAO && !d) return alert(`Limite: ${LIMIT_EDUCACAO}`); 
    const div = document.createElement('div'); div.className = 'dynamic-item'; 
    const isL = typeof d === 'string';
    const curso = isL ? d : (d?.curso || d?.titulo || '');
    const inst = isL ? '' : (d?.instituicao || '');
    const per = isL ? '' : (d?.periodo || d?.ano || '');
    div.innerHTML = `<button type="button" class="btn-remove" onclick="this.parentElement.remove(); syncPreview()">×</button><div class="field-item"><label>Curso</label><input type="text" class="input-pro edu-curso" placeholder="Ex: Administração" value="${curso}"></div><div class="field-item"><label>Instituição</label><input type="text" class="input-pro edu-inst" placeholder="Ex: Centro Educacional Anhanguera" value="${inst}"></div><div class="field-item"><label>Período</label><input type="text" class="input-pro edu-per" placeholder="Ex: 2022 - Cursando" value="${per}"></div>`; 
    l.appendChild(div); if(!d) syncPreview(); 
}

function adicionarCertificado(d=null) { 
    const l = document.getElementById('certificadosList'); if (!l) return;
    if (l.children.length >= LIMIT_CERTIFICADOS && !d) return alert(`Limite: ${LIMIT_CERTIFICADOS}`); 
    const div = document.createElement('div'); div.className = 'dynamic-item'; 
    const isL = typeof d === 'string';
    const ano = isL ? '' : (d?.ano || '');
    const tit = isL ? d : (d?.titulo || d?.nome || '');
    div.innerHTML = `<button type="button" class="btn-remove" onclick="this.parentElement.remove(); syncPreview()">×</button><div class="field-item"><label>Ano</label><input type="text" class="input-pro cert-ano" placeholder="Ex: 2023" value="${ano}"></div><div class="field-item"><label>Título</label><input type="text" class="input-pro cert-titulo" placeholder="Ex: Coursera | Administração Financeira" value="${tit}"></div>`; 
    l.appendChild(div); if(!d) syncPreview(); 
}

// --- Publicar ---
async function publicarCurriculo() {
    const sEl = document.getElementById('slug');
    const newSlug = sEl ? sEl.value.trim() : '';
    if (!newSlug) return alert("URL (Link) é obrigatória.");
    showLoader(true);
    try {
        const payload = collectData();
        const photoInput = document.getElementById('photoInput');
        const photoPreview = document.getElementById('photoPreview');
        const isCroppedImage = photoPreview && photoPreview.src && photoPreview.src.startsWith('data:image/');
        
        if (currentSlug && currentSlug !== newSlug) {
            await deletarDoGitHub(`dados/${currentSlug}.json`);
            if (currentData?.inicio?.foto_perfil?.includes(currentSlug)) await deletarDoGitHub(currentData.inicio.foto_perfil);
        }
        
        // Faz a verificação se a foto foi cortada e gerou um Base64 RAW
        if (isCroppedImage) {
            const path = `dados/uploads/${newSlug}.png`;
            const base64Data = photoPreview.src.split(',')[1];
            await uploadToGitHub(path, base64Data, false, true); // Usa modo raw base64
            payload.inicio.foto_perfil = path;
        } else if (currentData?.inicio?.foto_perfil) {
            if (currentSlug !== newSlug && currentData.inicio.foto_perfil.includes(currentSlug)) {
                const oldPath = currentData.inicio.foto_perfil;
                const newPath = `dados/uploads/${newSlug}.png`;
                await renomearArquivoGitHub(oldPath, newPath);
                payload.inicio.foto_perfil = newPath;
            } else payload.inicio.foto_perfil = currentData.inicio.foto_perfil;
        }
        await uploadToGitHub(`dados/${newSlug}.json`, JSON.stringify(payload, null, 2), true);
        alert("Currículo publicado com sucesso!");
        listarCurriculos();
        window.location.href = `../?id=${newSlug}`;
    } catch (e) { alert(`Falha na publicação: ${e.message}`); }
    finally { showLoader(false); }
}

function collectData() {
    const n = document.getElementById('nome')?.value || '';
    const s = document.getElementById('sobrenome')?.value || '';
    const full = `${n} ${s}`.trim();
    const soc = Array.from(document.querySelectorAll('#socialList .dynamic-item')).map(it => ({ rede: it.querySelector('.s-rede').value, url: it.querySelector('.s-url').value }));
    const habs = Array.from(document.querySelectorAll('#habilidadesList .dynamic-item')).map(it => ({ nome: it.querySelector('.h-nome').value, nivel: parseInt(it.querySelector('.h-nivel').value) || 0 }));
    const idis = Array.from(document.querySelectorAll('#idiomasList .dynamic-item')).map(it => ({ nome: it.querySelector('.i-nome').value, estrelas: parseInt(it.querySelector('.i-estrelas').value) || 5 }));
    const exps = Array.from(document.querySelectorAll('#experienciasList .dynamic-item')).map(it => ({ cargo: it.querySelector('.e-cargo').value, empresa: it.querySelector('.e-empresa').value, periodo: it.querySelector('.e-periodo').value, descricao: it.querySelector('.e-desc').value }));
    const edus = Array.from(document.querySelectorAll('#educacaoList .dynamic-item')).map(it => ({ curso: it.querySelector('.edu-curso').value, instituicao: it.querySelector('.edu-inst').value, periodo: it.querySelector('.edu-per').value }));
    const certs = Array.from(document.querySelectorAll('#certificadosList .dynamic-item')).map(it => ({ ano: it.querySelector('.cert-ano').value, titulo: it.querySelector('.cert-titulo').value }));
    const ints = Array.from(document.querySelectorAll('.icon-item.selected')).map(el => el.title);
    const idadeVal = document.getElementById('idade')?.value || '';
    const estCivilVal = document.getElementById('estado_civil')?.value || '';
    const cnhVal = document.getElementById('cnh')?.value || '';
    const inicioObj = { nome: full, profissao: document.getElementById('profissao')?.value || '', endereco: document.getElementById('endereco')?.value || '', localizacao: document.getElementById('endereco')?.value || '', email: document.getElementById('email')?.value || '', telefone: document.getElementById('telefone')?.value || '', botao_baixar: "BAIXAR" };
    if (idadeVal) inicioObj.idade = idadeVal;
    if (estCivilVal) inicioObj.estado_civil = estCivilVal;
    if (cnhVal) inicioObj.cnh = cnhVal;
    return {
        inicio: inicioObj,
        social: soc, perfil: { descricao: document.getElementById('descricao')?.value || '' }, habilidades: habs, idiomas: idis, experiencia_profissional: exps, educacao: edus, certificados: certs, interesses: ints,
        whatsapp: { ativo: true, numero: document.getElementById('wa_numero')?.value || '', mensagemPosCumprimento: document.getElementById('wa_mensagem_pos')?.value || '', mensagemPadrao: "Olá! Gostaria de falar sobre o currículo." }
    };
}

async function uploadToGitHub(path, content, isText = false, isRawBase64 = false) {
    let b64 = isRawBase64 ? content : (isText ? btoa(unescape(encodeURIComponent(content))) : await toBase64(content));
    let sha = null;
    try {
        const res = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${path}`, { headers: { 'Authorization': `token ${githubToken}` } });
        if (res.ok) sha = (await res.json()).sha;
    } catch (e) {}
    await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${path}`, {
        method: 'PUT', headers: { 'Authorization': `token ${githubToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Dashboard Edit: ${path}`, content: b64, sha })
    });
}

async function deletarDoGitHub(path) {
    try {
        const res = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${path}`, { headers: { 'Authorization': `token ${githubToken}` } });
        if (!res.ok) return;
        const sha = (await res.json()).sha;
        await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${path}`, {
            method: 'DELETE', headers: { 'Authorization': `token ${githubToken}` },
            body: JSON.stringify({ message: `Delete v3.7: ${path}`, sha })
        });
    } catch (e) {}
}

async function renomearArquivoGitHub(oldPath, newPath) {
    try {
        const res = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${oldPath}`, { headers: { 'Authorization': `token ${githubToken}` } });
        if (!res.ok) return;
        const d = await res.json();
        await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${newPath}`, {
            method: 'PUT', headers: { 'Authorization': `token ${githubToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Move v3.7: ${newPath}`, content: d.content })
        });
        await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${oldPath}`, {
            method: 'DELETE', headers: { 'Authorization': `token ${githubToken}` },
            body: JSON.stringify({ message: `Cleanup v3.7: ${oldPath}`, sha: d.sha })
        });
    } catch (e) {}
}

function toBase64(file) { return new Promise((r, j) => { const rd = new FileReader(); rd.readAsDataURL(file); rd.onload = () => r(rd.result.split(',')[1]); rd.onerror = e => j(e); }); }

function limparFormulario(f = true) {
    if (f) document.getElementById('cvForm')?.reset();
    const photo = document.getElementById('photoPreview');
    if (photo) photo.style.display = 'none';
    ['socialList', 'habilidadesList', 'idiomasList', 'experienciasList', 'educacaoList', 'certificadosList'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ''; });
    document.querySelectorAll('.icon-item').forEach(i => i.classList.remove('selected'));
    currentSlug = ''; currentData = null; isManualSlug = false;
    if (f) adicionarSocial({rede: 'WhatsApp', url: ''});
    updateURLManual();
    syncPreview();
}

function updateURLManual() {
    const n = document.getElementById('nome')?.value || '', s = document.getElementById('sobrenome')?.value || '';
    const v = `${n}-${s}`.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const si = document.getElementById('slug');
    if (si) { si.value = v; updateUrlDisplay(v); }
}

function showLoader(s) { const l = document.getElementById('loader'); if (l) l.style.display = s ? 'flex' : 'none'; }
function atualizarPreview(s = null) { const i = document.getElementById('previewFrame'); if (i) i.src = (s && s !== '') ? `../?id=${s}` : '../?id=modelo'; }

// --- Cropper Logic ---
function abrirCropper(imageSrc) {
    const modal = document.getElementById('cropModal');
    const image = document.getElementById('cropImage');
    
    image.src = imageSrc;
    modal.style.display = 'flex';
    
    if (cropperInstance) cropperInstance.destroy();
    
    cropperInstance = new Cropper(image, {
        aspectRatio: 1,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.9,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
    });
}

function fecharCropper() {
    document.getElementById('cropModal').style.display = 'none';
    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }
}

function aplicarCorte() {
    if (!cropperInstance) return;
    const canvas = cropperInstance.getCroppedCanvas({
        width: 400,
        height: 400,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });
    if (canvas) {
        const photoPreview = document.getElementById('photoPreview');
        if (photoPreview) {
            photoPreview.src = canvas.toDataURL('image/png', 0.9);
            photoPreview.style.display = 'block';
        }
        syncPreview();
    }
    fecharCropper();
}
