// Variáveis globais para o overlay
const projectDetailOverlay = document.getElementById('project-detail-overlay');
const projectDetailContentWrapper = projectDetailOverlay.querySelector('.project-detail-content-wrapper');

// Função para exibir o overlay com o conteúdo do projeto
// projectUrl agora receberá a URL COMPLETA ou relativa à raiz do domínio (ex: /sd-landing-page/projects/...)
async function showProjectDetail(projectUrl) {
    try {
        console.log('Carregando detalhes do projeto:', projectUrl);
        const response = await fetch(projectUrl); // Fetch diretamente usando a URL fornecida
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const htmlFragment = await response.text();

        // Injeta o conteúdo HTML do fragmento na div do overlay
        projectDetailContentWrapper.innerHTML = htmlFragment;

        // Ativa o overlay e impede a rolagem da página principal
        projectDetailOverlay.classList.add('active');
        document.body.classList.add('overlay-active'); // Adiciona classe ao body

        // Rola o conteúdo do overlay para o topo
        projectDetailOverlay.scrollTop = 0;

        // Adiciona listener para o botão de voltar DENTRO do conteúdo injetado
        const backButton = projectDetailContentWrapper.querySelector('#back-to-portfolio-button');
        if (backButton) {
            backButton.addEventListener('click', (e) => {
                e.preventDefault(); // Impede a navegação padrão do link
                hideProjectDetail();
                history.back(); // Volta para a URL anterior no histórico
            });
        }

    } catch (error) {
        console.error('Falha ao carregar detalhes do projeto:', error);
        // Exibe uma mensagem de erro no overlay ou um alert simples
        projectDetailContentWrapper.innerHTML = `<p style="text-align: center; color: #ff6666;">Não foi possível carregar os detalhes do projeto. Tente novamente mais tarde.</p><div class="back-to-portfolio"><a href="#portfolio" class="cta-button" id="back-to-portfolio-button">← Voltar</a></div>`;
        const backButtonAfterError = projectDetailContentWrapper.querySelector('#back-to-portfolio-button');
        if (backButtonAfterError) {
            backButtonAfterError.addEventListener('click', (e) => {
                e.preventDefault();
                hideProjectDetail();
                history.back();
            });
        }
        projectDetailOverlay.classList.add('active'); // Garante que o overlay apareça com a mensagem de erro
        document.body.classList.add('overlay-active');
    }
}

// Função para esconder o overlay
function hideProjectDetail() {
    projectDetailOverlay.classList.remove('active');
    document.body.classList.remove('overlay-active'); // Remove a classe do body

    // Limpa o conteúdo para não mostrar o projeto anterior da próxima vez
    setTimeout(() => {
        projectDetailContentWrapper.innerHTML = '';
    }, 500); // Espera a transição de opacidade acabar
}


// Handler para o evento popstate (botões de voltar/avançar do navegador)
window.addEventListener('popstate', (event) => {
    const currentPathname = window.location.pathname; // Ex: /sd-landing-page/projects/meu-projeto.html

    if (currentPathname.includes('/projects/') && currentPathname.endsWith('.html')) {
        // Se a URL ainda é de um projeto (ex: clicou em 'avançar' depois de voltar)
        showProjectDetail(window.location.href); // Use a URL completa para buscar
    } else {
        // Se a URL não é mais de um projeto (ex: voltou para a home ou outra âncora)
        hideProjectDetail();
    }
});


