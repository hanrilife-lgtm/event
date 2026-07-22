// ==================== 1. ЗОЛОТЫЕ ЧАСТИЦЫ ====================
(function() {
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    let animationId;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    window.addEventListener('resize', resize);
    resize();

    const PARTICLE_COUNT = Math.min(120, Math.floor((window.innerWidth * window.innerHeight) / 8000));
    const GOLD = 'rgba(212, 175, 55, ';

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2.5 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.5 + 0.15;
            this.twinkleSpeed = Math.random() * 0.025 + 0.005;
            this.phase = Math.random() * Math.PI * 2;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.phase += this.twinkleSpeed;
            this.currentOpacity = this.opacity * (0.5 + 0.5 * Math.sin(this.phase));
            if (this.x < -20 || this.x > width + 20 || this.y < -20 || this.y > height + 20) {
                this.reset();
                this.x = Math.random() * width;
                this.y = Math.random() * height;
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = GOLD + this.currentOpacity + ')';
            ctx.fill();
            if (this.size > 1.8) {
                ctx.shadowColor = 'rgba(212, 175, 55, 0.15)';
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        animationId = requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // Остановка анимации при переключении вкладок для экономии ресурсов
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else {
            animateParticles();
        }
    });
})();

// ==================== 2. УПРАВЛЕНИЕ СТОРИС ====================
document.addEventListener('DOMContentLoaded', () => {
    const stories = document.querySelectorAll('.story');
    let currentIndex = 0;
    let isTransitioning = false;
    const progressFill = document.getElementById('progressFill');

    function goToStory(index) {
        if (isTransitioning || index === currentIndex) return;
        if (index < 0 || index >= stories.length) return;

        isTransitioning = true;
        const current = stories[currentIndex];
        const next = stories[index];

        current.classList.remove('active');
        current.classList.add('exit');
        setTimeout(() => {
            current.classList.remove('exit');
        }, 700);

        next.classList.add('active');
        currentIndex = index;
        updateProgress();

        setTimeout(() => {
            isTransitioning = false;
        }, 700);
    }

    function updateProgress() {
        const total = stories.length;
        const progress = ((currentIndex + 1) / total) * 100;
        progressFill.style.width = progress + '%';
    }

    // Инициализация
    stories[0].classList.add('active');
    updateProgress();

    // ========== КОЛЁСИКО МЫШИ ==========
    let wheelTimeout = false;
    document.addEventListener('wheel', (e) => {
        if (isTransitioning || wheelTimeout) return;
        wheelTimeout = true;
        setTimeout(() => { wheelTimeout = false; }, 600);

        if (e.deltaY > 0) {
            const nextIndex = (currentIndex + 1) % stories.length;
            goToStory(nextIndex);
        } else if (e.deltaY < 0) {
            const prevIndex = (currentIndex - 1 + stories.length) % stories.length;
            goToStory(prevIndex);
        }
    }, { passive: true });

    // ========== КЛАВИШИ ==========
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % stories.length;
            goToStory(nextIndex);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevIndex = (currentIndex - 1 + stories.length) % stories.length;
            goToStory(prevIndex);
        }
    });

    // ========== ТАЧ-СВАЙПЫ (мобильные) ==========
    let touchStartY = 0;
    let touchStartX = 0;
    let isSwiping = false;

    document.addEventListener('touchstart', (e) => {
        touchStartY = e.changedTouches[0].screenY;
        touchStartX = e.changedTouches[0].screenX;
        isSwiping = true;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        const touch = e.changedTouches[0];
        const diffY = touchStartY - touch.screenY;
        const diffX = touchStartX - touch.screenX;
        // Определяем вертикальный свайп (игнорируем горизонтальные)
        if (Math.abs(diffY) > Math.abs(diffX) * 1.2 && Math.abs(diffY) > 20) {
            e.preventDefault(); // блокируем скролл страницы
        }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        isSwiping = false;
        const touchEndY = e.changedTouches[0].screenY;
        const diff = touchStartY - touchEndY;
        if (Math.abs(diff) > 40) {
            if (diff > 0) {
                const nextIndex = (currentIndex + 1) % stories.length;
                goToStory(nextIndex);
            } else {
                const prevIndex = (currentIndex - 1 + stories.length) % stories.length;
                goToStory(prevIndex);
            }
        }
    }, { passive: true });

    // ==================== 3. 3D-ЭФФЕКТЫ (мышь + touch) ====================
    // Определяем, touch-устройство ли это
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Для стеклянных карточек и info-карточек
    const glassCards = document.querySelectorAll('.glass-card, .info-card');

    if (!isTouchDevice) {
        // Мышь: классический 3D-эффект
        glassCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -4;
                const rotateY = ((x - centerX) / centerX) * 4;
                card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
            });
        });
    } else {
        // Touch: лёгкий 3D-эффект от наклона устройства (gyroscope)
        // или просто статический, но с анимацией при касании
        glassCards.forEach(card => {
            card.addEventListener('touchstart', () => {
                card.style.transform = 'perspective(800px) rotateX(2deg) rotateY(2deg) translateZ(5px)';
            });
            card.addEventListener('touchend', () => {
                card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
            });
        });
    }

    // ==================== 4. ПАРАЛЛАКС ДЛЯ ФОНОВЫХ СТОРИ ====================
    const bgStories = document.querySelectorAll('.story:not([data-index="0"]):not([data-index="4"])');

    if (!isTouchDevice) {
        // Мышь: параллакс
        bgStories.forEach(story => {
            story.addEventListener('mousemove', (e) => {
                const rect = story.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const moveX = (x - centerX) / centerX * 8;
                const moveY = (y - centerY) / centerY * 8;
                const overlay = story.querySelector('.story-overlay');
                if (overlay) {
                    overlay.style.transform = `translate(${moveX * 0.3}px, ${moveY * 0.3}px)`;
                }
                story.style.backgroundPosition = `calc(50% + ${moveX * 0.5}px) calc(50% + ${moveY * 0.5}px)`;
            });
            story.addEventListener('mouseleave', () => {
                const overlay = story.querySelector('.story-overlay');
                if (overlay) {
                    overlay.style.transform = 'translate(0, 0)';
                }
                story.style.backgroundPosition = 'center';
            });
        });
    } else {
        // Touch: лёгкое смещение при касании
        bgStories.forEach(story => {
            story.addEventListener('touchstart', (e) => {
                const touch = e.changedTouches[0];
                const rect = story.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const moveX = (x - centerX) / centerX * 4;
                const moveY = (y - centerY) / centerY * 4;
                const overlay = story.querySelector('.story-overlay');
                if (overlay) {
                    overlay.style.transform = `translate(${moveX * 0.3}px, ${moveY * 0.3}px)`;
                }
                story.style.backgroundPosition = `calc(50% + ${moveX * 0.3}px) calc(50% + ${moveY * 0.3}px)`;
            });
            story.addEventListener('touchend', () => {
                const overlay = story.querySelector('.story-overlay');
                if (overlay) {
                    overlay.style.transform = 'translate(0, 0)';
                }
                story.style.backgroundPosition = 'center';
            });
        });
    }

    // ==================== 5. ДИНАМИЧЕСКОЕ ОБНОВЛЕНИЕ ПРИ РЕСАЙЗЕ ====================
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Обновляем количество частиц при сильном изменении размера
            // (но не пересоздаём всё, чтобы не было тормозов)
        }, 300);
    });
});