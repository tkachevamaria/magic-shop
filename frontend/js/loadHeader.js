// loadHeader.js
fetch('header.html')
    .then(response => {
        if (!response.ok) throw new Error('Не удалось загрузить header.html');
        return response.text();
    })
    .then(data => {
        document.getElementById('header-container').innerHTML = data;
        
        setTimeout(function() {
            const logo = document.querySelector('#header-container .logo');
            if (logo) {
                logo.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.location.href = 'index.html';
                });
                logo.style.cursor = 'pointer';
            }
            
            const cartBtn = document.querySelector('#header-container .icon-btn[title="Корзина"]');
            if (cartBtn) {
                cartBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.location.href = 'cart.html';
                });
            }
            
            const ordersBtn = document.querySelector('#header-container .icon-btn[title="История заказов"]');
            if (ordersBtn) {
                ordersBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.location.href = 'orders.html';
                });
            }
            
            const notificationsBtn = document.querySelector('#header-container .icon-btn[title="Уведомления"]');
            if (notificationsBtn) {
                notificationsBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    showToast('🔔 У вас нет новых уведомлений');
                });
            }
        }, 100);
        
        if (typeof updateCartCount === 'function') {
            updateCartCount();
        }
    })
    .catch(err => {
        console.error('Ошибка:', err);
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
        
        document.getElementById('fallbackLogo')?.addEventListener('click', () => window.location.href = 'index.html');
        document.getElementById('fallbackCart')?.addEventListener('click', () => window.location.href = 'cart.html');
        document.getElementById('fallbackOrders')?.addEventListener('click', () => window.location.href = 'orders.html');
        document.getElementById('fallbackNotifications')?.addEventListener('click', () => showToast('🔔 У вас нет новых уведомлений'));
    });

function showToast(message) {
    const oldToast = document.querySelector('.cart-toast');
    if (oldToast) oldToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}