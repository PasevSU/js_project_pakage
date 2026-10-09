// ===================================================================================
// ФАЙЛ ЗА УПРАВЛЕНИЕ НА КОНТАКТНАТА ФОРМА
// ===================================================================================
/**
 * CONTACT FORM THAT SENDS DIRECTLY TO NTFY.SH
 * Този файл управлява контактната форма и изпращането на съобщения чрез ntfy.sh
 * Основни функционалности:
 * 1. Управление на модалния прозорец за контактна форма
 * 2. Валидация на формата
 * 3. Изпращане на съобщения директно към ntfy.sh
 * 4. Rate limiting за предотвратяване на спам
 * 5. Fallback механизъм с curl команда при грешка
 * ===================================================================================
 * 000.09.0 ИНИЦИАЛИЗАЦИЯ НА КОНТАКТНАТА ФОРМА
 * ===================================================================================
 */

document.addEventListener('DOMContentLoaded', function() {
    // 000.09.1 ДЕКЛАРАЦИИ НА ПРОМЕНЛИВИ
    const modal = document.getElementById('contact-modal');
    const closeBtn = document.querySelector('.close');
    const contactTriggers = document.querySelectorAll('.contact-trigger');
    const contactForm = document.getElementById('contact-form');
    const formMessage = document.getElementById('form-message');
    
    // 000.09.2 RATE LIMITING НАСТРОЙКИ
    let lastSubmission = 0;
    const MIN_SUBMISSION_INTERVAL = 5000; // 5 секунди между изпращанията
    
    // ===================================================================================
    // 000.09.3 ОТВАРЯНЕ НА МОДАЛНИЯ ПРОЗОРЕЦ
    // ===================================================================================
    contactTriggers.forEach(function(trigger) {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            if (modal) modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    });
    
    // ===================================================================================
    // 000.09.4 ЗАТВАРЯНЕ НА МОДАЛНИЯ ПРОЗОРЕЦ
    // ===================================================================================
    
    // 000.09.4.1 Затваряне при клик на X бутона
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (modal) modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            if (formMessage) {
                formMessage.style.display = 'none';
                formMessage.innerHTML = '';
            }
        });
    }
    
    // 000.09.4.2 Затваряне при клик извън модала
    window.addEventListener('click', function(e) {
        if (modal && e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            if (formMessage) {
                formMessage.style.display = 'none';
                formMessage.innerHTML = '';
            }
        }
    });
    
    // 000.09.4.3 Затваряне с ESC клавиш
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.style.display === 'block') {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            if (formMessage) {
                formMessage.style.display = 'none';
                formMessage.innerHTML = '';
            }
        }
    });
    
    // ===================================================================================
    // 000.09.5 ОБРАБОТКА НА ИЗПРАЩАНЕТО НА ФОРМАТА - DIRECT SEND TO NTFY.SH
    // ===================================================================================
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // 000.09.5.1 Rate limiting проверка
            const now = Date.now();
            if (now - lastSubmission < MIN_SUBMISSION_INTERVAL) {
                showMessage('Моля, изчакайте преди да изпратите отново.', 'error');
                return;
            }
            
            // 000.09.5.2 Вземане на стойности от формата
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();
            
            // 000.09.5.3 Валидация на формата
            if (!name || !email || !subject || !message) {
                showMessage('Моля, попълнете всички полета.', 'error');
                return;
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showMessage('Моля, въведете валиден имейл адрес.', 'error');
                return;
            }
            
            // 000.09.5.4 Показване на състояние на зареждане
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            if (!submitBtn) return;
            
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Изпращане...';
            submitBtn.disabled = true;
            
            showMessage('Изпращане на съобщението...', 'loading');
            
            try {
                // 000.09.5.5 Кодиране на non-ASCII символи в headers
                const encodeHeader = (str) => {
                    // Кодиране до base64 за headers с non-ASCII символи
                    if (/[^\x00-\x7F]/.test(str)) {
                        return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(str)))}?=`;
                    }
                    return str;
                };
                
                // 000.09.5.6 Подготовка на headers с кодирани non-ASCII символи
                const safeTitle = encodeHeader(`Ново съобщение от: ${name}`);
                const safeBody = `Имейл: ${email}\nТема: ${subject}\n\nСъобщение:\n${message}`;
                
                // 000.09.5.7 Direct send to ntfy.sh
                const response = await fetch('https://ntfy.sh/pasevsu_messages', {
                    method: 'POST',
                    mode: 'cors',
                    body: safeBody,
                    headers: {
                        'Title': safeTitle,
                        'Priority': 'default',
                        'Tags': 'email,contact',
                        'Click': `mailto:${email}`,
                        'Content-Type': 'text/plain; charset=utf-8'
                    }
                });
                
                if (response.ok) {
                    showMessage('✅ Съобщението е изпратено успешно!', 'success');
                    lastSubmission = Date.now();
                    
                    // 000.09.5.8 Изчистване на формата
                    contactForm.reset();
                    
                    // 000.09.5.9 Затваряне на модала след 2 секунди
                    setTimeout(() => {
                        if (modal) {
                            modal.style.display = 'none';
                            document.body.style.overflow = 'auto';
                        }
                        if (formMessage) {
                            formMessage.style.display = 'none';
                            formMessage.innerHTML = '';
                        }
                    }, 2000);
                } else {
                    throw new Error(`HTTP грешка! Статус: ${response.status}`);
                }
                
            } catch (error) {
                console.error('Грешка при изпращане:', error);
                lastSubmission = Date.now();
                
                // 000.09.5.10 Fallback: показване на curl командата
                showMessage('⚠️ Директното изпращане не успя. Копирайте командата за ръчно изпълнение:', 'error');
                
                // 000.09.5.11 Създаване на body за curl команда (escape newlines for bash)
                const escapedMessage = message.replace(/"/g, '\\"');
                const escapedName = name.replace(/"/g, '\\"');
                const body = `Име: ${escapedName}\\nИмейл: ${email}\\nТема: ${subject}\\n\\nСъобщение:\\n${escapedMessage}`;
                
                // 000.09.5.12 Създаване на curl командата
                const curlCommand = `curl -d "${body}" -H "Title: Съобщение от: ${escapedName}" -H "Priority: default" -H "Tags: test,email" -H "Click: mailto:${email}" https://ntfy.sh/pasevsu_messages`;
                
                console.log('CURL команда за ръчно изпълнение:');
                console.log(curlCommand);
                
                // 000.09.5.13 Показване на curl командата на потребителя
                showCurlCommand(curlCommand);
                
            } finally {
                // 000.09.5.14 Нулиране на състоянието на бутона
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }        
    
    // ===================================================================================
    // 000.09.6 ПОМОЩНА ФУНКЦИЯ ЗА ПОКАЗВАНЕ НА CURL КОМАНДАТА
    // ===================================================================================
    function showCurlCommand(curlCommand) {
        if (!formMessage) return;
        
        // 000.09.6.1 Създаване на контейнер за командата
        const commandContainer = document.createElement('div');
        commandContainer.style.marginTop = '15px';
        commandContainer.style.textAlign = 'left';
        
        // 000.09.6.2 Създаване на pre елемент за командата
        const commandPre = document.createElement('pre');
        commandPre.style.backgroundColor = '#2d2d2d';
        commandPre.style.color = '#f8f8f2';
        commandPre.style.padding = '15px';
        commandPre.style.borderRadius = '5px';
        commandPre.style.overflowX = 'auto';
        commandPre.style.fontFamily = 'monospace';
        commandPre.style.fontSize = '14px';
        commandPre.style.whiteSpace = 'pre-wrap';
        commandPre.style.wordBreak = 'break-all';
        commandPre.textContent = curlCommand;
        
        // 000.09.6.3 Създаване на бутон за копиране
        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋 Копирай командата';
        copyBtn.style.marginTop = '10px';
        copyBtn.style.padding = '10px 20px';
        copyBtn.style.backgroundColor = '#3498db';
        copyBtn.style.color = 'white';
        copyBtn.style.border = 'none';
        copyBtn.style.borderRadius = '5px';
        copyBtn.style.cursor = 'pointer';
        copyBtn.style.fontWeight = 'bold';
        copyBtn.style.width = '100%';
        
        // 000.09.6.4 Слушател за копиране на командата
        copyBtn.addEventListener('click', function() {
            navigator.clipboard.writeText(curlCommand)
                .then(function() {
                    const originalBtnText = copyBtn.textContent;
                    copyBtn.textContent = '✅ Командата е копирана!';
                    copyBtn.style.backgroundColor = '#27ae60';
                    
                    setTimeout(function() {
                        copyBtn.textContent = originalBtnText;
                        copyBtn.style.backgroundColor = '#3498db';
                    }, 2000);
                })
                .catch(function(err) {
                    console.error('Грешка при копиране:', err);
                    // 000.09.6.5 Fallback за стари браузъри
                    const textArea = document.createElement('textarea');
                    textArea.value = curlCommand;
                    textArea.style.position = 'fixed';
                    textArea.style.opacity = '0';
                    document.body.appendChild(textArea);
                    textArea.select();
                    
                    try {
                        const successful = document.execCommand('copy');
                        if (successful) {
                            copyBtn.textContent = '✅ Командата е копирана!';
                            copyBtn.style.backgroundColor = '#27ae60';
                            setTimeout(function() {
                                copyBtn.textContent = '📋 Копирай командата';
                                copyBtn.style.backgroundColor = '#3498db';
                            }, 2000);
                        }
                    } catch (err) {
                        console.error('Fallback копиране не успя:', err);
                    }
                    
                    document.body.removeChild(textArea);
                });
        });
        
        // 000.09.6.6 Създаване на инструкции
        const instructions = document.createElement('div');
        instructions.style.marginTop = '15px';
        instructions.style.padding = '10px';
        instructions.style.backgroundColor = '#fff3cd';
        instructions.style.border = '1px solid #ffeaa7';
        instructions.style.borderRadius = '5px';
        instructions.style.color = '#856404';
        instructions.style.fontSize = '14px';
        
        instructions.innerHTML = `
            <strong>Инструкции:</strong>
            <ol style="margin: 5px 0 0 0; padding-left: 20px;">
                <li>Копирайте командата отгоре</li>
                <li>Отворете терминал/команден ред</li>
                <li>Поставете и изпълнете командата</li>
                <li>Проверете ntfy канала за съобщението</li>
            </ol>
        `;
        
        // 000.09.6.7 Добавяне на всичко към контейнера за съобщения
        formMessage.appendChild(commandContainer);
        commandContainer.appendChild(commandPre);
        commandContainer.appendChild(copyBtn);
        commandContainer.appendChild(instructions);
    }
    
    // ===================================================================================
    // 000.09.7 ПОМОЩНА ФУНКЦИЯ ЗА ПОКАЗВАНЕ НА СЪОБЩЕНИЯ
    // ===================================================================================
    function showMessage(text, type) {
        if (!formMessage) return;
        
        formMessage.innerHTML = '';
        formMessage.textContent = text;
        formMessage.className = 'form-message ' + type;
        formMessage.style.display = 'block';
        
        try {
            formMessage.scrollIntoView({behavior: 'smooth', block: 'nearest'});
        } catch (e) {
            formMessage.scrollIntoView();
        }
    }
});