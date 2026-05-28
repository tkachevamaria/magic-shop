fetch('header.html')
    .then(response => {
        if (!response.ok) throw new Error('Блокировка браузера');
        return response.text();
    })
    .then(data => {
        document.getElementById('header-container').innerHTML = data;
        
        // ОБРАБОТЧИК ДЛЯ ЛОГОТИПА
        setTimeout(function() {
            const logo = document.querySelector('#header-container .logo');
            if (logo) {
                logo.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.location.href = 'index.html';
                });
                logo.style.cursor = 'pointer';
            }
        }, 100);
        
        // ОБРАБОТЧИКИ ДЛЯ ИКОНОК ШАПКИ
        setTimeout(function() {
            // Корзина
            const cartBtn = document.querySelector('#header-container .icon-btn[title="Корзина"], #header-container a[title="Корзина"]');
            if (cartBtn) {
                cartBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.location.href = 'cart.html';
                });
                cartBtn.style.cursor = 'pointer';
            }
            
            // История заказов (если есть)
            const ordersBtn = document.querySelector('#header-container .icon-btn[title="История заказов"], #header-container a[title="История заказов"]');
            if (ordersBtn) {
                ordersBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.location.href = 'orders.html';
                });
                ordersBtn.style.cursor = 'pointer';
            }
            
            
            // Уведомления
            const notificationsBtn = document.querySelector('#header-container .icon-btn[title="Уведомления"]');
            if (notificationsBtn) {
                notificationsBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    showToast('🔔 У вас нет новых уведомлений');
                });
                notificationsBtn.style.cursor = 'pointer';
            }
            
            // Фильтр
            const filterBtn = document.querySelector('#header-container .icon-btn[title="Фильтр"]');
            if (filterBtn) {
                filterBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    showToast('⏳ Фильтр скоро появится');
                });
                filterBtn.style.cursor = 'pointer';
            }
        }, 100);
    })
    .catch(err => {
        document.getElementById('header-container').innerHTML = `
            <div class="header-content">
                <div class="logo" id="fallbackLogo" style="cursor: pointer;">DA <span class="logo-sub">Logo</span></div>
                <div class="search-container">
                    <input type="text" placeholder="ПОИСК..." class="search-input">
                    <span class="search-arrow">🔍</span>
                </div>
                <div class="header-icons">
                    <button class="icon-btn" id="fallbackCart" title="Корзина">🛒</button>
                    <button class="icon-btn" id="fallbackOrders" title="История заказов">📜</button>
                    <button class="icon-btn" id="fallbackNotifications" title="Уведомления">🔔</button>
                </div>
            </div>
        `;
        
        // Обработчики для запасных кнопок
        const fallbackLogo = document.getElementById('fallbackLogo');
        if (fallbackLogo) {
            fallbackLogo.addEventListener('click', () => window.location.href = 'index.html');
        }
        
        const fallbackCart = document.getElementById('fallbackCart');
        if (fallbackCart) {
            fallbackCart.addEventListener('click', () => window.location.href = 'cart.html');
        }
        
        const fallbackOrders = document.getElementById('fallbackOrders');
        if (fallbackOrders) {
            fallbackOrders.addEventListener('click', () => window.location.href = 'orders.html');
        }
        
        const fallbackProfile = document.getElementById('fallbackProfile');
        if (fallbackProfile) {
            fallbackProfile.addEventListener('click', () => showToast('🧙 Скоро здесь будет личный кабинет'));
        }
        
        const fallbackNotifications = document.getElementById('fallbackNotifications');
        if (fallbackNotifications) {
            fallbackNotifications.addEventListener('click', () => showToast('🔔 У вас нет новых уведомлений'));
        }
    });

// Функция для уведомлений (если нет в components.js)
function showToast(message) {
    const oldToast = document.querySelector('.cart-toast');
    if (oldToast) oldToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}