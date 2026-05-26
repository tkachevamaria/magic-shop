(function() {
  const container = document.getElementById('products-grid');
  if (!container) return;

  container.innerHTML = '';

  if (typeof products === 'undefined' || !Array.isArray(products)) {
    console.warn('Моки товаров не найдены');
    return;
  }

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-product-id', product.id);

    card.innerHTML = `
      <div class="card-image-area">${product.emoji || '✨'}</div>
      <div class="card-footer">
        <span class="product-name">${product.name}</span>
        <span class="product-price">${product.price} Галлеонов</span>
      </div>
    `;

    card.addEventListener('click', function() {
      console.log('Переход на товар с id:', product.id);

    });

    container.appendChild(card);
  });
})();
