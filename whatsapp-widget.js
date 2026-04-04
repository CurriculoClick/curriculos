// Widget de WhatsApp
const estilo = document.createElement('style');
estilo.innerHTML = `
  :root {
    --chat-balloon-color: #d8fdd2;
    --chat-text-color: #1d1b1b;
  }

  body.modo-escuro {
    --chat-balloon-color: #144d37;
    --chat-text-color: #ffffff;
  }

  .whatsapp-button {
    -webkit-tap-highlight-color: transparent;
    outline: none;
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #25d366;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    z-index: 9999;
    touch-action: manipulation;
  }

  .whatsapp-button img {
    width: 30px;
    height: 30px;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    -webkit-user-drag: none;
  }

  .whatsapp-chat {
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 280px;
    background: #fff;
    border-radius: 15px;
    box-shadow: 0 5px 25px rgba(0, 0, 0, 0.3);
    display: none;
    flex-direction: column;
    overflow: hidden;
    z-index: 9998;
    font-family: 'Segoe UI', sans-serif;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .whatsapp-chat.open {
    display: flex;
    opacity: 1;
    transform: translateY(0);
  }

  .chat-header {
    background-color: #075e54;
    color: white;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .chat-header .info span.chat-subtext::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    background-color: #25d366;
    border-radius: 50%;
    margin-right: 6px;
    vertical-align: middle;
  }

  .chat-header .info span.chat-subtext {
    font-size: 12px;
    color: #cfcfcf;
    margin-top: 2px;
  }

  .chat-header .info {
    display: flex;
    align-items: center;
  }

  .chat-header img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 10px;
  }

  .close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
  }

  .chat-body {
    background-color: #e5ddd5;
    background-image: var(--chat-background-image);
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center center;
    padding: 15px;
    height: 180px;
    overflow-y: auto;
  }

  /* Papel de parede modo escuro para o corpo do chat */
  body.modo-escuro .chat-body {
    background-color: #2f2f2f !important;
    background-image: var(--chat-background-image);
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center center;
  }

  .message {
    font-size: 15px;
    background: var(--chat-balloon-color);
    color: var(--chat-text-color);
    padding: 10px;
    border-radius: 10px;
    margin-bottom: 10px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    display: inline-block;
    max-width: 80%;
    position: relative;
  }

  .message::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 12px;
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-right: 8px solid var(--chat-balloon-color);
  }

  .message-time {
    font-size: 10px;
    text-align: right;
    margin-top: 5px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 2.2px;
  }

  .message-time svg {
    width: 16px;
    height: 16px;
    fill: #34B7F1;
    vertical-align: middle;
  }

  .typing {
    display: flex;
    gap: 4px;
    margin-bottom: 10px;
  }

  .typing span {
    width: 6px;
    height: 6px;
    background: #ccc;
    border-radius: 50%;
    animation: piscar 1.4s infinite;
  }

  .typing span:nth-child(2) { animation-delay: 0.2s; }
  .typing span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes piscar {
    0%, 80%, 100% { opacity: 0; }
    40% { opacity: 1; }
  }

  .chat-footer {
    padding: 12px;
    background: #f0f0f0;
    text-align: center;
  }

  .chat-footer a {
    background: #075e54;
    color: white;
    padding: 8px 16px;
    border-radius: 25px;
    text-decoration: none;
    font-weight: bold;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  .chat-footer a img {
    width: 18px;
    height: 18px;
  }
`;
document.head.appendChild(estilo);

// JSON de cumprimentos está na mesma pasta do index.html

