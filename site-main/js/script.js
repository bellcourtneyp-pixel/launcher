/* ========================================
   RobBob Launcher Website - JavaScript
   ======================================== */

// Navigation
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetPage = button.getAttribute('data-page');
        
        // Update active nav button
        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update active page
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(targetPage).classList.add('active');
    });
});

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check for saved theme preference or default to dark
const savedTheme = localStorage.getItem('robbob_theme') || 'dark';
if (savedTheme === 'light') {
    body.classList.add('light');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('light');
    
    // Save theme preference
    const currentTheme = body.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem('robbob_theme', currentTheme);
});

// Download Button
const downloadBtn = document.getElementById('downloadBtn');
const toast = document.getElementById('toast');

downloadBtn.addEventListener('click', (e) => {
    // Show toast notification
    showToast('Загрузка началась!');
    
    // Track download event (you can add analytics here)
    console.log('Download initiated at:', new Date().toISOString());
});

// Toast notification function
function showToast(message) {
    const toastText = toast.querySelector('.toast-text');
    toastText.textContent = message;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Smooth scroll behavior
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

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    // Alt+1 for News, Alt+2 for Launcher
    if (e.altKey) {
        if (e.key === '1') {
            navButtons[0].click();
        } else if (e.key === '2') {
            navButtons[1].click();
        }
    }
});

// Add parallax effect to background gradient (optional)
let ticking = false;

document.addEventListener('mousemove', (e) => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            updateGradient(e);
            ticking = false;
        });
        ticking = true;
    }
});

function updateGradient(e) {
    const bgGradient = document.querySelector('.bg-gradient');
    if (!bgGradient) return;
    
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    bgGradient.style.transform = `translate(${x * 20 - 10}px, ${y * 20 - 10}px)`;
}

// Intersection Observer for animations on scroll
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

// Observe all feature cards and news items
document.addEventListener('DOMContentLoaded', () => {
    // Load news first, then observe animations
    loadNews().then(() => {
        const animatedElements = document.querySelectorAll('.feature-card, .news-item');
        animatedElements.forEach(el => observer.observe(el));
    });
    
    // Load and display recommended games
    loadRecommendedGames();
});

// ========================================
// News Loading (from localStorage - synced with admin panel)
// ========================================

// Load news from localStorage
async function loadNews() {
    const newsListEl = document.getElementById('newsList');
    if (!newsListEl) return;
    
    // Try to load from localStorage (shared with admin panel)
    const newsData = localStorage.getItem('robbob_news');
    
    if (newsData) {
        try {
            const news = JSON.parse(newsData);
            if (news && news.length > 0) {
                displayNews(news, newsListEl);
                return;
            }
        } catch (error) {
            console.error('Error parsing news:', error);
        }
    }
    
    // If no news in localStorage, show default news
    displayDefaultNews(newsListEl);
}

