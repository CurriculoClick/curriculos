/**
 * CurriculoClick Dashboard Engine v3.4
 * Foco: Live Preview, Gestão de URL (Slug) e Renomeação Segura.
 */

const GITHUB_API = 'https://api.github.com';
let githubToken = localStorage.getItem('cc_github_token');
let githubRepo = localStorage.getItem('cc_github_repo') || 'thiagodelgado/curriculoclick';

// State & Limits
let currentData = null;
let currentSlug = '';
let isManualSlug = false;
let syncTimeout = null;
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
    photoUploader.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => { 
                photoPreview.src = ev.target.result; 
                photoPreview.style.display = 'block';
                syncPreview();
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('publishBtn').addEventListener('click', publicarCurriculo);
    
    // UI Events
    document.getElementById('cvForm').addEventListener('input', () => {
        debouncedSync();
    });

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
        slugInput.addEventListener('input', () => {
            isManualSlug = true;
            updateUrlDisplay(slugInput.value);
        });
    }
}

function updateUrlDisplay(slug) {
    const display = document.getElementById('urlDisplay');
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
        item.onclick = () => { item.classList.toggle('selected'); syncPreview(); };
        grid.appendChild(item);
    });
}

// --- Listagem e Carregamento ---

async function listarCurriculos() {
    const listEl = document.getElementById('clientesList');
    if (!listEl) return;
    try {
        const res = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/dados`, {
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
        } else {
            listEl.innerHTML = '<small>Nenhum currículo encontrado.</small>';
        }
    } catch (e) { listEl.innerHTML = '<small>Erro ao listar</small>'; }
}

async function carregarCurriculo(slug) {
    showLoader(true);
    try {
        const response = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/dados/${slug}.json`, {
            headers: { 'Authorization': `token ${githubToken}` }
        });
        const fileData = await response.json();
        const json = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
        preencherFormulario(json, slug);
    } catch (e) { alert("Falha ao carregar"); }
    finally { showLoader(false); }
}

function preencherFormulario(data, slug) {
    limparFormulario(false);
    currentSlug = slug;
    currentData = data;
    isManualSlug = true; // Ao carregar, assume que o slug já está definido

    const partesNome = data.inicio?.nome?.split(' ') || [];
    document.getElementById('nome').value = partesNome[0] || '';
    document.getElementById('sobrenome').value = partesNome.slice(1).join(' ') || '';
    document.getElementById('slug').value = slug;
    updateUrlDisplay(slug);
    
    document.getElementById('profissao').value = data.inicio?.profissao || '';
    document.getElementById('endereco').value = data.inicio?.endereco || data.inicio?.localizacao || '';
    document.getElementById('email').value = data.inicio?.email || '';
    document.getElementById('telefone').value = data.inicio?.telefone || '';
    if (data.inicio?.foto_perfil) {
        document.getElementById('photoPreview').src = `../${data.inicio.foto_perfil}?t=${Date.now()}`;
        document.getElementById('photoPreview').style.display = 'block';
    }
    document.getElementById('descricao').value = data.perfil?.descricao || '';
    if (data.social) data.social.forEach(s => adicionarSocial(s));
    if (data.habilidades) data.habilidades.forEach(h => adicionarHabilidade(h));
    if (data.idiomas) data.idiomas.forEach(i => adicionarIdioma(i));
    if (data.experiencia_profissional && Array.isArray(data.experiencia_profissional)) data.experiencia_profissional.forEach(e => adicionarExperiencia(e));
    if (data.educacao && Array.isArray(data.educacao)) data.educacao.forEach(e => adicionarEducacao(e));
    if (data.certificados && Array.isArray(data.certificados)) data.certificados.forEach(c => adicionarCertificado(c));
    if (data.interesses) {
        data.interesses.forEach(int => {
            const icon = document.querySelector(`.icon-item[title="${int}"]`);
            if (icon) icon.classList.add('selected');
        });
    }
    if (data.whatsapp) { document.getElementById('wa_numero').value = data.whatsapp.numero || ''; }
    atualizarPreview(slug);
}