// descobre pasta base do script para carregar JSON.
const scriptWidget = document.querySelector('script[src*="whatsapp-widget.js"]');
const pastaWidget = scriptWidget.src.replace(/\/whatsapp-widget\.js$/, '');
// Defino caminhos para dados do currículo e do widget
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const resumeJsonPath = id ? `dados/${id}.json` : 'dados/modelo.json';
// valores padrão apenas para cumprimentos
const mensagensPadrao = { cumprimentos: { manha: 'Bom dia!', tarde: 'Boa tarde!', noite: 'Boa noite!' } };
// configuração de WhatsApp vinda do JSON de currículo (ativo, numero, cumprimentos, mensagemPosCumprimento, mensagemPadrao)
let whatsappConfig = { ativo: true, numero: '', cumprimentos: mensagensPadrao.cumprimentos, mensagemPosCumprimento: '', mensagemPadrao: '' };

// HTML DO CHAT + BOTÃO + ÁUDIO
const chatBox = document.createElement('div');
chatBox.innerHTML = `
  <div class="whatsapp-chat" id="chatBox">
    <div class="chat-header">
      <div class="info">
        <img id="chatLogo" src="" alt="Logo" />
        <div>
          <strong></strong><br />
          <span class="chat-subtext">Disponível</span>
        </div>
      </div>
      <button class="close-btn" onclick="alternarChat()">×</button>
    </div>
    <div class="chat-body" id="chatBody">
      <div class="typing" id="typing">
        <span></span><span></span><span></span>
      </div>
    </div>
    <div class="chat-footer">
      <a href="https://wa.me/5521970707616" target="_blank">
        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="Ícone do WhatsApp" />
        Iniciar conversa
      </a>
    </div>
  </div>

  <div class="whatsapp-button">
    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="Botão WhatsApp" />
  </div>

  <audio id="notifSound" preload="auto">
    <source src="https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3" type="audio/mpeg">
  </audio>
`;
document.body.appendChild(chatBox);

// Ativar clique do botão via JS (evita dependência de evento inline)
const whatsappBtn = document.querySelector('.whatsapp-button');
if (whatsappBtn) whatsappBtn.addEventListener('click', () => window.alternarChat());

// Carrega configuração de WhatsApp (cumprimentos e mensagem) do JSON de currículo ou modelo
fetch(`${resumeJsonPath}?t=${Date.now()}`)
  .then(res => res.json())
  .then(data => {
    if (data.whatsapp) {
      whatsappConfig.ativo = data.whatsapp.ativo !== false;
      whatsappConfig.numero = data.whatsapp.numero || whatsappConfig.numero;
      whatsappConfig.cumprimentos = data.whatsapp.cumprimentos || mensagensPadrao.cumprimentos;
      whatsappConfig.mensagemPosCumprimento = data.whatsapp.mensagemPosCumprimento || whatsappConfig.mensagemPosCumprimento;
      whatsappConfig.mensagemPadrao = data.whatsapp.mensagemPadrao || whatsappConfig.mensagemPadrao;
    }
  })
  .catch(err => console.error('Erro ao carregar WhatsApp config:', err));

// Função para atualizar cabeçalho do chat (nome, foto e link) a partir dos dados exibidos na página
function updateChatHeader() {
  const nome = document.querySelector('.inicio_titulo')?.innerText.trim() || '';
  // Remove cache-busting query string para file://
  const fotoRaw = document.getElementById('inicio-imagem')?.src || '';
  const fotoPath = fotoRaw.split('?')[0];
  const logoEl = document.querySelector('#chatBox .chat-header img#chatLogo');
  const titleEl = document.querySelector('#chatBox .chat-header strong');
  if (logoEl) {
    // Usa foto (sem query) ou placeholder se não existir
    logoEl.src = fotoPath || 'ativos/imagens/placeholder.png';
    logoEl.onerror = () => { logoEl.src = 'ativos/imagens/placeholder.png'; };
  }
  if (titleEl && nome) titleEl.textContent = nome;
  const telAnchor = document.querySelector('#telefone a');
  const telNum = telAnchor ? telAnchor.href.replace(/\D/g, '') : '';
  const linkEl = document.querySelector('#chatBox .chat-footer a');
  if (linkEl && telNum) {
    let url = `https://wa.me/${telNum}`;
    if (whatsappConfig.mensagemPadrao) {
      url += `?text=${encodeURIComponent(whatsappConfig.mensagemPadrao)}`;
    }
    linkEl.href = url;
  }
}