// Função para carregar produtos do arquivo JSON gerado
async function loadProducts() {
    const productsGrid = document.getElementById('products-grid');
    const filterContainer = document.getElementById('filter-container'); // Pega o container dos filtros

    productsGrid.innerHTML = ''; // Limpa o grid
    if (filterContainer) filterContainer.innerHTML = ''; // Limpa os filtros antigos

    try {
        const response = await fetch('projects.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const projects = await response.json();

        // --- LÓGICA DE FILTRAGEM (INÍCIO) ---

        // 1. Coletar todas as tags únicas
        const allTags = new Set();
        projects.forEach(project => {
            if (project.tags && project.tags.length > 0) {
                project.tags.forEach(tag => allTags.add(tag.trim()));
            }
        });

        // 2. Criar e adicionar o botão "Todos"
        const allButton = document.createElement('button');
        allButton.className = 'filter-btn active'; // O botão "Todos" começa ativo
        allButton.textContent = 'Todos';
        allButton.dataset.tag = 'all';
        if (filterContainer) filterContainer.appendChild(allButton);

        // 3. Criar e adicionar um botão para cada tag única
        allTags.forEach(tag => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = tag;
            button.dataset.tag = tag;
            if (filterContainer) filterContainer.appendChild(button);
        });

        // --- LÓGICA DE FILTRAGEM (FIM) ---

        // Renderizar todos os cards de projetos
        projects.forEach((project, index) => {
            const newCard = document.createElement('div');
            newCard.className = 'product-card fade-in';

            // Adiciona as tags do projeto como um atributo de dados para a filtragem
            if (project.tags && project.tags.length > 0) {
                newCard.dataset.tags = project.tags.map(t => t.trim()).join(',');
            }

            newCard.innerHTML = `
                <div class="product-icon">${project.icon || '💡'}</div>
                <h3>${project.name}</h3>
                <p>${project.description}</p>
                <div class="product-tags">
                    ${project.tags && project.tags.length > 0 ? project.tags.map(tag => `<span class="tag">${tag.trim()}</span>`).join('') : ''}
                </div>
                <a href="${project.url || '#'}" class="product-link">Ver detalhes →</a>
            `;
            productsGrid.appendChild(newCard);

            // Adiciona o listener para o clique no link (lógica de overlay)
            const productLink = newCard.querySelector('.product-link');
            if (productLink && project.url) {
                productLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    showProjectDetail(productLink.href);
                    history.pushState({ projectId: project.name }, project.name, new URL(productLink.href).pathname);
                });
            }

            // Lógica de animação de entrada (mantida)
            newCard.style.opacity = '0';
            newCard.style.transform = 'translateY(30px)';
            newCard.style.transition = 'all 0.6s ease, opacity 0.4s ease'; // Adiciona transição de opacidade
            if (typeof observer !== 'undefined') {
                observer.observe(newCard);
            }
        });

        // Adicionar event listeners aos botões de filtro
        if (filterContainer) {
            filterContainer.addEventListener('click', (e) => {
                if (e.target.matches('.filter-btn')) {
                    // Se o botão clicado já está ativo, não faz nada
                    if (e.target.classList.contains('active')) {
                        return;
                    }

                    const selectedTag = e.target.dataset.tag;

                    // Atualiza a classe 'active' nos botões
                    filterContainer.querySelector('.active').classList.remove('active');
                    e.target.classList.add('active');

                    // --- NOVA LÓGICA DE ANIMAÇÃO EM DUAS ETAPAS ---

                    // ETAPA 1: Inicia o fade-out em TODOS os cards que estão visíveis.
                    document.querySelectorAll('.product-card').forEach(card => {
                        // A verificação de 'display' garante que só vamos apagar o que já está na tela
                        if (card.style.display !== 'none') {
                            card.style.opacity = '0';
                        }
                    });

                    // ETAPA 2: Espera a animação de fade-out terminar para então reorganizar e revelar.
                    setTimeout(() => {
                        document.querySelectorAll('.product-card').forEach(card => {
                            const cardTags = card.dataset.tags;
                            const shouldBeVisible = selectedTag === 'all' || (cardTags && cardTags.includes(selectedTag));

                            // Agora sim, atualizamos o layout
                            if (shouldBeVisible) {
                                card.style.display = 'block'; // Coloca o card de volta no layout
                                // Precisamos de um pequeno delay para que o navegador processe o 'display: block'
                                // antes de iniciar a transição de opacidade.
                                setTimeout(() => {
                                    card.style.opacity = '1'; // Inicia a animação de fade-in
                                }, 10);
                            } else {
                                card.style.display = 'none'; // Remove completamente o card do layout
                            }
                        });
                    }, 400); // Este tempo DEVE ser igual à duração da transição no seu CSS (transition: all 0.6s, opacity 0.4s)
                }
            });
        }

        checkInitialUrlForDetail();

    } catch (error) {
        console.error('Falha ao carregar produtos:', error);
        productsGrid.innerHTML = '<p style="text-align: center; color: #ff6666;">Não foi possível carregar os produtos. Tente novamente mais tarde.</p>';
    }
}


// Função para verificar se a URL inicial é uma página de detalhes de projeto (para links diretos ou refresh)
function checkInitialUrlForDetail() {
    const currentPathname = window.location.pathname; // Ex: /sd-landing-page/projects/meu-projeto.html

    // Verifica se a URL contém '/projects/' e termina com '.html'
    if (currentPathname.includes('/projects/') && currentPathname.endsWith('.html')) {
        // Usa a URL completa da janela para buscar o conteúdo
        showProjectDetail(window.location.href);
    }
}

// Event listener para rolar suavemente para as seções ao clicar nos links internos (cabeçalho, hero e rodapé)
document.querySelectorAll('header a[href^="#"], .hero a[href^="#"], footer a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault(); // Impede a navegação padrão

        const targetId = this.getAttribute('href'); // Ex: #portfolio
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
            // Atualiza a URL sem recarregar a página para links de âncora internos
            history.pushState(null, '', targetId);
        }
    });
});


// Efeito parallax suave no hero (mantido)
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const rate = scrolled * -0.5;
    hero.style.transform = `translateY(${rate}px)`;
});

// Header transparente/opaco baseado no scroll (mantido)
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(0, 0, 0, 0.95)';
    } else {
        header.style.background = 'rgba(0, 0, 0, 0.9)';
    }
});

// O Intersection Observer (se você o tiver)
// Mantenha esta definição, pois é usada no loadProducts
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);


// Inicia o carregamento dos produtos quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});