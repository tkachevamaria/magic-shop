document.addEventListener('DOMContentLoaded', () => {
    const API_URL = "http://localhost:8080";
    const form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Сбор данных
        const firstName = document.getElementById('first_name').value.trim();
        const surname = document.getElementById('surname').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        // Простая валидация
        if (!firstName || !surname || !email || !password) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        if (password.length < 6) {
            alert('Пароль должен содержать не менее 6 символов');
            return;
        }

        const requestBody = {
            first_name: firstName,
            surname: surname,
            email: email,
            password: password,
            role: role
        };

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                alert('Регистрация успешна! Теперь вы можете войти.');
                // Перенаправляем на страницу входа (пока на главную, если login.html нет)
                window.location.href = 'login.html';
            } else {
                const errorText = await response.text();
                alert(`Ошибка регистрации: ${errorText || response.statusText}`);
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Не удалось соединиться с сервером. Убедитесь, что сервер запущен');
        }
    });
});