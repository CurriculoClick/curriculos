/**
 * CurriculoClick AI Engine v1.0
 * Integração com Google Gemini para Automação de Currículos
 */

const GEMINI_API_KEY = localStorage.getItem('cc_gemini_key') || 'AIzaSyDM4ZYNp93RPsMYyYg5XhDzwm2jajO0-fA';
const GEMINI_MODEL = 'gemini-1.5-flash';

async function gerarCurriculoComIA() {
    const rawInput = document.getElementById('aiRawInput');
    const btn = document.getElementById('aiGenerateBtn');
    const loader = document.getElementById('aiLoader');

    if (!rawInput || !rawInput.value.trim()) {
        alert("Por favor, cole algum texto ou informação do candidato no campo abaixo.");
        return;
    }

    try {
        btn.disabled = true;
        loader.style.display = 'inline-block';
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando...';

        const prompt = `
            Você é um especialista em recrutamento e seleção (HR Tech). 
            Sua tarefa é extrair e organizar informações de um texto bruto para preencher um currículo profissional.
            
            TEXTO BRUTO DO CANDIDATO:
            """
            ${rawInput.value}
            """

            REGRAS:
            1. Retorne APENAS um objeto JSON válido.
            2. Melhore o português e torne as descrições de experiências mais atraentes e profissionais.
            3. Se faltar alguma informação (como e-mail ou telefone), deixe o campo vazio, mas não invente dados.
            4. Se houver interesses/hobbies, mapeie para estas categorias exatas (máximo 8): pets, natureza, viagens, vídeo game, filmes, séries, culinária, esportes, leitura, música, fotografia, voluntariado, tecnologia, jardinagem, arte, escrita, festa, dança, astronomia, xadrez, podcast, ciclismo, maternidade, família, programação, internet, redes sociais, praia, saúde e beleza, notícias.

            ESTRUTURA JSON ESPERADA:
            {
              "inicio": { "nome": "", "profissao": "", "email": "", "telefone": "", "endereco": "", "idade": "", "estado_civil": "", "cnh": "" },
              "perfil": { "descricao": "" },
              "social": [ { "rede": "WhatsApp|LinkedIn|Instagram|GitHub", "url": "" } ],
              "habilidades": [ { "nome": "", "nivel": 80 } ],
              "idiomas": [ { "nome": "", "estrelas": 1-5 } ],
              "experiencia_profissional": [ { "cargo": "", "empresa": "", "periodo": "", "descricao": "" } ],
              "educacao": [ { "curso": "", "instituicao": "", "periodo": "" } ],
              "certificados": [ { "ano": "", "titulo": "" } ],
              "interesses": ["nome_da_categoria"]
            }
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        const result = await response.json();
        const jsonText = result.candidates[0].content.parts[0].text;
        const data = JSON.parse(jsonText);

        // Preenche o formulário usando a função existente no painel.js
        if (typeof preencherFormulario === 'function') {
            const slug = data.inicio.nome.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            preencherFormulario(data, slug);
            alert("✨ Currículo gerado e preenchido com sucesso pela IA!");
        } else {
            console.error("Função preencherFormulario não encontrada.");
        }

    } catch (error) {
        console.error("Erro na IA:", error);
        alert("Ocorreu um erro ao processar com IA. Verifique sua chave ou conexão.");
    } finally {
        btn.disabled = false;
        loader.style.display = 'none';
        btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Gerar com IA ✨';
    }
}

// Salva a chave no localStorage caso ela mude
localStorage.setItem('cc_gemini_key', GEMINI_API_KEY);
