// Admin Panel functionality
class AdminPanel {
    constructor() {
        this.currentEditingId = null;
        this.init();
    }

    init() {
        this.initializeSampleData(); // Добавено: инициализира примерни данни
        this.setupNavigation();
        this.loadAllData();
        this.setupEventListeners();
    }

    // Добавен метод: инициализира примерни данни при първо стартиране
    initializeSampleData() {
        // Проверка дали вече има данни
        if (!localStorage.getItem('ha_projects')) {
            const sampleProjects = this.getSampleProjects();
            localStorage.setItem('ha_projects', JSON.stringify(sampleProjects));
        }
        
        if (!localStorage.getItem('ha_documentation')) {
            const sampleDoc = {
                text: "Документация за Home Assistant проекти",
                links: [
                    { name: "Списък с add-on хранилища", url: "static/doku/repositories.html" },
                    { name: "Видове автоматизации", url: "static/doku/automations.html" },
                    { name: "HOME-ASSISTANT-AUTOMATIONS", url: "https://github.com/Bacard1/homeassistant-automations" }
                ]
            };
            localStorage.setItem('ha_documentation', JSON.stringify(sampleDoc));
        }
        
        if (!localStorage.getItem('ha_generators')) {
            const sampleGen = {
                text: "При нередности с генераторите ми пишете на имейл pasevdenislav@gmail.com с тема \"HASS Генератори\"",
                links: [
                    { name: "Генератор за ntfy известия", url: "https://pasevsu.github.io/ntfy_GEN_v1.0e.html" },
                    { name: "Генератор на известия до mobile app", url: "https://pasevsu.github.io/mobile_app_ntfy_GEN_v1.0e.html" },
                    { name: "Генератор на command shell кодове", url: "https://pasevsu.github.io/command_shell_GEN_v1.0e.html" }
                ]
            };
            localStorage.setItem('ha_generators', JSON.stringify(sampleGen));
        }
        
        if (!localStorage.getItem('ha_about')) {
            const sampleAbout = "Това хранилище съдържа моите персонални проекти за Home Assistant, автоматизации, конфигурации и интеграции. Повечето проекти имат поддръжка на английски и български и редовно добавям нови функции и подобрения.";
            localStorage.setItem('ha_about', sampleAbout);
        }
        
        if (!localStorage.getItem('ha_summary')) {
            const sampleSummary = [
                { title: "Респонсив дизайн", text: "Всички елементи и текст автоматично се променят спрямо размера на екрана, като се запазва четивността." },
                { title: "Чисто оформление", text: "Лесно за разбиране за възрастни и деца с минимална навигация." },
                { title: "Оптимизация на ресурси", text: "Намаляване на енергопотреблението в дома чрез автоматизация." },
                { title: "Структурирано управление", text: "Разделяне на дома на зони и групиране на сензори за по-лесни автоматизации." },
                { title: "Сигурност", text: "Използване на налични устройства за защита на дома при отсъствие." },
                { title: "Работа офлайн", text: "Всичко функционира и без интернет връзка." }
            ];
            localStorage.setItem('ha_summary', JSON.stringify(sampleSummary));
        }
        
        if (!localStorage.getItem('ha_badges')) {
            const sampleBadges = {
                text: "🔧 Умен дом, 🧠 Автоматизации, 🌐 IoT интеграции",
                image: ""
            };
            localStorage.setItem('ha_badges', JSON.stringify(sampleBadges));
        }
    }

    // Добавен метод: връща примерни проекти
    getSampleProjects() {
        return [
            {
                id: "създаване.и.интегриране.на.zigbee.мрежа",
                title: "🛜 Създаване и интегриране на Zigbee мрежа",
                image: "static/img/Zigbee_Network.gif",
                imageAlt: "Zigbee мрежа",
                platforms: ["HomeAssistant"],
                advantages: [
                    "Работи без интернет с Zigbee2MQTT",
                    "Не натоварва интернет мрежата",
                    "Лесна инсталация и преместване на устройства",
                    "Zigbee устройствата действат като ретранслатори",
                    "Достъпен Zigbee хардуер",
                    "Възможност за ъпгрейд при натоварване на мрежата"
                ],
                link: "https://github.com/Bacard1/HASS-ZigbeeNetwork.git",
                timestamp: new Date().toISOString()
            },
            {
                id: "списък.за.пазаруване.с.изображения",
                title: "🛒 Списък за пазаруване с изображения",
                image: "static/img/Projekt_shoplist.gif",
                imageAlt: "Списък за пазаруване",
                platforms: ["HomeAssistant", "WEB"],
                advantages: [
                    "Бързо намиране на артикули по категории",
                    "Визуална идентификация чрез изображения",
                    "Членовете на домакинството получават известия за нови артикули",
                    "Автоматично премахва отметнати артикули"
                ],
                link: "https://github.com/Bacard1/HASS-Shoplist",
                timestamp: new Date().toISOString()
            }
        ];
    }

