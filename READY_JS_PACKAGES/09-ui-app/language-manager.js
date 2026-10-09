// ===================================================================================
// КЛАС ЗА УПРАВЛЕНИЕ НА ЕЗИЦИТЕ
// ===================================================================================
/**
 * Основната функция на този клас е да управлява многоезичността на уебсайта.
 * Той се грижи за:
 * 1. Определяне на текущия език (от localStorage, URL параметри или браузър)
 * 2. Зареждане на преводите
 * 3. Актуализация на текста на страницата
 * 4. Запазване на предпочитанията на потребителя
 * 5. Синхронизация с URL параметри
 * 6. Създаване на събития за смяна на езика
 * ===================================================================================
 * 000.10.0 ДЕКЛАРАЦИЯ НА КЛАСА LANGUAGE MANAGER
 * ===================================================================================
 */

// ===================================================================================
// 000.10.8 МЕТОД ЗА СЛИВАНЕ НА ВСИЧКИ ПРЕВОДИ
// ===================================================================================
/**
 * Слива всички налични преводи в един глобален обект translations
 */
function mergeAllTranslations() {
    // Основният translations обект
    const allTranslations = {};
    
    // Добавяме преводи от translations.js (ако съществува)
    if (window.translations) {
        Object.assign(allTranslations, window.translations);
    }
    
    // Добавяме преводи от translations_doku.js (ако съществува)
    if (window.repositoryTranslations) {
        // Създаваме специален ключ за repositories преводите
        Object.keys(window.repositoryTranslations).forEach(lang => {
            if (!allTranslations[lang]) allTranslations[lang] = {};
            // Добавяме всички repository преводи
            Object.keys(window.repositoryTranslations[lang]).forEach(key => {
                allTranslations[lang][`repo.${key}`] = window.repositoryTranslations[lang][key];
            });
        });
    }
    
    // Добавяме преводи от translations_automations.js (ако съществува)
    if (window.automationsTranslations) {
        Object.keys(window.automationsTranslations).forEach(lang => {
            if (!allTranslations[lang]) allTranslations[lang] = {};
            // Добавяме всички automations преводи
            Object.keys(window.automationsTranslations[lang]).forEach(key => {
                allTranslations[lang][`automation.${key}`] = window.automationsTranslations[lang][key];
            });
        });
    }
    
    // Добавяме преводи от translations_config_methods.js (ако съществува)
    if (window.configMethodsTranslations) {
        Object.keys(window.configMethodsTranslations).forEach(lang => {
            if (!allTranslations[lang]) allTranslations[lang] = {};
            // Добавяме всички config methods преводи
            Object.keys(window.configMethodsTranslations[lang]).forEach(key => {
                allTranslations[lang][`config.${key}`] = window.configMethodsTranslations[lang][key];
            });
        });
    }
    
    return allTranslations;
}

class LanguageManager {
    constructor() {
        // 000.10.0.1 Сливаме всички преводи
        window.translations = mergeAllTranslations();
        
        // 000.10.0.2 Инициализиране на текущия език и стартиране на системата
        this.currentLang = this.getSavedLanguage(); // Определяне на текущия език
        this.init(); // Стартиране на системата
    }

    // ===================================================================================
    // 000.10.1 МЕТОД ЗА ОПРЕДЕЛЯНЕ НА ЗАПАЗЕНИЯ ЕЗИК
    // ===================================================================================
    /**
     * Този метод проверява на три места за предпочитан език:
     * 1. URL параметър ?lang= (има най-висок приоритет)
     * 2. localStorage (втори приоритет)
     * 3. Език на браузъра (трети приоритет)
     * 4. Български като език по подразбиране
     */
    getSavedLanguage() {
        const saved = localStorage.getItem('preferred-language'); // Проверка в localStorage
        const urlParams = new URLSearchParams(window.location.search); // Проверка в URL
        const urlLang = urlParams.get('lang'); // Взимане на езика от URL
        
        // Проверка на приоритетите
        if (urlLang && translations[urlLang]) return urlLang; // URL има приоритет
        if (saved && translations[saved]) return saved; // След това localStorage
        const browserLang = navigator.language.split('-')[0]; // Накрая браузъра
        if (translations[browserLang]) return browserLang;
        
        return 'bg'; // Български по подразбиране
    }

    // ===================================================================================
    // 000.10.2 МЕТОД ЗА ЗАПАЗВАНЕ НА ЕЗИКА
    // ===================================================================================
    /**
     * Запазва избрания език в localStorage за по-късно използване
     */
    saveLanguage(lang) {
        localStorage.setItem('preferred-language', lang);
    }

    // ===================================================================================
    // 000.10.3 МЕТОД ЗА ИНИЦИАЛИЗАЦИЯ НА СИСТЕМАТА
    // ===================================================================================
    /**
     * Стартира два основни процеса:
     * 1. Зареждане на преводите
     * 2. Настройване на слушатели за събития
     */
    init() {
        this.loadLanguage(this.currentLang);
        this.setupEventListeners();
    }

