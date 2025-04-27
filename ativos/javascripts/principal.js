/* Definir imagem em URL base64 */

const img = document.getElementById('inicio-imagem');

// bloco de código comentado de fetch removido, pois o arquivo perfil.txt não existe

/* Mostrar Menu */

const mostrarMenu = (toggleId, navId) => {
    const toggle = document.getElementById(toggleId);
    nav = document.getElementById(navId);

    // Validar se as variáveis existem
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            // Adiciona a classe mostrar-menu à div com a classe navegacao_menu
            nav.classList.toggle('mostrar-menu');
        });
    }
}

mostrarMenu('navegacao-toggle', 'navegacao-menu');

/* Remover menu em dispositivos móveis */

const navegacaoLink = document.querySelectorAll('.navegacao_link');

function acaoLink() {
    const navegacaoMenu = document.getElementById('navegacao-menu');
    // Ao clicar em cada navegacao_link, remove a classe mostrar-menu
    navegacaoMenu.classList.remove('mostrar-menu');
}

navegacaoLink.forEach(n => n.addEventListener('click', acaoLink));

/* Ativar link da seção ao rolar */

const secoes = document.querySelectorAll('section[id]');

function rolarAtivo() {
    const scrollY = window.pageYOffset;

    secoes.forEach(atual => {
        const alturaSecao = atual.offsetHeight;
        const topoSecao = atual.offsetTop - 50;
        secaoId = atual.getAttribute('id');

        if (scrollY > topoSecao && scrollY <= topoSecao + alturaSecao) {
            document.querySelector('.navegacao_menu a[href*=' + secaoId + ']').classList.add('active-link');
        } else {
            document.querySelector('.navegacao_menu a[href*=' + secaoId + ']').classList.remove('active-link');
        }
    });
}

window.addEventListener('scroll', rolarAtivo);

/* Mostrar botão de voltar ao topo */

function voltarAoTopo() {
    const voltarAoTopo = document.getElementById('voltar-ao-topo');
    if (this.scrollY >= 200) {
        voltarAoTopo.classList.add('mostrar-voltar');
    } else {
        voltarAoTopo.classList.remove('mostrar-voltar');
    }
}

window.addEventListener('scroll', voltarAoTopo);

/* Modo Claro/Escuro */

const botaoTema = document.getElementById('botao-tema');
let modoEscuro = 'modo-escuro';
let modoAtual = localStorage.getItem("modo-escuro");

function ativarModoEscuro() {
    document.body.classList.add(modoEscuro);
    botaoTema.classList.add('fa-sun');
    botaoTema.classList.remove('fa-moon');
    localStorage.setItem("modo-escuro", "ativado");
};

function desativarModoEscuro() {
    document.body.classList.remove(modoEscuro);
    botaoTema.classList.add('fa-moon');
    botaoTema.classList.remove('fa-sun');
    localStorage.setItem("modo-escuro", "desativado");
};

if (modoAtual === "ativado") {
    ativarModoEscuro();
}

botaoTema.addEventListener("click", () => {
    modoAtual = localStorage.getItem("modo-escuro");
    if (modoAtual === "desativado") {
        ativarModoEscuro();
    } else {
        desativarModoEscuro();
    }
});

/* Link para download de PDF no celular dependendo do modo claro/escuro */

const botaoDownload = document.getElementById('botao-download');

let customColorActive = false;
let selectedColorName = null;

// Função para remover acentos e caracteres inválidos do nome da cor
function sanitizeName(name) {
  return name.normalize('NFD').replace(/[^\w\- ]+/g, '').replace(/\s+/g, '');
}

