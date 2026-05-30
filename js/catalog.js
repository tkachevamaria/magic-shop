(function () {
  // 🧙‍♂️ Единое состояние приложения
  const state = {
    category: null,
    shop: null,
    page: 1,
    limit: 12,
  };

  const API = "http://localhost:8080";

  document.addEventListener("DOMContentLoaded", () => {
    loadFilters();
    loadProducts(); // Первая загрузка без фильтров
  });

  // 📥 1. Загрузка фильтров
  function loadFilters() {
    fetch(`${API}/api/filters`)
      .then((res) => res.json())
      .then((data) => {
        renderFilterGroup(
          ".categories-menu",
          data.categories,
          "category",
          "data-category-id",
        );

        // Магазинам нужен контейнер внутри dropdown
        const shopsDropdown = document.querySelector(".shops-dropdown");
        if (shopsDropdown && !shopsDropdown.querySelector(".shops-list")) {
          const list = document.createElement("div");
          list.className = "shops-list";
          shopsDropdown.appendChild(list);
          renderFilterGroup(".shops-list", data.shops, "shop", "data-shop-id");
        }
      })
      .catch((err) => console.error("❌ Ошибка загрузки фильтров:", err));
  }

  function renderFilterGroup(containerSelector, items, type, attr) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    container.innerHTML = items
      .map(
        (item) =>
          `<a href="#" class="filter-link ${type}" ${attr}="${item.id}">${type === "category" ? "⚡" : "🏪"} ${item.name}</a>`,
      )
      .join("");

    // Делегирование кликов
    container.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (!link) return;
      e.preventDefault();

      const id = parseInt(link.getAttribute(attr), 10);
      const isCategory = type === "category";
      const current = isCategory ? state.category : state.shop;

      // 🔁 Тоггл: если кликнули на уже выбранный - снимаем, иначе выбираем новый
      if (current === id) {
        if (isCategory) state.category = null;
        else state.shop = null;
      } else {
        if (isCategory) state.category = id;
        else state.shop = id;
      }

      state.page = 1; // Сброс пагинации при смене фильтра
      updateActiveUI();
      loadProducts();
    });
  }

  // 🎨 Обновление визуального состояния кнопок
  function updateActiveUI() {
    document.querySelectorAll(".filter-link.category").forEach((el) => {
      el.classList.toggle(
        "active",
        parseInt(el.dataset.categoryId) === state.category,
      );
    });
    document.querySelectorAll(".filter-link.shop").forEach((el) => {
      el.classList.toggle("active", parseInt(el.dataset.shopId) === state.shop);
    });
  }

  // 📦 2. Загрузка товаров
  function loadProducts() {
    const grid = document.getElementById("products-grid");
    if (!grid) return;

    grid.innerHTML =
      '<p style="text-align:center; padding:40px;">🔍 Ищем волшебные товары...</p>';

    // Формируем параметры запроса точно под твой бэкенд
    const params = new URLSearchParams({
      page: state.page,
      limit: state.limit,
    });
    if (state.category) params.set("category", state.category);
    if (state.shop) params.set("shop", state.shop);

    fetch(`${API}/api/products?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка сети");
        return res.json();
      })
      .then((data) => {
        grid.innerHTML = "";
        const products = data.products || [];

        if (!products.length) {
          grid.innerHTML =
            '<p style="text-align:center; padding:40px;">📦 Ничего не найдено. Сбросьте фильтры или попробуйте другие.</p>';
          return;
        }

        products.forEach((product) => {
          const card = document.createElement("div");
          card.className = "product-card";
          card.dataset.productId = product.id;
          card.innerHTML = `
            <div class="card-image-area">
              <img src="${API}${product.image_url}" alt="${product.name}">
            </div>
            <div class="card-footer">
              <span class="product-name">${product.name}</span>
              <span class="product-price">${product.price} Галлеонов</span>
            </div>
          `;
          card.addEventListener("click", () => {
            window.location.href = `/frontend/product.html?id=${product.id}`;
          });
          grid.appendChild(card);
        });
      })
      .catch((err) => {
        console.error(err);
        grid.innerHTML =
          '<p style="text-align:center; padding:40px; color:#e74c3c;">⚠️ Ошибка загрузки товаров</p>';
      });
  }
})();