// --- Dynamic Fields ---
function adicionarSocial(d=null) { const l = document.getElementById('socialList'); const div = document.createElement('div'); div.className = 'dynamic-item form-row'; div.innerHTML = `<button type="button" class="btn-remove" onclick="this.parentElement.remove(); syncPreview()">×</button><div class="field-item"><select class="input-pro s-rede">${['LinkedIn','WhatsApp','Instagram','TikTok','GitHub','Site'].map(r => `<option value="${r}" ${d?.rede === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div><div class="field-item"><input type="text" class="input-pro s-url" placeholder="Link" value="${d?.url || ''}"></div>`; l.appendChild(div); if(!d) syncPreview(); }
function adicionarHabilidade(d=null) { const l = document.getElementById('habilidadesList'); if (l.children.length >= LIMIT_HABILIDADES && !d) return alert(`Limit ${LIMIT_HABILIDADES}`); const div = document.createElement('div'); div.className = 'dynamic-item form-row'; div.innerHTML = `<button type="button" class="btn-remove" onclick="this.parentElement.remove(); syncPreview()">×</button><div class="field-item"><input type="text" class="input-pro h-nome" placeholder="Hab" value="${d?.nome || ''}"></div><div class="field-item"><input type="number" class="input-pro h-nivel" value="${d?.nivel || 80}"></div>`; l.appendChild(div); if(!d) syncPreview(); }
function adicionarIdioma(d=null) { const l = document.getElementById('idiomasList'); if (l.children.length >= LIMIT_IDIOMAS && !d) return alert(`Limit ${LIMIT_IDIOMAS}`); const div = document.createElement('div'); div.className = 'dynamic-item form-row'; div.innerHTML = `<button type="button" class="btn-remove" onclick="this.parentElement.remove(); syncPreview()">×</button><div class="field-item"><input type="text" class="input-pro i-nome" placeholder="Idio" value="${d?.nome || ''}"></div><div class="field-item"><input type="text" class="input-pro i-nivel" placeholder="Flu" value="${d?.nivel || ''}"></div>`; l.appendChild(div); if(!d) syncPreview(); }
function adicionarExperiencia(d=null) { const l = document.getElementById('experienciasList'); if (l.children.length >= LIMIT_EXPERIENCIA && !d) return alert(`Limit ${LIMIT_EXPERIENCIA}`); const div = document.createElement('div'); div.className = 'dynamic-item'; div.innerHTML = `<button type="button" class="btn-remove" onclick="this.parentElement.remove(); syncPreview()">×</button><div class="form-row"><div class="field-item"><label>Cargo</label><input type="text" class="input-pro e-cargo" value="${d?.cargo || d?.titulo || ''}"></div><div class="field-item"><label>Empresa</label><input type="text" class="input-pro e-empresa" value="${d?.empresa || ''}"></div></div><div class="field-item"><label>Período</label><input type="text" class="input-pro e-periodo" value="${d?.periodo || d?.data || ''}"></div><div class="field-item"><label>Atividades</label><textarea class="textarea-pro e-desc" rows="2">${d?.descricao || ''}</textarea></div>`; l.appendChild(div); if(!d) syncPreview(); }
function adicionarEducacao(d=null) { const l = document.getElementById('educacaoList'); if (l.children.length >= LIMIT_EDUCACAO && !d) return alert(`Limit ${LIMIT_EDUCACAO}`); const div = document.createElement('div'); div.className = 'dynamic-item'; div.innerHTML = `<button type="button" class="btn-remove" onclick="this.parentElement.remove(); syncPreview()">×</button><div class="field-item"><label>Curso</label><input type="text" class="input-pro edu-curso" value="${d?.curso || d?.titulo || ''}"></div><div class="field-item"><label>Instituição</label><input type="text" class="input-pro edu-inst" value="${d?.instituicao || ''}"></div><div class="field-item"><label>Período</label><input type="text" class="input-pro edu-per" value="${d?.periodo || d?.ano || ''}"></div>`; l.appendChild(div); if(!d) syncPreview(); }
function adicionarCertificado(d=null) { const l = document.getElementById('certificadosList'); if (l.children.length >= LIMIT_CERTIFICADOS && !d) return alert(`Limit ${LIMIT_CERTIFICADOS}`); const div = document.createElement('div'); div.className = 'dynamic-item'; div.innerHTML = `<button type="button" class="btn-remove" onclick="this.parentElement.remove(); syncPreview()">×</button><div class="field-item"><label>Ano</label><input type="text" class="input-pro cert-ano" value="${d?.ano || ''}"></div><div class="field-item"><label>Título</label><input type="text" class="input-pro cert-titulo" value="${d?.titulo || d?.nome || ''}"></div>`; l.appendChild(div); if(!d) syncPreview(); }

// --- Publicar ---
async function publicarCurriculo() {
    const newSlug = document.getElementById('slug').value.trim();
    if (!newSlug) return alert("URL obrigatória.");
    showLoader(true);

    try {
        const payload = collectData();
        const photoInput = document.getElementById('photoInput');
        
        // Se a slug mudou, deletamos o antigo e salvamos o novo
        if (currentSlug && currentSlug !== newSlug) {
            await deletarDoGitHub(`dados/${currentSlug}.json`);
            // Se houver foto antiga, deletamos também para evitar lixo
            if (currentData && currentData.inicio.foto_perfil && currentData.inicio.foto_perfil.includes(currentSlug)) {
                await deletarDoGitHub(currentData.inicio.foto_perfil);
            }
        }

        if (photoInput.files.length > 0) {
            const photoPath = `dados/uploads/${newSlug}.png`;
            await uploadToGitHub(photoPath, photoInput.files[0]);
            payload.inicio.foto_perfil = photoPath;
        } else if (currentData && currentData.inicio.foto_perfil) {
            // Se mudou a slug mas manteve a foto, precisamos renomear o arquivo da foto no GitHub
            if (currentSlug !== newSlug && currentData.inicio.foto_perfil.includes(currentSlug)) {
                const oldPath = currentData.inicio.foto_perfil;
                const newPath = `dados/uploads/${newSlug}.png`;
                await renomearArquivoGitHub(oldPath, newPath);
                payload.inicio.foto_perfil = newPath;
            } else {
                payload.inicio.foto_perfil = currentData.inicio.foto_perfil;
            }
        }

        await uploadToGitHub(`dados/${newSlug}.json`, JSON.stringify(payload, null, 2), true);
        alert("Publicado com Sucesso!");
        listarCurriculos();
        window.location.href = `../?id=${newSlug}`;
    } catch (e) { alert(`Falha: ${e.message}`); }
    finally { showLoader(false); }
}

function collectData() {
    const fullNome = `${document.getElementById('nome').value} ${document.getElementById('sobrenome').value}`.trim();
    const social = Array.from(document.querySelectorAll('#socialList .dynamic-item')).map(it => ({ rede: it.querySelector('.s-rede').value, url: it.querySelector('.s-url').value }));
    const habs = Array.from(document.querySelectorAll('#habilidadesList .dynamic-item')).map(it => ({ nome: it.querySelector('.h-nome').value, nivel: it.querySelector('.h-nivel').value }));
    const idis = Array.from(document.querySelectorAll('#idiomasList .dynamic-item')).map(it => ({ nome: it.querySelector('.i-nome').value, nivel: it.querySelector('.i-nivel').value }));
    const exps = Array.from(document.querySelectorAll('#experienciasList .dynamic-item')).map(it => ({ cargo: it.querySelector('.e-cargo').value, empresa: it.querySelector('.e-empresa').value, periodo: it.querySelector('.e-periodo').value, descricao: it.querySelector('.e-desc').value }));
    const edus = Array.from(document.querySelectorAll('#educacaoList .dynamic-item')).map(it => ({ curso: it.querySelector('.edu-curso').value, instituicao: it.querySelector('.edu-inst').value, periodo: it.querySelector('.edu-per').value }));
    const certs = Array.from(document.querySelectorAll('#certificadosList .dynamic-item')).map(it => ({ ano: it.querySelector('.cert-ano').value, titulo: it.querySelector('.cert-titulo').value }));
    const ints = Array.from(document.querySelectorAll('.icon-item.selected')).map(el => el.title);
    return {
        inicio: { nome: fullNome, profissao: document.getElementById('profissao').value, endereco: document.getElementById('endereco').value, localizacao: document.getElementById('endereco').value, email: document.getElementById('email').value, telefone: document.getElementById('telefone').value, botao_baixar: "BAIXAR" },
        social, perfil: { descricao: document.getElementById('descricao').value }, habilidades: habs, idiomas: idis, experiencia_profissional: exps, educacao: edus, certificados: certs, interesses: ints,
        whatsapp: { ativo: true, numero: document.getElementById('wa_numero').value, mensagemPadrao: "Olá..." }
    };
}

// --- GitHub API Helpers ---
async function uploadToGitHub(path, content, isText = false) {
    let base64 = isText ? btoa(unescape(encodeURIComponent(content))) : await toBase64(content);
    let sha = null;
    try {
        const res = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${path}`, { headers: { 'Authorization': `token ${githubToken}` } });
        if (res.ok) sha = (await res.json()).sha;
    } catch (e) {}
    const res = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${path}`, {
        method: 'PUT', headers: { 'Authorization': `token ${githubToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Save v3.4: ${path}`, content: base64, sha })
    });
    if (!res.ok) throw new Error(`Erro GitHub: ${res.statusText}`);
}

async function deletarDoGitHub(path) {
    try {
        const resGet = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${path}`, { headers: { 'Authorization': `token ${githubToken}` } });
        if (!resGet.ok) return;
        const sha = (await resGet.json()).sha;
        await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${path}`, {
            method: 'DELETE', headers: { 'Authorization': `token ${githubToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Delete v3.4: ${path}`, sha })
        });
    } catch (e) {}
}

async function renomearArquivoGitHub(oldPath, newPath) {
    try {
        const resGet = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${oldPath}`, { headers: { 'Authorization': `token ${githubToken}` } });
        if (!resGet.ok) return;
        const data = await resGet.json();
        const base64 = data.content;
        await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${newPath}`, {
            method: 'PUT', headers: { 'Authorization': `token ${githubToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Rename (Move) v3.4: ${newPath}`, content: base64 })
        });
        await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${oldPath}`, {
            method: 'DELETE', headers: { 'Authorization': `token ${githubToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Rename (Delete Old) v3.4: ${oldPath}`, sha: data.sha })
        });
    } catch (e) {}
}

