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

// Загружает активные заказы (не DELIVERED)
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

// Группирует заказы по методу доставки для отображения секциями
function groupByDelivery(orders) {
    const groups = {};
    (orders ?? []).forEach(order => {
        const name = order.delivery_name;
        if (!groups[name]) groups[name] = [];
        groups[name].push(order);
    });
    return groups;
}

// Рендерит карточки товаров внутри заказа.
// Каждый товар — отдельная карточка со ссылкой на страницу продукта.
// quantity берётся из order.items[n].quantity (бек уже схлопывает дубли).
function renderOrderItems(items, deliveryIcon) {
    if (!items || items.length === 0) {
        return `<div class="order-product-card">
            <div class="card-image">${deliveryIcon}</div>
            <div class="card-footer"><span class="product-name">Нет данных о товарах</span></div>
        </div>`;
    }


    return items.map(item => {
        const image = item.image_url
            ? `<img src="${API_URL}${item.image_url}" alt="${item.name}" class="card-img">`
            : `<div class="card-image">${deliveryIcon}</div>`;

        const quantityBadge = item.quantity > 1
            ? `<span class="quantity-badge">×${item.quantity}</span>`
            : '';

        return `
            <div class="order-product-card clickable-card" data-product-id="${item.product_id}">
                <div class="card-image-wrap">
                    ${image}
                    ${quantityBadge}
                </div>
                <div class="card-footer">
                    <span class="product-name">${item.name}</span>
                    ${item.color ? `<span class="product-meta">${item.color}${item.size ? `, ${item.size}` : ''}</span>` : ''}
                    <span class="product-price">${item.price} Галлеонов</span>
                </div>
            </div>
        `;
    }).join('');
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

    Object.entries(groups).forEach(([deliveryName, groupOrders]) => {
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
        `;

        // Каждый заказ — своя подсекция с датой/статусом и сеткой товаров
        groupOrders.forEach(order => {
            html += `
                <div class="order-block" data-order-id="${order.id}">
                    <div class="order-block-header">
                        <span class="order-id">Заказ #${order.id}</span>
                        <span class="order-status">${order.status}</span>
                        <span class="delivery-date">📅 ${order.estimated_date}</span>
                        <span class="order-total">${order.total_price} Галлеонов</span>
                    </div>
                    <div class="products-grid">
                        ${renderOrderItems(order.items, icon)}
                    </div>
                </div>
            `;
        });

        html += `</div>`;
    });

    container.innerHTML = html;

    // Клик по карточке товара - страница продукта
    document.querySelectorAll('.order-product-card[data-product-id]').forEach(card => {
        card.addEventListener('click', function () {
            const productId = this.getAttribute('data-product-id');
            if (productId) window.location.href = `product.html?id=${productId}`;
        });
    });
}