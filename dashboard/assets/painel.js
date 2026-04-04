/**
 * CurriculoClick Dashboard Pro - JS Engine v2.0
 * Suporta: CRUD completo, listagem automática de clientes, seletor de ícones.
 */

const GITHUB_API = 'https://api.github.com';
let githubToken = localStorage.getItem('cc_github_token');
let githubRepo = localStorage.getItem('cc_github_repo') || 'thiagodelgado/curriculoclick';

// State Management
let currentData = null;
let currentSlug = '';

// Icon Selection List (Extraído de carregarDados.js)
const INTEREST_ICONS = {
    'pets': 'fa-paw', 'natureza': 'fa-leaf', 'viagens': 'fa-plane',
    'vídeo game': 'fa-gamepad', 'filmes': 'fa-film', 'séries': 'fa-film',
    'culinária': 'fa-utensils', 'esportes': 'fa-futbol', 'leitura': 'fa-book',
    'música': 'fa-music', 'fotografia': 'fa-camera', 'voluntariado': 'fa-hands-helping',
    'tecnologia': 'fa-laptop', 'jardinagem': 'fa-seedling', 'arte': 'fa-palette',
    'escrita': 'fa-pen-nib', 'festa': 'fa-cocktail', 'dança': 'fa-theater-masks',
    'astronomia': 'fa-satellite', 'xadrez': 'fa-chess', 'podcast': 'fa-podcast',
    'ciclismo': 'fa-bicycle', 'maternidade': 'fa-baby', 'família': 'fa-users',
    'programação': 'fa-code', 'internet': 'fa-globe', 'redes sociais': 'fa-hashtag',
    'praia': 'fa-umbrella-beach', 'saúde e beleza': 'fa-heart-pulse', 'notícias': 'fa-newspaper'
};

const SOCIAL_ICONS = {
    'Instagram': 'fa-brands fa-instagram', 'LinkedIn': 'fa-brands fa-linkedin',
    'WhatsApp': 'fa-brands fa-whatsapp', 'GitHub': 'fa-brands fa-github',
    'Facebook': 'fa-brands fa-facebook', 'YouTube': 'fa-brands fa-youtube',
    'TikTok': 'fa-brands fa-tiktok', 'Site': 'fa-solid fa-globe', 'Outro': 'fa-solid fa-link'
};

document.addEventListener('DOMContentLoaded', async () => {
    checkConfig();
    setupCoreEvents();
    renderIconSelectors();
    await listarCurriculos();
    limparFormulario(); 
});

function checkConfig() {
    if (!githubToken) { window.location.href = 'configuracao.html'; }
}

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
            };
            reader.readAsDataURL(file);
        }
    });
    document.getElementById('publishBtn').addEventListener('click', publicarCurriculo);
}

function renderIconSelectors() {
    const interestGrid = document.getElementById('interestIcons');
    interestGrid.innerHTML = '';
    Object.entries(INTEREST_ICONS).forEach(([name, icon]) => {
        const item = document.createElement('div');
        item.className = 'icon-item';
        item.innerHTML = `<i class="fa-solid ${icon}"></i>`;
        item.title = name;
        item.onclick = () => item.classList.toggle('selected');
        interestGrid.appendChild(item);
    });
}

// --- Funções de Listagem e Carregamento ---

async function listarCurriculos() {
    const listEl = document.getElementById('clientesList');
    try {
        const res = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/dados`, {
            headers: { 'Authorization': `token ${githubToken}` }
        });
        if (!res.ok) throw new Error("Falha ao listar arquivos.");
        const files = await res.json();
        
        listEl.innerHTML = '';
        files.filter(f => f.name.endsWith('.json') && f.name !== 'modelo.json').forEach(file => {
            const btn = document.createElement('a');
            btn.className = 'nav-item';
            btn.style.fontSize = '0.8rem';
            btn.innerHTML = `<i class="fa-solid fa-user"></i> ${file.name.replace('.json', '')}`;
            btn.href = '#';
            btn.onclick = (e) => {
                e.preventDefault();
                carregarCurriculo(file.name.replace('.json', ''));
            };
            listEl.appendChild(btn);
        });
    } catch (err) {
        listEl.innerHTML = '<div style="color:red; font-size:0.7rem">Erro ao carregar lista</div>';
    }
}

async function carregarCurriculo(slug) {
    showLoader(true);
    try {
        const response = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/dados/${slug}.json`, {
            headers: { 'Authorization': `token ${githubToken}` }
        });
        if (!response.ok) throw new Error("Arquivo não encontrado.");
        const fileData = await response.json();
        const json = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
        preencherFormulario(json, slug);
        currentSlug = slug;
        currentData = json;
    } catch (err) {
        alert("Erro ao carregar: " + err.message);
    } finally {
        showLoader(false);
    }
}

