// YAML code examples
const yamlExamples = {
    directory_structure: `homeassistant/              # 🏠 Основна директория
├── configuration.yaml      # ⚙️  Главен конфигурационен файл
├── secrets.yaml           # 🔐  Пароли и токени (НИКОГА не се споделя!)
├── customize.yaml         # 🎨  Персонализации на entities
├── automations/           # 🤖  Автоматизации по категории
│   ├── lighting/          # 💡  Автоматизации за светлини
│   ├── security/          # 🚨  Автоматизации за сигурност  
│   └── climate/           # 🌡️  Автоматизации за климатик
├── scripts/               # 📜  Потребителски скриптове
├── scenes/                # 🎭  Сцени (групи от настройки)
├── packages/              # 📦  Пакети - групирани функционалности
│   ├── living_room/       # 🛋️  Всичко за хола
│   ├── kitchen/           # 👨‍🍳 Всичко за кухнята
│   └── notifications/     # 📢  Всичко за известия
└── themes/                # 🎨  Потребителски теми
    ├── dark_theme.yaml    # 🌙  Тъмна тема
    └── light_theme.yaml   # ☀️  Светла тема`,

    include_example: `# configuration.yaml
customize: !include customize.yaml
rest_command:
  ntfy_notification: !include yaml/ntfy/notification.yaml`,

    include_dir_named_example: `# configuration.yaml
rest_command: !include_dir_named yaml/rest_command
automation: !include_dir_named automations`,

    include_dir_merge_list_example: `# configuration.yaml
sensor: !include_dir_merge_list sensors
automation: !include_dir_merge_list automations`,

    include_dir_merge_named_example: `# configuration.yaml
frontend:
  themes: !include_dir_merge_named themes`,

    packages_example: `# configuration.yaml
homeassistant:
  packages: !include_dir_named packs`,

    approach1_example: `# automation.yaml
- alias: "Дверта е отворена"
  trigger:
    platform: state
    entity_id: binary_sensor.front_door
    to: "on"
  action:
    service: notify.ntfy
    data:
      message: "🚪 Предната врата е отворена"
      title: "Сигурност"`,

    approach2_example: `# configuration.yaml
rest_command:
  ntfy_notification: !include yaml/ntfy/notification.yaml

# yaml/ntfy/notification.yaml  
url: "https://ntfy.sh/home_alerts"
method: POST
payload: "{{ title }} - {{ message }}"`,

    approach3_example: `# configuration.yaml
rest_command: !include_dir_named yaml/rest_command

# yaml/rest_command/ntfy_security.yaml
security_alert:
  url: "https://ntfy.sh/security"
  method: POST
  headers:
    Priority: "high"
    Tags: "warning"`,

    approach4_example: `# yaml/ntfy/base_template.yaml
url: "{{ server }}{{ topic }}"
method: "{{ method }}"
headers:
  Title: "{{ title }}"
  Priority: "{{ priority | default('default') }}"
payload: "{{ message }}"

# automation.yaml
- alias: "Температура"
  action:
    service: rest_command.ntfy_notification
    data:
      server: "https://ntfy.sh/"
      topic: "home_alerts"
      title: "🌡️ Висока температура!"
      message: "Температурата е 25°C"`,

    approach5_example: `# packs/notifications/package.yaml
rest_command:
  ntfy_alert:
    url: "https://ntfy.sh/alerts"
    method: POST
    headers:
      Priority: "high"

automation:
  - alias: "Сигурност - Дверта"
    trigger:
      - platform: state
        entity_id: binary_sensor.front_door
        to: "on"
    action:
      - service: rest_command.ntfy_alert
        data:
          payload: "🚨 Предната врата е отворена!"`,

    circular_bad_example: `# configuration.yaml
automation: !include automations/main.yaml

# automations/main.yaml  
trigger: !include common/triggers.yaml

# common/triggers.yaml
value_template: !include automations/main.yaml  # ← ГРЕШКА!`,

    circular_good_example: `# configuration.yaml
automation: !include_dir_merge_list automations

# automations/security.yaml
- alias: "Сигурност - Дверта"
  trigger:
    platform: state
    entity_id: binary_sensor.door`,

    security_example: `# secrets.yaml - НИКОГА не комитирай в Git!
ntfy_token: "supersecret123"
api_password: "mypassword123"

# configuration.yaml
rest_command:
  secure_notification:
    headers:
      Authorization: "Bearer !secret ntfy_token"  # ← Безопасно!`,

    development_example: `# configuration.yaml
{% if development %}
rest_command: !include_dir_named yaml/rest_command/development
{% else %}
rest_command: !include_dir_named yaml/rest_command/production  
{% endif %}

# yaml/rest_command/development/ntfy.yaml
ntfy_notification:
  url: "https://ntfy.sh/my_test_topic"  # 🧪 Тестов топик

# yaml/rest_command/production/ntfy.yaml  
ntfy_notification:
  url: "https://ntfy.sh/my_real_topic"  # 🚀 Истински топик`
};

