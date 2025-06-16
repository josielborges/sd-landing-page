// ===================================================================
// ================ SCRIPT.JS COMPLETO E ATUALIZADO ==================
// ===================================================================

// --- LÓGICA DE DETECÇÃO DE AMBIENTE ---
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BASE_PATH = isLocal ? '' : '/sd-landing-page';

const onHomePage = document.getElementById('products-grid-homepage');
const onPortfolioPage = document.getElementById('products-grid-full');

// --- Variáveis Globais ---
let allProjects = []; // A lista de todos os projetos será armazenada aqui.
let currentlyVisibleProjects = []; // <<--- NOVA: Lista apenas com os projetos visíveis/filtrados
const projectDetailOverlay = document.getElementById('project-detail-overlay');
const projectDetailContentWrapper = projectDetailOverlay.querySelector('.project-detail-content-wrapper');
const prevProjectBtn = document.getElementById('prev-project-btn');
const nextProjectBtn = document.getElementById('next-project-btn');
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
    const finalFetchUrl = BASE_PATH + projectHtmlPath;
    try {
        const response = await fetch(finalFetchUrl);
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
                window.location.hash = 'portfolio';
            });
        }
        updateProjectNavigation();
    } catch (error) {
        console.error('Falha ao carregar detalhes do projeto:', error);
    }
}

function updateProjectNavigation() {
    const currentHash = window.location.hash;
    if (currentlyVisibleProjects.length < 2) {
        prevProjectBtn.classList.add('disabled');
        nextProjectBtn.classList.add('disabled');
        return;
    };
    const currentSlug = currentHash.split('/')[2]; 
    const currentIndex = currentlyVisibleProjects.findIndex(p => p.slug === currentSlug);
    if (currentIndex === -1) {
        prevProjectBtn.classList.add('disabled');
        nextProjectBtn.classList.add('disabled');
        return;
    }
    // Lógica para o botão ANTERIOR
    if (currentIndex > 0) {
        prevProjectBtn.classList.remove('disabled');
        const prevSlug = currentlyVisibleProjects[currentIndex - 1].slug;
        prevProjectBtn.onclick = () => { window.location.hash = `/projects/${prevSlug}/`; };
    } else {
        prevProjectBtn.classList.add('disabled');
        prevProjectBtn.onclick = null;
    }
    // Lógica para o botão PRÓXIMO
    if (currentIndex < currentlyVisibleProjects.length - 1) {
        nextProjectBtn.classList.remove('disabled');
        const nextSlug = currentlyVisibleProjects[currentIndex + 1].slug;
        nextProjectBtn.onclick = () => { window.location.hash = `/projects/${nextSlug}/`; };
    } else {
        nextProjectBtn.classList.add('disabled');
        nextProjectBtn.onclick = null;
    }
}

function hideProjectDetail() {
    projectDetailOverlay.classList.remove('active');
    document.body.classList.remove('overlay-active');
    setTimeout(() => { projectDetailContentWrapper.innerHTML = ''; }, 400);
}


// --- Lógica de Roteamento (Hash Routing) ---

function handleRouting() {
    const hash = window.location.hash;
    if (hash.startsWith('#/projects/')) {
        const projectPath = hash.substring(1);
        const projectHtmlPath = projectPath + 'index.html';
        showProjectDetail(projectHtmlPath);
    } else {
        hideProjectDetail();
    }
}

/**
 * Função reutilizável para renderizar uma lista de projetos em um elemento de grid.
 * @param {Array} projects - A lista de objetos de projeto a ser renderizada.
 * @param {HTMLElement} gridElement - O elemento do DOM onde os cards serão inseridos.
 */
function renderProjectCards(projects, gridElement) {
    if (!gridElement) return; // Se o grid não existir na página, não faz nada.
    
    gridElement.innerHTML = ''; // Limpa a grade antes de adicionar novos cards.

    projects.forEach((project, index) => {
        const newCard = document.createElement('div');
        newCard.className = 'product-card';
        newCard.setAttribute('data-aos', 'fade-up');
        if (project.tags) {
            newCard.dataset.tags = project.tags.map(t => t.trim()).join(',');
        }
        
        // Constrói o link do projeto dinamicamente
        const projectHash = `#/projects/${project.slug}/`;

        newCard.innerHTML = `
            <div class="product-icon">${project.icon || '💡'}</div>
            <h3>${project.name}</h3>
            <p>${project.description}</p>
            <div class="product-tags">${project.tags ? project.tags.map(tag => `<span class="tag">${tag.trim()}</span>`).join('') : ''}</div>
            <a href="${projectHash}" class="product-link">Ver detalhes →</a>`;
        
        gridElement.appendChild(newCard);
    });
}