// Adiciono função para aplicação programática de cor customizada via JSON
window.applyCustomColor = (hex, name) => {
    // Ignora em telas pequenas
    if (window.innerWidth <= 968) return;
    // Aplica cor de fundo
    leftSide.style.backgroundColor = hex;
    leftSide.classList.add('custom-color-active');
    customColorActive = true;
    // Atualiza nome para o PDF
    selectedColorName = sanitizeName(name);
    // Ajusta contraste
    const hexClean = hex.replace('#','');
    const r = parseInt(hexClean.substr(0,2), 16);
    const g = parseInt(hexClean.substr(2,2), 16);
    const b = parseInt(hexClean.substr(4,2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    if (brightness < 128) {
        leftSide.style.color = '#fff';
    } else {
        leftSide.style.color = '#000';
    }
};

botaoDownload.addEventListener('click', () => {
    const nomeArquivo = obterNomeArquivo();
    const modoLabel = document.body.classList.contains(modoEscuro) ? 'escuro' : 'claro';
    const colorLabel = selectedColorName ? `-${selectedColorName}` : '';
    const fileName = `${nomeArquivo}${colorLabel}-${modoLabel}.pdf`;
    botaoDownload.href = `ativos/pdf/${fileName}`;
    botaoDownload.setAttribute('download', fileName);
});

/* Reduzir o tamanho e formatar para folha A4 */

function adicionarEscalaCurriculo() {
    document.body.classList.add("escalar-curriculo");
}

/* Remover a escala após o download do currículo */

function removerEscalaCurriculo() {
    document.body.classList.remove("escalar-curriculo");
}

/* Gerar PDF */

// Área onde o PDF será gerado
let areaCurriculo = document.getElementById('area-curriculo');

// Botão
let botaoCurriculo = document.getElementById("botao-curriculo");

// Adiciono função para obter nome de arquivo dinâmico a partir do título da pessoa
function obterNomeArquivo() {
    const tituloEl = document.querySelector('.inicio_titulo');
    if (tituloEl) {
        const nome = tituloEl.innerText.trim();
        return nome.replace(/\s+/g, '-');
    }
    return 'Curriculo';
}

// Gerar PDF com html2pdf.js
function gerarCurriculo() {
    const nomeArquivo = obterNomeArquivo();
    const modoLabel = document.body.classList.contains(modoEscuro) ? 'escuro' : 'claro';
    const colorLabel = selectedColorName ? `-${selectedColorName}` : '';
    const fileName = `${nomeArquivo}${colorLabel}-${modoLabel}.pdf`;
    const opt = {
        margin: [0, 0, 0, 0],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 4, useCORS: true },
        jsPDF: { format: 'a4', orientation: 'portrait' }
    };
    html2pdf()
        .set(opt)
        .from(areaCurriculo)
        .toPdf()
        .get('pdf')
        .then((pdf) => {
            // Remover páginas extras em branco
            let totalPages = pdf.internal.getNumberOfPages();
            while (totalPages > 1) {
                pdf.deletePage(totalPages);
                totalPages--;
            }
            // Salvar PDF após remoção de páginas vazias
            pdf.save(fileName);
        });
}

// Ação executada ao clicar no botão => geração do PDF final do currículo
botaoCurriculo.addEventListener("click", () => {
    // Adaptar a área do PDF
    adicionarEscalaCurriculo();
    // Gerar o PDF
    gerarCurriculo();
    // Remover a adaptação após 1 segundo (pode aumentar o tempo se o download do PDF demorar mais)
    setTimeout(removerEscalaCurriculo, 1000);
});

// Lógica de seleção de paleta de cores
const botaoCores = document.getElementById('botao-cores');
const panelCores = document.getElementById('cores-picker-panel');
const swatches = document.querySelectorAll('#cores-picker-panel .color-swatch');
const leftSide = document.querySelector('.curriculo_esquerda');

botaoCores.addEventListener('click', (e) => {
    // Não faz nada em telas pequenas
    if (window.innerWidth <= 968) return;
    e.stopPropagation();
    panelCores.style.display = panelCores.style.display === 'block' ? 'none' : 'block';
});

swatches.forEach(swatch => {
    swatch.addEventListener('click', (e) => {
        // Não faz nada em telas pequenas
        if (window.innerWidth <= 968) return;
        const color = e.target.getAttribute('data-color');
        if (color === 'default') {
            leftSide.style.backgroundColor = '';
            leftSide.style.color = '';
            leftSide.classList.remove('custom-color-active');
            customColorActive = false;
            selectedColorName = null;
        } else {
            leftSide.style.backgroundColor = color;
            leftSide.classList.add('custom-color-active');
            customColorActive = true;
            // Atualizo nome da cor para usar no PDF
            selectedColorName = sanitizeName(e.target.title);
            // Verificar contraste e ajustar cor da fonte se necessário
            const hex = color.replace('#','');
            const r = parseInt(hex.substr(0,2), 16);
            const g = parseInt(hex.substr(2,2), 16);
            const b = parseInt(hex.substr(4,2), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            if (brightness < 128) {
                leftSide.style.color = '#fff';
            } else {
                leftSide.style.color = '#000';
            }
        }
        panelCores.style.display = 'none';
    });
});

document.addEventListener('click', (e) => {
    // Não faz nada em telas pequenas
    if (window.innerWidth <= 968) return;
    if (!panelCores.contains(e.target) && e.target !== botaoCores) {
        panelCores.style.display = 'none';
    }
});

// Aplica cor JSON inicial, se definida e em telas grandes
if (window.initialColorHex && window.innerWidth > 968) {
    const swatch = document.querySelector(`#cores-picker-panel .color-swatch[data-color="${window.initialColorHex}"]`);
    if (swatch) swatch.click();
}

// Remover cor personalizada em telas pequenas ao redimensionar
window.addEventListener('resize', () => {
    if (window.innerWidth <= 968 && customColorActive) {
        leftSide.style.backgroundColor = '';
        leftSide.style.color = '';
        leftSide.classList.remove('custom-color-active');
        customColorActive = false;
        selectedColorName = null;
    }
});

document.addEventListener('DOMContentLoaded', async () => {
   // ... existing DomContentLoaded code ...

   // Botão para ocultar/exibir foto de perfil
   const botaoOcultarFoto = document.getElementById('botao-ocultar-foto');
   const fotoPerfilEl = document.getElementById('inicio-imagem');
   let fotoOculta = false;
   if (botaoOcultarFoto && fotoPerfilEl) {
     botaoOcultarFoto.addEventListener('click', () => {
       fotoOculta = !fotoOculta;
       if (fotoOculta) {
         // Torna a foto invisível, mas mantém um placeholder para evitar sobreposição
         fotoPerfilEl.style.opacity = '0';
         fotoPerfilEl.style.height = '26px';
       } else {
         fotoPerfilEl.style.opacity = '1';
         fotoPerfilEl.style.height = '';
       }
       botaoOcultarFoto.classList.toggle('fa-eye-slash', !fotoOculta);
       botaoOcultarFoto.classList.toggle('fa-eye', fotoOculta);
       botaoOcultarFoto.title = fotoOculta ? 'Exibir foto' : 'Ocultar foto';
     });
   }

   // Aplica cor customizada se definida
   if (window.initialColorHex && window.innerWidth > 968) {
     window.applyCustomColor(window.initialColorHex, window.initialColorName);
   }
});