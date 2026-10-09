// ===================================================================================
// ФАЙЛ ЗА ЗАРЕЖДАНЕ И УПРАВЛЕНИЕ НА ПРОЕКТИТЕ
// ===================================================================================
// Този файл се използва за:
// 1. Зареждане на проектните данни от all-projects.js
// 2. Рендиране на проектите в HTML контейнера
// 3. Управление на езиковите преводи за проектите
// 4. Синхронизация с езиковата система (language-manager.js)
// 5. Създаване на визуални карти за всеки проект
// ===================================================================================
// 000.03.0 ГЛОБАЛНИ ДЕКЛАРАЦИИ И НАСТРОЙКИ
// Актуализиран вариант само с български преводи като fallback
// ===================================================================================

// 000.03.1 ГЛОБАЛНИ ПРОМЕНЛИВИ
let currentLanguage = 'bg';               // Текущ език (по подразбиране български)
let allProjects = [];                     // Масив за всички заредени проекти

// 000.03.2 ЛОКАЛНИ ПРЕВОДИ САМО ЗА ПРОЕКТИТЕ (само български като fallback)
const localProjectTranslations = {
    "projects.advantages": "Предимства:",  // Текст преди списъка с предимства
    "platforms.ha": "HomeAssistant",       // Платформа Home Assistant
    "platforms.web": "WEB",                // Платформа Web
    "platforms.android": "ANDROID",        // Платформа Android
    "platforms.alexa": "Alexa",            // Платформа Alexa
    "platforms.google": "Google"           // Платформа Google
};

// 000.03.3 ОСНОВНА ФУНКЦИЯ ЗА ЗАРЕЖДАНЕ НА ВСИЧКИ ПРОЕКТИ
/**
 * Основна функция за зареждане на всички проекти:
 * - Търси контейнера за проекти
 * - Показва съобщение за зареждане
 * - Зарежда данни от window.allProjectsData или тестови данни
 * - Сортира проектите по ID
 * - Извиква функция за рендиране
 */
function loadAllProjects() {
    const container = document.getElementById('projects-container');
    
    if (!container) {
        console.error('Не е намерен контейнер за проекти!');
        return;
    }
    
    // 000.03.3.1 Показване на съобщение за зареждане
    container.innerHTML = '<div class="loading-projects">Зареждане на проектите...</div>';
    
    // 000.03.3.2 Проверяваме дали има вградени данни от all-projects.js
    if (window.allProjectsData && window.allProjectsData.length > 0) {
        allProjects = window.allProjectsData;
        console.log(`✅ Заредени ${allProjects.length} проекта от вградени данни`);
    } else {
        // 000.03.3.3 Ако няма вградени данни, използваме тестови
        allProjects = getFallbackProjects();
        console.log(`⚠️ Използвани тестови проекти: ${allProjects.length}`);
    }
    
    // 000.03.3.4 Сортиране по ID (за подредено показване)
    allProjects.sort((a, b) => (a.id || 0) - (b.id || 0));
    
    console.log(`✅ Заредени общо ${allProjects.length} проекта`);
    renderProjects();
}

// 000.03.4 ТЕСТОВИ ПРОЕКТИ ЗА FALLBACK (при липса на данни)
/**
 * Създава тестови проекти за случаите, когато няма заредени данни:
 * - Използва се за разработка и дебъг
 * - Съдържа минимални данни за тестване на функционалността
 */
function getFallbackProjects() {
    return [
        {
            "id": 1,
            "title": "🛜 Zigbee мрежа (Тест)",
            "platforms": ["ha"],
            "image": "static/img/banner-w-bg.png",
            "imageAlt": "Zigbee мрежа",
            "advantages": [
                "Тестово предимство 1",
                "Тестово предимство 2",
                "Тестово предимство 3"
            ],
            "link": "#",
            "buttonText": "↪️ КЪМ ПРОЕКТА ▶️"
        },
        {
            "id": 2,
            "title": "🛒 Пазарна листа (Тест)",
            "platforms": ["ha", "android"],
            "image": "static/img/banner-w-bg.png",
            "imageAlt": "Списък за пазаруване",
            "advantages": [
                "Тестово предимство A",
                "Тестово предимство B"
            ],
            "link": "#",
            "buttonText": "↪️ КЪМ ПРОЕКТА ▶️"
        }
    ];
}

// 000.03.5 ФУНКЦИЯ ЗА РЕНДИРАНЕ НА ПРОЕКТИТЕ
/**
 * Рендира всички проекти в HTML контейнера:
 * - Проверява дали има проекти
 * - Генерира HTML за всеки проект
 * - Заменя съдържанието на контейнера
 */