function preencherFormulario(data, slug) {
    limparFormulario(false);
    document.getElementById('nome').value = data.inicio?.nome || '';
    document.getElementById('profissao').value = data.inicio?.profissao || '';
    document.getElementById('idade').value = data.inicio?.idade || '';
    document.getElementById('localizacao').value = data.inicio?.localizacao || '';
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
    if (data.experiencia_profissional) data.experiencia_profissional.forEach(e => adicionarExperiencia(e));
    if (data.interesses) {
        data.interesses.forEach(int => {
            const iconEl = document.querySelector(`.icon-item[title="${int}"]`);
            if (iconEl) iconEl.classList.add('selected');
        });
    }
    if (data.whatsapp) {
        document.getElementById('wa_numero').value = data.whatsapp.numero || '';
        document.getElementById('wa_ativo').checked = data.whatsapp.ativo !== false;
        document.getElementById('wa_msg_saudacao').value = data.whatsapp.mensagemPosCumprimento || '';
    }
}

// --- Funções Dinâmicas ---

function adicionarSocial(data = null) {
    const container = document.getElementById('socialList');
    const div = document.createElement('div');
    div.className = 'dynamic-item row';
    div.innerHTML = `
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>
        <div class="form-group"><label>Rede</label><select class="form-control social-rede">
            ${Object.keys(SOCIAL_ICONS).map(r => `<option value="${r}" ${data?.rede === r ? 'selected' : ''}>${r}</option>`).join('')}
        </select></div>
        <div class="form-group"><label>URL / @</label><input type="text" class="form-control social-url" value="${data?.url || ''}"></div>
    `;
    container.appendChild(div);
}

function adicionarHabilidade(data = null) {
    const container = document.getElementById('habilidadesList');
    const div = document.createElement('div');
    div.className = 'dynamic-item row';
    div.innerHTML = `
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>
        <div class="form-group"><label>Nome</label><input type="text" class="form-control hab-nome" value="${data?.nome || ''}"></div>
        <div class="form-group"><label>Nível %</label><input type="number" class="form-control hab-nivel" value="${data?.nivel || 80}"></div>
    `;
    container.appendChild(div);
}

function adicionarIdioma(data = null) {
    const container = document.getElementById('idiomasList');
    const div = document.createElement('div');
    div.className = 'dynamic-item row';
    div.innerHTML = `
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>
        <div class="form-group"><label>Idioma</label><input type="text" class="form-control idi-nome" value="${data?.nome || ''}"></div>
        <div class="form-group"><label>Fluência</label><input type="text" class="form-control idi-nivel" value="${data?.nivel || ''}"></div>
    `;
    container.appendChild(div);
}

