(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        document.getElementById('product-content').innerHTML = '<div>Товар не найден</div>';
        return;
    }

    fetch(`http://localhost:8080/api/products/${productId}`)
        .then(response => {
            if (!response.ok) throw new Error('Товар не найден');
            return response.json();
        })
        .then(product => {
            // product здесь — это ProductDetail со всеми полями включая items[]
            renderProductPage(product);
        })
        .catch(err => {
            document.getElementById('product-content').innerHTML = '<div>Не удалось загрузить товар</div>';
            console.error(err);
        });
})();