function renderProjects() {
    const container = document.getElementById('projects-container');
    
    if (!container) {
        console.error('Не е намерен контейнер за проекти!');
        return;
    }
    
    if (allProjects.length === 0) {
        container.innerHTML = '<div class="error-message">Няма заредени проекти</div>';
        return;
    }
    
    // 000.03.5.1 Генериране на HTML за всички проекти
    container.innerHTML = allProjects.map(project => generateProjectHTML(project)).join('');
    
    console.log(`✅ Рендирани ${allProjects.length} проекта`);
}

// 000.03.6 ФУНКЦИЯ ЗА ГЕНЕРИРАНЕ НА HTML ЗА ПРОЕКТ
/**
 * Генерира HTML структура за един проект:
 * - Взима преводи за заглавие, описание, бутон
 * - Създава HTML за платформите
 * - Създава HTML за предимствата
 * - Връща пълна HTML структура за картата на проекта
 */
function generateProjectHTML(project) {
    // 000.03.6.1 Взимане на заглавие на текущия език
    const title = getProjectTranslation(project, 'title');
    const imageAlt = getProjectTranslation(project, 'imageAlt');
    const buttonText = getProjectTranslation(project, 'buttonText');
    
    // 000.03.6.2 Генериране на HTML за платформите
    const platformsHTML = generatePlatformsHTML(project.platforms || []);
    
    // 000.03.6.3 Генериране на HTML за предимствата
    const advantagesHTML = generateAdvantagesHTML(project.advantages || [], project.id);
    
    // 000.03.6.4 Връщане на пълната HTML структура
    return `
        <div class="project-card">
            <div class="project-header">
                <h3>${title}</h3>
                <div class="platform-badges">
                    ${platformsHTML}
                </div>
            </div>
            <div class="project-content">
                ${project.image ? `
                <div class="project-image">
                    <img src="${project.image}" alt="${imageAlt}" style="max-width:100%; height:auto; display:block;">
                </div>
                ` : ''}
                <div class="project-info">
                    <h4>${localProjectTranslations["projects.advantages"] || "Предимства:"}</h4>
                    <ul>
                        ${advantagesHTML}
                    </ul>
                    ${project.link ? `
                    <a class="project-link" href="${project.link}" target="_blank" rel="noopener">
                        ${buttonText}
                    </a>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// 000.03.7 ФУНКЦИЯ ЗА ВЗИМАНЕ НА ПРЕВОД ЗА ПРОЕКТ
/**
 * Взима превод за конкретно поле на проект:
 * - Първо търси превод в translations.js за текущия език
 * - Ако няма, търси в българските преводи
 * - Ако няма и там, връща оригиналната стойност
 */
function getProjectTranslation(project, field) {
    const projectId = project.id;
    const translationKey = getTranslationKeyForProject(projectId, field);
    
    // 000.03.7.1 Опит за взимане на превод от translations.js за текущия език
    if (translations[currentLanguage] && translations[currentLanguage][translationKey]) {
        return translations[currentLanguage][translationKey];
    }
    
    // 000.03.7.2 Връщане на българския превод ако няма за текущия език
    if (translations['bg'] && translations['bg'][translationKey]) {
        return translations['bg'][translationKey];
    }
    
    // 000.03.7.3 Връщане на оригиналната стойност от JSON данните
    return project[field] || '';
}

// 000.03.8 ФУНКЦИЯ ЗА ГЕНЕРИРАНЕ НА КЛЮЧ ЗА ПРЕВОД
/**
 * Генерира ключ за превод въз основа на ID на проекта и поле:
 * - Мапва ID на проекти към имена (zigbee, shopping, wled и т.н.)
 * - Генерира ключ във формат projects.{projectName}.{fieldKey}
 */
function getTranslationKeyForProject(projectId, field) {
    // 000.03.8.1 Мапване на ID на проекти към имена
    const projectNames = {
        1: 'zigbee',
        2: 'shopping',
        3: 'wled',
        4: 'tasmota',
        5: 'hass2zigbee',
        6: 'voice',
        7: 'fingerbot',
        8: 'eco',
        9: 'away',
        10: 'timer'
    };
    
    const projectName = projectNames[projectId] || `project${projectId}`;
    
    // 000.03.8.2 Поле -> ключ за превод (мапиране на имената на полетата)
    const fieldMap = {
        'title': 'title',
        'imageAlt': 'imageAlt',
        'buttonText': 'button'
    };
    
    const fieldKey = fieldMap[field] || field;
    
    return `projects.${projectName}.${fieldKey}`;
}

// 000.03.9 ФУНКЦИЯ ЗА ГЕНЕРИРАНЕ НА HTML ЗА ПЛАТФОРМИ
/**
 * Генерира HTML за платформите на проекта:
 * - За всяка платформа създава badge
 * - Различава активни и неактивни платформи (_inactive суфикс)
 * - Използва преводи за имената на платформите
 */
function generatePlatformsHTML(platforms) {
    if (!platforms || platforms.length === 0) return '';
    
    return platforms.map(platform => {
        const isActive = !platform.includes('_inactive');
        const platformClass = isActive ? 'platform-badge' : 'platform-badge inactive';
        const platformKey = platform.replace('_inactive', '').toLowerCase();
        const platformText = localProjectTranslations[`platforms.${platformKey}`] || 
                           platformKey.toUpperCase();
        
        return `<span class="${platformClass}">${platformText}</span>`;
    }).join('');
}

// 000.03.10 ФУНКЦИЯ ЗА ГЕНЕРИРАНЕ НА HTML ЗА ПРЕДИМСТВА
/**
 * Генерира HTML списък с предимства за проекта:
 * - Опитва да вземе превод за всяко предимство
 * - Ако няма превод, използва оригиналния текст
 * - Създава номериран списък (adv1, adv2, adv3...)
 */
function generateAdvantagesHTML(advantages, projectId) {
    if (!advantages || advantages.length === 0) {
        return '<li>Няма информация за предимства</li>';
    }
    
    return advantages.map((advantage, index) => {
        // 000.03.10.1 Опитваме първо да вземем превод от translations.js
        const projectName = getProjectNameById(projectId);
        const translationKey = `projects.${projectName}.adv${index + 1}`;
        
        if (translations[currentLanguage] && translations[currentLanguage][translationKey]) {
            return `<li>${translations[currentLanguage][translationKey]}</li>`;
        }
        
        // 000.03.10.2 Ако няма превод, използваме оригиналния текст
        if (typeof advantage === 'string') {
            return `<li>${advantage}</li>`;
        } else {
            return `<li>${JSON.stringify(advantage)}</li>`;
        }
    }).join('');
}

// 000.03.11 ФУНКЦИЯ ЗА ВЗИМАНЕ НА ИМЕ НА ПРОЕКТ ПО ID
/**
 * Връща името на проекта въз основа на ID:
 * - Използва същото мапиране като getTranslationKeyForProject
 * - Използва се за генериране на ключове за преводи
 */
function getProjectNameById(projectId) {
    const projectNames = {
        1: 'zigbee',
        2: 'shopping',
        3: 'wled',
        4: 'tasmota',
        5: 'hass2zigbee',
        6: 'voice',
        7: 'fingerbot',
        8: 'eco',
        9: 'away',
        10: 'timer'
    };
    
    return projectNames[projectId] || `project${projectId}`;
}

// 000.03.12 ФУНКЦИЯ ЗА СМЯНА НА ЕЗИКА
/**
 * Променя текущия език и прерисува проектите:
 * - Променя глобалната променлива currentLanguage
 * - Извиква renderProjects() за актуализация на съдържанието
 */
function setLanguage(lang) {
    if (currentLanguage === lang) return;
    
    currentLanguage = lang;
    console.log(`🌍 Сменен език на: ${lang}`);
    
    // Рендиране на проектите с новия език
    renderProjects();
}

// 000.03.13 ИНИЦИАЛИЗАЦИЯ ПРИ ЗАРЕЖДАНЕ НА СТРАНИЦАТА
/**
 * Основна инициализация при зареждане на DOM:
 * - Задава текущия език от languageManager
 * - Свързва бутоните за смяна на език
 * - Зарежда проектите след малко забавяне
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Инициализация на зареждане на проекти...');
    
    // 000.03.13.1 Задаваме текущия език от languageManager
    if (window.languageManager && window.languageManager.currentLang) {
        currentLanguage = window.languageManager.currentLang;
    }
    
    // 000.03.13.2 Свързване на бутоните за език
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            setLanguage(lang);
        });
    });
    
    // 000.03.13.3 Зареждане на проектите след малко забавяне
    setTimeout(() => {
        loadAllProjects();
    }, 500);
});

// 000.03.14 СЛУШАНЕ ЗА СМЯНА НА ЕЗИКА ОТ LANGUAGE-MANAGER
/**
 * Слуша за събитие languageChanged от language-manager.js:
 * - Актуализира текущия език
 * - Прерисува проектите с новия език
 */
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('languageChanged', function() {
        // Актуализиране на текущия език от languageManager
        if (window.languageManager && window.languageManager.currentLang) {
            currentLanguage = window.languageManager.currentLang;
            renderProjects();
        }
    });
});

// 000.03.15 ЕКСПОРТ НА ФУНКЦИИ ЗА ДОСТЪП ОТ ДРУГИ СКРИПТОВЕ
/**
 * Създава глобален обект ProjectManager с публични функции:
 * - Позволява достъп до функциите от други JavaScript файлове
 * - Предоставя API за управление на проектите
 */
window.ProjectManager = {
    loadAllProjects,      // Функция за зареждане на всички проекти
    setLanguage,          // Функция за смяна на езика
    getCurrentLanguage: () => currentLanguage, // Гетър за текущия език
    getAllProjects: () => allProjects // Гетър за всички проекти
};