// Comparison table data
const comparisonData = {
    "!include": {
        when: "Малки проекти, единични файлове",
        advantages: "🟢 Прост, лесен за разбиране",
        disadvantages: "🔴 Не мащабируем", 
        example: "customize: !include customize.yaml"
    },
    "!include_dir_named": {
        when: "Големи проекти, много файлове",
        advantages: "🟢 Добра организация, мащабируем",
        disadvantages: "🟡 По-сложен",
        example: "rest_command: !include_dir_named yaml/rest_command"
    },
    "!include_dir_merge_list": {
        when: "Списъци от еднакви обекти", 
        advantages: "🟢 Автоматично сливане на списъци",
        disadvantages: "🔴 Трябва да са един тип",
        example: "sensor: !include_dir_merge_list sensors"
    },
    "!include_dir_merge_named": {
        when: "Именувани колекции",
        advantages: "🟢 Автоматично сливане на именувани обекти",
        disadvantages: "🟡 Специфична употреба", 
        example: "themes: !include_dir_merge_named themes"
    },
    "📦 Пакети": {
        when: "Функционални групировки",
        advantages: "🟢 Всичко на едно място, изолирани функции",
        disadvantages: "🟡 Може да стане прекалено голям",
        example: "packages: !include_dir_named packs"
    },
    "🎨 Шаблони": {
        when: "Повтаряща се конфигурация",
        advantages: "🟢 Избягва повторение на код, централизиране",
        disadvantages: "🔴 По-сложни за дебъгване",
        example: "rest_command: !include yaml/ntfy/template.yaml"
    }
};

