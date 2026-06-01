const API_URL = "http://localhost:8080";
const magicSelect = document.getElementById('reg-role');
const selected = magicSelect.querySelector('.magic-select__selected');
const options = magicSelect.querySelectorAll('.magic-select__option');
const hiddenInput = document.getElementById('reg-role-value');

selected.addEventListener('click', () => {
    magicSelect.classList.toggle('open');
});

options.forEach(option => {
    option.addEventListener('click', () => {
        const value = option.dataset.value;
        const text = option.textContent;

        selected.textContent = text;
        hiddenInput.value = value;

        magicSelect.classList.remove('open');
    });
});

document.addEventListener('click', (e) => {
    if (!magicSelect.contains(e.target)) {
        magicSelect.classList.remove('open');
    }
});

        // Если уже залогинен — сразу на главную
        if (localStorage.getItem('token')) {
            window.location.href = 'index.html';
        }

        // ─── Переключение вкладок
        function switchTab(tabName) {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));

            document.querySelector(`.auth-tab[data-tab="${tabName}"]`).classList.add('active');
            document.getElementById(`panel-${tabName}`).classList.add('active');
        }

        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });

        // Ссылки внутри форм ("Нет аккаунта?" и т.п.)
        document.querySelectorAll('a[data-tab]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchTab(link.dataset.tab);
            });
        });

        // ─── Сообщения 
        function showMessage(text, type = 'error') {
            const oldToast = document.querySelector('.toast');
            if (oldToast) {
                oldToast.remove();
            }

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = text;

            document.body.appendChild(toast);

            setTimeout(() => {
                toast.remove();
            }, 2000);
        }

        // ─── Вход 
        document.getElementById('login-btn').addEventListener('click', async () => {
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const btn = document.getElementById('login-btn');

            if (!email || !password) {
                showMessage('Заполните все поля', 'error');
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Входим...';

            try {
                const res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (res.ok) {
                    const data = await res.json();
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user_id', data.user_id);
                    localStorage.setItem('access_level', data.access_level);
                    showMessage('Добро пожаловать! ✨', 'success');
                    setTimeout(() => window.location.href = 'index.html', 800);
                } else {
                    const text = await res.text();
                    showMessage(text || 'Неверная почта или пароль', 'error');
                }
            } catch (err) {
                showMessage('Не удалось соединиться с сервером', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Войти';
            }
        });

        // ─── Регистрация
        document.getElementById('register-btn').addEventListener('click', async () => {
            const firstName = document.getElementById('reg-first-name').value.trim();
            const surname = document.getElementById('reg-surname').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            const role = document.getElementById('reg-role-value').value;
            const deliveryAddress = document.getElementById('reg-delivery-address').value.trim();
            const btn = document.getElementById('register-btn');

            if (!firstName || !surname || !email || !password || !role || !deliveryAddress) {
                showMessage('Заполните все поля', 'error');
                return;
            }
            if (password.length < 6) {
                showMessage('Пароль должен содержать не менее 6 символов', 'error');
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Регистрируем...';

            try {
                const res = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ first_name: firstName, surname, email, password, role, delivery_address: deliveryAddress })
                });

                if (res.ok) {
                    showMessage('Аккаунт создан! Теперь войдите ✨', 'success');
                    // Очищаем форму и переключаем на вход
                    setTimeout(() => {
                        document.getElementById('reg-first-name').value = '';
                        document.getElementById('reg-surname').value = '';
                        document.getElementById('reg-email').value = '';
                        document.getElementById('reg-password').value = '';
                        document.getElementById('reg-delivery-address').value = '';
                        switchTab('login');
                        // Подставляем email в форму входа
                        document.getElementById('login-email').value = email;
                    }, 1000);
                } else {
                    const text = await res.text();
                    showMessage(text || 'Ошибка регистрации', 'error');
                }
            } catch (err) {
                showMessage('Не удалось соединиться с сервером', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Примкнуть к избранным';
            }
        });

        // Enter в полях логина
        ['login-email', 'login-password'].forEach(id => {
            document.getElementById(id).addEventListener('keydown', e => {
                if (e.key === 'Enter') document.getElementById('login-btn').click();
            });
        });