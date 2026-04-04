/**
 * CurriculoClick Dashboard Pro - JS Engine
 * Suporta: CRUD completo, listas dinâmicas, edição de existentes.
 */

const GITHUB_API = 'https://api.github.com';
let githubToken = localStorage.getItem('cc_github_token');
let githubRepo = localStorage.getItem('cc_github_repo') || 'thiagodelgado/curriculoclick';

// State Management
let currentData = null;
let currentSlug = '';

// Icons & Defaults
const SOCIAL_ICONS = {
    'Instagram': 'fa-brands fa-instagram', 'LinkedIn': 'fa-brands fa-linkedin',
    'WhatsApp': 'fa-brands fa-whatsapp', 'GitHub': 'fa-brands fa-github',
    'Facebook': 'fa-brands fa-facebook', 'YouTube': 'fa-brands fa-youtube',
    'TikTok': 'fa-brands fa-tiktok', 'Site': 'fa-solid fa-globe', 'Outro': 'fa-solid fa-link'
};

document.addEventListener('DOMContentLoaded', () => {
    checkConfig();
    setupCoreEvents();
    limparFormulario(); // Inicializa vazio
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

// --- Funções de Carregamento ---

async function carregarCurriculoExistente() {
    const slug = document.getElementById('loadId').value.trim();
    if (!slug) return alert("Digite um ID válido.");
    
    showLoader(true);
    try {
        const response = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/dados/${slug}.json`, {
            headers: { 'Authorization': `token ${githubToken}` }
        });
        
        if (!response.ok) throw new Error("Currículo não encontrado no GitHub.");
        
        const fileData = await response.json();
        const json = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
        
        preencherFormulario(json, slug);
        currentSlug = slug;
        alert("Dados carregados com sucesso! Agora você pode editar.");
        
    } catch (err) {
        alert("Erro: " + err.message);
    } finally {
        showLoader(false);
    }
}

function preencherFormulario(data, slug) {
    limparFormulario(); // Reseta antes de preencher
    
    // Início
    document.getElementById('nome').value = data.inicio?.nome || '';
    document.getElementById('profissao').value = data.inicio?.profissao || '';
    document.getElementById('idade').value = data.inicio?.idade || '';
    document.getElementById('estado_civil').value = data.inicio?.estado_civil || '';
    document.getElementById('localizacao').value = data.inicio?.localizacao || '';
    document.getElementById('email').value = data.inicio?.email || '';
    document.getElementById('telefone').value = data.inicio?.telefone || '';
    
    if (data.inicio?.foto_perfil) {
        // Tentativa de carregar a foto do GitHub se for path relativo
        const photoPreview = document.getElementById('photoPreview');
        photoPreview.src = `../${data.inicio.foto_perfil}?t=${Date.now()}`;
        photoPreview.style.display = 'block';
    }

    // Perfil
    document.getElementById('descricao').value = data.perfil?.descricao || '';

    // Redes Sociais
    if (data.social) data.social.forEach(s => adicionarSocial(s));

    // Habilidades
    if (data.habilidades) data.habilidades.forEach(h => adicionarHabilidade(h));

    // Idiomas
    if (data.idiomas) data.idiomas.forEach(i => adicionarIdioma(i));

    // Experiências
    if (data.experiencia_profissional) data.experiencia_profissional.forEach(e => adicionarExperiencia(e));

    // WhatsApp
    if (data.whatsapp) {
        document.getElementById('wa_numero').value = data.whatsapp.numero || '';
        document.getElementById('wa_ativo').checked = data.whatsapp.ativo !== false;
        document.getElementById('wa_msg_saudacao').value = data.whatsapp.mensagemPosCumprimento || '';
    }

    atualizarPreview(slug);
}

// --- Manipulação de Listas Dinâmicas ---

function adicionarSocial(data = null) {
    const container = document.getElementById('socialList');
    const div = document.createElement('div');
    div.className = 'dynamic-item row';
    div.innerHTML = `
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>
        <div class="form-group">
            <label>Rede</label>
            <select class="form-control social-rede">
                ${Object.keys(SOCIAL_ICONS).map(r => `<option value="${r}" ${data?.rede === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
        </div>
        <div class="form-group"><label>Link ou @User</label><input type="text" class="form-control social-url" value="${data?.url || ''}"></div>
    `;
    container.appendChild(div);
}

function adicionarHabilidade(data = null) {
    const container = document.getElementById('habilidadesList');
    const div = document.createElement('div');
    div.className = 'dynamic-item row';
    div.innerHTML = `
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>
        <div class="form-group"><label>Habilidade</label><input type="text" class="form-control hab-nome" value="${data?.nome || ''}"></div>
        <div class="form-group"><label>Nível (0-100%)</label><input type="number" class="form-control hab-nivel" value="${data?.nivel || 80}"></div>
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
        <div class="form-group"><label>Nível (Ex: Fluente)</label><input type="text" class="form-control idi-nivel" value="${data?.nivel || ''}"></div>
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
        <div class="form-group"><label>Descrição das Atividades</label><textarea class="form-control exp-desc" rows="2">${data?.descricao || ''}</textarea></div>
    `;
    container.appendChild(div);
}

// --- Publicação e Salvamento ---

async function publicarCurriculo() {
    const nome = document.getElementById('nome').value;
    if (!nome) return alert("O Nome é obrigatório.");

    const slug = currentSlug || nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    showLoader(true);

    try {
        const payload = collectData();
        
        // 1. Upload de Foto (opcional)
        const photoInput = document.getElementById('photoInput');
        if (photoInput.files.length > 0) {
            const photoPath = `dados/uploads/${slug}.png`;
            await uploadToGitHub(photoPath, photoInput.files[0]);
            payload.inicio.foto_perfil = photoPath;
        } else if (currentData && currentData.inicio.foto_perfil) {
            payload.inicio.foto_perfil = currentData.inicio.foto_perfil;
        }

        // 2. Upload de JSON
        const jsonPath = `dados/${slug}.json`;
        await uploadToGitHub(jsonPath, JSON.stringify(payload, null, 2), true);

        alert(`Sucesso! Currículo publicado/atualizado: /?id=${slug}`);
        window.location.href = `../?id=${slug}`;

    } catch (err) {
        alert("Falha na publicação: " + err.message);
    } finally {
        showLoader(false);
    }
}

function collectData() {
    // Coleta Social
    const social = Array.from(document.querySelectorAll('#socialList .dynamic-item')).map(item => ({
        rede: item.querySelector('.social-rede').value,
        url: item.querySelector('.social-url').value
    }));

    // Coleta Habilidades
    const habilidades = Array.from(document.querySelectorAll('#habilidadesList .dynamic-item')).map(item => ({
        nome: item.querySelector('.hab-nome').value,
        nivel: item.querySelector('.hab-nivel').value
    }));

    // Coleta Idiomas
    const idiomas = Array.from(document.querySelectorAll('#idiomasList .dynamic-item')).map(item => ({
        nome: item.querySelector('.idi-nome').value,
        nivel: item.querySelector('.idi-nivel').value
    }));

    // Coleta Experiências
    const experiencia = Array.from(document.querySelectorAll('#experienciasList .dynamic-item')).map(item => ({
        titulo: item.querySelector('.exp-titulo').value,
        empresa: item.querySelector('.exp-empresa').value,
        data: item.querySelector('.exp-data').value,
        descricao: item.querySelector('.exp-desc').value
    }));

    return {
        inicio: {
            nome: document.getElementById('nome').value,
            profissao: document.getElementById('profissao').value,
            idade: document.getElementById('idade').value,
            estado_civil: document.getElementById('estado_civil').value,
            localizacao: document.getElementById('localizacao').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
            botao_baixar: "BAIXAR CURRÍCULO"
        },
        social: social,
        perfil: { descricao: document.getElementById('descricao').value },
        habilidades: habilidades,
        idiomas: idiomas,
        experiencia_profissional: experiencia,
        whatsapp: {
            ativo: document.getElementById('wa_ativo').checked,
            numero: document.getElementById('wa_numero').value,
            mensagemPosCumprimento: document.getElementById('wa_msg_saudacao').value,
            mensagemPadrao: "Olá, vim através do seu currículo online."
        }
    };
}

async function uploadToGitHub(path, content, isText = false) {
    let base64;
    if (isText) {
        base64 = btoa(unescape(encodeURIComponent(content)));
    } else {
        base64 = await toBase64(content);
    }

    let sha = null;
    try {
        const res = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${path}`, {
            headers: { 'Authorization': `token ${githubToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            sha = data.sha;
        }
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
        rd.onload = () => r(rd.result.split(',')[1]);
        rd.onerror = e => j(e);
    });
}

// --- Helpers ---

function limparFormulario() {
    document.getElementById('cvForm').reset();
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('socialList').innerHTML = '';
    document.getElementById('habilidadesList').innerHTML = '';
    document.getElementById('idiomasList').innerHTML = '';
    document.getElementById('experienciasList').innerHTML = '';
    currentSlug = '';
    currentData = null;
    adicionarSocial({rede: 'WhatsApp', url: ''}); // Padrão
    atualizarPreview();
}

function showLoader(show) {
    document.getElementById('loader').style.display = show ? 'flex' : 'none';
}

function atualizarPreview(slug = null) {
    const iframe = document.getElementById('previewFrame');
    if (slug) {
        iframe.src = `../?id=${slug}`;
    } else {
        iframe.src = 'about:blank';
    }
}
