// ===================================================================================
// ОСНОВЕН JAVASCRIPT ФАЙЛ ЗА ФУНКЦИОНАЛНОСТ НА УЕБСАЙТА
// ===================================================================================
// КОРИГИРАН ФАЙЛ С MOBILE НАВИГАЦИЯ
// ===================================================================================
// Този файл съдържа основната JavaScript функционалност за уебсайта, включително:
// 1. Управление на мобилната навигация (hamburger menu)
// 2. Функционалност за контактна форма и модален прозорец
// 3. Система за тъмен режим
// 4. Плавно скролиране
// 5. Управление на фавикон и различни помощни функции
// 6. Специална логика за скриване на банера при скролване (без да се скрива навигацията)
// 
// ВАЖНО: Навигационният бар НЕ се скрива при скролване, само банерът се скрива.
// ===================================================================================

// ===================================================================================
// 000.04.0 ИНИЦИАЛИЗАЦИЯ И ПРЕДОТВРАТЯВАНЕ НА ГРЕШКИ
// ===================================================================================

// 000.04.1 ПРЕДОТВРАТЯВАНЕ НА ГРЕШКА С ЛИПСВАЩ ФАВИКОН
// Създава временен фавикон, ако такъв не съществува на страницата.
if (!document.querySelector('link[rel*="icon"]')) {
    const link = document.createElement('link');
    link.rel = 'shortcut icon';
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏠</text></svg>';
    document.head.appendChild(link);
}

// ===================================================================================
// 000.04.2 ФУНКЦИОНАЛНОСТ ЗА КОНТАКТЕН МОДАЛЕН ПРОЗОРЕЦ
// Управление на отварянето и затварянето на модалния прозорец за контакти.
// ===================================================================================

// 000.04.2.1 ДЕКЛАРАЦИИ НА ПРОМЕНЛИВИ ЗА КОНТАКТЕН МОДАЛ
const contactModal = document.getElementById('contact-modal');
const contactLinks = document.querySelectorAll('a[href="#contact"]');
const closeBtn = document.querySelector('.close');

// 000.04.2.2 ОТВАРЯНЕ НА МОДАЛНИЯ ПРОЗОРЕЦ ПРИ КЛИК НА КОНТАКТ ЛИНКОВЕТЕ В НАВИГАЦИЯТА
if (contactLinks.length > 0) {
    contactLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (contactModal) {
                contactModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
                
                // Добавяме клас за да предотвратим скролиране
                document.body.classList.add('modal-open');
                
                // Фокусираме се върху първото поле
                setTimeout(() => {
                    const nameInput = document.getElementById('name');
                    if (nameInput) nameInput.focus();
                }, 100);
            }
        });
    });
}

// 000.04.2.3 ЗАТВАРЯНЕ НА МОДАЛНИЯ ПРОЗОРЕЦ ПРИ КЛИК НА X БУТОНА
if (closeBtn && contactModal) {
    closeBtn.addEventListener('click', function() {
        contactModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.body.classList.remove('modal-open');
    });
}

// 000.04.2.4 ЗАТВАРЯНЕ НА МОДАЛНИЯ ПРОЗОРЕЦ ПРИ КЛИК ИЗВЪН НЕГО
if (contactModal) {
    contactModal.addEventListener('click', function(e) {
        if (e.target === contactModal) {
            contactModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            document.body.classList.remove('modal-open');
        }
    });
}

// 000.04.2.5 ЗАТВАРЯНЕ НА МОДАЛНИЯ ПРОЗОРЕЦ С КЛАВИША ESCAPE
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && contactModal && contactModal.style.display === 'block') {
        contactModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.body.classList.remove('modal-open');
    }
});

// ===================================================================================
// 000.04.3 МОБИЛНА НАВИГАЦИЯ - ОСНОВНА ИМПЛЕМЕНТАЦИЯ
// Управление на hamburger менюто за мобилни устройства.
// ===================================================================================

// 000.04.3.1 ДЕКЛАРАЦИИ НА ЕЛЕМЕНТИ ЗА MOBILE НАВИГАЦИЯ
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