    setupNavigation() {
        document.querySelectorAll('.nav-admin').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                this.showSection(section);
            });
        });
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all nav links
        document.querySelectorAll('.nav-admin').forEach(link => {
            link.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionId).classList.add('active');
        
        // Add active class to clicked nav link
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    }

    loadAllData() {
        this.loadProjects();
        this.loadDocumentation();
        this.loadGenerators();
        this.loadAbout();
        this.loadSummary();
        this.loadBadges();
    }

    loadProjects() {
        const projectsList = document.getElementById('projects-list');
        projectsList.innerHTML = '<p>Зареждане на проекти...</p>';

        // Simulate loading from localStorage or actual data
        setTimeout(() => {
            const projects = JSON.parse(localStorage.getItem('ha_projects')) || [];
            
            if (projects.length === 0) {
                projectsList.innerHTML = '<p>Няма добавени проекти. Добавете първия проект!</p>';
                return;
            }

            projectsList.innerHTML = projects.map(project => `
                <div class="project-item" data-id="${project.id}">
                    <div class="item-header">
                        <h4>${project.title}</h4>
                        <div class="item-actions">
                            <button class="btn btn-primary edit-project">✏️ Редактирай</button>
                            <button class="btn btn-danger delete-project">🗑️ Изтрий</button>
                        </div>
                    </div>
                    <p><strong>Платформи:</strong> ${project.platforms.join(', ')}</p>
                    <p><strong>ID:</strong> ${project.id}</p>
                    <p><strong>Преимущества:</strong> ${project.advantages.slice(0, 2).join(', ')}...</p>
                </div>
            `).join('');

            this.setupProjectButtons();
        }, 500);
    }

    setupProjectButtons() {
        document.querySelectorAll('.edit-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.editProject(e.target.closest('.project-item'));
            });
        });

        document.querySelectorAll('.delete-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.deleteProject(e.target.closest('.project-item'));
            });
        });
    }

    setupEventListeners() {
        // Project title auto-generates ID
        document.getElementById('project-title').addEventListener('input', (e) => {
            const title = e.target.value;
            const id = this.generateProjectId(title);
            document.getElementById('project-id').value = id;
        });

        // Add project button
        document.getElementById('add-project').addEventListener('click', () => {
            this.addProject();
        });

        // Update project button
        document.getElementById('update-project').addEventListener('click', () => {
            this.updateProject();
        });

        // Cancel edit button
        document.getElementById('cancel-edit').addEventListener('click', () => {
            this.cancelEdit();
        });

        // Documentation
        document.getElementById('save-doc-text').addEventListener('click', () => {
            this.saveDocText();
        });

        document.getElementById('add-doc-link-btn').addEventListener('click', () => {
            this.addDocLink();
        });

        // Generators
        document.getElementById('save-gen-text').addEventListener('click', () => {
            this.saveGenText();
        });

        document.getElementById('add-gen-link-btn').addEventListener('click', () => {
            this.addGenLink();
        });

        // About
        document.getElementById('save-about-text').addEventListener('click', () => {
            this.saveAboutText();
        });

        // Badges
        document.getElementById('save-badges').addEventListener('click', () => {
            this.saveBadges();
        });

        // Export button - НОВ ДОБАВЕН КОД
        document.getElementById('export-changes').addEventListener('click', () => {
            this.exportChanges();
        });
    }

    generateProjectId(title) {
        return title.toLowerCase()
            .replace(/\s+/g, '.')
            .replace(/[^a-z0-9а-я.-]/g, '');
    }

    addProject() {
        const title = document.getElementById('project-title').value;
        const id = document.getElementById('project-id').value;
        const image = document.getElementById('project-image').value;
        const imageAlt = document.getElementById('project-image-alt').value;
        const advantages = document.getElementById('project-advantages').value.split('\n').filter(item => item.trim());
        const link = document.getElementById('project-link').value;
        
        // Get platforms
        const platforms = [];
        if (document.getElementById('platform-ha').checked) platforms.push('HomeAssistant');
        if (document.getElementById('platform-web').checked) platforms.push('WEB');
        if (document.getElementById('platform-android').checked) platforms.push('ANDROID');

        if (!title) {
            this.showMessage('Моля, въведете заглавие на проекта', 'error');
            return;
        }

        const project = {
            id,
            title,
            image,
            imageAlt,
            platforms,
            advantages,
            link,
            timestamp: new Date().toISOString()
        };

        // Save to localStorage
        const projects = JSON.parse(localStorage.getItem('ha_projects')) || [];
        projects.unshift(project); // Add to beginning
        localStorage.setItem('ha_projects', JSON.stringify(projects));

        this.showMessage(`Проект "${title}" е добавен успешно!`, 'success');
        this.resetProjectForm();
        this.loadProjects();
    }

    editProject(projectItem) {
        const projectId = projectItem.getAttribute('data-id');
        const projects = JSON.parse(localStorage.getItem('ha_projects')) || [];
        const project = projects.find(p => p.id === projectId);

        if (!project) return;

        // Fill form with project data
        document.getElementById('project-title').value = project.title;
        document.getElementById('project-id').value = project.id;
        document.getElementById('project-image').value = project.image || '';
        document.getElementById('project-image-alt').value = project.imageAlt || '';
        document.getElementById('project-advantages').value = project.advantages.join('\n');
        document.getElementById('project-link').value = project.link || '';

        // Set platforms
        document.getElementById('platform-ha').checked = project.platforms.includes('HomeAssistant');
        document.getElementById('platform-web').checked = project.platforms.includes('WEB');
        document.getElementById('platform-android').checked = project.platforms.includes('ANDROID');

        this.currentEditingId = projectId;

        // Show update buttons, hide add button
        document.getElementById('add-project').style.display = 'none';
        document.getElementById('update-project').style.display = 'inline-block';
        document.getElementById('cancel-edit').style.display = 'inline-block';

        this.showMessage(`Редактиране на проект: ${project.title}`, 'success');
    }

    updateProject() {
        if (!this.currentEditingId) return;

        const projects = JSON.parse(localStorage.getItem('ha_projects')) || [];
        const projectIndex = projects.findIndex(p => p.id === this.currentEditingId);

        if (projectIndex === -1) return;

        // Get updated data
        const title = document.getElementById('project-title').value;
        const image = document.getElementById('project-image').value;
        const imageAlt = document.getElementById('project-image-alt').value;
        const advantages = document.getElementById('project-advantages').value.split('\n').filter(item => item.trim());
        const link = document.getElementById('project-link').value;
        
        const platforms = [];
        if (document.getElementById('platform-ha').checked) platforms.push('HomeAssistant');
        if (document.getElementById('platform-web').checked) platforms.push('WEB');
        if (document.getElementById('platform-android').checked) platforms.push('ANDROID');

        // Update project
        projects[projectIndex] = {
            ...projects[projectIndex],
            title,
            image,
            imageAlt,
            platforms,
            advantages,
            link
        };

        localStorage.setItem('ha_projects', JSON.stringify(projects));
        this.showMessage(`Проект "${title}" е обновен успешно!`, 'success');
        this.cancelEdit();
        this.loadProjects();
    }

    deleteProject(projectItem) {
        const projectId = projectItem.getAttribute('data-id');
        const projects = JSON.parse(localStorage.getItem('ha_projects')) || [];
        const project = projects.find(p => p.id === projectId);

        if (!project) return;

        if (confirm(`Сигурни ли сте, че искате да изтриете "${project.title}"?`)) {
            const updatedProjects = projects.filter(p => p.id !== projectId);
            localStorage.setItem('ha_projects', JSON.stringify(updatedProjects));
            projectItem.remove();
            this.showMessage(`Проект "${project.title}" е изтрит успешно!`, 'success');
        }
    }

    cancelEdit() {
        this.currentEditingId = null;
        this.resetProjectForm();
    }

    resetProjectForm() {
        document.getElementById('project-form').reset();
        document.getElementById('project-id').value = '';
        document.getElementById('add-project').style.display = 'inline-block';
        document.getElementById('update-project').style.display = 'none';
        document.getElementById('cancel-edit').style.display = 'none';
    }

    // Documentation methods
    loadDocumentation() {
        const docData = JSON.parse(localStorage.getItem('ha_documentation')) || { text: '', links: [] };
        document.getElementById('doc-text').value = docData.text || '';
        this.renderDocLinks(docData.links);
    }

    saveDocText() {
        const text = document.getElementById('doc-text').value;
        const docData = JSON.parse(localStorage.getItem('ha_documentation')) || { text: '', links: [] };
        docData.text = text;
        localStorage.setItem('ha_documentation', JSON.stringify(docData));
        this.showMessage('Текстът за документация е запазен успешно!', 'success');
    }

    addDocLink() {
        const name = document.getElementById('doc-link-name').value;
        const url = document.getElementById('doc-link-url').value;

        if (!name || !url) {
            this.showMessage('Моля, попълнете и двете полета', 'error');
            return;
        }

        const docData = JSON.parse(localStorage.getItem('ha_documentation')) || { text: '', links: [] };
        docData.links.push({ name, url });
        localStorage.setItem('ha_documentation', JSON.stringify(docData));

        this.renderDocLinks(docData.links);
        document.getElementById('add-doc-link').reset();
        this.showMessage('Препратката е добавена успешно!', 'success');
    }

    renderDocLinks(links) {
        const docLinksList = document.getElementById('doc-links-list');
        docLinksList.innerHTML = links.map((link, index) => `
            <div class="link-item">
                <div class="item-header">
                    <span>${link.name}</span>
                    <div class="item-actions">
                        <button class="btn btn-danger delete-doc-link" data-index="${index}">🗑️ Изтрий</button>
                    </div>
                </div>
                <p><strong>URL:</strong> ${link.url}</p>
            </div>
        `).join('');

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-doc-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.deleteDocLink(index);
            });
        });
    }

    deleteDocLink(index) {
        const docData = JSON.parse(localStorage.getItem('ha_documentation')) || { text: '', links: [] };
        docData.links.splice(index, 1);
        localStorage.setItem('ha_documentation', JSON.stringify(docData));
        this.renderDocLinks(docData.links);
        this.showMessage('Препратката е изтрита успешно!', 'success');
    }

    // Similar methods for Generators, About, Summary, and Badges sections
    loadGenerators() {
        const genData = JSON.parse(localStorage.getItem('ha_generators')) || { text: '', links: [] };
        document.getElementById('gen-text').value = genData.text || '';
        this.renderGenLinks(genData.links);
    }

    saveGenText() {
        const text = document.getElementById('gen-text').value;
        const genData = JSON.parse(localStorage.getItem('ha_generators')) || { text: '', links: [] };
        genData.text = text;
        localStorage.setItem('ha_generators', JSON.stringify(genData));
        this.showMessage('Текстът за генератори е запазен успешно!', 'success');
    }

    addGenLink() {
        const name = document.getElementById('gen-link-name').value;
        const url = document.getElementById('gen-link-url').value;

        if (!name || !url) {
            this.showMessage('Моля, попълнете и двете полета', 'error');
            return;
        }

        const genData = JSON.parse(localStorage.getItem('ha_generators')) || { text: '', links: [] };
        genData.links.push({ name, url });
        localStorage.setItem('ha_generators', JSON.stringify(genData));

        this.renderGenLinks(genData.links);
        document.getElementById('add-gen-link').reset();
        this.showMessage('Препратката е добавена успешно!', 'success');
    }

    renderGenLinks(links) {
        const genLinksList = document.getElementById('gen-links-list');
        genLinksList.innerHTML = links.map((link, index) => `
            <div class="link-item">
                <div class="item-header">
                    <span>${link.name}</span>
                    <div class="item-actions">
                        <button class="btn btn-danger delete-gen-link" data-index="${index}">🗑️ Изтрий</button>
                    </div>
                </div>
                <p><strong>URL:</strong> ${link.url}</p>
            </div>
        `).join('');

        document.querySelectorAll('.delete-gen-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.deleteGenLink(index);
            });
        });
    }

    deleteGenLink(index) {
        const genData = JSON.parse(localStorage.getItem('ha_generators')) || { text: '', links: [] };
        genData.links.splice(index, 1);
        localStorage.setItem('ha_generators', JSON.stringify(genData));
        this.renderGenLinks(genData.links);
        this.showMessage('Препратката е изтрита успешно!', 'success');
    }

    loadAbout() {
        const aboutText = localStorage.getItem('ha_about') || '';
        document.getElementById('about-text').value = aboutText;
    }

    saveAboutText() {
        const text = document.getElementById('about-text').value;
        localStorage.setItem('ha_about', text);
        this.showMessage('Текстът за "За нас" е запазен успешно!', 'success');
    }

    loadSummary() {
        const summaryData = JSON.parse(localStorage.getItem('ha_summary')) || Array(6).fill().map(() => ({ title: '', text: '' }));
        this.renderSummaryItems(summaryData);
    }

    renderSummaryItems(items) {
        const summaryItems = document.getElementById('summary-items');
        summaryItems.innerHTML = items.map((item, index) => `
            <div class="summary-item-admin">
                <div class="form-group">
                    <label for="summary-title-${index}">Заглавие ${index + 1}</label>
                    <input type="text" id="summary-title-${index}" value="${item.title}" class="form-control">
                </div>
                <div class="form-group">
                    <label for="summary-text-${index}">Текст ${index + 1}</label>
                    <textarea id="summary-text-${index}" rows="3" class="form-control">${item.text}</textarea>
                </div>
                <button type="button" class="btn btn-primary save-summary-item" data-index="${index}">💾 Запази</button>
            </div>
        `).join('');

        document.querySelectorAll('.save-summary-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.saveSummaryItem(index);
            });
        });
    }

    saveSummaryItem(index) {
        const title = document.getElementById(`summary-title-${index}`).value;
        const text = document.getElementById(`summary-text-${index}`).value;

        const summaryData = JSON.parse(localStorage.getItem('ha_summary')) || Array(6).fill().map(() => ({ title: '', text: '' }));
        summaryData[index] = { title, text };
        localStorage.setItem('ha_summary', JSON.stringify(summaryData));

        this.showMessage(`Обобщение ${index + 1} е запазено успешно!`, 'success');
    }

    loadBadges() {
        const badgesData = JSON.parse(localStorage.getItem('ha_badges')) || { text: '', image: '' };
        document.getElementById('badge-text').value = badgesData.text || '';
        document.getElementById('badge-image').value = badgesData.image || '';
    }

    saveBadges() {
        const text = document.getElementById('badge-text').value;
        const image = document.getElementById('badge-image').value;

        const badgesData = { text, image };
        localStorage.setItem('ha_badges', JSON.stringify(badgesData));

        this.showMessage('Бейджовете са запазени успешно!', 'success');
    }

    // НОВ ДОБАВЕН МЕТОД: Експорт на промените
    exportChanges() {
        // Събираме всички данни от localStorage
        const allData = {
            projects: JSON.parse(localStorage.getItem('ha_projects')) || [],
            documentation: JSON.parse(localStorage.getItem('ha_documentation')) || { text: '', links: [] },
            generators: JSON.parse(localStorage.getItem('ha_generators')) || { text: '', links: [] },
            about: localStorage.getItem('ha_about') || '',
            summary: JSON.parse(localStorage.getItem('ha_summary')) || [],
            badges: JSON.parse(localStorage.getItem('ha_badges')) || { text: '', image: '' }
        };

        // Създаваме downloadable файл
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "ha_export_" + new Date().toISOString().split('T')[0] + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        this.showMessage('Данните са експортирани успешно! Файлът е изтеглен.', 'success');
    }

    showMessage(text, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';

        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 3000);
    }
}

// Initialize admin panel when page loads
document.addEventListener('DOMContentLoaded', function() {
    new AdminPanel();
});