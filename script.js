// Smooth scrolling para links de navegação
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Animação de fade-in quando elementos entram na viewport
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Função para carregar produtos do arquivo JSON gerado
async function loadProducts() {
    const productsGrid = document.getElementById('products-grid');
    // Remove o botão 'Adicionar Produto' antes de limpar, para recolocá-lo no final
    const addButton = productsGrid.querySelector('.add-product');
    if (addButton) {
        productsGrid.removeChild(addButton);
    }
    
    // Limpa os produtos existentes (caso já existam placeholders estáticos)
    productsGrid.querySelectorAll('.product-card').forEach(card => card.remove());

    try {
        // Altere o caminho se você decidir colocar o JSON em outra subpasta dentro de 'dist'
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
            productsGrid.appendChild(newCard); // Adiciona ao grid
            
            // Aplica animação e observa
            newCard.style.opacity = '0';
            newCard.style.transform = 'translateY(30px)';
            newCard.style.transition = 'all 0.6s ease';
            newCard.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(newCard);
        });
    } catch (error) {
        console.error('Falha ao carregar projetos:', error);
        // Exiba uma mensagem para o usuário ou logue o erro
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'Não foi possível carregar os produtos. Tente novamente mais tarde.';
        errorMessage.style.color = '#ff6666';
        errorMessage.style.textAlign = 'center';
        productsGrid.appendChild(errorMessage);
    } finally {
        // Recoloca o botão 'Adicionar Produto' no final
        if (addButton) {
            productsGrid.appendChild(addButton);
        }
    }
}

// A função addNewProduct() no frontend não terá um backend para salvar o arquivo MD.
// Ela servirá para informar o usuário sobre o processo de adição.
function addNewProduct() {
    alert("Para adicionar um novo produto, você deve criar um novo arquivo Markdown (.md) na pasta 'projects/' do seu repositório GitHub, seguindo o formato existente (com front matter YAML). Após o commit e push, o GitHub Actions irá reconstruir e publicar o site automaticamente.");
    // Você pode ser mais sofisticado aqui, talvez redirecionar para um README explicando o processo.
}

// Chamada inicial para carregar os produtos quando a página carregar
document.addEventListener('DOMContentLoaded', loadProducts);

// Efeito parallax suave no hero
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const rate = scrolled * -0.5;
    hero.style.transform = `translateY(${rate}px)`;
});

// Header transparente/opaco baseado no scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(0, 0, 0, 0.95)';
    } else {
        header.style.background = 'rgba(0, 0, 0, 0.9)';
    }
});

// Smooth scrolling para links de navegação (movido para o script.js)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});