// 000.04.3.2 ИНИЦИАЛИЗАЦИЯ НА HAMBURGER МЕНЮТО
if (hamburger && navMenu) {
    console.log('Mobile navigation elements found');
    
    // 000.04.3.2.1 ДОБАВЯНЕ НА СЛУШАТЕЛ ЗА КЛИК НА HAMBURGER ИКОНКАТА
    hamburger.addEventListener('click', () => {
        console.log('Hamburger clicked');
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // Предотвратяване на скролиране на тялото, когато менюто е отворено
        if (navMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    });
    
    // 000.04.3.2.2 ЗАТВАРЯНЕ НА МОБИЛНОТО МЕНЮ ПРИ КЛИК НА НАВИГАЦИОННИТЕ ЛИНКОВЕ
    document.querySelectorAll('.nav-link').forEach(n => {
        n.addEventListener('click', () => {
            console.log('Nav link clicked, closing menu');
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });
    
    // 000.04.3.2.3 ЗАТВАРЯНЕ НА МЕНЮТО ПРИ КЛИК ИЗВЪН НЕГО
    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('active') && 
            !navMenu.contains(e.target) && 
            !hamburger.contains(e.target)) {
            console.log('Clicked outside, closing menu');
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
}

// ===================================================================================
// 000.04.4 ПЛАВНО СКРОЛИРАНЕ С ИЗКЛЮЧЕНИЕ ЗА КОНТАКТ ЛИНКОВЕТЕ
// Всички линкове с # се скролират плавно, освен контакт линковете.
// ===================================================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        
        // Ако е контакт линк, не правим smooth scrolling
        if (targetId === '#contact') {
            e.preventDefault();
            return;
        }
        
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// ===================================================================================
// 000.04.5 ФУНКЦИОНАЛНОСТ ЗА КОНТАКТНА ФОРМА
// Обработка на изпращането на контактна форма чрез ntfy.sh услуга.
// ===================================================================================

// 000.04.5.1 ДЕКЛАРАЦИИ НА ЕЛЕМЕНТИ ЗА КОНТАКТНА ФОРМА
const contactForm = document.getElementById('contact-form');
const formMessage = document.getElementById('form-message');

// 000.04.5.2 СЛУШАТЕЛ ЗА ИЗПРАЩАНЕ НА ФОРМАТА
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Вземане на данни от формата
        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };
        
        // Валидация на формата
        if (!data.name || !data.email || !data.subject || !data.message) {
            const validationMsg = "Please fill in all fields.";
            showMessage(validationMsg, 'error');
            return;
        }
        
        // Показване на състояние на зареждане
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        const loadingText = "Sending...";
        submitBtn.textContent = loadingText;
        submitBtn.disabled = true;
        
        try {
            // Изпращане към ntfy.sh
            await sendToNtfy(data);
            
            // Показване на съобщение за успех
            const successMsg = "Message sent successfully!";
            showMessage(successMsg, 'success');
            contactForm.reset();
            
            // Затваряне на модалния прозорец след успех
            setTimeout(() => {
                if (contactModal) {
                    contactModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                    document.body.classList.remove('modal-open');
                }
            }, 2000);
            
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMsg = "Error sending message.";
            showMessage(errorMsg, 'error');
        } finally {
            // Нулиране на състоянието на бутона
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ===================================================================================
// 000.04.6 ПОКАЗВАНЕ НА СЪОБЩЕНИЯ ЗА ФОРМАТА
// Показване на съобщения за успех или грешка във формата.
// ===================================================================================
function showMessage(text, type) {
    if (formMessage) {
        formMessage.textContent = text;
        formMessage.className = 'form-message ' + type;
        formMessage.style.display = 'block';
        
        // Автоматично скриване след 5 секунди
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    }
}

// ===================================================================================
// 000.04.7 ИЗПРАЩАНЕ НА СЪОБЩЕНИЕ ДО NTFY.SH
// Изпращане на данните от контактната форма чрез ntfy.sh API.
// ===================================================================================
async function sendToNtfy(data) {
    const topic = 'pasevsu_messages';
    const ntfyUrl = `https://ntfy.sh/${topic}`;
    
    // Създаване на съдържанието на съобщението
    const messageContent = `
Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}

Sent from: ${window.location.hostname}
    `.trim();
    
    try {
        // Изпращане към ntfy.sh
        const response = await fetch(ntfyUrl, {
            method: 'POST',
            body: messageContent,
            headers: {
                'Title': `New message from: ${data.name}`,
                'Priority': 'default',
                'Tags': 'email,envelope',
                'Click': `mailto:${data.email}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log('Message sent successfully to ntfy');
        return response;
        
    } catch (error) {
        console.error('Error sending to ntfy:', error);
        throw error;
    }
}

// ===================================================================================
// 000.04.8 ФУНКЦИОНАЛНОСТ ЗА ТЪМЕН РЕЖИМ
// Управление на тъмния режим на уебсайта.
// ===================================================================================

// 000.04.8.1 ДЕКЛАРАЦИЯ НА БУТОН ЗА ТЪМЕН РЕЖИМ
const darkModeToggle = document.getElementById('dark-mode-toggle');

// 000.04.8.2 ИНИЦИАЛИЗАЦИЯ НА ТЪМНИЯ РЕЖИМ - само ако бутонът съществува
function initDarkMode() {
    // Проверка дали бутонът за dark mode съществува
    if (!darkModeToggle) {
        console.log('Dark mode toggle not found, skipping dark mode initialization');
        return;
    }
    
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const systemPrefersDark = prefersDarkScheme.matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.body.classList.add('dark-mode');
    }
}

// 000.04.8.3 ПРЕВКЛЮЧВАНЕ НА ТЪМНИЯ РЕЖИМ - само ако бутонът съществува
function toggleDarkMode() {
    if (!darkModeToggle) return;
    
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

// 000.04.8.4 EVENT LISTENERS - само ако бутонът съществува
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
}

// 000.04.8.5 ИНИЦИАЛИЗАЦИЯ ПРИ ЗАРЕЖДАНЕ
initDarkMode();

// 000.04.8.6 СЛУШАНЕ ЗА ПРОМЕНИ В СИСТЕМНАТА ТЕМА
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
if (prefersDarkScheme.addEventListener) {
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        }
    });
}

// ===================================================================================
// 000.04.9 УНИВЕРСАЛЕН МОБИЛЕН NAVIGATION ОБРАБОТЧИК
// Допълнителна логика за мобилна навигация за гарантирана функционалност.
// ===================================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded - initializing mobile navigation...');
    
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        console.log('✅ Mobile navigation elements found');
        
        // 000.04.9.1 ФУНКЦИЯ ЗА ЗАТВАРЯНЕ НА МЕНЮТО
        function closeMobileMenu() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
            console.log('📱 Mobile menu closed');
        }
        
        // 000.04.9.2 ФУНКЦИЯ ЗА ОТВАРЯНЕ/ЗАТВАРЯНЕ НА МЕНЮТО
        function toggleMobileMenu() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
                console.log('📱 Mobile menu opened');
            } else {
                document.body.style.overflow = 'auto';
                console.log('📱 Mobile menu closed');
            }
        }
        
        // 000.04.9.3 СЛУШАТЕЛ ЗА HAMBURGER ИКОНКАТА
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            toggleMobileMenu();
        });
        
        // 000.04.9.4 СЛУШАТЕЛИ ЗА НАВИГАЦИОННИТЕ ЛИНКОВЕ
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                closeMobileMenu();
            });
        });
        
        // 000.04.9.5 ЗАТВАРЯНЕ НА МЕНЮТО ПРИ КЛИК ИЗВЪН НЕГО
        document.addEventListener('click', function(e) {
            if (navMenu.classList.contains('active') && 
                !navMenu.contains(e.target) && 
                !hamburger.contains(e.target)) {
                closeMobileMenu();
            }
        });
        
        // 000.04.9.6 ЗАТВАРЯНЕ НА МЕНЮТО С ESC КЛАВИШ
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                closeMobileMenu();
            }
        });
        
        // 000.04.9.7 КОРЕКЦИЯ НА СТИЛОВЕ ЗА МОБИЛНО МЕНЮ
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .nav-menu {
                    position: fixed;
                    left: -100%;
                    top: 0;
                    height: 100vh;
                    width: 80%;
                    max-width: 300px;
                    background-color: var(--dark-color);
                    flex-direction: column;
                    text-align: left;
                    transition: left 0.3s ease;
                    z-index: 999;
                    padding-top: 80px;
                    padding-left: 20px;
                    box-shadow: 5px 0 15px rgba(0,0,0,0.3);
                }
                
                .nav-menu.active {
                    left: 0;
                }
                
                .nav-item {
                    margin: 0;
                    width: 100%;
                }
                
                .nav-link {
                    display: block;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    width: 100%;
                    font-size: 1.1rem;
                }
                
                .nav-link:hover {
                    background-color: rgba(255,255,255,0.05);
                }
                
                /* Overlay behind menu */
                .nav-menu.active::before {
                    content: '';
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.5);
                    z-index: -1;
                }
            }
            
            /* Ensure hamburger is visible on mobile */
            @media (max-width: 768px) {
                .hamburger {
                    display: flex !important;
                    z-index: 1000;
                }
                
                /* Hide hamburger on desktop */
                @media (min-width: 769px) {
                    .hamburger {
                        display: none !important;
                    }
                }
            }
        `;
        document.head.appendChild(style);
        
        console.log('✅ Mobile navigation initialized successfully');
    } else {
        console.error('❌ Could not find hamburger or navMenu elements');
        if (!hamburger) console.error('Hamburger element not found');
        if (!navMenu) console.error('Nav menu element not found');
    }
});

// ===================================================================================
// 000.04.10 ФУНКЦИОНАЛНОСТ ЗА СКРИВАНЕ НА БАНЕРА ПРИ СКРОЛВАНЕ
// Скрива банера при скролване надолу, но запазва навигационния бар винаги видим.
// ===================================================================================
let lastScrollTop = 0;
const banner = document.querySelector('.banner'); // Предполага се, че има елемент с клас 'banner'
const navbar = document.querySelector('.navbar'); // Предполага се, че има елемент с клас 'navbar'

window.addEventListener('scroll', function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Проверка дали банера съществува
    if (banner) {
        // Ако потребителят скролва надолу и е скролнал повече от 50px
        if (scrollTop > lastScrollTop && scrollTop > 50) {
            // Скриване на банера
            banner.style.transform = 'translateY(-100%)';
            banner.style.transition = 'transform 0.3s ease';
        } 
        // Ако потребителят скролва нагоре
        else if (scrollTop < lastScrollTop) {
            // Показване на банера
            banner.style.transform = 'translateY(0)';
        }
    }
    
    // НАВИГАЦИОННИЯТ БАР ВИНАГИ СИ ОСТАВА ВИДИМ
    // Няма код за скриване на навигационния бар
    
    lastScrollTop = scrollTop;
});

// ===================================================================================
// 000.04.11 ИНИЦИАЛИЗАЦИЯ ПРИ ЗАРЕЖДАНЕ НА СТРАНИЦАТА
// ===================================================================================
console.log('script.js loaded successfully');