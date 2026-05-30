function renderCartPage() {
    const container = document.getElementById('cart-content');
    const cart = getCart();
    
    if (!container) return;
    
    if (cart.length === 0) {
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
    
    let total = 0;
    let cartHtml = '<div class="cart-layout"><div class="cart-items"><h2>Товары в корзине</h2>';
    
    cart.forEach((item, index) => {
        total += item.price;
        cartHtml += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-details">
                        ${item.size ? `Размер: ${item.size}` : ''}
                        ${item.size && item.color ? ' | ' : ''}
                        ${item.color ? `Цвет: ${item.color}` : ''}
                    </div>
                    <div class="cart-item-price">${item.price} Галлеонов</div>
                </div>
                <button class="cart-item-remove" data-index="${index}" title="Удалить">🗑️</button>
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
    
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'));
            removeFromCart(index);
        });
    });
    
    const orderBtn = document.getElementById('order-btn');
    if (orderBtn) {
        orderBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                alert('✨ Спасибо за заказ! Скоро с вами свяжется сова. ✨');
                localStorage.removeItem('potterCart');
                renderCartPage();
                updateCartCount();
            }
        });
    }
}