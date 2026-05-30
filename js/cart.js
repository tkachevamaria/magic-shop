//работа с корзиной через API

const API_URL = "http://localhost:8080";

function authHeaders() {
    return { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
}

async function getCart() {
    const res = await fetch(`${API_URL}/api/cart`, {
        headers: authHeaders()
    });
    if (res.status === 401) {
        window.location.href = 'auth.html';
        return null;
    }
    if (!res.ok) throw new Error(`Ошибка загрузки корзины: ${res.status}`);
    return await res.json(); // { cart_id, user_id, items: [...] }
}

async function addToCart(itemID) {
    const res = await fetch(`${API_URL}/api/cart/${itemID}`, {
        method: 'POST',
        headers: authHeaders()
    });
    if (res.status === 401) { window.location.href = 'auth.html'; return; }
    if (res.status === 409) { showCartToast('⚠️ Больше нет в наличии'); return; }
    if (res.status === 403) { showCartToast('⛔ Нет доступа к этому товару'); return; }
    if (!res.ok) throw new Error(`Ошибка добавления: ${res.status}`);
    showCartToast('✨ Товар добавлен в корзину');
    await updateCartCount();
}

async function removeFromCart(itemID, productName) {
    const res = await fetch(`${API_URL}/api/cart/${itemID}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
    if (res.status === 401) { window.location.href = 'auth.html'; return; }
    if (!res.ok) throw new Error(`Ошибка удаления: ${res.status}`);
    showCartToast(`${productName} удалён из корзины`);
    await updateCartCount();
    if (typeof renderCartPage === 'function') renderCartPage();
}

async function incrementItem(itemID) {
    const res = await fetch(`${API_URL}/api/cart/${itemID}`, {
        method: 'POST',
        headers: authHeaders()
    });
    if (res.status === 409) { showCartToast('⚠️ Больше нет в наличии'); return; }
    if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
}

async function decrementItem(itemID) {
    const res = await fetch(`${API_URL}/api/cart/${itemID}/decrement`, {
        method: 'POST',
        headers: authHeaders()
    });
    if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
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

async function updateCartCount() {
    try {
        const cart = await getCart();
        const count = cart?.items?.length ?? 0;
        const cartIcon = document.querySelector('#header-container .icon-btn[title="Корзина"]');

        if (!cartIcon) return;

        const oldBadge = cartIcon.querySelector('.cart-badge');
        if (oldBadge) oldBadge.remove();

        if (count > 0) {
            const badge = document.createElement('span');
            badge.className = 'cart-badge';
            badge.textContent = count;
            badge.style.cssText = `
                position: absolute; top: -8px; right: -8px;
                background: #e74c3c; color: white;
                font-size: 12px; font-family: Arial, sans-serif;
                border-radius: 50%; width: 18px; height: 18px;
                display: flex; align-items: center; justify-content: center;
            `;
            cartIcon.style.position = 'relative';
            cartIcon.appendChild(badge);
        }
    } catch (err) {
        console.error('Ошибка обновления счётчика корзины:', err);
    }
}