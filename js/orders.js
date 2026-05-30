const API_URL = "http://localhost:8080";

// Иконки и описания способов доставки
const deliveryMeta = {
    "Сова":          { icon: "🦉", description: "Доставка совой — традиционный и надёжный способ" },
    "Камин":         { icon: "🔥", description: "Каминная сеть — мгновенная доставка через камины" },
    "Delivery Guy":  { icon: "🧙‍♂️", description: "Курьер-волшебник — доставит лично в руки" },
};

function getDeliveryMeta(name) {
    return deliveryMeta[name] ?? { icon: "📦", description: name };
}

async function loadOrders() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401) {
        window.location.href = 'auth.html';
        return [];
    }
    if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);

    return await res.json();
}

function groupByDelivery(orders) {
    const groups = {};
    (orders ?? []).forEach(order => {
        const name = order.delivery_name;
        if (!groups[name]) groups[name] = [];
        groups[name].push(order);
    });
    return groups;
}

async function renderOrdersPage() {
    const container = document.getElementById('orders-content');
    if (!container) return;

    container.innerHTML = `<div style="text-align:center; padding:100px; font-size:28px;">Загрузка...</div>`;

    let orders;
    try {
        orders = await loadOrders();
    } catch (err) {
        container.innerHTML = `<div style="text-align:center; padding:100px; font-size:24px; color:#ff6b6b;">⚠️ Не удалось загрузить заказы</div>`;
        return;
    }

    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:100px; font-size:28px;">
                📭 У вас пока нет активных заказов
            </div>`;
        return;
    }

    const groups = groupByDelivery(orders);

    let html = `<div class="stats-header"><h1>📜 Заказы</h1></div>`;

    Object.entries(groups).forEach(([deliveryName, items]) => {
        const { icon, description } = getDeliveryMeta(deliveryName);

        html += `<div class="delivery-section">`;
        html += `<div class="delivery-line"></div>`;
        html += `
            <div class="delivery-content">
                <div class="delivery-icon">${icon}</div>
                <div class="delivery-title">
                    <h2>${deliveryName}</h2>
                    <p>${description}</p>
                </div>
            </div>
            <div class="products-grid">
        `;

        items.forEach(order => {
            html += `
                <div class="order-product-card" data-order-id="${order.id}">
                    <div class="card-image">${icon}</div>
                    <div class="card-footer">
                        <span class="product-name">Заказ #${order.id}</span>
                        <span class="product-price">${order.total_price} Галлеонов</span>
                        <span class="delivery-date">📅 ${order.estimated_date}</span>
                        <span class="delivery-date">📦 Товаров: ${order.items_count}</span>
                    </div>
                </div>
            `;
        });

        html += `</div></div>`;
    });

    container.innerHTML = html;

    document.querySelectorAll('.order-product-card').forEach(card => {
        card.addEventListener('click', function () {
            const orderId = this.getAttribute('data-order-id');
            if (orderId) window.location.href = `order-details.html?id=${orderId}`;
        });
    });
}