// Variáveis globais para o overlay
const projectDetailOverlay = document.getElementById('project-detail-overlay');
const projectDetailContentWrapper = projectDetailOverlay.querySelector('.project-detail-content-wrapper');

// Função para exibir o overlay com o conteúdo do projeto
async function showProjectDetail(projectPath) {
    try {
        // Assume que projectPath será algo como 'projects/meu-projeto.html'
        const response = await fetch(projectPath);
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
                // Retorna ao estado anterior da URL, que deve ser a página principal
                //history.pushState(null, '', 'index.html#portfolio'); // Opcional: força a âncora
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
    // (Opcional: você pode remover apenas se a transição não for muito rápida)
    setTimeout(() => {
        projectDetailContentWrapper.innerHTML = ''; 
    }, 500); // Espera a transição de opacidade acabar
}


// Handler para o evento popstate (botões de voltar/avançar do navegador)
window.addEventListener('popstate', (event) => {
    const currentPath = window.location.pathname;
    // Se a URL atual não for mais de um projeto (ex: voltou para a home), esconde o detalhe
    if (!currentPath.includes('/projects/') && currentPath.endsWith('.html') || currentPath.endsWith('/')) {
        hideProjectDetail();
    } else if (currentPath.includes('/projects/') && currentPath.endsWith('.html')) {
        // Se for uma URL de projeto e ainda estamos nela (ex: forward button)
        // Isso é importante para que o link direto funcione ou o botão "forward" do navegador
        showProjectDetail(currentPath.substring(1)); // Remove o '/' inicial para o fetch
    }
});


// Função para carregar produtos do arquivo JSON gerado
async function loadProducts() {
    const productsGrid = document.getElementById('products-grid');
    
    // Limpa os produtos existentes (neste caso, se houver, seriam apenas os carregados dinamicamente)
    productsGrid.querySelectorAll('.product-card').forEach(card => card.remove());

    try {
        const response = await fetch('projects.json'); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const projects = await response.json();

        projects.forEach((project, index) => {
            const newCard = document.createElement('div');
            newCard.className = 'product-card fade-in';
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
            
            // Adiciona um event listener para o clique no link do produto
            const productLink = newCard.querySelector('.product-link');
            if (productLink) {
                productLink.addEventListener('click', (e) => {
                    e.preventDefault(); // IMPEDE A NAVEGAÇÃO PADRÃO
                    const fullUrl = productLink.href;
                    // Extrai o caminho relativo para o fetch e para o history.pushState
                    const path = new URL(fullUrl).pathname;
                    showProjectDetail(path.substring(1)); // Remove o '/' inicial, ex: "projects/meu-projeto.html"
                    
                    // Atualiza a URL no histórico do navegador sem recarregar a página
                    history.pushState({ projectId: project.name }, project.name, path);
                });
            }

            // Aplica animação e observa (mantido)
            newCard.style.opacity = '0';
            newCard.style.transform = 'translateY(30px)';
            newCard.style.transition = 'all 0.6s ease';
            newCard.style.transitionDelay = `${index * 0.1}s`;
            // Certifique-se de que 'observer' está definido, se não for usar, remova esta linha
            if (typeof observer !== 'undefined') {
                observer.observe(newCard);
            }
        });

        // Chama a função para verificar a URL na carga inicial para links diretos para detalhes
        checkInitialUrlForDetail();

    } catch (error) {
        console.error('Falha ao carregar produtos:', error);
        // Exiba uma mensagem para o usuário ou logue o erro
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'Não foi possível carregar os produtos. Tente novamente mais tarde.';
        errorMessage.style.color = '#ff6666';
        errorMessage.style.textAlign = 'center';
        productsGrid.appendChild(errorMessage);
    } 
}


// Função para verificar se a URL inicial é uma página de detalhes de projeto (para links diretos ou refresh)
function checkInitialUrlForDetail() {
    const path = window.location.pathname;
    // Verifica se a URL é de uma página de detalhes (ex: /projects/meu-projeto.html)
    if (path.includes('/projects/') && path.endsWith('.html')) {
        showProjectDetail(path.substring(1)); // Remove o '/' inicial para o fetch
    }
}

// Event listener para rolar suavemente para as seções ao clicar nos links de navegação do HEADER
document.querySelectorAll('nav .nav-links a').forEach(anchor => {
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
// Se você não o tiver, remova o 'if (typeof observer !== 'undefined')' e a linha que usa 'observer.observe(newCard);'
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