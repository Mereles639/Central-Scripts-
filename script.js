document.addEventListener('DOMContentLoaded', () => {
    const aiQueryInput = document.getElementById('aiQueryInput');
    const aiQueryButton = document.getElementById('aiQueryButton');
    const aiResponseOutput = document.getElementById('aiResponse');
    const platformItems = document.querySelectorAll('.platform-item');
    const pageViewsCountElement = document.getElementById('pageViewsCount');

    // Page View Counter Logic
    if (pageViewsCountElement) {
        let views = localStorage.getItem('cmspScriptsPageViews');
        if (views === null) {
            views = 0; // Initialize to 0 if not found
        } else {
            views = parseInt(views, 10);
            if (isNaN(views)) { // Handle potential non-numeric value in localStorage
                views = 0;
            }
        }
        
        views += 1;
        localStorage.setItem('cmspScriptsPageViews', views.toString());
        pageViewsCountElement.textContent = views;
    }

    // No conversation history needed for this specific AI interaction model
    // let conversationHistory = []; 

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

    aiQueryButton.addEventListener('click', handleAIQuery);
    aiQueryInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleAIQuery();
        }
    });

    async function handleAIQuery() {
        const query = aiQueryInput.value.trim();
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

            // Sanitize responseText for HTML display and highlight platform names
            let displayResponse = responseText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            
            suggestedPlatforms.forEach(suggestedPlatformName => {
                if (suggestedPlatformName && !suggestedPlatformName.includes("nenhuma plataforma específica")) {
                    // Create a regex to find the platform name case-insensitively
                    const platformNameRegex = new RegExp(`\\b(${Object.keys(platformsData).find(p => p.toLowerCase() === suggestedPlatformName) || ''})\\b`, 'gi');
                    if (platformNameRegex) {
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
                if (suggestedPlatforms.includes(platformNameAttr) && !responseText.toLowerCase().startsWith("nenhuma plataforma específica")) {
                    item.classList.add('highlighted');
                    // item.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Keep or remove based on preference
                    foundPlatform = true;
                }
            });
            
            if (!foundPlatform && !responseText.toLowerCase().startsWith("nenhuma plataforma específica")) {
                 // This case might be redundant if the AI always lists valid names or the "nenhuma" message.
                 // Consider if specific handling is needed if AI returns names not in our list but doesn't say "nenhuma".
            }


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