    // ===================================================================================
    // 000.10.4 ОСНОВЕН МЕТОД ЗА ЗАРЕЖДАНЕ НА ЕЗИК
    // ===================================================================================
    /**
     * Основната функция за актуализация на всички елементи на страницата
     */
    loadLanguage(lang) {
        if (!translations[lang]) {
            console.error('Language not found:', lang);
            return;
        }

        document.documentElement.lang = lang; // Задаване на атрибута lang на HTML елемента
        const langData = translations[lang]; // Взимане на преводите за конкретния език

        // 000.10.4.1 АКТУАЛИЗАЦИЯ НА ОСНОВЕН ТЕКСТ
        // Обхожда всички елементи с data-translate атрибут
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate'); // Взимане на ключа за превод
            if (langData[key]) {
                element.textContent = langData[key]; // Замяна на текста
            } else {
                console.warn('Missing translation for key:', key, 'in language:', lang);
            }
        });

        // 000.10.4.2 АКТУАЛИЗАЦИЯ НА ALT АТРИБУТИ
        // За изображения и други елементи с alt текст
        document.querySelectorAll('[data-translate-alt]').forEach(element => {
            const key = element.getAttribute('data-translate-alt');
            if (langData[key]) {
                element.alt = langData[key];
            } else {
                console.warn('Missing alt translation for key:', key, 'in language:', lang);
            }
        });

        // 000.10.4.3 АКТУАЛИЗАЦИЯ НА PLACEHOLDER АТРИБУТИ
        // За полета за въвеждане в форми
        document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            if (langData[key]) {
                element.placeholder = langData[key];
            } else {
                console.warn('Missing placeholder translation for key:', key, 'in language:', lang);
            }
        });

        // 000.10.4.4 АКТУАЛИЗАЦИЯ НА АКТИВНИЯ ЕЗИКОВ БУТОН
        // Маркира бутона на текущия език като активен
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active'); // Премахване на активния клас от всички бутони
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active'); // Добавяне на активния клас на текущия език
            }
        });

        // 000.10.4.5 АКТУАЛИЗАЦИЯ НА ЗАГЛАВИЕТО НА СТРАНИЦАТА
        if (langData['footer.title']) {
            document.title = langData['footer.title'];
        }

        // 000.10.4.6 Актуализиране на текущия език и запазване
        this.currentLang = lang;
        this.saveLanguage(lang);
        
        // 000.10.4.7 Изпращане на събитие за смяна на езика
        // Това събитие се използва от други скриптове за ре-рендиране
        document.dispatchEvent(new Event('languageChanged'));
        
        console.log('Language changed to:', lang);
    }

    // ===================================================================================
    // 000.10.5 МЕТОД ЗА НАСТРОЙВАНЕ НА СЛУШАТЕЛИ ЗА СЪБИТИЯ
    // ===================================================================================
    /**
     * Добавя слушатели за кликване върху езиковите бутони
     */
    setupEventListeners() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Предотвратяване на стандартното поведение
                const lang = e.target.getAttribute('data-lang'); // Взимане на езика от бутона
                if (translations[lang]) {
                    this.loadLanguage(lang); // Зареждане на новия език
                    
                    // 000.10.5.1 Актуализиране на URL адреса с новия езиков параметър
                    const url = new URL(window.location);
                    url.searchParams.set('lang', lang);
                    window.history.replaceState({}, '', url);
                }
            });
        });
    }
}

// ===================================================================================
// 000.10.6 ИНИЦИАЛИЗАЦИЯ ПРИ ЗАРЕЖДАНЕ НА DOM
// ===================================================================================
/**
 * Създава глобален обект за управление на езиците
 */
document.addEventListener('DOMContentLoaded', () => {
    window.languageManager = new LanguageManager();
});

// ===================================================================================
// 000.10.7 СПЕЦИАЛЕН СЛУШАТЕЛ ЗА СМЯНА НА ЕЗИКА ПРИ ОТВОРЕН ДОКУМЕНТАЦИОНЕН МОДАЛ
// ===================================================================================
/**
 * Този код се грижи за автоматично обновяване на документацията при смяна на езика
 */
document.addEventListener('DOMContentLoaded', function() {
    // 000.10.7.1 Намиране на всички бутони за смяна на езика
    const langButtons = document.querySelectorAll('.lang-btn');
    
    // 000.10.7.2 Добавяне на слушател за клик към всеки бутон
    langButtons.forEach(button => {
        button.addEventListener('click', function() {
            setTimeout(() => {
                // 000.10.7.3 Проверка дали документационният модал е отворен
                const docsModal = document.getElementById('docs-modal');
                if (docsModal && docsModal.style.display === 'block') {
                    // 000.10.7.4 Изпращане на събитие за смяна на езика
                    // Това събитие се улавя от load-docs.js за презареждане на документацията
                    document.dispatchEvent(new Event('languageChanged'));
                }
            }, 100); // Малко забавяне за да се гарантира, че преводите са заредени
        });
    });
});
