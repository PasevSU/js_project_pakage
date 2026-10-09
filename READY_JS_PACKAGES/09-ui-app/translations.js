//---------------------------------------------------------------------------------------- 
// В този файл се съхраняват всички преводи за различните езици, използвани в index.html
// Структуриран по секции на страницата
//----------------------------------------------------------------------------------------
const translations = {
    // ----------------------------------------------------------------------------------------
    // English translations
    // ----------------------------------------------------------------------------------------
    en: {
        // HEADER SECTION
        "header.logo": "HOME ASSISTANT",
        "header.nav.home": "Home",
        "header.nav.projects": "Projects",
        "header.nav.about": "About",
        "header.nav.documentation": "Documentation",
        "header.nav.generators": "Generators",
        "header.nav.contact": "Contact",
        "header.language.bg": "Bulgarian",
        "header.language.en": "English",
        "header.language.de": "German",
        
        // HERO SECTION (id="home")
        "hero.title": "🏠 HOME ASSISTANT PROJECTS AND DEVELOPMENTS",
        "hero.badge1": "🔧 Smart Home",
        "hero.badge2": "🧠 Automations",
        "hero.badge3": "🌐 IoT Integrations",
        "hero.description": "Welcome to my Home Assistant repository! Here you'll find a collection of my personal Home Assistant projects, automations, configurations, and integrations — all carefully developed to simplify daily routines, enhance comfort, and save energy in the smart home environment.",
        
        // SUMMARY SECTION (id="summary")
        "summary.title": "💬 SUMMARY",
        "summary.item1.title": "Responsive Design",
        "summary.item1.text": "All elements and text automatically scale based on screen size while maintaining readability.",
        "summary.item2.title": "Clean Layout",
        "summary.item2.text": "Easy to understand by both adults and children with minimal navigation.",
        "summary.item3.title": "Resource Optimization",
        "summary.item3.text": "Reduce household energy consumption through automation.",
        "summary.item4.title": "Structured Management",
        "summary.item4.text": "Divide home into zones and group sensors for simplified automations.",
        "summary.item5.title": "Security",
        "summary.item5.text": "Utilize existing devices for home protection when no one is home.",
        "summary.item6.title": "Offline Functionality",
        "summary.item6.text": "Everything operates without internet access.",
        
        // PROJECTS SECTION (id="projects")
        "projects.title": "🛠️ PROJECTS",
        "projects.loading": "Loading projects...",
        "projects.advantages": "Advantages:",
        "projects.platforms.homeassistant": "HomeAssistant",
        "projects.platforms.web": "WEB",
        "projects.platforms.android": "ANDROID",
        "projects.platforms.alexa": "Alexa",
        "projects.platforms.google": "Google",
        "projects.goto": "↪️ GO TO PROJECT ▶️",
        
        // PROJECT SPECIFIC TRANSLATIONS
        "projects.zigbee.title": "🛜 Creating and Integrating a Zigbee Network",
        "projects.zigbee.imageAlt": "Zigbee network",
        "projects.zigbee.adv1": "Works without internet using Zigbee2MQTT",
        "projects.zigbee.adv2": "Does not load the internet network",
        "projects.zigbee.adv3": "Easy installation and device relocation",
        "projects.zigbee.adv4": "Zigbee devices act as repeaters",
        "projects.zigbee.adv5": "Affordable Zigbee hardware",
        "projects.zigbee.adv6": "Upgrade possibility when network is loaded",
        
        "projects.shopping.title": "🛒 Shopping List with Images",
        "projects.shopping.imageAlt": "Shopping list",
        "projects.shopping.adv1": "Quick item finding by categories",
        "projects.shopping.adv2": "Visual identification through images",
        "projects.shopping.adv3": "Household members receive notifications for new items",
        "projects.shopping.adv4": "Automatically removes checked items",
        
        "projects.wled.title": "🎤🔉 WLED SoundReactive Intelligent Light Show",
        "projects.wled.imageAlt": "WLED SoundReactive animation",
        "projects.wled.adv1": "Real-time reaction beyond human perception",
        "projects.wled.adv2": "Automatic microphone sensitivity adjustment",
        "projects.wled.adv3": "Low cost and energy efficiency",
        "projects.wled.adv4": "Full WLED mod with official firmware features",
        "projects.wled.adv5": "Web interface and mobile apps - compatible with Home Assistant",
        
        "projects.tasmota.title": "🤖 TASMOTA – Integration and Devices",
        "projects.tasmota.imageAlt": "Tasmota devices",
        "projects.tasmota.adv1": "Full control over devices",
        "projects.tasmota.adv2": "Independent of internet connection",
        "projects.tasmota.adv3": "Instant control through TASMOTA, Home Assistant and Alexa",
        "projects.tasmota.adv4": "Does not load the internet network",
        
        "projects.hass2zigbee.title": "🏠 HASS with Two Zigbee Networks",
        "projects.hass2zigbee.imageAlt": "Two Zigbee networks",
        "projects.hass2zigbee.adv1": "Supports more devices",
        "projects.hass2zigbee.adv2": "Load/function separation",
        "projects.hass2zigbee.adv3": "Improved compatibility testing",
        "projects.hass2zigbee.adv4": "Flexible migration and experimentation",
        
        "projects.voice.title": "🎙️ Voice Control for HASS Devices (Alexa / Google Home)",
        "projects.voice.imageAlt": "Voice control integration",
        "projects.voice.adv1": "Voice control of automations and scripts",
        "projects.voice.adv2": "Device control and monitoring through voice",
        "projects.voice.adv3": "Easy addition and removal of devices",
        
        "projects.fingerbot.title": "🖲️ Zigbee Fingerbot Control via NFC and Home Assistant",
        "projects.fingerbot.imageAlt": "Fingerbot NFC door",
        "projects.fingerbot.adv1": "Contactless access",
        "projects.fingerbot.adv2": "Integration with Home Assistant",
        "projects.fingerbot.adv3": "Local and offline control",
        "projects.fingerbot.adv4": "Compatible with any NFC device",
        
        "projects.eco.title": "🌿 Eco Mode for Thermostats in Home Assistant",
        "projects.eco.imageAlt": "Eco mode thermostat",
        "projects.eco.adv1": "Energy saving",
        "projects.eco.adv2": "Comfort without compromise",
        "projects.eco.adv3": "Easy integration and customization",
        
        "projects.away.title": "🔋 HASS-AWAY-MODE / AWAY MODE",
        "projects.away.imageAlt": "Away Mode banner",
        "projects.away.adv1": "Automated away mode management",
        "projects.away.adv2": "Integration with Home Assistant",
        "projects.away.adv3": "Flexible scenarios with input booleans",
        
        "projects.timer.title": "⏱️ Home Assistant - Flexible Timer Automation",
        "projects.timer.imageAlt": "Flexible timer banner",
        "projects.timer.adv1": "Interval setting through UI (hours, minutes, seconds)",
        "projects.timer.adv2": "Executes actions after interval expires",
        "projects.timer.adv3": "Prevents premature triggering",
        
        // GENERATORS SECTION (id="generators")
        "generators.title": "Generators",
        "generators.description": "If you encounter any problems with the generators, feel free to contact me using our contact form. In case of difficulties, we hope you will look for me, even for criticisms, they are important to me in order not to stop my aspiration to improve and learn every day.",
        "generators.contactLink": "📧 contact form",
        "generators.contactSubject": "HASS Generators",
        "generators.ntfy": "ntfy notifications generator",
        "generators.mobile": "Mobile app notification generator",
        "generators.shell": "Command shell code generator",
        
        // ABOUT SECTION (id="about")
        "about.title": "About",
        "about.description": "This repository contains my personal Home Assistant projects, automations, configurations, and integrations. Most projects include support in both English and Bulgarian, and I continuously update the repository with new features and improvements.",
        
        // DOCUMENTATION SECTION (id="documents")
        "documentation.title": "Documentation",
        "documentation.docsDescription": "Click on any document to view its full content in a new window.",
        "documentation.loading": "Loading documents...",
        "documentation.error": "Error loading documents.",
        "documentation.noDocs": "No documents loaded.",
        "documentation.fullDoc": "Open full documentation",
        "documentation.clickToOpen": "📄 Click to open full document",
        
        // DOCUMENT SPECIFIC (moved from separate translation files)
        "doc.repositories.title": "Add-on Repositories List",
        "doc.repositories.description": "Complete list of useful add-on repositories for Home Assistant",
        "doc.automations.title": "Types of Automations",
        "doc.automations.description": "Overview of different automation types and their applications",
        "doc.config-methods.title": "Configuration Methods",
        "doc.config-methods.description": "Different ways to configure Home Assistant and add-ons",
        
        // CONTACT MODAL
        "contact.title": "Contact",
        "contact.description": "Send us a message and we'll respond as soon as possible.",
        "contact.form.name": "Name",
        "contact.form.email": "Email",
        "contact.form.subject": "Subject",
        "contact.form.message": "Message",
        "contact.form.submit": "Send Message",
        "contact.form.namePlaceholder": "Enter your name",
        "contact.form.emailPlaceholder": "Enter your email address",
        "contact.form.subjectPlaceholder": "Message subject",
        "contact.form.messagePlaceholder": "Write your message here...",
        
        // FOOTER SECTION
        "footer.title": "Home Assistant Projects",
        "footer.description": "Simplifying daily routines, enhancing comfort, and saving energy in the smart home environment.",
        "footer.links": "Links",
        "footer.connect": "Connect",
        "footer.donate": "Donate",
        "footer.copyright": "© 2023 Home Assistant Projects. All rights reserved.",
        
        // COMMON/BUTTONS
        "button.viewAll": "View all documents",
        "button.exploreProjects": "Explore Projects",
        "button.close": "Close"
    },
    
    // ----------------------------------------------------------------------------------------
    // Български преводи
    // ----------------------------------------------------------------------------------------
    bg: {
        // HEADER SECTION
        "header.logo": "HOME ASSISTANT",
        "header.nav.home": "Начало",
        "header.nav.projects": "Проекти",
        "header.nav.about": "За нас",
        "header.nav.documentation": "Документи",
        "header.nav.generators": "Генератори",
        "header.nav.contact": "Контакт",
        "header.language.bg": "Български",
        "header.language.en": "Английски",
        "header.language.de": "Немски",
        
        // HERO SECTION (id="home")
        "hero.title": "🏠 HOME ASSISTANT ПРОЕКТИ И РАЗРАБОТКИ",
        "hero.badge1": "🔧 Умен дом",
        "hero.badge2": "🧠 Автоматизации",
        "hero.badge3": "🌐 IoT интеграции",
        "hero.description": "Добре дошли в моето Home Assistant хранилище! Тук ще намерите колекция от мои проекти, автоматизации, конфигурации и интеграции — всички разработени за опростяване на ежедневието, повишаване на комфорта и пестене на енергия в интелигентния дом.",
        
        // SUMMARY SECTION (id="summary")
        "summary.title": "💬 ОБОБЩЕНИЕ",
        "summary.item1.title": "Респонсив дизайн",
        "summary.item1.text": "Всички елементи и текст автоматично се променят спрямо размера на екрана, като се запазва четивността.",
        "summary.item2.title": "Чисто оформление",
        "summary.item2.text": "Лесно за разбиране за възрастни и деца с минимална навигация.",
        "summary.item3.title": "Оптимизация на ресурси",
        "summary.item3.text": "Намаляване на енергопотреблението в дома чрез автоматизация.",
        "summary.item4.title": "Структурирано управление",
        "summary.item4.text": "Разделяне на дома на зони и групиране на сензори за по-лесни автоматизации.",
        "summary.item5.title": "Сигурност",
        "summary.item5.text": "Използване на налични устройства за защита на дома при отсъствие.",
        "summary.item6.title": "Работа офлайн",
        "summary.item6.text": "Всичко функционира и без интернет връзка.",
        
        // PROJECTS SECTION (id="projects")
        "projects.title": "🛠️ ПРОЕКТИ",
        "projects.loading": "Зареждане на проектите...",
        "projects.advantages": "Предимства:",
        "projects.platforms.homeassistant": "HomeAssistant",
        "projects.platforms.web": "WEB",
        "projects.platforms.android": "ANDROID",
        "projects.platforms.alexa": "Alexa",
        "projects.platforms.google": "Google",
        "projects.goto": "↪️ КЪМ ПРОЕКТА ▶️",
        
        // PROJECT SPECIFIC TRANSLATIONS
        "projects.zigbee.title": "🛜 Създаване и интегриране на Zigbee мрежа",
        "projects.zigbee.imageAlt": "Zigbee мрежа",
        "projects.zigbee.adv1": "Работи без интернет с Zigbee2MQTT",
        "projects.zigbee.adv2": "Не натоварва интернет мрежата",
        "projects.zigbee.adv3": "Лесна инсталация и преместване на устройства",
        "projects.zigbee.adv4": "Zigbee устройствата действат като ретранслатори",
        "projects.zigbee.adv5": "Достъпен Zigbee хардуер",
        "projects.zigbee.adv6": "Възможност за ъпгрейд при натоварване на мрежата",
        
        "projects.shopping.title": "🛒 Списък за пазаруване с изображения",
        "projects.shopping.imageAlt": "Списък за пазаруване",
        "projects.shopping.adv1": "Бързо намиране на артикули по категории",
        "projects.shopping.adv2": "Визуална идентификация чрез изображения",
        "projects.shopping.adv3": "Членовете на домакинството получават известия за нови артикули",
        "projects.shopping.adv4": "Автоматично премахва отметнати артикули",
        
        "projects.wled.title": "🎤🔉 WLED SoundReactive Интелигентно светлинно шоу",
        "projects.wled.imageAlt": "WLED SoundReactive анимация",
        "projects.wled.adv1": "Реакция в реално време извън човешкото възприятие",
        "projects.wled.adv2": "Автоматично регулиране на чувствителността на микрофона",
        "projects.wled.adv3": "Ниска цена и енергийна ефективност",
        "projects.wled.adv4": "Пълен WLED мод с официални функции на фърмуера",
        "projects.wled.adv5": "Уеб интерфейс и мобилни приложения — съвместими с Home Assistant",
        
        "projects.tasmota.title": "🤖 TASMOTA – Интеграция и устройства",
        "projects.tasmota.imageAlt": "Tasmota устройства",
        "projects.tasmota.adv1": "Пълен контрол върху устройствата",
        "projects.tasmota.adv2": "Независимо от интернет връзка",
        "projects.tasmota.adv3": "Моментален контрол чрез TASMOTA, Home Assistant и Alexa",
        "projects.tasmota.adv4": "Не натоварва интернет мрежата",
        
        "projects.hass2zigbee.title": "🏠 HASS с две Zigbee мрежи",
        "projects.hass2zigbee.imageAlt": "Две Zigbee мрежи",
        "projects.hass2zigbee.adv1": "Поддържа повече устройства",
        "projects.hass2zigbee.adv2": "Разделяне на товар/функции",
        "projects.hass2zigbee.adv3": "Подобрено тестване за съвместимост",
        "projects.hass2zigbee.adv4": "Гъвкава миграция и експериментиране",
        
        "projects.voice.title": "🎙️ Гласово управление на HASS устройства (Alexa / Google Home)",
        "projects.voice.imageAlt": "Гласово управление интеграция",
        "projects.voice.adv1": "Управление на автоматизации и скриптове с глас",
        "projects.voice.adv2": "Управление на устройства и мониторинг чрез глас",
        "projects.voice.adv3": "Лесно добавяне и премахване на устройства",
        
        "projects.fingerbot.title": "🖲️ Управление на Zigbee Fingerbot чрез NFC и Home Assistant",
        "projects.fingerbot.imageAlt": "Fingerbot NFC врата",
        "projects.fingerbot.adv1": "Безконтактен достъп",
        "projects.fingerbot.adv2": "Интеграция с Home Assistant",
        "projects.fingerbot.adv3": "Локален и офлайн контрол",
        "projects.fingerbot.adv4": "Съвместим с всяко NFC устройство",
        
        "projects.eco.title": "🌿 Eco режим за термостати в Home Assistant",
        "projects.eco.imageAlt": "Еко режим термостат",
        "projects.eco.adv1": "Спестяване на енергия",
        "projects.eco.adv2": "Комфорт без компромис",
        "projects.eco.adv3": "Лесна интеграция и персонализация",
        
        "projects.away.title": "🔋 HASS-AWAY-MODE / AWAY MODE",
        "projects.away.imageAlt": "Банер Away Mode",
        "projects.away.adv1": "Автоматизирано управление на away режима",
        "projects.away.adv2": "Интеграция с Home Assistant",
        "projects.away.adv3": "Гъвкави сценарии с input booleans",
        
        "projects.timer.title": "⏱️ Home Assistant - Гъвкава таймер автоматизация",
        "projects.timer.imageAlt": "Банер гъвкав таймер",
        "projects.timer.adv1": "Настройка на интервал чрез UI (часове, минути, секунди)",
        "projects.timer.adv2": "Изпълнява действия след изтичане на интервала",
        "projects.timer.adv3": "Предотвратява преждевременно задействане",
        
        // GENERATORS SECTION (id="generators")
        "generators.title": "Генератори",
        "generators.description": "При нередности с генераторите ми пишете на контактната форма с тема 'HASS Генератори'.",
        "generators.contactLink": "📧 контактната форма",
        "generators.contactSubject": "HASS Генератори",
        "generators.ntfy": "Генератор за ntfy известия",
        "generators.mobile": "Генератор на известия до mobile app",
        "generators.shell": "Генератор на command shell кодове",
        
        // ABOUT SECTION (id="about")
        "about.title": "За нас",
        "about.description": "Това хранилище съдържа моите персонални проекти за Home Assistant, автоматизации, конфигурации и интеграции. Повечето проекти имат поддръжка на английски и български и редовно добавям нови функции и подобрения.",
        
        // DOCUMENTATION SECTION (id="documents")
        "documentation.title": "Документи",
        "documentation.docsDescription": "Кликнете върху всеки документ за да отворите пълния документ в нов прозорец.",
        "documentation.loading": "Зареждане на документи...",
        "documentation.error": "Грешка при зареждане на документи.",
        "documentation.noDocs": "Няма заредени документи.",
        "documentation.fullDoc": "Отвори пълната документация",
        "documentation.clickToOpen": "📄 Кликнете за пълния документ",
        
        // DOCUMENT SPECIFIC
        "doc.repositories.title": "Списък с add-on хранилища",
        "doc.repositories.description": "Пълен списък на полезни add-on хранилища за Home Assistant",
        "doc.automations.title": "Видове автоматизации",
        "doc.automations.description": "Преглед на различни видове автоматизации и тяхното приложение",
        "doc.config-methods.title": "Методи на конфигуриране",
        "doc.config-methods.description": "Различни начини за конфигуриране на Home Assistant и добавки",
        
        // CONTACT MODAL
        "contact.title": "Контакт",
        "contact.description": "Изпратете ни съобщение и ще ви отговорим възможно най-бързо.",
        "contact.form.name": "Име",
        "contact.form.email": "Имейл",
        "contact.form.subject": "Тема",
        "contact.form.message": "Съобщение",
        "contact.form.submit": "Изпрати съобщение",
        "contact.form.namePlaceholder": "Въведете вашето име",
        "contact.form.emailPlaceholder": "Въведете вашия имейл адрес",
        "contact.form.subjectPlaceholder": "Тема на съобщението",
        "contact.form.messagePlaceholder": "Напишете вашето съобщение тук...",
        
        // FOOTER SECTION
        "footer.title": "Home Assistant Проекти",
        "footer.description": "Опростяване на ежедневието, повишаване на комфорта и пестене на енергия в интелигентния дом.",
        "footer.links": "Връзки",
        "footer.connect": "Свържи се",
        "footer.donate": "Дарение",
        "footer.copyright": "© 2023 Home Assistant Проекти. Всички права запазени.",
        
        // COMMON/BUTTONS
        "button.viewAll": "Виж всички документи",
        "button.exploreProjects": "Разгледай Проекти",
        "button.close": "Затвори"
    },
    
    // ----------------------------------------------------------------------------------------
    // Deutsche Übersetzungen
    // ----------------------------------------------------------------------------------------
    de: {
        // HEADER SECTION
        "header.logo": "HOME ASSISTANT",
        "header.nav.home": "Startseite",
        "header.nav.projects": "Projekte",
        "header.nav.about": "Über uns",
        "header.nav.documentation": "Dokumentation",
        "header.nav.generators": "Generatoren",
        "header.nav.contact": "Kontakt",
        "header.language.bg": "Bulgarisch",
        "header.language.en": "Englisch",
        "header.language.de": "Deutsch",
        
        // HERO SECTION (id="home")
        "hero.title": "🏠 HOME ASSISTANT PROJEKTE UND ENTWICKLUNGEN",
        "hero.badge1": "🔧 Smart Home",
        "hero.badge2": "🧠 Automatisierungen",
        "hero.badge3": "🌐 IoT-Integrationen",
        "hero.description": "Willkommen in meinem Home Assistant Repository! Hier finden Sie eine Sammlung meiner Projekte, Automatisierungen, Konfigurationen und Integrationen, die dazu dienen, den Alltag zu erleichtern, den Komfort zu erhöhen und Energie im smarten Zuhause zu sparen.",
        
        // SUMMARY SECTION (id="summary")
        "summary.title": "💬 ZUSAMMENFASSUNG",
        "summary.item1.title": "Responsives Design",
        "summary.item1.text": "Alle Elemente und Texte passen sich automatisch an die Bildschirmgröße an und bleiben lesbar.",
        "summary.item2.title": "Übersichtliches Layout",
        "summary.item2.text": "Einfach verständlich für Erwachsene und Kinder mit minimaler Navigation.",
        "summary.item3.title": "Ressourcenoptimierung",
        "summary.item3.text": "Reduzierung des Energieverbrauchs im Haushalt durch Automatisierung.",
        "summary.item4.title": "Strukturierte Verwaltung",
        "summary.item4.text": "Unterteilung in Zonen und Gruppierung von Sensoren für vereinfachte Automatisierungen.",
        "summary.item5.title": "Sicherheit",
        "summary.item5.text": "Nutzung vorhandener Geräte zum Schutz des Hauses, wenn niemand anwesend ist.",
        "summary.item6.title": "Offline-Funktionalität",
        "summary.item6.text": "Alles funktioniert ohne Internetverbindung.",
        
        // PROJECTS SECTION (id="projects")
        "projects.title": "🛠️ PROJEKTE",
        "projects.loading": "Projekte werden geladen...",
        "projects.advantages": "Vorteile:",
        "projects.platforms.homeassistant": "HomeAssistant",
        "projects.platforms.web": "WEB",
        "projects.platforms.android": "ANDROID",
        "projects.platforms.alexa": "Alexa",
        "projects.platforms.google": "Google",
        "projects.goto": "↪️ ZUM PROJEKT ▶️",
        
        // PROJECT SPECIFIC TRANSLATIONS
        "projects.zigbee.title": "🛜 Erstellung und Integration eines Zigbee-Netzwerks",
        "projects.zigbee.imageAlt": "Zigbee-Netzwerk",
        "projects.zigbee.adv1": "Funktioniert ohne Internet mit Zigbee2MQTT",
        "projects.zigbee.adv2": "Belastet das Internetnetzwerk nicht",
        "projects.zigbee.adv3": "Einfache Installation und Geräteverlegung",
        "projects.zigbee.adv4": "Zigbee-Geräte fungieren als Repeater",
        "projects.zigbee.adv5": "Erschwingliche Zigbee-Hardware",
        "projects.zigbee.adv6": "Upgrade-Möglichkeit bei Netzwerkbelastung",
        
        "projects.shopping.title": "🛒 Einkaufsliste mit Bildern",
        "projects.shopping.imageAlt": "Einkaufsliste",
        "projects.shopping.adv1": "Schnelles Finden von Artikeln nach Kategorien",
        "projects.shopping.adv2": "Visuelle Identifikation durch Bilder",
        "projects.shopping.adv3": "Haushaltsmitglieder erhalten Benachrichtigungen für neue Artikel",
        "projects.shopping.adv4": "Automatisches Entfernen markierter Artikel",
        
        "projects.wled.title": "🎤🔉 WLED SoundReactive Intelligente Lichtshow",
        "projects.wled.imageAlt": "WLED SoundReactive Animation",
        "projects.wled.adv1": "Echtzeit-Reaktion jenseits der menschlichen Wahrnehmung",
        "projects.wled.adv2": "Automatische Mikrofonempfindlichkeitsregelung",
        "projects.wled.adv3": "Geringe Kosten und Energieeffizienz",
        "projects.wled.adv4": "Vollständiger WLED-Mod mit offiziellen Firmware-Funktionen",
        "projects.wled.adv5": "Webinterface und mobile Apps - kompatibel mit Home Assistant",
        
        "projects.tasmota.title": "🤖 TASMOTA – Integration und Geräte",
        "projects.tasmota.imageAlt": "Tasmota-Geräte",
        "projects.tasmota.adv1": "Vollständige Kontrolle über die Geräte",
        "projects.tasmota.adv2": "Unabhängig von Internetverbindung",
        "projects.tasmota.adv3": "Sofortige Kontrolle über TASMOTA, Home Assistant und Alexa",
        "projects.tasmota.adv4": "Belastet das Internetnetzwerk nicht",
        
        "projects.hass2zigbee.title": "🏠 HASS mit zwei Zigbee-Netzwerken",
        "projects.hass2zigbee.imageAlt": "Zwei Zigbee-Netzwerke",
        "projects.hass2zigbee.adv1": "Unterstützt mehr Geräte",
        "projects.hass2zigbee.adv2": "Last-/Funktionstrennung",
        "projects.hass2zigbee.adv3": "Verbesserte Kompatibilitätstests",
        "projects.hass2zigbee.adv4": "Flexible Migration und Experimentierung",
        
        "projects.voice.title": "🎙️ Sprachsteuerung für HASS-Geräte (Alexa / Google Home)",
        "projects.voice.imageAlt": "Sprachsteuerungsintegration",
        "projects.voice.adv1": "Sprachsteuerung von Automatisierungen und Skripten",
        "projects.voice.adv2": "Gerätesteuerung und -überwachung per Sprache",
        "projects.voice.adv3": "Einfaches Hinzufügen und Entfernen von Geräten",
        
        "projects.fingerbot.title": "🖲️ Zigbee Fingerbot-Steuerung via NFC und Home Assistant",
        "projects.fingerbot.imageAlt": "Fingerbot NFC-Tür",
        "projects.fingerbot.adv1": "Kontaktloser Zugang",
        "projects.fingerbot.adv2": "Integration mit Home Assistant",
        "projects.fingerbot.adv3": "Lokale und offline Steuerung",
        "projects.fingerbot.adv4": "Kompatibel mit jedem NFC-Gerät",
        
        "projects.eco.title": "🌿 Eco-Modus für Thermostate in Home Assistant",
        "projects.eco.imageAlt": "Eco-Modus Thermostat",
        "projects.eco.adv1": "Energieeinsparung",
        "projects.eco.adv2": "Komfort ohne Kompromisse",
        "projects.eco.adv3": "Einfache Integration und Anpassung",
        
        "projects.away.title": "🔋 HASS-AWAY-MODE / AWAY MODUS",
        "projects.away.imageAlt": "Away-Modus Banner",
        "projects.away.adv1": "Automatisierte Away-Modus-Verwaltung",
        "projects.away.adv2": "Integration mit Home Assistant",
        "projects.away.adv3": "Flexible Szenarien mit Input-Booleans",
        
        "projects.timer.title": "⏱️ Home Assistant - Flexible Timer-Automatisierung",
        "projects.timer.imageAlt": "Flexibler Timer Banner",
        "projects.timer.adv1": "Intervalleinstellung über UI (Stunden, Minuten, Sekunden)",
        "projects.timer.adv2": "Führt Aktionen nach Ablauf des Intervalls aus",
        "projects.timer.adv3": "Verhindert vorzeitiges Auslösen",
        
        // GENERATORS SECTION (id="generators")
        "generators.title": "Generatoren",
        "generators.description": "Wenn Sie Probleme mit den Generatoren haben, kontaktieren Sie mich bitte über das Kontaktformular mit dem Betreff 'HASS Generatoren'.",
        "generators.contactLink": "📧 Kontaktformular",
        "generators.contactSubject": "HASS Generatoren",
        "generators.ntfy": "Generator für ntfy-Benachrichtigungen",
        "generators.mobile": "Generator für Mobile-App-Benachrichtigungen",
        "generators.shell": "Generator für Command-Shell-Code",
        
        // ABOUT SECTION (id="about")
        "about.title": "Über uns",
        "about.description": "Dieses Repository enthält meine persönlichen Home Assistant Projekte, Automatisierungen, Konfigurationen und Integrationen. Die meisten Projekte unterstützen Englisch und Bulgarisch und werden laufend erweitert.",
        
        // DOCUMENTATION SECTION (id="documents")
        "documentation.title": "Dokumentation",
        "documentation.docsDescription": "Klicken Sie auf ein Dokument, um den vollständigen Inhalt in einem neuen Fenster anzuzeigen.",
        "documentation.loading": "Dokumente werden geladen...",
        "documentation.error": "Fehler beim Laden der Dokumente.",
        "documentation.noDocs": "Keine Dokumente geladen.",
        "documentation.fullDoc": "Vollständige Dokumentation öffnen",
        "documentation.clickToOpen": "📄 Klicken Sie, um das vollständige Dokument zu öffnen",
        
        // DOCUMENT SPECIFIC
        "doc.repositories.title": "Liste der Add-on-Repositorys",
        "doc.repositories.description": "Vollständige Liste nützlicher Add-on-Repositorys für Home Assistant",
        "doc.automations.title": "Arten von Automatisierungen",
        "doc.automations.description": "Überblick über verschiedene Automatisierungsarten und ihre Anwendungen",
        "doc.config-methods.title": "Konfigurationsmethoden",
        "doc.config-methods.description": "Verschiedene Möglichkeiten zur Konfiguration von Home Assistant und Add-ons",
        
        // CONTACT MODAL
        "contact.title": "Kontakt",
        "contact.description": "Senden Sie uns eine Nachricht und wir antworten so schnell wie möglich.",
        "contact.form.name": "Name",
        "contact.form.email": "E-Mail",
        "contact.form.subject": "Betreff",
        "contact.form.message": "Nachricht",
        "contact.form.submit": "Nachricht Senden",
        "contact.form.namePlaceholder": "Geben Sie Ihren Namen ein",
        "contact.form.emailPlaceholder": "Geben Sie Ihre E-Mail-Adresse ein",
        "contact.form.subjectPlaceholder": "Betreff der Nachricht",
        "contact.form.messagePlaceholder": "Schreiben Sie hier Ihre Nachricht...",
        
        // FOOTER SECTION
        "footer.title": "Home Assistant Projekte",
        "footer.description": "Vereinfachung des Alltags, Erhöhung des Komforts und Einsparung von Energie im Smart Home.",
        "footer.links": "Links",
        "footer.connect": "Verbinden",
        "footer.donate": "Spenden",
        "footer.copyright": "© 2023 Home Assistant Projects. Alle Rechte vorbehalten.",
        
        // COMMON/BUTTONS
        "button.viewAll": "Alle Dokumente ansehen",
        "button.exploreProjects": "Projekte Erkunden",
        "button.close": "Schließen"
    }
};

// Auto-fill missing English translations
(function ensureEnTranslations() {
    if (!translations || !translations.en) return;
    const otherLocales = Object.keys(translations).filter(l => l !== 'en');
    const added = [];
    otherLocales.forEach(locale => {
        const src = translations[locale] || {};
        Object.keys(src).forEach(key => {
            if (!(key in translations.en)) {
                translations.en[key] = src[key];
                added.push(key);
            }
        });
    });
    if (added.length) {
        console.warn('Auto-filled missing en translation keys:', added);
    }
})();