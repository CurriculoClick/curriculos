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
    if (window.innerWidth <= 968 && customColorActive) {
        removeCustomColor();
    }
    if (modoAtual === "ativado") {
        desativarModoEscuro();
    } else {
        ativarModoEscuro();
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

// Função para aplicar cor customizada
window.applyCustomColor = (hex, name) => {
  // guarda nome para PDF
  selectedColorName = sanitizeName(name);
  customColorActive = true;
  
  // Salva no localStorage para persistência
  localStorage.setItem('cc_custom_color_hex', hex);
  localStorage.setItem('cc_custom_color_name', name);

  // calcula cor de texto por contraste
  const [r, g, b] = hex.replace('#','').match(/.{2}/g).map(v=>parseInt(v,16));
  const brightness = (r*299 + g*587 + b*114)/1000;
  const textColor = brightness < 128 ? '#fff' : '#000';
  // define variáveis CSS
  const root = document.documentElement;
  root.style.setProperty('--custom-color', hex);
  root.style.setProperty('--custom-text-color', textColor);
  // ativa custom theme
  root.classList.add('custom-color-active');
  // também marca no body para print override
  document.body.classList.add('custom-color-active');

  // Força cor no menu mobile e seta de rolagem
  const menu = document.querySelector('.navegacao_menu');
  if (menu) {
      menu.style.setProperty('background-color', hex, 'important');
      const menuElements = menu.querySelectorAll('*');
      menuElements.forEach(el => el.style.setProperty('color', textColor, 'important'));
  }
  const topo = document.querySelector('.voltar-ao-topo');
  if (topo) {
      topo.style.setProperty('background-color', hex, 'important');
      const topoIcon = topo.querySelector('*');
      if (topoIcon) topoIcon.style.setProperty('color', textColor, 'important');
  }
};

// Função para remover cor customizada
function removeCustomColor() {
  customColorActive = false;
  selectedColorName = null;
  
  // Remove do localStorage
  localStorage.removeItem('cc_custom_color_hex');
  localStorage.removeItem('cc_custom_color_name');

  const root = document.documentElement;
  // remove custom theme
  root.classList.remove('custom-color-active');
  root.style.removeProperty('--custom-color');
  root.style.removeProperty('--custom-text-color');
  // o CSS volta ao padrão para desktop e mobile
  // remove no body também
  document.body.classList.remove('custom-color-active');

  // Remove estilos inline forçados
  const menu = document.querySelector('.navegacao_menu');
  if (menu) {
      menu.style.removeProperty('background-color');
      const menuElements = menu.querySelectorAll('*');
      menuElements.forEach(el => el.style.removeProperty('color'));
  }
  const topo = document.querySelector('.voltar-ao-topo');
  if (topo) {
      topo.style.removeProperty('background-color');
      const topoIcon = topo.querySelector('*');
      if (topoIcon) topoIcon.style.removeProperty('color');
  }
}

// Remove listener resize se existir
window.removeEventListener('resize', () => {});

botaoDownload.addEventListener('click', (e) => {
    e.preventDefault();
    // Aplica escala para A4 e gera o PDF
    adicionarEscalaCurriculo();
    gerarCurriculo();
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
    // Garantir profissão correta no PDF, mesmo se a animação não terminou
    const profissaoEl = document.querySelector('.inicio_profissao');
    if (window.finalProfissao && profissaoEl) {
        profissaoEl.textContent = window.finalProfissao;
    }

    const nomeArquivo = obterNomeArquivo();
    const modoLabel = document.body.classList.contains(modoEscuro) ? 'escuro' : 'claro';
    const colorLabel = selectedColorName ? `-${selectedColorName}` : '';
    const fileName = `${nomeArquivo}${colorLabel}-${modoLabel}.pdf`;

    // Se mobile e com cor custom, prepare apenas o left side custom para o PDF
    let savedInline = null;
    if (window.innerWidth <= 968 && customColorActive) {
        const root = document.documentElement;
        const curriculoEl = document.querySelector('.curriculo');
        const leftEl = document.querySelector('.curriculo_esquerda');
        const rightEl = document.querySelector('.curriculo_direita');
        // Salva estado e estilos inline existentes
        savedInline = {
            hadClass: root.classList.contains('custom-color-active'),
            currBg: curriculoEl.style.backgroundColor,
            currColor: curriculoEl.style.color,
            leftBg: leftEl.style.backgroundColor,
            leftColor: leftEl.style.color,
            rightBg: rightEl.style.backgroundColor,
            rightColor: rightEl.style.color
        };
        // Remove classe global de custom para evitar cobertura mobile
        root.classList.remove('custom-color-active');
        // Coleta cores do tema e custom
        const themeBg = getComputedStyle(root).getPropertyValue('--cor-container').trim();
        const themeText = getComputedStyle(root).getPropertyValue('--cor-texto').trim();
        const customBg = getComputedStyle(root).getPropertyValue('--custom-color').trim();
        const customText = getComputedStyle(root).getPropertyValue('--custom-text-color').trim();
        // Aplica inline styles: container e right side no tema, left side custom
        curriculoEl.style.backgroundColor = themeBg;
        curriculoEl.style.color = themeText;
        rightEl.style.backgroundColor = themeBg;
        rightEl.style.color = themeText;
        leftEl.style.backgroundColor = customBg;
        leftEl.style.color = customText;
    }

    // Forçar dimensões de desktop (A4) mesmo em mobile: largura acima do breakpoint para aplicar CSS desktop
    const larguraPDF = 1200;
    const alturaDesktop = areaCurriculo.scrollHeight;
    const opt = {
        margin: [0, 0, 0, 0],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 4,
            useCORS: true,
            windowWidth: larguraPDF,
            windowHeight: alturaDesktop
        },
        jsPDF: { format: 'a4', orientation: 'portrait' }
    };

    html2pdf()
        .set(opt)
        .from(areaCurriculo)
        .toPdf()
        .get('pdf')
        .then(pdf => {
            // Remover páginas extras em branco
            let totalPages = pdf.internal.getNumberOfPages();
            while (totalPages > 1) {
                pdf.deletePage(totalPages);
                totalPages--;
            }
            // Salvar PDF A4 gerado
            pdf.save(fileName);
        })
        .finally(() => {
            // Restaura estilos inline se for mobile custom
            if (savedInline && window.innerWidth <= 968 && customColorActive) {
                const root = document.documentElement;
                const curriculoEl = document.querySelector('.curriculo');
                const leftEl = document.querySelector('.curriculo_esquerda');
                const rightEl = document.querySelector('.curriculo_direita');
                // Restaura classe global
                if (savedInline.hadClass) root.classList.add('custom-color-active');
                // Restaura inline styles originais
                curriculoEl.style.backgroundColor = savedInline.currBg;
                curriculoEl.style.color = savedInline.currColor;
                leftEl.style.backgroundColor = savedInline.leftBg;
                leftEl.style.color = savedInline.leftColor;
                rightEl.style.backgroundColor = savedInline.rightBg;
                rightEl.style.color = savedInline.rightColor;
            }
            // Remove a escala após a captura terminar
            removerEscalaCurriculo();
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

let isPanelOpen = false;

botaoCores.addEventListener('click', (e) => {
    e.stopPropagation();
    panelCores.classList.toggle('show');
    isPanelOpen = panelCores.classList.contains('show');
});

swatches.forEach(swatch => {
    swatch.addEventListener('click', (e) => {
        const color = e.target.getAttribute('data-color');
        const name = e.target.title;
        if (color === 'default') {
            removeCustomColor();
        } else {
            window.applyCustomColor(color, name);
        }
        // Fecha o painel
        panelCores.classList.remove('show');
        isPanelOpen = false;
    });
});

// Fecha o painel ao clicar fora
document.addEventListener('click', (e) => {
    if (!panelCores.contains(e.target) && e.target !== botaoCores) {
        panelCores.classList.remove('show');
        isPanelOpen = false;
    }
});

// Aplica cor JSON inicial, se definida e em telas grandes
if (window.initialColorHex && window.innerWidth > 968) {
    const swatch = document.querySelector(`#cores-picker-panel .color-swatch[data-color="${window.initialColorHex}"]`);
    if (swatch) swatch.click();
}

// Desabilita clique direito em toda a página
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// Bloqueia teclas de atalho específicas
document.addEventListener('keydown', function(e) {
    // F12
    if (e.keyCode === 123) e.preventDefault();
    // Ctrl+Shift+I/J
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) e.preventDefault();
    // Ctrl+U (view-source)
    if (e.ctrlKey && e.keyCode === 85) e.preventDefault();
    // Ctrl+Shift+C (inspecionar elemento)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 67) e.preventDefault();
});

// Início do listener DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
   // ... existing DomContentLoaded code ...

   // Botões para ocultar e exibir foto de perfil
   const botaoOcultarFoto = document.getElementById('botao-ocultar-foto');
   const fotoPerfilEl = document.getElementById('inicio-imagem');
   if (botaoOcultarFoto && fotoPerfilEl) {
       let fotoVisivel = true;
       botaoOcultarFoto.addEventListener('click', () => {
           botaoOcultarFoto.classList.toggle('mostrar-foto');
           if (fotoVisivel) {
               botaoOcultarFoto.classList.remove('fa-eye-slash');
               botaoOcultarFoto.classList.add('fa-eye');
               fotoPerfilEl.style.opacity = '0';
               fotoPerfilEl.style.height = '26px';
           } else {
               botaoOcultarFoto.classList.remove('fa-eye');
               botaoOcultarFoto.classList.add('fa-eye-slash');
               fotoPerfilEl.style.opacity = '1';
               fotoPerfilEl.style.height = '';
           }
           fotoVisivel = !fotoVisivel;
       });
   }

   // Aplica cor customizada se definida (prioriza localStorage, depois o que vem do JSON inicial)
   const savedHex = localStorage.getItem('cc_custom_color_hex');
   const savedName = localStorage.getItem('cc_custom_color_name');

    if (savedHex) {
      window.applyCustomColor(savedHex, savedName);
    } else if (window.initialColorHex) {
      window.applyCustomColor(window.initialColorHex, window.initialColorName);
    }
});