function toBase64(file) { return new Promise((r, j) => { const rd = new FileReader(); rd.readAsDataURL(file); rd.onload = () => r(rd.result.split(',')[1]); rd.onerror = e => j(e); }); }

function limparFormulario(f = true) {
    if (f) document.getElementById('cvForm').reset();
    document.getElementById('photoPreview').style.display = 'none';
    ['socialList', 'habilidadesList', 'idiomasList', 'experienciasList', 'educacaoList', 'certificadosList'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ''; });
    document.querySelectorAll('.icon-item').forEach(i => i.classList.remove('selected'));
    currentSlug = ''; currentData = null; isManualSlug = false;
    if (f) adicionarSocial({rede: 'WhatsApp', url: ''});
    updateSlugDisplayFromInputs();
    syncPreview();
}

function updateSlugDisplayFromInputs() {
    const n = document.getElementById('nome').value;
    const s = document.getElementById('sobrenome').value;
    const val = `${n}-${s}`.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const slugInput = document.getElementById('slug');
    if (slugInput) { slugInput.value = val; updateUrlDisplay(val); }
}

function showLoader(s) { document.getElementById('loader').style.display = s ? 'flex' : 'none'; }
function atualizarPreview(s = null) { const i = document.getElementById('previewFrame'); if (i) i.src = (s && s !== '') ? `../?id=${s}` : '../?id=modelo'; }