// Complete translations for config methods
const configMethodsTranslations = {
    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------
    // English translations
    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------
    en: {
        "page.title": "Home Assistant Configuration Methods - Complete Guide",
        "header.title": "🏠 Configuration Methods",
        "repo.description": "Complete guide to configuration methods in Home Assistant",
        "back.button": "Home Page",

        // Table of Contents
        "toc.title": "📋 Table of Contents",
        "toc.intro": "🎯 Introduction",
        "toc.directories": "📁 Basic Directories", 
        "toc.methods": "🔄 Configuration Methods",
        "toc.examples": "⚡ Practical Examples",
        "toc.problems": "🚨 Common Problems",
        "toc.bestpractices": "🏆 Best Practices",
        "toc.comparison": "📊 Comparison Table",
        "toc.conclusion": "🎯 Conclusion",

        // Introduction
        "intro.title": "🎯 Introduction",
        "intro.text": "Home Assistant offers different ways to organize your configuration. The choice of the right method depends on the size of your project, experience and specific needs.",

        // Directories
        "directories.title": "📁 Basic Directories",
        "directories.text": "Basic directory structure for organized configuration:",

        // Configuration Methods
        "methods.title": "🔄 Configuration Methods",
        
        "method.include.title": "📄 `!include` - Simple Inclusion",
        "method.include.when": "When to use: For single large files",
        
        "method.dir_named.title": "📂 `!include_dir_named` - Directory Inclusion", 
        "method.dir_named.when": "When to use: For multiple files of the same type",
        
        "method.merge_list.title": "📋 `!include_dir_merge_list` - List Merging",
        "method.merge_list.when": "When to use: For lists of identical objects",
        
        "method.merge_named.title": "🏷️ `!include_dir_merge_named` - Named Objects Merging",
        "method.merge_named.when": "When to use: For named collections like themes",
        
        "method.packages.title": "📦 Package Approach", 
        "method.packages.when": "When to use: For functional groupings",

        // Examples
        "examples.title": "⚡ Practical Examples",
        "examples.ntfy.title": "🔔 NTFY Notifications - Different Approaches",
        
        "example.approach1.title": "📋 Approach 1: Directly in Automation (Simplest)",
        "example.approach2.title": "🛠️ Approach 2: REST Command with `!include`",
        "example.approach3.title": "📚 Approach 3: REST Command with `!include_dir_named`",
        "example.approach4.title": "🎨 Approach 4: Template with Variables", 
        "example.approach5.title": "📦 Approach 5: Package Approach",

        // Common Problems
        "problems.title": "🚨 Common Problems",
        
        "problem.circular.title": "❌ Problem 1: Circular Dependencies",
        "problem.circular.bad": "BAD - Infinite loop:",
        "problem.circular.good": "GOOD - Independent files:",
        
        "problem.loading.title": "❌ Problem 2: Loading Errors", 
        "problem.loading.solution": "Solution: Test files individually",
        
        "problem.security.title": "❌ Problem 3: Security",
        "problem.security.solution": "Solution: Use `secrets.yaml`",
        
        "problem.development.title": "❌ Problem 4: Development vs Production",
        "problem.development.solution": "Solution: Separate configurations",

        // Best Practices
        "bestpractices.title": "🏆 Best Practices",
        
        "performance.title": "📊 Performance",
        "performance.small": "10-50 files: 🟢 Ideal for `!include_dir_named`",
        "performance.medium": "100+ files: 🟡 Possible slowdown", 
        "performance.large": "1-5 files: 🔴 Use directly in `configuration.yaml`",
        
        "organization.title": "🗂️ Organization",
        "organization.point1": "Name files descriptively",
        "organization.point2": "Group by functionality", 
        "organization.point3": "Document the structure",
        
        "maintenance.title": "🔧 Maintenance",
        "maintenance.point1": "Make regular backups",
        "maintenance.point2": "Test changes before applying",
        "maintenance.point3": "Use version control (Git)",
        
        "beginners.title": "🎯 Recommendations for Beginners", 
        "beginners.point1": "Start with `!include` for large files",
        "beginners.point2": "Move to `!include_dir_named` when you have many files",
        "beginners.point3": "Use packages for functional groupings", 
        "beginners.point4": "Templates - only for repeating code",

        // Comparison Table
        "comparison.title": "📊 Comparison Table",
        "comparison.method": "Method",
        "comparison.when": "When to use?",
        "comparison.advantages": "✅ Advantages", 
        "comparison.disadvantages": "❌ Disadvantages",
        "comparison.example": "📝 Example",

        // Conclusion
        "conclusion.title": "🎯 Conclusion",
        "conclusion.text": "The choice of configuration method depends on:",
        "conclusion.point1": "📏 Project size - small → simple, large → structured",
        "conclusion.point2": "👤 Your experience - start simple, gradually complicate", 
        "conclusion.point3": "👥 Team work - structured approaches are better for teams",
        "conclusion.point4": "🔄 Change frequency - frequently changed configurations benefit from separation",
        "conclusion.remember": "🏁 Remember: The best configuration is the one you can easily maintain and understand!",

        "tip.title": "💡 Tip:",
        "tip.text": "If you like this project, check out [more of my repositories here](https://github.com/Bacard1?tab=repositories).",
        "tip.contact": "If you need help or have questions, feel free to contact me."
    },

    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------
    // German translations  
    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------
    de: {
        "page.title": "Home Assistant Konfigurationsmethoden - Vollständige Anleitung",
        "header.title": "🏠 Konfigurationsmethoden", 
        "repo.description": "Vollständige Anleitung zu Konfigurationsmethoden в Home Assistant",
        "back.button": "Startseite",

        // Table of Contents
        "toc.title": "📋 Inhaltsverzeichnis",
        "toc.intro": "🎯 Einführung",
        "toc.directories": "📁 Grundlegende Verzeichnisse",
        "toc.methods": "🔄 Konfigurationsmethoden",
        "toc.examples": "⚡ Praktische Beispiele", 
        "toc.problems": "🚨 Häufige Probleme",
        "toc.bestpractices": "🏆 Best Practices",
        "toc.comparison": "📊 Vergleichstabelle",
        "toc.conclusion": "🎯 Fazit",

        // Introduction
        "intro.title": "🎯 Einführung",
        "intro.text": "Home Assistant bietet verschiedene Möglichkeiten, Ihre Konfiguration zu organisieren. Die Wahl der richtigen Methode hängt von der Größe Ihres Projekts, Ihrer Erfahrung und spezifischen Anforderungen ab.",

        // Directories
        "directories.title": "📁 Grundlegende Verzeichnisse",
        "directories.text": "Grundlegende Verzeichnisstruktur für organisierte Konfiguration:",

        // Configuration Methods
        "methods.title": "🔄 Konfigurationsmethoden",
        
        "method.include.title": "📄 `!include` - Einfaches Einbinden",
        "method.include.when": "Wann zu verwenden: Für einzelne große Dateien",
        
        "method.dir_named.title": "📂 `!include_dir_named` - Verzeichniseinbindung",
        "method.dir_named.when": "Wann zu verwenden: Für mehrere Dateien desselben Typs", 
        
        "method.merge_list.title": "📋 `!include_dir_merge_list` - Listen-Zusammenführung",
        "method.merge_list.when": "Wann zu verwenden: Für Listen identischer Objekte",
        
        "method.merge_named.title": "🏷️ `!include_dir_merge_named` - Benannte Objekte Zusammenführung",
        "method.merge_named.when": "Wann zu verwenden: Für benannte Sammlungen wie Themen",
        
        "method.packages.title": "📦 Paket-Ansatz",
        "method.packages.when": "Wann zu verwenden: Für funktionale Gruppierungen",

        // Examples
        "examples.title": "⚡ Praktische Beispiele", 
        "examples.ntfy.title": "🔔 NTFY Benachrichtigungen - Verschiedene Ansätze",
        
        "example.approach1.title": "📋 Ansatz 1: Direkt in der Automatisierung (Einfachster)",
        "example.approach2.title": "🛠️ Ansatz 2: REST-Befehl mit `!include`",
        "example.approach3.title": "📚 Ansatz 3: REST-Befehl mit `!include_dir_named`", 
        "example.approach4.title": "🎨 Ansatz 4: Vorlage mit Variablen",
        "example.approach5.title": "📦 Ansatz 5: Paket-Ansatz",

        // Common Problems
        "problems.title": "🚨 Häufige Probleme",
        
        "problem.circular.title": "❌ Problem 1: Zirkuläre Abhängigkeiten",
        "problem.circular.bad": "SCHLECHT - Endlosschleife:",
        "problem.circular.good": "GUT - Unabhängige Dateien:",
        
        "problem.loading.title": "❌ Problem 2: Ladefehler",
        "problem.loading.solution": "Lösung: Teste Dateien einzeln", 
        
        "problem.security.title": "❌ Problem 3: Sicherheit",
        "problem.security.solution": "Lösung: Verwende `secrets.yaml`",
        
        "problem.development.title": "❌ Problem 4: Entwicklung vs Produktion",
        "problem.development.solution": "Lösung: Separate Konfigurationen",

        // Best Practices
        "bestpractices.title": "🏆 Best Practices",
        
        "performance.title": "📊 Leistung", 
        "performance.small": "10-50 Dateien: 🟢 Ideal für `!include_dir_named`",
        "performance.medium": "100+ Dateien: 🟡 Mögliche Verlangsamung",
        "performance.large": "1-5 Dateien: 🔴 Direkt in `configuration.yaml` verwenden",
        
        "organization.title": "🗂️ Organisation",
        "organization.point1": "Benenne Dateien beschreibend",
        "organization.point2": "Gruppiere nach Funktionalität", 
        "organization.point3": "Dokumentiere die Struktur",
        
        "maintenance.title": "🔧 Wartung",
        "maintenance.point1": "Mache regelmäßige Backups",
        "maintenance.point2": "Teste Änderungen vor dem Anwenden",
        "maintenance.point3": "Verwende Versionskontrolle (Git)",
        
        "beginners.title": "🎯 Empfehlungen für Anfänger",
        "beginners.point1": "Beginne mit `!include` für große Dateien", 
        "beginners.point2": "Wechsle zu `!include_dir_named` wenn du viele Dateien hast",
        "beginners.point3": "Verwende Pakete für funktionale Gruppierungen",
        "beginners.point4": "Vorlagen - nur für sich wiederholenden Code",

        // Comparison Table
        "comparison.title": "📊 Vergleichstabelle", 
        "comparison.method": "Methode",
        "comparison.when": "Wann zu verwenden?",
        "comparison.advantages": "✅ Vorteile",
        "comparison.disadvantages": "❌ Nachteile", 
        "comparison.example": "📝 Beispiel",

        // Conclusion
        "conclusion.title": "🎯 Fazit",
        "conclusion.text": "Die Wahl der Konfigurationsmethode hängt ab von:",
        "conclusion.point1": "📏 Projektgröße - klein → einfach, groß → strukturiert",
        "conclusion.point2": "👤 Ihrer Erfahrung - starte einfach, kompliziere schrittweise", 
        "conclusion.point3": "👥 Teamarbeit - strukturierte Ansätze sind besser für Teams",
        "conclusion.point4": "🔄 Änderungshäufigkeit - häufig geänderte Konfigurationen profitieren von Trennung",
        "conclusion.remember": "🏁 Merke: Die beste Konfiguration ist die, die du leicht warten und verstehen kannst!",

        "tip.title": "💡 Tipp:",
        "tip.text": "Wenn Ihnen dieses Projekt gefällt, sehen Sie sich [hier meine weiteren Repositories an](https://github.com/Bacard1?tab=repositories).",
        "tip.contact": "Wenn Sie Hilfe benötigen oder Fragen haben, kontaktieren Sie mich gerne."
    },

    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------
    // Bulgarian translations (default)
    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------
    bg: {
        "page.title": "Home Assistant Конфигурационни Методи - Пълно Ръководство",
        "header.title": "🏠 Конфигурационни Методи",
        "repo.description": "Пълно ръководство за методите на конфигуриране в Home Assistant",
        "back.button": "Начална страница",

        // Table of Contents
        "toc.title": "📋 Съдържание",
        "toc.intro": "🎯 Въведение",
        "toc.directories": "📁 Основни директории",
        "toc.methods": "🔄 Методи на конфигуриране", 
        "toc.examples": "⚡ Практически примери",
        "toc.problems": "🚨 Често срещани проблеми",
        "toc.bestpractices": "🏆 Най-добри практики",
        "toc.comparison": "📊 Сравнителна таблица",
        "toc.conclusion": "🎯 Заключение",

        // Introduction
        "intro.title": "🎯 Въведение", 
        "intro.text": "Home Assistant предлага различни начини за организиране на конфигурацията. Изборът на правилния метод зависи от размера на вашия проект, опита и специфичните нужди.",

        // Directories
        "directories.title": "📁 Основни директории",
        "directories.text": "Основна директорна структура за организирана конфигурация:",

        // Configuration Methods
        "methods.title": "🔄 Методи на конфигуриране",
        
        "method.include.title": "📄 `!include` - Просто включване",
        "method.include.when": "Кога се ползва: За единични големи файлове",
        
        "method.dir_named.title": "📂 `!include_dir_named` - Включване на директория", 
        "method.dir_named.when": "Кога се ползва: За множество файлове от един тип",
        
        "method.merge_list.title": "📋 `!include_dir_merge_list` - Сливане на списъци",
        "method.merge_list.when": "Кога се ползва: За списъци от еднакви обекти",
        
        "method.merge_named.title": "🏷️ `!include_dir_merge_named` - Сливане на именувани обекти",
        "method.merge_named.when": "Кога се ползва: За именувани колекции като теми",
        
        "method.packages.title": "📦 Пакетен подход",
        "method.packages.when": "Кога се ползва: За функционални групировки",

        // Examples
        "examples.title": "⚡ Практически примери",
        "examples.ntfy.title": "🔔 NTFY Известия - Различни подходи",
        
        "example.approach1.title": "📋 Подход 1: Директно в автоматизация (Най-прост)",
        "example.approach2.title": "🛠️ Подход 2: REST Command с `!include`", 
        "example.approach3.title": "📚 Подход 3: REST Command с `!include_dir_named`",
        "example.approach4.title": "🎨 Подход 4: Шаблон с променливи",
        "example.approach5.title": "📦 Подход 5: Пакетен подход",

        // Common Problems
        "problems.title": "🚨 Често срещани проблеми",
        
        "problem.circular.title": "❌ Проблем 1: Циркулярни зависимости",
        "problem.circular.bad": "🚫 ЛОШО - Безкраен цикъл:",
        "problem.circular.good": "✅ ДОБРЕ - Независими файлове:",
        
        "problem.loading.title": "❌ Проблем 2: Грешки при зареждане",
        "problem.loading.solution": "🔧 Решение: Тествай файлове индивидуално", 
        
        "problem.security.title": "❌ Проблем 3: Сигурност",
        "problem.security.solution": "🔐 Решение: Използвай `secrets.yaml`",
        
        "problem.development.title": "❌ Проблем 4: Разработка vs Производство",
        "problem.development.solution": "🎭 Решение: Разделни конфигурации",

        // Best Practices
        "bestpractices.title": "🏆 Най-добри практики",
        
        "performance.title": "📊 Производителност",
        "performance.small": "10-50 файла: 🟢 Идеално за `!include_dir_named`",
        "performance.medium": "100+ файла: 🟡 Възможно забавяне", 
        "performance.large": "1-5 файла: 🔴 Използвай директно в `configuration.yaml`",
        
        "organization.title": "🗂️ Организация",
        "organization.point1": "Именувай файловете описателно",
        "organization.point2": "Групирай по функционалност",
        "organization.point3": "Документирай структурата", 
        
        "maintenance.title": "🔧 Поддръжка",
        "maintenance.point1": "Правей регулярни бекъпи",
        "maintenance.point2": "Тествай промените преди да ги приложиш",
        "maintenance.point3": "Използвай version control (Git)",
        
        "beginners.title": "🎯 Препоръки за начинаещи",
        "beginners.point1": "Започни с `!include` за големи файлове", 
        "beginners.point2": "Премини на `!include_dir_named` когато имаш много файлове",
        "beginners.point3": "Използвай пакети за функционални групировки",
        "beginners.point4": "Шаблони - само за повтарящ се код",

        // Comparison Table
        "comparison.title": "📊 Сравнителна таблица",
        "comparison.method": "Метод", 
        "comparison.when": "🎯 Кога се ползва?",
        "comparison.advantages": "✅ Предимства",
        "comparison.disadvantages": "❌ Недостатки",
        "comparison.example": "📝 Пример",

        // Conclusion
        "conclusion.title": "🎯 Заключение",
        "conclusion.text": "Изборът на конфигурационен метод зависи от:",
        "conclusion.point1": "📏 Размер на проекта - малки → прости, големи → структурирани",
        "conclusion.point2": "👤 Вашият опит - започни просто, усложнявай постепенно", 
        "conclusion.point3": "👥 Екипна работа - структурирани подходи са по-добри за екипи",
        "conclusion.point4": "🔄 Честота на промени - често променяни конфигурации се възползват от разделяне",
        "conclusion.remember": "🏁 Запомни: Най-добрата конфигурация е тази, която можеш лесно да поддържаш и разбираш!",

        "tip.title": "💡 Съвет:",
        "tip.text": "Ако ви харесва този проект, вижте [още от моите репозитории тук](https://github.com/Bacard1?tab=repositories).",
        "tip.contact": "Ако имате нужда от помощ или въпроси, не се колебайте да се свържете с мен."
    }
};

