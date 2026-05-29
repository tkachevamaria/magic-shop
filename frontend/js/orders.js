// orders.js - заказы, сгруппированные по способу доставки

const ordersData = {
    owl: {
        name: "Сова",
        icon: "🦉",
        description: "Доставка совой — традиционный и надёжный способ",
        items: [
            { id: 1, name: "Бузинная палочка", price: 5000, icon: "🪄", size: "Стандарт", color: "Черный", deliveryDate: "15.12.2024" },
            { id: 2, name: "Амортенция", price: 700, icon: "💖", size: "30 мл", color: "Розовый", deliveryDate: "15.12.2024" },
            { id: 3, name: "Сова-почтальон", price: 200, icon: "🦉", size: "Крупная", color: "Белая", deliveryDate: "18.01.2025" },
            { id: 4, name: "Волшебные шахматы", price: 350, icon: "♟️", size: "Стандарт", color: "Черно-белые", deliveryDate: "22.02.2025" }
        ]
    },
    fireplace: {
        name: "Камин",
        icon: "🔥",
        description: "Каминная сеть — мгновенная доставка через камины",
        items: [
            { id: 5, name: "Нимбус 2000", price: 400, icon: "🧹", size: "Стандарт", color: "Дубовый", deliveryDate: "20.12.2024" },
            { id: 6, name: "Учебник заклинаний", price: 300, icon: "📚", size: "Твердая обложка", color: "Синий", deliveryDate: "20.12.2024" },
            { id: 7, name: "Летучий порох", price: 50, icon: "🔥", size: "Стандарт", color: "Черный", deliveryDate: "20.12.2024" }
        ]
    },
    guy: {
        name: "Delivery Guy",
        icon: "🧙‍♂️",
        description: "Курьер-волшебник — доставит лично в руки",
        items: [
            { id: 8, name: "Мантия-невидимка", price: 10000, icon: "👻", size: "Взрослый (M)", color: "Серебристо-серая", deliveryDate: "05.01.2025" },
            { id: 9, name: "Золотой снитч", price: 1500, icon: "⭐", size: "Стандарт", color: "Золотой", deliveryDate: "10.03.2025" }
        ]
    }
};

function getTotalStats() {
    let totalAmount = 0;
    let totalOrders = 0;
    
    for (const method in ordersData) {
        ordersData[method].items.forEach(item => {
            totalAmount += item.price;
            totalOrders++;
        });
    }
    
    return { totalAmount, totalOrders };
}

function renderOrdersPage() {
    const container = document.getElementById('orders-content');
    
    if (!container) return;
    
    const { totalAmount, totalOrders } = getTotalStats();
    
    let html = `
        <div class="stats-header">
            <h1>📜 Заказы </h1>
        </div>
    `;
    
    const methods = ['owl', 'fireplace', 'guy'];
    
    methods.forEach(method => {
        const section = ordersData[method];
        
        // СНАЧАЛА ЗОЛОТАЯ ЛИНИЯ
        html += `<div class="delivery-section">`;
        html += `<div class="delivery-line"></div>`;
        
        // ПОТОМ СПОСОБ ДОСТАВКИ (под линией)
        html += `
            <div class="delivery-content">
                <div class="delivery-icon">${section.icon}</div>
                <div class="delivery-title">
                    <h2>${section.name}</h2>
                    <p>${section.description}</p>
                </div>
            </div>
        `;
        
        if (section.items.length === 0) {
            html += `<div class="empty-section">📭 Нет заказов с доставкой "${section.name}"</div>`;
        } else {
            html += `<div class="products-grid">`;
            
            section.items.forEach(item => {
                html += `
                    <div class="order-product-card" data-product-id="${item.id}">
                        <div class="card-image">${item.icon}</div>
                        <div class="card-footer">
                            <span class="product-name" title="${item.name}">${item.name}</span>
                            <span class="product-price">${item.price} Галлеонов</span>
                            <span class="delivery-date">📅 ${item.deliveryDate}</span>
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
        }
        
        html += `</div>`;
    });
    
    container.innerHTML = html;
    
    // Обработчики клика на карточки
    document.querySelectorAll('.order-product-card').forEach(card => {
        card.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            if (productId) {
                window.location.href = `product.html?id=${productId}`;
            }
        });
    });
}