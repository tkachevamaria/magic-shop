// purchases.js - данные о покупках

const purchasesData = [
    { id: 1, name: "Бузинная палочка", price: 5000, icon: "🪄", deliveryDate: "15.12.2024", status: "delivered" },
    { id: 2, name: "Амортенция", price: 700, icon: "💖", deliveryDate: "15.12.2024", status: "delivered" },
    { id: 3, name: "Нимбус 2000", price: 400, icon: "🧹", deliveryDate: "20.12.2024", status: "delivered" },
    { id: 4, name: "Учебник заклинаний", price: 300, icon: "📚", deliveryDate: "20.12.2024", status: "delivered" },
    { id: 5, name: "Мантия-невидимка", price: 10000, icon: "👻", deliveryDate: "05.01.2025", status: "delivered" },
    { id: 6, name: "Сова-почтальон", price: 200, icon: "🦉", deliveryDate: "18.01.2025", status: "delivered" },
    { id: 7, name: "Волшебные шахматы", price: 350, icon: "♟️", deliveryDate: "22.02.2025", status: "delivered" },
    { id: 8, name: "Золотой снитч", price: 1500, icon: "⭐", deliveryDate: "10.03.2025", status: "delivered" },
    { id: 9, name: "Летучий порох", price: 50, icon: "🔥", deliveryDate: "20.12.2024", status: "delivered" }
];

function getTotalStats() {
    let totalAmount = 0;
    purchasesData.forEach(item => {
        totalAmount += item.price;
    });
    return { totalAmount, totalOrders: purchasesData.length };
}

function renderPurchasesPage() {
    const container = document.getElementById('purchases-content');
    
    if (!container) return;
    
    const { totalAmount, totalOrders } = getTotalStats();
    
    if (purchasesData.length === 0) {
        container.innerHTML = `
            <div class="empty-purchases">
                <div class="empty-icon">🛍️</div>
                <h2>У вас пока нет покупок</h2>
                <p>Совершите первую покупку в нашем магазине</p>
                <a href="index.html" class="back-to-shop">Перейти к покупкам</a>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="stats-header">
            <h1>🛍️ Мои покупки</h1>
            <div class="total-stats">
                <div class="total-amount">💰 ${totalAmount} Галлеонов</div>
                <div class="total-orders-count">📦 Всего покупок: ${totalOrders}</div>
            </div>
        </div>
        <div class="products-grid">
    `;
    
    purchasesData.forEach(item => {
        html += `
            <div class="purchase-card" data-product-id="${item.id}">
                <div class="card-image">${item.icon}</div>
                <div class="card-footer">
                    <span class="product-name" title="${item.name}">${item.name}</span>
                    <span class="product-price">${item.price} Галлеонов</span>
                    <span class="delivery-date">📅 Доставлено: ${item.deliveryDate}</span>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
    
    document.querySelectorAll('.purchase-card').forEach(card => {
        card.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            if (productId) {
                window.location.href = `product.html?id=${productId}`;
            }
        });
    });
}