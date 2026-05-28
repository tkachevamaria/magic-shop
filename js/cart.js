// cart.js - работа с корзиной

function getCart() {
    const cart = localStorage.getItem('potterCart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('potterCart', JSON.stringify(cart));
}

function addToCart(product, size, color) {
    const cart = getCart();
    cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        size: size || 'Стандарт',
        color: color || 'Стандарт',
        date: new Date().toISOString()
    });
    saveCart(cart);
    showCartToast(product.name + ' добавлен в корзину');
    updateCartCount();
}

function removeFromCart(index) {
    const cart = getCart();
    const removed = cart.splice(index, 1);
    saveCart(cart);
    updateCartCount();
    showCartToast(removed[0].name + ' удалён из корзины');
    if (typeof renderCartPage === 'function') {
        renderCartPage();
    }
}

function showCartToast(message) {
    const oldToast = document.querySelector('.cart-toast');
    if (oldToast) oldToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.length;
    const cartIcon = document.querySelector('#header-container .icon-btn[title="Корзина"]');
    
    if (cartIcon) {
        const oldBadge = cartIcon.querySelector('.cart-badge');
        if (oldBadge) oldBadge.remove();
        
        if (count > 0) {
            const badge = document.createElement('span');
            badge.className = 'cart-badge';
            badge.textContent = count;
            badge.style.cssText = `
                position: absolute;
                top: -8px;
                right: -8px;
                background: #e74c3c;
                color: white;
                font-size: 12px;
                font-family: Arial, sans-serif;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            cartIcon.style.position = 'relative';
            cartIcon.appendChild(badge);
        }
    }
}