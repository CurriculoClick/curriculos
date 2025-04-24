// whatsapp-widget.js
const estilo = document.createElement('style');
estilo.innerHTML = `
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
    background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
    padding: 15px;
    height: 180px;
    overflow-y: auto;
  }

  .message {
    font-size: 15px;
    background: #d8fdd2;
    color: #1d1b1b;
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
    border-right: 8px solid #d8fdd2;
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
const resumeJsonPath = id ? `dados/curriculo_${id}.json` : 'dados/modelo.json';
// valores padrão apenas para cumprimentos
const mensagensPadrao = { cumprimentos: { manha: 'Bom dia!', tarde: 'Boa tarde!', noite: 'Boa noite!' } };
// configuração de WhatsApp vinda do JSON de currículo (ativo, numero, cumprimentos, mensagemPosCumprimento)
let whatsappConfig = { ativo: true, numero: '', cumprimentos: mensagensPadrao.cumprimentos, mensagemPosCumprimento: '' };

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

  <div class="whatsapp-button" onclick="alternarChat()">
    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="Botão WhatsApp" />
  </div>

  <audio id="notifSound" preload="auto">
    <source src="https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3" type="audio/mpeg">
  </audio>
`;
document.body.appendChild(chatBox);

// Carrega configuração de WhatsApp (cumprimentos e mensagem) do JSON de currículo ou modelo
fetch(`${resumeJsonPath}?t=${Date.now()}`)
  .then(res => res.json())
  .then(data => {
    if (data.whatsapp) {
      whatsappConfig.ativo = data.whatsapp.ativo !== false;
      whatsappConfig.numero = data.whatsapp.numero || whatsappConfig.numero;
      whatsappConfig.cumprimentos = data.whatsapp.cumprimentos || mensagensPadrao.cumprimentos;
      whatsappConfig.mensagemPosCumprimento = data.whatsapp.mensagemPosCumprimento || whatsappConfig.mensagemPosCumprimento;
    }
  })
  .catch(err => console.error('Erro ao carregar WhatsApp config:', err));

// Função para atualizar cabeçalho do chat (nome, foto e link) a partir dos dados exibidos na página
function updateChatHeader() {
  const nome = document.querySelector('.inicio_titulo')?.innerText.trim() || '';
  const foto = document.getElementById('inicio-imagem')?.src || '';
  const logoEl = document.querySelector('#chatBox .chat-header img#chatLogo');
  const titleEl = document.querySelector('#chatBox .chat-header strong');
  if (logoEl && foto) logoEl.src = foto;
  if (titleEl && nome) titleEl.textContent = nome;
  const telAnchor = document.querySelector('#telefone a');
  const telNum = telAnchor ? telAnchor.href.replace(/\D/g, '') : '';
  const linkEl = document.querySelector('#chatBox .chat-footer a');
  if (linkEl && telNum) linkEl.href = `https://wa.me/${telNum}`;
}

// SCRIPT: ABRIR/FECHAR E ENVIAR MENSAGEM COM SOM
let chatVisivel = false;
let mensagemEnviada = false;
let mensagemTimeoutId;

window.alternarChat = function () {
  const box = document.getElementById('chatBox');
  const body = document.getElementById('chatBody');
  const sound = document.getElementById('notifSound');

  if (!chatVisivel) {
    // Atualiza header do chat a partir dos elementos da página
    updateChatHeader();

    clearTimeout(mensagemTimeoutId);
    // abrir chat: limpar mensagens antigas e resetar estado
    body.innerHTML = `<div class="typing" id="typing"><span></span><span></span><span></span></div>`;
    const typingIndicator = document.getElementById('typing');
    typingIndicator.style.display = 'flex';
    mensagemEnviada = false;
    box.style.display = 'flex';
    chatVisivel = true;
    clearTimeout(mensagemTimeoutId);
    // aguardar indicador e carregar JSON fresco
    mensagemTimeoutId = setTimeout(() => {
      // Busca JSON do currículo para saudações e mensagem pós-cumprimento
      fetch(`${resumeJsonPath}?t=${Date.now()}`)
        .then(res => res.json())
        .catch(err => {
          console.error('Erro ao carregar dados do chat:', err);
          return { whatsapp: { cumprimentos: whatsappConfig.cumprimentos, mensagemPosCumprimento: whatsappConfig.mensagemPosCumprimento } };
        })
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
          document.getElementById('typing').style.display = 'none';
          body.appendChild(message);
          sound.play().catch(err => console.warn('Falha ao reproduzir som:', err));
          mensagemEnviada = true;
        });
    }, 2000);
  } else {
    clearTimeout(mensagemTimeoutId);
    // fechar chat
    box.style.display = 'none';
    chatVisivel = false;
  }
};
