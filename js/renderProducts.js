(function() {
    const container = document.getElementById('products-grid');
    if (!container) return;

    fetch('http://localhost:8080/api/products')
        .then(response => {
            if (!response.ok) throw new Error('Ошибка загрузки товаров');
            return response.json();
        })
        .then(data => {
            console.log('ответ с сервера:', data);
            const products = data.products;
            container.innerHTML = '';

            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.setAttribute('data-product-id', product.id);

                card.innerHTML = `
                    <div class="card-image-area">
                        <img src="http://localhost:8080${product.image_url}" alt="${product.name}">
                    </div>
                    <div class="card-footer">
                        <span class="product-name">${product.name}</span>
                        <span class="product-price">${product.price} Галлеонов</span>
                    </div>
                `;

                card.addEventListener('click', function() {
                    console.log('id товара:', product.id);
                    console.log('переход на:', `/product.html?id=${product.id}`);
                    window.location.href = `/frontend/product.html?id=${product.id}`;
                });

                container.appendChild(card);
            });
        })
        .catch(err => {
            container.innerHTML = `<div style="padding: 40px">Не удалось загрузить товары</div>`;
            console.error(err);
        });
})();