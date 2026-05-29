// renderProducts.js
(function() {
    const container = document.getElementById('products-grid');
    if (!container) return;

    const products = [
        { id: 1, name: "Бузинная палочка", price: 5000, icon: "🪄" },
        { id: 2, name: "Амортенция", price: 700, icon: "💖" },
        { id: 3, name: "Учебник заклинаний", price: 300, icon: "📚" },
        { id: 4, name: "Нимбус 2000", price: 400, icon: "🧹" },
        { id: 5, name: "Сова-почтальон", price: 200, icon: "🦉" },
        { id: 6, name: "Мантия-невидимка", price: 10000, icon: "👻" }
    ];

    container.innerHTML = '';

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-product-id', product.id);

        card.innerHTML = `
            <div class="card-image-area">
                <span style="font-size: 74px;">${product.icon}</span>
            </div>
            <div class="card-footer">
                <span class="product-name">${product.name}</span>
                <span class="product-price">${product.price} Галлеонов</span>
            </div>
        `;

        card.addEventListener('click', function() {
            window.location.href = `product.html?id=${product.id}`;
        });

        container.appendChild(card);
    });
})();