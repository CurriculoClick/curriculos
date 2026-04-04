/**
 * CurriculoClick Admin Panel - Painel.js
 * Gerenciamento de criação de currículos e sincronização com GitHub
 */

const GITHUB_API = 'https://api.github.com';
let githubToken = localStorage.getItem('cc_github_token');
let githubRepo = localStorage.getItem('cc_github_repo') || 'thiagodelgado/curriculoclick';

// Icon Mapping (Extraído de carregarDados.js)
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

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkConfiguration();
    setupEventListeners();
    renderIconSelectors();
});

function checkConfiguration() {
    if (!githubToken) {
        alert("Configuração pendente! Redirecionando para a página de configuração.");
        window.location.href = 'configuracao.html';
    }
}

function setupEventListeners() {
    // Photo Upload Preview
    const photoInput = document.getElementById('photoInput');
    const photoUploader = document.getElementById('photoUploader');
    const photoPreview = document.getElementById('photoPreview');

    photoUploader.addEventListener('click', () => photoInput.click());
    
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                photoPreview.src = event.target.result;
                photoPreview.style.display = 'block';
                photoUploader.querySelector('i').style.display = 'none';
                photoUploader.querySelector('p').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    // Form Submission
    document.getElementById('publishBtn').addEventListener('click', publishCurriculo);
}

function renderIconSelectors() {
    const interestGrid = document.getElementById('interestIcons');
    if (!interestGrid) return;

    Object.entries(INTEREST_ICONS).forEach(([name, icon]) => {
        const item = document.createElement('div');
        item.className = 'icon-item';
        item.innerHTML = `<i class="fa-solid ${icon}"></i>`;
        item.title = name;
        item.onclick = () => {
            item.classList.toggle('selected');
        };
        interestGrid.appendChild(item);
    });
}

async function publishCurriculo() {
    const loader = document.getElementById('loader');
    loader.style.display = 'flex';

    try {
        const formData = collectFormData();
        const slug = formData.inicio.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
        
        // 1. Upload Photo if selected
        let photoPath = "ativos/imagens/foto.png"; // Default
        const photoFile = document.getElementById('photoInput').files[0];
        if (photoFile) {
            photoPath = `dados/uploads/${slug}.png`;
            await uploadFileToGitHub(photoPath, photoFile);
            formData.inicio.foto_perfil = photoPath;
        }

        // 2. Upload JSON
        const jsonPath = `dados/${slug}.json`;
        const jsonContent = JSON.stringify(formData, null, 2);
        await uploadFileToGitHub(jsonPath, jsonContent, true);

        alert(`Sucesso! Currículo publicado em: /?id=${slug}`);
        window.location.href = `../?id=${slug}`;

    } catch (err) {
        console.error(err);
        alert("Erro ao publicar: " + err.message);
    } finally {
        loader.style.display = 'none';
    }
}

function collectFormData() {
    // Coleta básica (expandir conforme necessário)
    const selectedInterests = Array.from(document.querySelectorAll('#interestIcons .icon-item.selected'))
        .map(el => el.title);

    return {
        inicio: {
            nome: document.getElementById('nome').value,
            profissao: document.getElementById('profissao').value,
            idade: document.getElementById('idade').value,
            estado_civil: document.getElementById('estado_civil').value,
            localizacao: document.getElementById('localizacao').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
            botao_baixar: "BAIXAR CURRÍCULO",
            foto_perfil: "" // Set later
        },
        perfil: {
            descricao: document.getElementById('descricao').value
        },
        habilidades: [], // Adicionar inputs dinâmicos depois
        idiomas: [],
        experiencia_profissional: [],
        certificacoes: [],
        educacao: [],
        interesses: selectedInterests,
        whatsapp: {
            ativo: true,
            numero: document.getElementById('telefone').value.replace(/\D/g, ''),
            mensagemPadrao: "Olá, gostaria de falar sobre seu currículo."
        }
    };
}

async function uploadFileToGitHub(path, content, isText = false) {
    let base64Content;
    
    if (isText) {
        base64Content = btoa(unescape(encodeURIComponent(content)));
    } else {
        // Handle file (Image)
        base64Content = await fileToBase64(content);
    }

    // Check if file exists to get SHA (for updates)
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
        headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Admin: Adicionando/Atualizando ${path}`,
            content: base64Content,
            sha: sha
        })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Falha no upload para o GitHub");
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}
