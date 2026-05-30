(function() {
    fetch('http://localhost:8080/api/filters')
        .then(res => res.json())
        .then(data => {
            // Категории
            const categoriesNav = document.querySelector('.categories-menu');
            if (categoriesNav) {
                categoriesNav.innerHTML = data.categories.map(cat => 
                    `<a href="#" class="menu-link" data-category-id="${cat.id}">⚡ ${cat.name}</a>`
                ).join('');
            }

            // Магазины
            const shopsDropdown = document.querySelector('.shops-dropdown');
            if (shopsDropdown) {
                // Можно создать выпадающий список внутри или заменить содержимое
                // Например, добавить после текущего span список ссылок
                let shopList = document.createElement('div');
                shopList.className = 'shops-list';
                shopList.innerHTML = data.shops.map(shop => 
                    `<a href="#" class="shop-link" data-shop-id="${shop.id}">🏪 ${shop.name}</a>`
                ).join('');
                shopsDropdown.appendChild(shopList);
            }
        })
        .catch(err => console.error('Ошибка загрузки фильтров:', err));
})();