// Display news articles
function displayNews(newsArray, container) {
    // Sort by date (newest first), with "new" items prioritized
    const sorted = [...newsArray].sort((a, b) => {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        return new Date(b.date) - new Date(a.date);
    });
    
    container.innerHTML = sorted.map(news => `
        <article class="news-item glass-panel">
            <div class="news-header">
                ${news.isNew ? '<span class="news-badge new">Новое</span>' : ''}
                <time class="news-date">${formatNewsDate(news.date)}</time>
            </div>
            <h3 class="news-title">${escapeHtml(news.title)}</h3>
            <p class="news-desc">${escapeHtml(news.desc)}</p>
            ${news.tags && news.tags.length > 0 ? `
                <div class="news-tags">
                    ${news.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
        </article>
    `).join('');
}

// Display default news if none in localStorage
function displayDefaultNews(container) {
    const defaultNews = [
        {
            id: 1,
            title: 'Релиз версии 1.0.0',
            desc: 'Первая стабильная версия RobBob Launcher. Включает все основные функции: быстрый запуск игр, автоматические обновления, современный интерфейс с темной и светлой темами.',
            tags: ['Релиз', 'Стабильная версия'],
            isNew: true,
            date: '2025-12-15'
        },
        {
            id: 2,
            title: 'Бета-тестирование завершено',
            desc: 'Благодарим всех участников бета-тестирования! Ваши отзывы помогли улучшить лаунчер и исправить критические ошибки перед релизом.',
            tags: ['Бета'],
            isNew: false,
            date: '2025-12-10'
        },
        {
            id: 3,
            title: 'Анонс RobBob Launcher',
            desc: 'Представляем новый игровой лаунчер с фокусом на производительность и удобство. Скоро выйдет первая публичная версия.',
            tags: ['Анонс'],
            isNew: false,
            date: '2025-12-05'
        }
    ];
    
    displayNews(defaultNews, container);
}

// Format date for display
function formatNewsDate(dateStr) {
    try {
        const date = new Date(dateStr);
        const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch (e) {
        return dateStr;
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// Recommended Games
// ========================================

// Load games from localStorage and display them
function loadRecommendedGames() {
    const gamesData = localStorage.getItem('robbob_roblox_games');
    
    if (!gamesData) {
        return; // No games to display
    }
    
    try {
        const games = JSON.parse(gamesData);
        
        if (!games || games.length === 0) {
            return; // No games to display
        }
        
        displayGames(games);
    } catch (error) {
        console.error('Error loading games:', error);
    }
}

// Display games on the page
function displayGames(games) {
    const gamesGrid = document.getElementById('gamesGrid');
    const recommendedGamesSection = document.getElementById('recommendedGames');
    
    if (!gamesGrid || !recommendedGamesSection) {
        return;
    }
    
    // Show the section
    recommendedGamesSection.style.display = 'block';
    
    // Clear existing content
    gamesGrid.innerHTML = '';
    
    // Create game cards
    games.forEach(game => {
        // Create card container
        const cardContainer = document.createElement('div');
        cardContainer.className = 'game-card-container';
        
        // Create game card link
        const gameCard = document.createElement('a');
        gameCard.href = game.url;
        gameCard.target = '_blank';
        gameCard.rel = 'noopener noreferrer';
        gameCard.className = 'game-card glass-panel';
        gameCard.title = game.name;
        
        // Add image
        const img = document.createElement('img');
        img.className = 'game-card-image';
        img.alt = game.name;
        img.loading = 'lazy';
        
        if (game.thumbnailUrl) {
            img.src = game.thumbnailUrl;
        } else {
            // Fallback if no thumbnail
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%2312131a" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-family="sans-serif" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
        }
        
        // Handle image loading errors
        img.onerror = function() {
            this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%2312131a" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-family="sans-serif" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
        };
        
        // Add overlay with game name
        const overlay = document.createElement('div');
        overlay.className = 'game-card-overlay';
        
        const gameName = document.createElement('div');
        gameName.className = 'game-card-name';
        gameName.textContent = game.name;
        
        overlay.appendChild(gameName);
        
        // Assemble game card
        gameCard.appendChild(img);
        gameCard.appendChild(overlay);
        
        // Add game card to container
        cardContainer.appendChild(gameCard);
        
        // Add admin comment if description exists
        if (game.description) {
            const adminComment = document.createElement('div');
            adminComment.className = 'admin-comment';
            
            // Admin avatar (site logo)
            const avatar = document.createElement('img');
            avatar.className = 'admin-avatar';
            avatar.src = 'img/icon.png';
            avatar.alt = 'Админ';
            avatar.onerror = function() {
                // Fallback to gradient circle if no image
                this.style.display = 'none';
                this.parentElement.querySelector('.admin-avatar-fallback').style.display = 'block';
            };
            
            const avatarFallback = document.createElement('div');
            avatarFallback.className = 'admin-avatar admin-avatar-fallback';
            avatarFallback.style.display = 'none';
            
            // Comment content
            const commentContent = document.createElement('div');
            commentContent.className = 'admin-comment-content';
            
            const adminName = document.createElement('div');
            adminName.className = 'admin-name';
            adminName.textContent = game.adminName || 'Админ';
            
            const commentText = document.createElement('div');
            commentText.className = 'admin-comment-text';
            commentText.textContent = game.description;
            
            commentContent.appendChild(adminName);
            commentContent.appendChild(commentText);
            
            adminComment.appendChild(avatar);
            adminComment.appendChild(avatarFallback);
            adminComment.appendChild(commentContent);
            
            cardContainer.appendChild(adminComment);
        }
        
        // Add to grid
        gamesGrid.appendChild(cardContainer);
    });
}

// Console Easter Egg
console.log('%cRobBob Launcher', 'font-size: 20px; font-weight: bold; background: linear-gradient(135deg, #a855f7, #22c55e); -webkit-background-clip: text; color: transparent;');
console.log('%cВерсия: 1.0.0', 'font-size: 12px; color: #64748b;');
