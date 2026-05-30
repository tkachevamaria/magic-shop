// renderCart.js - рендер страницы корзины

async function renderCartPage() {
    const container = document.getElementById('cart-content');
    if (!container) return;

    container.innerHTML = `<div style="text-align:center; padding:100px; font-size:28px;">Загрузка...</div>`;

    let cart;
    try {
        cart = await getCart();
    } catch (err) {
        container.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">⚠️</div>
                <h2>Не удалось загрузить корзину</h2>
                <p>Проверьте соединение с сервером</p>
            </div>
        `;
        return;
    }

    const items = cart?.items ?? [];

    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h2>Корзина пуста</h2>
                <p>Похоже, вы ещё ничего не выбрали.</p>
                <a href="index.html" class="back-to-shop">Перейти к покупкам</a>
            </div>
        `;
        return;
    }

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let cartHtml = `<div class="cart-layout"><div class="cart-items"><h2>Товары в корзине</h2>`;

    items.forEach(item => {
        cartHtml += `
            <div class="cart-item" data-item-id="${item.item_id}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.product_name}</div>
                    <div class="cart-item-details">
                        ${item.size ? `Размер: ${item.size}` : ''}
                        ${item.size && item.color ? ' | ' : ''}
                        ${item.color ? `Цвет: ${item.color}` : ''}
                    </div>
                    <div class="cart-item-price">${item.price} Галлеонов</div>
                    <div class="cart-item-quantity">
                        <button class="qty-btn decrement" data-item-id="${item.item_id}">−</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn increment" data-item-id="${item.item_id}">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" data-item-id="${item.item_id}" data-name="${item.product_name}" title="Удалить">🗑️</button>
            </div>
        `;
    });

    cartHtml += `
        </div>
        <div class="cart-summary">
            <h2>Итого</h2>
            <div class="summary-total">
                <span>Общая сумма:</span>
                <span class="total-price">${total} Галлеонов</span>
            </div>
            <button class="order-btn" id="order-btn">Заказать</button>
        </div>
        </div>
    `;

    container.innerHTML = cartHtml;

    // Удаление
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', async () => {
            const itemID = parseInt(btn.getAttribute('data-item-id'));
            const name = btn.getAttribute('data-name');
            await removeFromCart(itemID, name);
        });
    });

    // Увеличить количество
    document.querySelectorAll('.qty-btn.increment').forEach(btn => {
        btn.addEventListener('click', async () => {
            const itemID = parseInt(btn.getAttribute('data-item-id'));
            await incrementItem(itemID);
            renderCartPage();
        });
    });

    // Уменьшить количество
    document.querySelectorAll('.qty-btn.decrement').forEach(btn => {
        btn.addEventListener('click', async () => {
            const itemID = parseInt(btn.getAttribute('data-item-id'));
            await decrementItem(itemID);
            renderCartPage();
        });
    });

    // Заказать
    document.getElementById('order-btn')?.addEventListener('click', () => {
        alert('Спасибо за заказ! Скоро с вами свяжется сова.');
    });
}