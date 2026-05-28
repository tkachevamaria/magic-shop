(async function() {
  const container = document.getElementById('products-grid');
  if (!container) return;

  // Показываем загрузку, пока ждём ответа
  container.innerHTML = '<p style="color: var(--gold-bright); font-size: 28px; text-align: center; grid-column: 1 / -1;">Загрузка товаров...</p>';

  try {
    const response = await fetch(`${API_URL}/api/products`);
    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    const products = await response.json();

    // Если пришёл пустой массив
    if (!Array.isArray(products) || products.length === 0) {
      container.innerHTML = '<p style="color: var(--gold-glow); font-size: 28px; text-align: center; grid-column: 1 / -1;">Товары не найдены</p>';
      return;
    }

    container.innerHTML = '';

    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.setAttribute('data-product-id', product.id);

      const imageSrc = product.image_url && product.image_url !== '/images/default.png'
        ? product.image_url
        : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Ctext x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2260%22%3E🔮%3C/text%3E%3C/svg%3E';

      card.innerHTML = `
        <div class="card-image-area">
          <img src="${imageSrc}" alt="${product.name}">
        </div>
        <div class="card-footer">
          <span class="product-name">${product.name}</span>
          <span class="product-price">${product.price} Галлеонов</span>
        </div>
      `;

      // Переход на страницу товара (пока выводим id в консоль)
      card.addEventListener('click', () => {
        console.log('Переход на товар с id:', product.id);
        // Когда product.html будет готов
        // window.location.href = `product.html?id=${product.id}`;
      });

      container.appendChild(card);
    });
  } catch (error) {
    console.error('Ошибка загрузки товаров:', error);
    container.innerHTML = `
      <p style="color: #ff6b6b; font-size: 24px; text-align: center; grid-column: 1 / -1;">
        Не удалось загрузить товары 😞<br>
        <small>Проверьте, запущен ли сервер на ${API_URL}</small>
      </p>`;
  }
})();
