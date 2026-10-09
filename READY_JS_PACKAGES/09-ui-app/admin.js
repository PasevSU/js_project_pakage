// Admin functionality for Home Assistant Projects
class AdminPanel {
    constructor() {
        this.isAdmin = false;
        this.adminPassword = "admin123"; // Променете тази парола
        this.init();
    }

    init() {
        // Проверка дали потребителят е админ
        this.checkAdminStatus();
        
        // Добавяне на админ бутон в навигацията
        this.addAdminButton();
        
        // Зареждане на админ функционалности
        this.loadAdminFeatures();
    }

    checkAdminStatus() {
        this.isAdmin = localStorage.getItem('ha_admin') === 'true';
    }

    addAdminButton() {
        // Намиране на навигационното меню
        const navMenu = document.querySelector('.nav-menu');
        if (!navMenu) return;

        // Създаване на админ бутон
        const adminNavItem = document.createElement('li');
        adminNavItem.className = 'nav-item';
        adminNavItem.innerHTML = `
            <a href="#" class="nav-link admin-login-btn" data-translate="nav.admin">
                🔐 Админ
            </a>
        `;

        // Добавяне в навигацията
        navMenu.appendChild(adminNavItem);

        // Добавяне на event listener
        document.querySelector('.admin-login-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showAdminLogin();
        });
    }

    showAdminLogin() {
        if (this.isAdmin) {
            this.openAdminPanel();
            return;
        }

        const password = prompt('Въведете парола за админ достъп:');
        if (password === this.adminPassword) {
            this.isAdmin = true;
            localStorage.setItem('ha_admin', 'true');
            this.openAdminPanel();
        } else {
            alert('Грешна парола!');
        }
    }

    openAdminPanel() {
        // Отваряне на админ панела в нов прозорец
        window.open('index_admin.html', 'adminPanel', 'width=1200,height=800,scrollbars=yes');
    }

    loadAdminFeatures() {
        // Тук можете да добавите допълнителни функционалности
        // които се появяват само когато потребителят е админ
    }
}

// Инициализиране на админ панела при зареждане на страницата
document.addEventListener('DOMContentLoaded', function() {
    new AdminPanel();
});