// --- Carregamento de Produtos e Filtros ---




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
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');

        // 1. Ignora os links de projeto para não interferir com a lógica de roteamento
        if (href.startsWith('#/')) {
            return;
        }

        // 2. Procede com a rolagem suave para âncoras internas (ex: #portfolio, #sobre)
        // Garante que o href não é apenas um "#" vazio
        if (href.length > 1) {
            const targetElement = document.querySelector(href);
            
            if (targetElement) {
                e.preventDefault(); // Previne o "salto" imediato do navegador

                // Executa a animação de rolagem suave
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });

                // Atualiza a URL de forma sutil, sem criar uma nova entrada no histórico
                // Isso evita comportamentos estranhos com o botão "voltar" do navegador
                history.replaceState(null, null, href);
            }
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

async function fetchAndStoreProjects() {
    // Não busca os dados de novo se a lista já estiver preenchida
    if (allProjects.length > 0) return; 

    try {
        const response = await fetch(BASE_PATH + '/projects.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allProjects = await response.json();
        // A lista de projetos visíveis começa com todos os projetos
        currentlyVisibleProjects = [...allProjects]; 
    } catch (error) {
        console.error('Falha ao carregar o arquivo projects.json:', error);
    }
}

async function initializeHomepage() {
    await fetchAndStoreProjects(); // Primeiro, garante que temos os dados
    const grid = document.getElementById('products-grid-homepage');
    if (grid) {
        const projectsToShow = allProjects.slice(0, 6); // Pega apenas os 6 primeiros
        renderProjectCards(projectsToShow, grid); // Usa nossa função ajudante para desenhar os cards
    }
}

// Esta função será chamada apenas na portfolio.html
async function initializePortfolioPage() {
    await fetchAndStoreProjects();
    const grid = document.getElementById('products-grid-full');
    if (grid) {
        renderProjectCards(allProjects, grid); // Primeiro, renderiza todos os cards
        setupFilters(grid); // DEPOIS, configura os filtros para essa grade
    }
}

// --- Inicialização da Página ---
document.addEventListener('DOMContentLoaded', () => {
    if (onHomePage) {
        initializeHomepage();
    } else if (onPortfolioPage) {
        initializePortfolioPage();
    }

    // O resto da inicialização que é comum a todas as páginas
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, once: true });
    }
    handleRouting(); 
});

// Listener para quando o hash na URL muda (botões voltar/avançar do navegador)
window.addEventListener('hashchange', handleRouting);

window.addEventListener('keydown', function (event) {
    // 1. Verifica se a tecla pressionada foi 'Escape'
    // 2. E também se o overlay de detalhes está atualmente ativo/visível
    if (event.key === 'Escape' && projectDetailOverlay.classList.contains('active')) {
        
        // Usa a mesma lógica do botão "Voltar" e do "clicar fora"
        // para fechar o overlay e rolar de volta para a seção do portfólio.
        window.location.hash = 'portfolio';
    }
});

function setupFilters(grid) {
    const filterContainer = document.getElementById('filter-container');
    if (!filterContainer) return; // Só executa se houver um container de filtros na página
    
    // Cria os botões de filtro a partir das tags de todos os projetos
    const allTags = new Set();
    allProjects.forEach(p => p.tags?.forEach(t => allTags.add(t.trim())));
    
    filterContainer.innerHTML = ''; // Limpa filtros antigos
    const allButton = document.createElement('button');
    allButton.className = 'filter-btn active';
    allButton.textContent = 'Todos';
    allButton.dataset.tag = 'all';
    filterContainer.appendChild(allButton);
    
    allTags.forEach(tag => {
        const button = document.createElement('button');
        button.className = 'filter-btn';
        button.textContent = tag;
        button.dataset.tag = tag;
        filterContainer.appendChild(button);
    });

    // Adiciona o listener de clique para a mágica acontecer
    filterContainer.addEventListener('click', (e) => {
        if (e.target.matches('.filter-btn')) {
            if (e.target.classList.contains('active')) return;
            
            const selectedTag = e.target.dataset.tag;
            filterContainer.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            
            // Atualiza a lista global de projetos visíveis (importante para as setas de navegação!)
            if (selectedTag === 'all') {
                currentlyVisibleProjects = [...allProjects];
            } else {
                currentlyVisibleProjects = allProjects.filter(p => p.tags && p.tags.map(t => t.trim()).includes(selectedTag));
            }
            
            // Re-renderiza a grade apenas com os projetos filtrados
            renderProjectCards(currentlyVisibleProjects, grid);
            
            // Atualiza as animações do AOS para os novos itens
            if (typeof AOS !== 'undefined') {
                AOS.refresh();
            }
        }
    });
}