// модальное окна для адреса
function showAddressModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <div class="modal-icon">📍</div>
                <h3>Изменить адрес доставки</h3>
                <p>Введите новый адрес для доставки заказов</p>
            </div>
            <div class="modal-body">
                <label>Адрес доставки:</label>
                <input type="text" id="modalAddressInput" value="${userAddress.replace(/"/g, '&quot;')}" placeholder="Введите ваш адрес">
            </div>
            <div class="modal-buttons">
                <button class="modal-btn modal-btn-cancel" id="modalCancelBtn">Отмена</button>
                <button class="modal-btn modal-btn-confirm" id="modalConfirmBtn">Сохранить</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    
    const addressInput = modal.querySelector('#modalAddressInput');
    const cancelBtn = modal.querySelector('#modalCancelBtn');
    const confirmBtn = modal.querySelector('#modalConfirmBtn');
    
    setTimeout(() => addressInput.focus(), 50);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
    });
    
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeModal(modal);
            document.removeEventListener('keydown', escHandler);
        }
    });
    
    cancelBtn.addEventListener('click', () => closeModal(modal));
    
    confirmBtn.addEventListener('click', async () => {
        const newAddress = addressInput.value.trim();

        if (!newAddress) {
            addressInput.style.borderColor = '#e74c3c';
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const res = await fetch(
                'http://localhost:8080/api/users/profile/me/address',
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        delivery_address: newAddress
                    })
                }
            );

            if (!res.ok) {
                throw new Error('Ошибка обновления адреса');
            }

            userAddress = newAddress;

            const addressEl = document.getElementById('userAddress');
            if (addressEl) {
                addressEl.textContent = userAddress;
            }

            showToast('📍 Адрес доставки обновлён');
            closeModal(modal);

        } catch (err) {
            console.error(err);
            showToast('❌ Не удалось обновить адрес');
        }
    });
    
    addressInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') confirmBtn.click();
    });
}

function closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
}

// Функция рендера панели
function renderSidebarPanel() {
    const container = document.getElementById('sidebar-panel-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="sidebar-panel" id="sidebarPanel">
            <div class="user-profile">
                <div class="user-name">${userName}</div>
                <div class="user-level">
                    <span>🎓 Уровень ${userLevel}</span>
                    <span class="level-badge">${userLevelName}</span>
                </div>
            </div>
            
            <nav class="sidebar-nav">
                <div class="nav-item" data-page="orders">
                    <span class="nav-icon">📜</span>
                    <span class="nav-text">Заказы</span>
                </div>
                <div class="nav-item" data-page="purchases">
                    <span class="nav-icon">🛍️</span>
                    <span class="nav-text">Мои покупки</span>
                </div>
            </nav>
            
            <div class="delivery-address-card" id="addressCard">
                <div class="label">
                    <span>🦉</span> Адрес доставки по умолчанию:
                </div>
                <div class="address" id="userAddress">${userAddress}</div>
                <button class="edit-address" id="editAddressBtn">✎ Изменить</button>
            </div>
            
            <nav class="sidebar-nav">
                <div class="nav-item logout-btn" data-page="logout">
                    <span class="nav-icon">🚪</span>
                    <span class="nav-text">Выйти</span>
                </div>
            </nav>
        </div>
        
        <button class="sidebar-toggle" id="sidebarToggle">☰</button>
    `;
    
    const sidebarPanel = document.getElementById('sidebarPanel');
    const toggleBtn = document.getElementById('sidebarToggle');
    const editAddressBtn = document.getElementById('editAddressBtn');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebarPanel.classList.toggle('open');
        });
    }
    
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 800 && sidebarPanel.classList.contains('open')) {
            if (!sidebarPanel.contains(e.target) && !toggleBtn.contains(e.target)) {
                sidebarPanel.classList.remove('open');
            }
        }
    });
    
    if (editAddressBtn) {
        editAddressBtn.addEventListener('click', () => {
            showAddressModal();
        });
    }
    
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            const page = item.getAttribute('data-page');
            
            switch(page) {
                case 'orders':
                    window.location.href = 'orders.html';
                    break;
                case 'purchases':
                    window.location.href = 'purchases.html';
                    break;
                case 'logout':
                    if (confirm('Вы уверены, что хотите выйти?')) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user_id');
                        localStorage.removeItem('access_level');
                        showToast('🚪 Вы вышли из аккаунта');
                        setTimeout(() => {
                            window.location.href = 'auth.html';
                        }, 1000);
                    }
                    break;
                default:
                    if (page === 'address') showAddressModal();
                    else showToast('⏳ Скоро появится');
            }
        });
    });
    
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item').forEach(item => {
        if (currentPage === 'orders.html' && item.getAttribute('data-page') === 'orders') {
            item.classList.add('active');
        }
        if (currentPage === 'purchases.html' && item.getAttribute('data-page') === 'purchases') {
            item.classList.add('active');
        }
    });
}

async function initSidebarPanel() {
    const currentPage = window.location.pathname.split('/').pop();
    const isIndexPage = currentPage === 'index.html' || currentPage === '' || currentPage === '/';
    
    if (isIndexPage) {
        const container = document.getElementById('sidebar-panel-container');
        if (container) container.style.display = 'none';
        document.body.classList.remove('has-sidebar');
        return;
    }
    
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:8080/api/users/profile/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            window.location.href = 'auth.html';
            return;
        }
        const profile = await res.json();
        userName = profile.first_name;
        userLevel = profile.access_level;
        userLevelName = levelName(profile.access_level);
        userAddress = profile.delivery_address || 'Адрес не указан';
    } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
    }

    renderSidebarPanel();
    document.body.classList.add('has-sidebar');
}

function levelName(level) {
    return { 1: 'Студент', 2: 'Маг', 3: 'Профессионал' }[level];
}

// Функция для уведомлений
function showToast(message) {
    const oldToast = document.querySelector('.cart-toast');
    if (oldToast) oldToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}