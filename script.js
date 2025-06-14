// ===================================================================
// ================ SCRIPT.JS COMPLETO E ATUALIZADO ==================
// ===================================================================

// --- Variáveis Globais ---
const projectDetailOverlay = document.getElementById('project-detail-overlay');
const projectDetailContentWrapper = projectDetailOverlay.querySelector('.project-detail-content-wrapper');
const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);


// --- Funções Principais do Overlay ---

async function showProjectDetail(projectHtmlPath) {
    try {
        const bodyHasScrollbar = window.innerHeight < document.body.scrollHeight;
        if (bodyHasScrollbar) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        const response = await fetch(projectHtmlPath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const htmlFragment = await response.text();

        projectDetailContentWrapper.innerHTML = htmlFragment;
        wrapYouTubeVideos(projectDetailContentWrapper);
        
        projectDetailOverlay.classList.add('active');
        document.body.classList.add('overlay-active'); 
        projectDetailOverlay.scrollTop = 0;

        const backButton = projectDetailContentWrapper.querySelector('#back-to-portfolio-button');
        if (backButton) {
            backButton.addEventListener('click', (e) => {
                e.preventDefault();
                // --- MUDANÇA AQUI ---
                window.location.hash = 'portfolio'; // Aponta para a seção do portfólio
            });
        }
    } catch (error) {
        console.error('Falha ao carregar detalhes do projeto:', error);
        projectDetailContentWrapper.innerHTML = `<p style="text-align: center; color: #ff6666;">Não foi possível carregar os detalhes do projeto.</p>`;
    }
}

function hideProjectDetail() {
    projectDetailOverlay.classList.remove('active');
    document.body.classList.remove('overlay-active');

    // Remove a compensação da barra de rolagem
    document.body.style.paddingRight = '';
    document.querySelector('header').style.paddingRight = '';

    setTimeout(() => {
        projectDetailContentWrapper.innerHTML = '';
    }, 400); // Espera a animação de fade-out
}


// --- Lógica de Roteamento (Hash Routing) ---

function handleRouting() {
    const hash = window.location.hash;

    // Verifica se o hash corresponde ao padrão de um projeto
    if (hash.startsWith('#/projects/')) {
        const projectPath = hash.substring(1); // ex: /projects/predicao/
        const projectHtmlPath = projectPath + 'index.html';
        showProjectDetail(projectHtmlPath);
    } else {
        hideProjectDetail();
    }
}


// --- Carregamento de Produtos e Filtros ---

async function loadProducts() {
    const productsGrid = document.getElementById('products-grid');
    const filterContainer = document.getElementById('filter-container');
    productsGrid.innerHTML = '';
    if (filterContainer) filterContainer.innerHTML = '';

    try {
        const response = await fetch('projects.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const projects = await response.json();

        // Lógica para criar botões de filtro (mantida)
        const allTags = new Set();
        projects.forEach(p => p.tags?.forEach(t => allTags.add(t.trim())));
        const allButton = document.createElement('button');
        allButton.className = 'filter-btn active';
        allButton.textContent = 'Todos';
        allButton.dataset.tag = 'all';
        if (filterContainer) filterContainer.appendChild(allButton);
        allTags.forEach(tag => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = tag;
            button.dataset.tag = tag;
            if (filterContainer) filterContainer.appendChild(button);
        });

        // Renderizar todos os cards de projetos
        projects.forEach((project, index) => {
            const newCard = document.createElement('div');
            newCard.className = 'product-card';
            newCard.setAttribute('data-aos', 'fade-up');
            newCard.setAttribute('data-aos-delay', (index % 3) * 100);
            if (project.tags && project.tags.length > 0) {
                newCard.dataset.tags = project.tags.map(t => t.trim()).join(',');
            }
            newCard.innerHTML = `
                <div class="product-icon">${project.icon || '💡'}</div>
                <h3>${project.name}</h3>
                <p>${project.description}</p>
                <div class="product-tags">${project.tags ? project.tags.map(tag => `<span class="tag">${tag.trim()}</span>`).join('') : ''}</div>
                <a href="${project.url || '#'}" class="product-link">Ver detalhes →</a>`;
            productsGrid.appendChild(newCard);

            // Listener de clique no card para NAVEGAR via hash
            const productLink = newCard.querySelector('.product-link');
            if (productLink && project.url) {
                productLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    // A URL no link já contém o hash correto (ex: /sd-landing-page/#/projects/...)
                    // Nós apenas extraímos o hash e o aplicamos à janela
                    const hash = new URL(productLink.href, window.location.origin).hash;
                    window.location.hash = hash;
                });
            }
        });

        // Adicionar event listeners aos botões de filtro (mantido)
        if (filterContainer) {
            filterContainer.addEventListener('click', (e) => {
                if (e.target.matches('.filter-btn')) {
                    if (e.target.classList.contains('active')) return;
                    const selectedTag = e.target.dataset.tag;
                    filterContainer.querySelector('.active').classList.remove('active');
                    e.target.classList.add('active');
                    document.querySelectorAll('.product-card').forEach(card => card.style.opacity = '0');
                    setTimeout(() => {
                        document.querySelectorAll('.product-card').forEach(card => {
                            const cardTags = card.dataset.tags;
                            const shouldBeVisible = selectedTag === 'all' || (cardTags && cardTags.includes(selectedTag));
                            card.style.display = shouldBeVisible ? 'block' : 'none';
                            if (shouldBeVisible) {
                                setTimeout(() => { card.style.opacity = '1'; }, 10);
                            }
                        });
                        AOS.refresh(); 
                    }, 400);
                }
            });
        }
    } catch (error) {
        console.error('Falha ao carregar produtos:', error);
        productsGrid.innerHTML = '<p style="text-align: center; color: #ff6666;">Não foi possível carregar os produtos.</p>';
    }
}


// --- Funções Auxiliares e Listeners de Eventos ---

function wrapYouTubeVideos(container) {
    const iframes = container.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
    iframes.forEach(iframe => {
        if (!iframe.parentElement.classList.contains('video-responsive')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'video-responsive';
            iframe.parentNode.insertBefore(wrapper, iframe);
            wrapper.appendChild(iframe);
        }
    });
}

// Listener para fechar o overlay ao clicar fora
projectDetailOverlay.addEventListener('click', function(event) {
    if (event.target.classList.contains('project-detail-content-wrapper')) {
        window.location.hash = 'portfolio'; // Aponta para a seção do portfólio
    }
});

// Listener para rolagem suave de âncoras internas
document.querySelectorAll('header a[href^="#"], footer a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        // IGNORA os links de projeto que agora usam hash
        if (href.startsWith('#/')) return;
        
        const targetElement = document.querySelector(href);
        if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({ behavior: 'smooth' });
            // Remove o hash da URL para links de âncora
            history.pushState("", document.title, window.location.pathname + window.location.search);
        }
    });
});


// Efeitos de scroll (Parallax e Header)
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    document.querySelector('.hero').style.transform = `translateY(${scrolled * -0.5}px)`;
    const header = document.querySelector('header');
    header.style.background = (window.scrollY > 100) ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.9)';
});


// --- Inicialização da Página ---
document.addEventListener('DOMContentLoaded', () => {
    AOS.init({ duration: 800, once: true });
    loadProducts();
    handleRouting(); // Verifica a URL na carga inicial
});

// Listener para quando o hash na URL muda (botões voltar/avançar do navegador)
window.addEventListener('hashchange', handleRouting);