function adicionarExperiencia(data = null) {
    const container = document.getElementById('experienciasList');
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>
        <div class="row">
            <div class="form-group"><label>Cargo</label><input type="text" class="form-control exp-titulo" value="${data?.titulo || ''}"></div>
            <div class="form-group"><label>Empresa</label><input type="text" class="form-control exp-empresa" value="${data?.empresa || ''}"></div>
        </div>
        <div class="form-group"><label>Período</label><input type="text" class="form-control exp-data" value="${data?.data || ''}"></div>
        <textarea class="form-control exp-desc" rows="2" placeholder="Atividades...">${data?.descricao || ''}</textarea>
    `;
    container.appendChild(div);
}

// --- Publicar ---

async function publicarCurriculo() {
    const nome = document.getElementById('nome').value;
    if (!nome) return alert("O Nome é obrigatório.");
    const slug = currentSlug || nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    showLoader(true);
    try {
        const payload = collectData();
        const photoInput = document.getElementById('photoInput');
        if (photoInput.files.length > 0) {
            const photoPath = `dados/uploads/${slug}.png`;
            await uploadToGitHub(photoPath, photoInput.files[0]);
            payload.inicio.foto_perfil = photoPath;
        } else if (currentData && currentData.inicio.foto_perfil) {
            payload.inicio.foto_perfil = currentData.inicio.foto_perfil;
        }
        await uploadToGitHub(`dados/${slug}.json`, JSON.stringify(payload, null, 2), true);
        alert(`Sucesso! Currículo salvo: /?id=${slug}`);
        await listarCurriculos();
        window.location.href = `../?id=${slug}`;
    } catch (err) {
        alert("Falha: " + err.message);
    } finally {
        showLoader(false);
    }
}

function collectData() {
    const selectedInt = Array.from(document.querySelectorAll('#interestIcons .icon-item.selected')).map(el => el.title);
    const social = Array.from(document.querySelectorAll('#socialList .dynamic-item')).map(it => ({
        rede: it.querySelector('.social-rede').value, url: it.querySelector('.social-url').value
    }));
    const habilidades = Array.from(document.querySelectorAll('#habilidadesList .dynamic-item')).map(it => ({
        nome: it.querySelector('.hab-nome').value, nivel: it.querySelector('.hab-nivel').value
    }));
    const idiomas = Array.from(document.querySelectorAll('#idiomasList .dynamic-item')).map(it => ({
        nome: it.querySelector('.idi-nome').value, nivel: it.querySelector('.idi-nivel').value
    }));
    const experiencia = Array.from(document.querySelectorAll('#experienciasList .dynamic-item')).map(it => ({
        titulo: it.querySelector('.exp-titulo').value, empresa: it.querySelector('.exp-empresa').value,
        data: it.querySelector('.exp-data').value, descricao: it.querySelector('.exp-desc').value
    }));

    return {
        inicio: {
            nome: document.getElementById('nome').value, profissao: document.getElementById('profissao').value,
            idade: document.getElementById('idade').value, localizacao: document.getElementById('localizacao').value,
            email: document.getElementById('email').value, telefone: document.getElementById('telefone').value,
            botao_baixar: "BAIXAR CURRÍCULO"
        },
        social: social,
        perfil: { descricao: document.getElementById('descricao').value },
        habilidades: habilidades, idiomas: idiomas, experiencia_profissional: experiencia, interesses: selectedInt,
        whatsapp: {
            ativo: document.getElementById('wa_ativo').checked, numero: document.getElementById('wa_numero').value,
            mensagemPosCumprimento: document.getElementById('wa_msg_saudacao').value,
            mensagemPadrao: "Olá, vim através do seu currículo online."
        }
    };
}

async function uploadToGitHub(path, content, isText = false) {
    let base64 = isText ? btoa(unescape(encodeURIComponent(content))) : await toBase64(content);
    let sha = null;
    try {
        const res = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${path}`, {
            headers: { 'Authorization': `token ${githubToken}` }
        });
        if (res.ok) { sha = (await res.json()).sha; }
    } catch (e) {}
    const res = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${githubToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Dashboard: ${path}`, content: base64, sha: sha })
    });
    if (!res.ok) throw new Error("Erro de API GitHub");
}

function toBase64(file) {
    return new Promise((r, j) => {
        const rd = new FileReader(); rd.readAsDataURL(file);
        rd.onload = () => r(rd.result.split(',')[1]); rd.onerror = e => j(e);
    });
}

function limparFormulario(full = true) {
    if (full) document.getElementById('cvForm').reset();
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('socialList').innerHTML = '';
    document.getElementById('habilidadesList').innerHTML = '';
    document.getElementById('idiomasList').innerHTML = '';
    document.getElementById('experienciasList').innerHTML = '';
    document.querySelectorAll('.icon-item').forEach(i => i.classList.remove('selected'));
    currentSlug = '';
    currentData = null;
    if (full) adicionarSocial({rede: 'WhatsApp', url: ''});
}

function showLoader(show) {
    document.getElementById('loader').style.display = show ? 'flex' : 'none';
}
