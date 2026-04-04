/**
 * CurriculoClick Dashboard Engine v3.1
 * Foco: Nome/Sobrenome, Endereço, Limites (5 Habs, 3 Idis, 3 Exps), Responsividade.
 */

const GITHUB_API = 'https://api.github.com';
let githubToken = localStorage.getItem('cc_github_token');
let githubRepo = localStorage.getItem('cc_github_repo') || 'thiagodelgado/curriculoclick';

// State & Limits
let currentData = null;
let currentSlug = '';
const LIMIT_HABILIDADES = 5;
const LIMIT_IDIOMAS = 3;
const LIMIT_EXPERIENCIA = 3;

// Icons Definitions
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
    'TikTok': 'fa-brands fa-tiktok', 'Site': 'fa-solid fa-globe'
};

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
            reader.onload = (ev) => { photoPreview.src = ev.target.result; photoPreview.style.display = 'block'; };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('publishBtn').addEventListener('click', publicarCurriculo);
}

function renderIconSelectors() {
    const grid = document.getElementById('interestIcons');
    if (!grid) return;
    grid.innerHTML = '';
    Object.entries(INTEREST_ICONS).forEach(([name, icon]) => {
        const item = document.createElement('div');
        item.className = 'icon-item';
        item.innerHTML = `<i class="fa-solid ${icon}"></i>`;
        item.title = name;
        item.onclick = () => item.classList.toggle('selected');
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
        files.filter(f => f.name.endsWith('.json') && f.name !== 'modelo.json').forEach(file => {
            const btn = document.createElement('div');
            btn.className = 'menu-item';
            btn.innerHTML = `<i class="fa-solid fa-circle-user"></i> <span>${file.name.replace('.json', '')}</span>`;
            btn.onclick = () => carregarCurriculo(file.name.replace('.json', ''));
            listEl.appendChild(btn);
        });
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

    // Identidade
    const partesNome = data.inicio?.nome?.split(' ') || [];
    document.getElementById('nome').value = partesNome[0] || '';
    document.getElementById('sobrenome').value = partesNome.slice(1).join(' ') || '';
    document.getElementById('profissao').value = data.inicio?.profissao || '';
    document.getElementById('endereco').value = data.inicio?.endereco || data.inicio?.localizacao || '';
    document.getElementById('email').value = data.inicio?.email || '';
    document.getElementById('telefone').value = data.inicio?.telefone || '';
    
    if (data.inicio?.foto_perfil) {
        document.getElementById('photoPreview').src = `../${data.inicio.foto_perfil}?t=${Date.now()}`;
        document.getElementById('photoPreview').style.display = 'block';
    }

    // Textareas
    document.getElementById('descricao').value = data.perfil?.descricao || '';
    document.getElementById('educacao').value = typeof data.educacao === 'string' ? data.educacao : (Array.isArray(data.educacao) ? data.educacao.map(e => `${e.curso} - ${e.instituicao}`).join('\n') : '');
    document.getElementById('certificados').value = typeof data.certificados === 'string' ? data.certificados : (Array.isArray(data.certificados) ? data.certificados.map(c => c.nome).join('\n') : '');

    // Listas
    if (data.social) data.social.forEach(s => adicionarSocial(s));
    if (data.habilidades) data.habilidades.forEach(h => adicionarHabilidade(h));
    if (data.idiomas) data.idiomas.forEach(i => adicionarIdioma(i));
    if (data.experiencia_profissional && Array.isArray(data.experiencia_profissional)) {
        data.experiencia_profissional.forEach(e => adicionarExperiencia(e));
    }
    
    // Interesses
    if (data.interesses) {
        data.interesses.forEach(int => {
            const icon = document.querySelector(`.icon-item[title="${int}"]`);
            if (icon) icon.classList.add('selected');
        });
    }

    // WhatsApp
    if (data.whatsapp) {
        document.getElementById('wa_numero').value = data.whatsapp.numero || '';
    }

    atualizarPreview(slug);
}

// --- Dynamic Fields with Limits ---

function adicionarSocial(data = null) {
    const list = document.getElementById('socialList');
    const div = document.createElement('div');
    div.className = 'dynamic-item form-row';
    div.innerHTML = `
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>
        <div class="field-item"><select class="input-pro s-rede">${Object.keys(SOCIAL_ICONS).map(r => `<option value="${r}" ${data?.rede === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
        <div class="field-item"><input type="text" class="input-pro s-url" placeholder="Link ou @" value="${data?.url || ''}"></div>
    `;
    list.appendChild(div);
}

function adicionarHabilidade(data = null) {
    const list = document.getElementById('habilidadesList');
    if (list.children.length >= LIMIT_HABILIDADES && !data) return alert(`Limite de ${LIMIT_HABILIDADES} habilidades atingido.`);
    const div = document.createElement('div');
    div.className = 'dynamic-item form-row';
    div.innerHTML = `
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>
        <div class="field-item"><input type="text" class="input-pro h-nome" placeholder="Habilidade" value="${data?.nome || ''}"></div>
        <div class="field-item"><input type="number" class="input-pro h-nivel" placeholder="%" value="${data?.nivel || 80}"></div>
    `;
    list.appendChild(div);
}

function adicionarIdioma(data = null) {
    const list = document.getElementById('idiomasList');
    if (list.children.length >= LIMIT_IDIOMAS && !data) return alert(`Limite de ${LIMIT_IDIOMAS} idiomas atingido.`);
    const div = document.createElement('div');
    div.className = 'dynamic-item form-row';
    div.innerHTML = `
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>
        <div class="field-item"><input type="text" class="input-pro i-nome" placeholder="Idioma" value="${data?.nome || ''}"></div>
        <div class="field-item"><input type="text" class="input-pro i-nivel" placeholder="Fluência" value="${data?.nivel || ''}"></div>
    `;
    list.appendChild(div);
}

function adicionarExperiencia(data = null) {
    const list = document.getElementById('experienciasList');
    if (list.children.length >= LIMIT_EXPERIENCIA && !data) return alert(`Limite de ${LIMIT_EXPERIENCIA} experiências atingido.`);
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>
        <div class="form-row">
            <div class="field-item"><label>Cargo/Função</label><input type="text" class="input-pro e-cargo" placeholder="Ex: Vice-Presidente" value="${data?.cargo || data?.titulo || ''}"></div>
            <div class="field-item"><label>Empresa</label><input type="text" class="input-pro e-empresa" placeholder="Ex: Pizza Hut" value="${data?.empresa || ''}"></div>
        </div>
        <div class="field-item"><label>Período</label><input type="text" class="input-pro e-periodo" placeholder="Ex: Janeiro 2022 - Atual" value="${data?.periodo || data?.data || ''}"></div>
        <div class="field-item"><label>Atividades/Resumo</label><textarea class="textarea-pro e-desc" rows="2" placeholder="Resumo do serviço...">${data?.descricao || ''}</textarea></div>
    `;
    list.appendChild(div);
}

// --- Publicar ---

async function publicarCurriculo() {
    const nome = document.getElementById('nome').value;
    const sobrenome = document.getElementById('sobrenome').value;
    if (!nome) return alert("O Nome é obrigatório.");

    const slug = currentSlug || `${nome}-${sobrenome}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
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
        alert("Publicado com sucesso!");
        listarCurriculos();
        window.location.href = `../?id=${slug}`;
    } catch (e) { alert("Falha na publicação"); }
    finally { showLoader(false); }
}

function collectData() {
    const fullNome = `${document.getElementById('nome').value} ${document.getElementById('sobrenome').value}`.trim();
    const social = Array.from(document.querySelectorAll('#socialList .dynamic-item')).map(it => ({
        rede: it.querySelector('.s-rede').value, url: it.querySelector('.s-url').value
    }));
    const habs = Array.from(document.querySelectorAll('#habilidadesList .dynamic-item')).map(it => ({
        nome: it.querySelector('.h-nome').value, nivel: it.querySelector('.h-nivel').value
    }));
    const idis = Array.from(document.querySelectorAll('#idiomasList .dynamic-item')).map(it => ({
        nome: it.querySelector('.i-nome').value, nivel: it.querySelector('.i-nivel').value
    }));
    const exps = Array.from(document.querySelectorAll('#experienciasList .dynamic-item')).map(it => ({
        cargo: it.querySelector('.e-cargo').value,
        empresa: it.querySelector('.e-empresa').value,
        periodo: it.querySelector('.e-periodo').value,
        descricao: it.querySelector('.e-desc').value
    }));
    const ints = Array.from(document.querySelectorAll('.icon-item.selected')).map(el => el.title);

    return {
        inicio: {
            nome: fullNome,
            profissao: document.getElementById('profissao').value,
            endereco: document.getElementById('endereco').value,
            localizacao: document.getElementById('endereco').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
            botao_baixar: "BAIXAR CURRÍCULO"
        },
        social: social,
        perfil: { descricao: document.getElementById('descricao').value },
        habilidades: habs,
        idiomas: idis,
        experiencia_profissional: exps,
        educacao: document.getElementById('educacao').value,
        certificados: document.getElementById('certificados').value,
        interesses: ints,
        whatsapp: {
            ativo: true,
            numero: document.getElementById('wa_numero').value,
            mensagemPadrao: "Olá, vi seu currículo e gostaria de conversar."
        }
    };
}

async function uploadToGitHub(path, content, isText = false) {
    let base64 = isText ? btoa(unescape(encodeURIComponent(content))) : await toBase64(content);
    let sha = null;
    try {
        const res = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${path}`, { headers: { 'Authorization': `token ${githubToken}` } });
        if (res.ok) sha = (await res.json()).sha;
    } catch (e) {}
    const res = await fetch(`${GITHUB_API}/repos/${githubRepo}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${githubToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Dashboard v3.1: ${path}`, content: base64, sha: sha })
    });
    if (!res.ok) throw new Error("Erro GitHub");
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
    const dynamicLists = ['socialList', 'habilidadesList', 'idiomasList', 'experienciasList'];
    dynamicLists.forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ''; });
    document.querySelectorAll('.icon-item').forEach(i => i.classList.remove('selected'));
    currentSlug = ''; currentData = null;
    if (full) { adicionarSocial({rede: 'WhatsApp', url: ''}); }
}

function showLoader(show) { document.getElementById('loader').style.display = show ? 'flex' : 'none'; }
function atualizarPreview(slug = null) { const iframe = document.getElementById('previewFrame'); if (iframe) iframe.src = slug ? `../?id=${slug}` : 'about:blank'; }
