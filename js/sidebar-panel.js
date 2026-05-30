// sidebar-panel.js - функционал левой панели

// Данные пользователя
const userData = {
    name: "Волшебник",
    avatar: "🧙‍♂️",
    level: 3,
    levelName: "Мастер волшебства",
    address: "Хогвартс, Башня Гриффиндора, комната 7",
    pendingPurchases: 3
};

// Функция красивого модального окна для адреса
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
                <input type="text" id="modalAddressInput" value="${userData.address.replace(/"/g, '&quot;')}" placeholder="Введите ваш адрес">
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
    
    confirmBtn.addEventListener('click', () => {
        const newAddress = addressInput.value.trim();
        if (newAddress) {
            userData.address = newAddress;
            const addressEl = document.getElementById('userAddress');
            if (addressEl) addressEl.textContent = userData.address;
            localStorage.setItem('userAddress', userData.address);
            showToast('📍 Адрес доставки обновлён');
            closeModal(modal);
        } else {
            addressInput.style.borderColor = '#e74c3c';
            setTimeout(() => {
                addressInput.style.borderColor = 'var(--gold-glow)';
            }, 1500);
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
                <div class="user-avatar">${userData.avatar}</div>
                <div class="user-name">${userData.name}</div>
                <div class="user-level">
                    <span>🎓 Уровень ${userData.level}</span>
                    <span class="level-badge">${userData.levelName}</span>
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
                <div class="address" id="userAddress">${userData.address}</div>
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

function loadUserAddress() {
    const savedAddress = localStorage.getItem('userAddress');
    if (savedAddress) {
        userData.address = savedAddress;
    }
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
        // Перезаписываем моки реальными данными
        userData.name = profile.first_name;
        userData.level = profile.access_level;
        userData.levelName = levelName(profile.access_level);
    } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
    }

    loadUserAddress();
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