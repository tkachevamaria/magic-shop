fetch('header.html')
            .then(response => {
                if (!response.ok) throw new Error('Блокировка браузера');
                return response.text();
            })
            .then(data => {
                document.getElementById('header-container').innerHTML = data;
            })
            .catch(err => {
                // Если твой компьютер заблокировал файл с диска, скрипт подставит код сам!
                document.getElementById('header-container').innerHTML = `
                    <div class="header-content">
                        <div class="logo">DA <span class="logo-sub">Logo</span></div>
                        <div class="search-container">
                            <input type="text" placeholder="ПОИСК..." class="search-input">
                            <span class="search-arrow">🔍</span>
                        </div>
                        <div class="header-icons">
                            <button class="icon-btn" title="Фильтр">⏳</button>
                            <button class="icon-btn" title="Корзина">🛒</button>
                            <button class="icon-btn" title="Профиль">🧙‍♂️</button>
                            <button class="icon-btn" title="Уведомления">🔔</button>
                        </div>
                    </div>
                `;
            });