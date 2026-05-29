(function () {
    const API_URL = 'http://localhost:8080/api';
    const PHOTO_URL = 'http://localhost:8080';

    const container = document.getElementById('product-content');

    if (!container) return;

    function renderProduct(product) {
        container.innerHTML = `
            <div class="product-card-large">

                <div class="product-image">
                    <img src="${PHOTO_URL}${product.image_url}" alt="${product.name}">
                </div>

                <div class="product-info">
                    <h1>${product.name}</h1>

                    <div class="product-price">
                        ${product.price} Галлеонов
                    </div>

                    <div class="product-description">
                        ${product.description || 'Описание отсутствует'}
                    </div>
                </div>

            </div>
        `;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    console.log('productId:', productId);

    if (!productId) {
        container.innerHTML = '<div>Товар не найден</div>';
        return;
    }

    fetch(`${API_URL}/products/${productId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка загрузки товара');
            }

            return response.json();
        })
        .then(product => {
            console.log(product);

            renderProduct(product);
        })
        .catch(error => {
            console.error(error);

            container.innerHTML =
                '<div>Не удалось загрузить товар</div>';
        });
})();