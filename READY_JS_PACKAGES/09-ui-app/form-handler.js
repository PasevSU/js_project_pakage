// form-handler.js - Обработка на контактната форма

const FormHandler = {
    init: function() {
        const form = document.getElementById('contact-form');
        if (form) {
            form.addEventListener('submit', this.handleSubmit.bind(this));
            console.log('FormHandler: Контактната форма е инициализирана');
        }
    },
    
    handleSubmit: function(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const messageContainer = document.getElementById('form-message');
        
        // Валидация
        if (!this.validateForm(formData)) {
            this.showMessage('Моля, попълнете всички полета правилно!', 'error', messageContainer);
            return;
        }
        
        // Показване на съобщение за зареждане
        this.showMessage('Изпращане на съобщението...', 'info', messageContainer);
        
        // Симулиране на изпращане (заменете с реална заявка)
        setTimeout(() => {
            this.simulateSubmit(formData, messageContainer);
        }, 1500);
    },
    
    validateForm: function(formData) {
        const name = formData.get('name');
        const email = formData.get('email');
        const subject = formData.get('subject');
        const message = formData.get('message');
        
        // Проверка за празни полета
        if (!name || !email || !subject || !message) {
            return false;
        }
        
        // Проверка на email формат
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return false;
        }
        
        // Проверка за минимална дължина
        if (name.length < 2 || subject.length < 3 || message.length < 10) {
            return false;
        }
        
        return true;
    },
    
    simulateSubmit: function(formData, messageContainer) {
        // Тук бихте направили реална AJAX заявка
        // Пример с fetch:
        /*
        fetch('/api/contact', {
            method: 'POST',
            body: JSON.stringify(Object.fromEntries(formData)),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showMessage('Съобщението е изпратено успешно!', 'success', messageContainer);
                document.getElementById('contact-form').reset();
            } else {
                this.showMessage('Възникна грешка при изпращане!', 'error', messageContainer);
            }
        })
        .catch(error => {
            this.showMessage('Възникна грешка при изпращане!', 'error', messageContainer);
        });
        */
        
        // Симулирано успешно изпращане
        const isSuccess = Math.random() > 0.2; // 80% успешност за демонстрация
        
        if (isSuccess) {
            this.showMessage('Съобщението е изпратено успешно! Ще се свържем с вас скоро.', 'success', messageContainer);
            document.getElementById('contact-form').reset();
            
            // Автоматично затваряне след 3 секунди
            setTimeout(() => {
                closeContactModal();
            }, 3000);
        } else {
            this.showMessage('Възникна грешка при изпращане. Моля, опитайте отново.', 'error', messageContainer);
        }
    },
    
    showMessage: function(text, type, container) {
        if (!container) return;
        
        container.textContent = text;
        container.className = 'form-message ' + type;
        container.style.display = 'block';
        
        // Автоматично скриване на грешки след 5 секунди
        if (type === 'error') {
            setTimeout(() => {
                container.style.display = 'none';
            }, 5000);
        }
    }
};

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    FormHandler.init();
});