// SCRIPT: ABRIR/FECHAR E ENVIAR MENSAGEM COM SOM
let chatVisivel = false;
let mensagemEnviada = false;
let mensagemTimeoutId;

// Função para atualizar o background do chat baseado no modo escuro/claro
function atualizarBackgroundChat() {
  if(document.body.classList.contains('modo-escuro')) {
    document.documentElement.style.setProperty('--chat-background-image', "url('https://raw.githubusercontent.com/thiagodelgado/appdoid/gh-pages/stylesheets/16-17-18.svg')");
  } else {
    document.documentElement.style.setProperty('--chat-background-image', "url('https://raw.githubusercontent.com/thiagodelgado/appdoid/gh-pages/stylesheets/15-16-17.svg')");
  }
}

// Observar mudanças no modo escuro/claro
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'class' && chatVisivel) {
      atualizarBackgroundChat();
    }
  });
});

// Começar a observar mudanças no body
observer.observe(document.body, {
  attributes: true
});

window.alternarChat = function () {
  const box = document.getElementById('chatBox');
  const body = document.getElementById('chatBody');
  const sound = document.getElementById('notifSound');

  if (!chatVisivel) {
    updateChatHeader();
    clearTimeout(mensagemTimeoutId);
    body.innerHTML = `<div class="typing" id="typing"><span></span><span></span><span></span></div>`;
    const typingIndicator = document.getElementById('typing');
    typingIndicator.style.display = 'flex';
    mensagemEnviada = false;

    // Atualizar background do chat
    atualizarBackgroundChat();
    const bgCss = getComputedStyle(document.documentElement).getPropertyValue('--chat-background-image').trim();
    const match = bgCss.match(/url\(["']?(.*?)["']?\)/);
    const bgUrl = match ? match[1] : null;

    const openAndType = () => {
      box.classList.add('open');
      chatVisivel = true;
      fetch(`${resumeJsonPath}?t=${Date.now()}`)
        .then(res => res.json())
        .catch(err => { console.error('Erro ao carregar dados do chat:', err); return { whatsapp: { cumprimentos: whatsappConfig.cumprimentos, mensagemPosCumprimento: whatsappConfig.mensagemPosCumprimento } }; })
        .then(data => {
          const horaAtual = new Date().getHours();
          const periodo = horaAtual < 12 ? 'manha' : (horaAtual < 18 ? 'tarde' : 'noite');
          const cumprimentos = data.whatsapp?.cumprimentos || mensagensPadrao.cumprimentos;
          const saudacao = cumprimentos[periodo] || mensagensPadrao.cumprimentos[periodo];
          const posMsg = data.whatsapp?.mensagemPosCumprimento || whatsappConfig.mensagemPosCumprimento;
          const message = document.createElement('div');
          message.classList.add('message');
          message.innerHTML = `
            ${saudacao}<br />
            ${posMsg}
            <div class="message-time">
              ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              <svg viewBox="0 0 24 24"><path d="M1.8 12l2.1-2.1L9 15l11.1-11.1L22.2 6 9 19.2z"/><path d="M12 19.2L7.2 14.4l1.4-1.4L12 16.4l7.8-7.8 1.4 1.4z"/></svg>
            </div>
          `;
          mensagemTimeoutId = setTimeout(() => {
            document.getElementById('typing').style.display = 'none';
            body.appendChild(message);
            sound.play().catch(() => {});
            mensagemEnviada = true;
          }, 1480);
        });
    };
    if (bgUrl) {
      const img = new Image();
      img.onload = openAndType;
      img.onerror = openAndType;
      img.src = bgUrl;
    } else {
      openAndType();
    }
  } else {
    clearTimeout(mensagemTimeoutId);
    box.classList.remove('open');
    chatVisivel = false;
  }
};
