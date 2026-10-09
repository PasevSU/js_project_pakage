// Функция за синхронизиране на данните от localStorage към index.html
class DataSync {
    constructor() {
        this.init();
    }

    init() {
        this.syncAllData();
    }

    syncAllData() {
        this.syncAbout();
        this.syncSummary();
        this.syncBadges();
        this.syncDocumentation();
        this.syncGenerators();
        // Проектите ще се синхронизират по различен начин
    }

    syncAbout() {
        const aboutText = localStorage.getItem('ha_about');
        if (aboutText) {
            const aboutElement = document.querySelector('#about p[data-translate="about.description"]');
            if (aboutElement) {
                aboutElement.textContent = aboutText;
            }
        }
    }

    syncSummary() {
        const summaryData = JSON.parse(localStorage.getItem('ha_summary')) || [];
        if (summaryData.length === 6) {
            // Синхронизираме всичките 6 summary елемента
            for (let i = 0; i < 6; i++) {
                const titleElement = document.querySelector(`[data-translate="summary.item${i+1}.title"]`);
                const textElement = document.querySelector(`[data-translate="summary.item${i+1}.text"]`);
                
                if (titleElement && summaryData[i].title) {
                    titleElement.textContent = summaryData[i].title;
                }
                if (textElement && summaryData[i].text) {
                    textElement.textContent = summaryData[i].text;
                }
            }
        }
    }

    syncBadges() {
        const badgesData = JSON.parse(localStorage.getItem('ha_badges')) || { text: '', image: '' };
        if (badgesData.text) {
            const badges = badgesData.text.split(',').map(badge => badge.trim());
            const badgeElements = document.querySelectorAll('.badges .badge');
            
            badgeElements.forEach((element, index) => {
                if (badges[index]) {
                    element.textContent = badges[index];
                }
            });
        }
    }

    syncDocumentation() {
        const docData = JSON.parse(localStorage.getItem('ha_documentation')) || { text: '', links: [] };
        
        // Синхронизиране на текст
        if (docData.text) {
            const docSection = document.querySelector('#documentation');
            if (docSection) {
                const existingText = docSection.querySelector('p');
                if (!existingText) {
                    const newText = document.createElement('p');
                    newText.textContent = docData.text;
                    docSection.insertBefore(newText, docSection.querySelector('.doc-links'));
                } else {
                    existingText.textContent = docData.text;
                }
            }
        }

        // Синхронизиране на линкове
        if (docData.links.length > 0) {
            const docLinksContainer = document.querySelector('#documentation .doc-links');
            if (docLinksContainer) {
                docLinksContainer.innerHTML = docData.links.map(link => 
                    `<a href="${link.url}" class="doc-link" target="_blank">${link.name}</a>`
                ).join('');
            }
        }
    }

    syncGenerators() {
        const genData = JSON.parse(localStorage.getItem('ha_generators')) || { text: '', links: [] };
        
        // Синхронизиране на текст
        if (genData.text) {
            const genTextElement = document.querySelector('#support p[data-translate="support.description"]');
            if (genTextElement) {
                genTextElement.textContent = genData.text;
            }
        }

        // Синхронизиране на линкове
        if (genData.links.length > 0) {
            const genGrid = document.querySelector('#support .gen-grid');
            if (genGrid) {
                genGrid.innerHTML = genData.links.map(link => 
                    `<div class="gen-column">
                        <a class="gen-button" href="${link.url}" target="_blank" rel="noopener">${link.name}</a>
                    </div>`
                ).join('');
            }
        }
    }
}

// Автоматично синхронизиране при зареждане на страницата
document.addEventListener('DOMContentLoaded', function() {
    new DataSync();
});