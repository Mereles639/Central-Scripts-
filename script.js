document.addEventListener('DOMContentLoaded', () => {
    const aiQueryInput = document.getElementById('aiQueryInput');
    const aiQueryButton = document.getElementById('aiQueryButton');
    const aiResponseOutput = document.getElementById('aiResponse');
    const platformItems = document.querySelectorAll('.platform-item');
    const pageViewsCountElement = document.getElementById('pageViewsCount');

    // Check for WebSim environment for AI functionality
    const isWebSimEnvironment = typeof websim !== 'undefined' &&
                                typeof websim.chat !== 'undefined' &&
                                typeof websim.chat.completions !== 'undefined';

    if (!isWebSimEnvironment) {
        if (aiQueryInput) {
            aiQueryInput.placeholder = "> AI Indisponível neste ambiente";
            aiQueryInput.disabled = true;
            aiQueryInput.style.cursor = 'not-allowed';
            aiQueryInput.style.backgroundColor = '#333333'; 
            aiQueryInput.style.borderColor = '#555555'; 
            aiQueryInput.style.color = '#888888'; 
        }
        if (aiQueryButton) {
            aiQueryButton.disabled = true;
            aiQueryButton.textContent = 'AI OFFLINE';
            aiQueryButton.style.backgroundColor = '#555555';
            aiQueryButton.style.borderColor = '#777777';
            aiQueryButton.style.color = '#999999';
            aiQueryButton.style.cursor = 'not-allowed';
        }
        if (aiResponseOutput) {
            aiResponseOutput.innerHTML = `<strong>AVISO DO SISTEMA:</strong> O Assistente de Estudos AI é uma funcionalidade que depende do ambiente de desenvolvimento original para interagir com o modelo de linguagem. <br><br>Fora desse ambiente (por exemplo, ao hospedar em plataformas como Vercel, GitHub Pages, etc.), o Assistente AI fica <strong>desativado</strong>.<br><br>As demais ferramentas e links do site continuam funcionando normalmente.`;
            aiResponseOutput.style.backgroundColor = '#2a2a00'; 
            aiResponseOutput.style.border = '1px solid #FFCC00'; 
            aiResponseOutput.style.color = '#FFDD33'; 
            aiResponseOutput.style.textAlign = 'center';
            aiResponseOutput.style.padding = '15px';
            aiResponseOutput.style.lineHeight = '1.5';
            aiResponseOutput.style.marginTop = '20px'; 
        }
    }

    // Page View Counter Logic
    if (pageViewsCountElement) {
        let views = localStorage.getItem('cmspScriptsPageViews');
        if (views === null) {
            views = 0;
        } else {
            views = parseInt(views, 10);
            if (isNaN(views)) { 
                views = 0;
            }
        }
        
        views += 1;
        localStorage.setItem('cmspScriptsPageViews', views.toString());
        pageViewsCountElement.textContent = views;
    }

    const platformsData = {
        "TarefasSP": "gerenciamento de tarefas escolares gerais.",
        "Redação Paulista": "ajuda com redação e escrita, especificamente para o contexto paulista.",
        "Expansão Noturno": "um curso ou projeto específico, possivelmente de expansão de conhecimento em horários noturnos.",
        "Khan Academy": "aprendizado de diversas matérias como matemática, ciências, programação, história e mais.",
        "Matific": "aprendizado de matemática de forma lúdica, especialmente para crianças.",
        "SPeak": "prática de conversação e aprendizado de idiomas.",
        "Alura": "cursos online na área de tecnologia, como programação, design, dados, e marketing digital.",
        "Kahoot": "criação e participação em quizzes interativos para aprendizado e revisão.",
        "Microbit": "programação e projetos com a placa Micro:bit, focado em STEM (Ciência, Tecnologia, Engenharia e Matemática).",
        "Quizizz": "plataforma de quizzes interativos para avaliações formativas e gamificação da aprendizagem.",
        "Árvore": "plataforma de leitura digital, com acesso a livros e outros conteúdos (anteriormente LeiaSP)."
    };

    // Only add event listeners for AI if it's available and elements exist
    if (isWebSimEnvironment && aiQueryButton && aiQueryInput) {
        aiQueryButton.addEventListener('click', handleAIQuery);
        aiQueryInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                handleAIQuery();
            }
        });
    }

    async function handleAIQuery() {
        // This function should ideally only be callable if isWebSimEnvironment is true
        // due to conditional event listener attachment.
        // Adding a guard here just in case.
        if (!isWebSimEnvironment) {
            if (aiResponseOutput) {
                // This state should ideally be handled by the initial !isWebSimEnvironment block.
                // If somehow handleAIQuery is called, re-assert the disabled state message.
                aiResponseOutput.innerHTML = "<strong>AVISO_SISTEMA:</strong> Assistente AI indisponível neste ambiente.";
                aiResponseOutput.style.textAlign = 'center';
                aiResponseOutput.style.color = '#FFCC00';
            }
            return;
        }

        const query = aiQueryInput.value.trim();

        // Reset AI response area to default style for new messages or empty query
        if (aiResponseOutput) {
            aiResponseOutput.style.border = '1px dashed #00FF41';
            aiResponseOutput.style.backgroundColor = '#1C1C1C';
            aiResponseOutput.style.color = '#BDBDBD';
            aiResponseOutput.style.textAlign = 'left';
            aiResponseOutput.style.padding = '10px 15px'; // Reset padding
            aiResponseOutput.style.lineHeight = '1.6'; // Reset line height
            aiResponseOutput.style.marginTop = '15px'; // Reset margin
        }
        
        if (!query) {
            aiResponseOutput.innerHTML = 'Por favor, digite sua dúvida ou necessidade.';
            return;
        }

        aiQueryButton.disabled = true;
        aiQueryButton.textContent = 'PROCESSANDO...';
        aiResponseOutput.innerHTML = 'Analisando sua query...';
        
        platformItems.forEach(item => item.classList.remove('highlighted'));

        const platformDescriptions = Object.entries(platformsData)
            .map(([name, desc]) => `- ${name}: ${desc}`)
            .join("\n");

        const systemPrompt = `Você é um assistente de terminal que ajuda estudantes a encontrar a ferramenta digital correta para seus estudos.
As ferramentas disponíveis são:
${platformDescriptions}

Analise a pergunta do usuário e sugira uma ou mais dessas ferramentas.
Responda APENAS com os nomes das plataformas sugeridas, separados por vírgula. Se nenhuma plataforma for ideal, responda com "Nenhuma plataforma específica parece ideal para isso.".
Seja direto e técnico.
Exemplo de resposta: Khan Academy, Matific`;

        const userMessage = {
            role: "user",
            content: query
        };
        
        const messagesForAPI = [
            { role: "system", content: systemPrompt },
            userMessage
        ];

        try {
            const completion = await websim.chat.completions.create({
                messages: messagesForAPI,
            });

            const responseText = completion.content;
            
            const suggestedPlatforms = responseText.split(',').map(p => p.trim().toLowerCase());
            let foundPlatform = false;

            let displayResponse = responseText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            
            suggestedPlatforms.forEach(suggestedPlatformName => {
                if (suggestedPlatformName && !suggestedPlatformName.includes("nenhuma plataforma específica")) {
                    // Find the canonical platform name (case-sensitive from platformsData keys)
                    const platformKey = Object.keys(platformsData).find(p => p.toLowerCase() === suggestedPlatformName);
                    if (platformKey) {
                         // Use the canonical name for regex to ensure correct bolding
                        const platformNameRegex = new RegExp(`\\b(${platformKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
                        displayResponse = displayResponse.replace(platformNameRegex, (match) => `<strong>${match}</strong>`);
                    }
                }
            });


            if (responseText.toLowerCase().startsWith("nenhuma plataforma específica")) {
                 aiResponseOutput.innerHTML = `SYSTEM_MSG: ${displayResponse}`;
            } else {
                 aiResponseOutput.innerHTML = `SUGESTÃO_TERMINAL: ${displayResponse}`;
            }
            
            platformItems.forEach(item => {
                const platformNameAttr = item.dataset.platformName.toLowerCase();
                // Check if the platformNameAttr (from data-attribute, already lowercased) is in the list of suggested platforms
                if (suggestedPlatforms.includes(platformNameAttr) && !responseText.toLowerCase().startsWith("nenhuma plataforma específica")) {
                    item.classList.add('highlighted');
                    foundPlatform = true;
                }
            });
            

        } catch (error) {
            console.error('Error with AI completion:', error);
            aiResponseOutput.innerHTML = 'ERRO_SISTEMA: Falha ao processar solicitação. Tente novamente.';
        } finally {
            aiQueryButton.disabled = false;
            aiQueryButton.textContent = 'EXECUTAR';
            aiQueryInput.value = ''; 
        }
    }
});