// Функция за инициализиране на темата
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        const themeIcon = themeToggle.querySelector('.theme-icon');
        if (savedTheme === 'dark') {
            themeIcon.textContent = '☀️';
        } else {
            themeIcon.textContent = '🌙';
        }
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
}

// Функция за създаване на съдържание за конфигурационни методи
function renderConfigMethodsContent(lang) {
    const container = document.querySelector('.config-methods-container');
    if (!container) return;

    const translations = configMethodsTranslations[lang] || configMethodsTranslations['bg'];

    let html = `
        <!-- Table of Contents -->
        <div class="content-section">
            <h2>${translations['toc.title']}</h2>
            <div class="toc-container">
                <ul class="toc-list">
                    <li><a href="#introduction">${translations['toc.intro']}</a></li>
                    <li><a href="#directories">${translations['toc.directories']}</a></li>
                    <li><a href="#methods">${translations['toc.methods']}</a></li>
                    <li><a href="#examples">${translations['toc.examples']}</a></li>
                    <li><a href="#problems">${translations['toc.problems']}</a></li>
                    <li><a href="#bestpractices">${translations['toc.bestpractices']}</a></li>
                    <li><a href="#comparison">${translations['toc.comparison']}</a></li>
                    <li><a href="#conclusion">${translations['toc.conclusion']}</a></li>
                </ul>
            </div>
        </div>

        <!-- Introduction -->
        <div class="mode-section" id="introduction">
            <h2>${translations['intro.title']}</h2>
            <p>${translations['intro.text']}</p>
        </div>

        <!-- Directories -->
        <div class="mode-section" id="directories">
            <h2>${translations['directories.title']}</h2>
            <p>${translations['directories.text']}</p>
            <pre><code class="language-yaml">${yamlExamples.directory_structure}</code></pre>
        </div>

        <!-- Configuration Methods -->
        <div class="mode-section" id="methods">
            <h2>${translations['methods.title']}</h2>
            
            <div class="method-item">
                <h3>${translations['method.include.title']}</h3>
                <p><strong>${translations['method.include.when']}</strong></p>
                <pre><code class="language-yaml">${yamlExamples.include_example}</code></pre>
            </div>

            <div class="method-item">
                <h3>${translations['method.dir_named.title']}</h3>
                <p><strong>${translations['method.dir_named.when']}</strong></p>
                <pre><code class="language-yaml">${yamlExamples.include_dir_named_example}</code></pre>
            </div>

            <div class="method-item">
                <h3>${translations['method.merge_list.title']}</h3>
                <p><strong>${translations['method.merge_list.when']}</strong></p>
                <pre><code class="language-yaml">${yamlExamples.include_dir_merge_list_example}</code></pre>
            </div>

            <div class="method-item">
                <h3>${translations['method.merge_named.title']}</h3>
                <p><strong>${translations['method.merge_named.when']}</strong></p>
                <pre><code class="language-yaml">${yamlExamples.include_dir_merge_named_example}</code></pre>
            </div>

            <div class="method-item">
                <h3>${translations['method.packages.title']}</h3>
                <p><strong>${translations['method.packages.when']}</strong></p>
                <pre><code class="language-yaml">${yamlExamples.packages_example}</code></pre>
            </div>
        </div>

        <!-- Practical Examples -->
        <div class="mode-section" id="examples">
            <h2>${translations['examples.title']}</h2>
            <h3>${translations['examples.ntfy.title']}</h3>
            
            <div class="method-item">
                <h4>${translations['example.approach1.title']}</h4>
                <pre><code class="language-yaml">${yamlExamples.approach1_example}</code></pre>
            </div>

            <div class="method-item">
                <h4>${translations['example.approach2.title']}</h4>
                <pre><code class="language-yaml">${yamlExamples.approach2_example}</code></pre>
            </div>

            <div class="method-item">
                <h4>${translations['example.approach3.title']}</h4>
                <pre><code class="language-yaml">${yamlExamples.approach3_example}</code></pre>
            </div>

            <div class="method-item">
                <h4>${translations['example.approach4.title']}</h4>
                <pre><code class="language-yaml">${yamlExamples.approach4_example}</code></pre>
            </div>

            <div class="method-item">
                <h4>${translations['example.approach5.title']}</h4>
                <pre><code class="language-yaml">${yamlExamples.approach5_example}</code></pre>
            </div>
        </div>

        <!-- Common Problems -->
        <div class="mode-section" id="problems">
            <h2>${translations['problems.title']}</h2>
            
            <div class="method-item">
                <h3>${translations['problem.circular.title']}</h3>
                <p><strong>${translations['problem.circular.bad']}</strong></p>
                <pre><code class="language-yaml">${yamlExamples.circular_bad_example}</code></pre>
                <p><strong>${translations['problem.circular.good']}</strong></p>
                <pre><code class="language-yaml">${yamlExamples.circular_good_example}</code></pre>
            </div>

            <div class="method-item">
                <h3>${translations['problem.loading.title']}</h3>
                <p><strong>${translations['problem.loading.solution']}</strong></p>
                <pre><code class="language-bash"># Провери цялата конфигурация
hass --script check_config

# Провери конкретна папка  
hass --script check_config --files config/automations/</code></pre>
            </div>

            <div class="method-item">
                <h3>${translations['problem.security.title']}</h3>
                <p><strong>${translations['problem.security.solution']}</strong></p>
                <pre><code class="language-yaml">${yamlExamples.security_example}</code></pre>
            </div>

            <div class="method-item">
                <h3>${translations['problem.development.title']}</h3>
                <p><strong>${translations['problem.development.solution']}</strong></p>
                <pre><code class="language-yaml">${yamlExamples.development_example}</code></pre>
            </div>
        </div>

        <!-- Best Practices -->
        <div class="mode-section" id="bestpractices">
            <h2>${translations['bestpractices.title']}</h2>
            
            <div class="method-item">
                <h3>${translations['performance.title']}</h3>
                <ul>
                    <li>${translations['performance.small']}</li>
                    <li>${translations['performance.medium']}</li>
                    <li>${translations['performance.large']}</li>
                </ul>
            </div>

            <div class="method-item">
                <h3>${translations['organization.title']}</h3>
                <ul>
                    <li>${translations['organization.point1']}</li>
                    <li>${translations['organization.point2']}</li>
                    <li>${translations['organization.point3']}</li>
                </ul>
            </div>

            <div class="method-item">
                <h3>${translations['maintenance.title']}</h3>
                <ul>
                    <li>${translations['maintenance.point1']}</li>
                    <li>${translations['maintenance.point2']}</li>
                    <li>${translations['maintenance.point3']}</li>
                </ul>
            </div>

            <div class="method-item">
                <h3>${translations['beginners.title']}</h3>
                <ul>
                    <li>${translations['beginners.point1']}</li>
                    <li>${translations['beginners.point2']}</li>
                    <li>${translations['beginners.point3']}</li>
                    <li>${translations['beginners.point4']}</li>
                </ul>
            </div>
        </div>

        <!-- Comparison Table -->
        <div class="mode-section" id="comparison">
            <h2>${translations['comparison.title']}</h2>
            
            <div class="table-container">
                <table class="automations-table">
                    <thead>
                        <tr>
                            <th>${translations['comparison.method']}</th>
                            <th>${translations['comparison.when']}</th>
                            <th>${translations['comparison.advantages']}</th>
                            <th>${translations['comparison.disadvantages']}</th>
                            <th>${translations['comparison.example']}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(comparisonData).map(([method, data]) => `
                            <tr>
                                <td><code>${method}</code></td>
                                <td>${data.when}</td>
                                <td>${data.advantages}</td>
                                <td>${data.disadvantages}</td>
                                <td><code>${data.example}</code></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Conclusion -->
        <div class="mode-section" id="conclusion">
            <h2>${translations['conclusion.title']}</h2>
            <p>${translations['conclusion.text']}</p>
            <ul>
                <li>${translations['conclusion.point1']}</li>
                <li>${translations['conclusion.point2']}</li>
                <li>${translations['conclusion.point3']}</li>
                <li>${translations['conclusion.point4']}</li>
            </ul>
            <p><strong>${translations['conclusion.remember']}</strong></p>
        </div>
    `;

    container.innerHTML = html;
}

// Функция за обновяване на tip секцията
function updateConfigMethodsTipSection(lang) {
    const tipBox = document.querySelector('.tip-box');
    if (!tipBox) return;

    const translations = configMethodsTranslations[lang] || configMethodsTranslations['bg'];
    
    tipBox.innerHTML = `
        <strong>${translations['tip.title']}</strong>
        <p>${parseMarkdownLinks(translations['tip.text'])}</p>
        <p>${translations['tip.contact']}</p>
    `;
}

// Помощна функция за парсване на markdown линкове
function parseMarkdownLinks(text) {
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

// Инициализация при зареждане на DOM
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    
    // Ако имаме LanguageManager, използваме него
    if (window.languageManager) {
        // Зареждаме съдържанието с текущия език
        const currentLang = window.languageManager.currentLang;
        renderConfigMethodsContent(currentLang);
        updateConfigMethodsTipSection(currentLang);
        
        // Добавяме слушател за смяна на езика
        document.addEventListener('languageChanged', function() {
            if (window.languageManager) {
                const lang = window.languageManager.currentLang;
                renderConfigMethodsContent(lang);
                updateConfigMethodsTipSection(lang);
            }
        });
    } else {
        // Ако няма LanguageManager, използваме български по подразбиране
        renderConfigMethodsContent('bg');
        updateConfigMethodsTipSection('bg');
    }
});

// Експорт на функции за глобална употреба
window.renderConfigMethodsContent = renderConfigMethodsContent;
window.updateConfigMethodsTipSection = updateConfigMethodsTipSection;
window.configMethodsTranslations = configMethodsTranslations;
