(function () {
  //  Единое состояние приложения
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

        // Создаём контейнер для магазинов, если его нет в HTML
        const dropdown = document.querySelector(".shops-dropdown");
        if (dropdown) {
          let list = dropdown.querySelector(".shops-list");
          if (!list) {
            list = document.createElement("div");
            list.className = "shops-list";
            dropdown.appendChild(list);
          }
          renderFilterGroup(".shops-list", data.shops, "shop", "data-shop-id");
        }
      })
      .catch((err) => console.error("❌ Ошибка загрузки фильтров: ", err));
  }

  function renderFilterGroup(containerSelector, items, type, attr) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // 🔹 Генерируем <div> вместо <a>
    container.innerHTML = items
      .map(
        (item) =>
          `<div class="filter-link ${type}" ${attr}="${item.id}" style="cursor: pointer; user-select: none;">${type === "category" ? "⚡ " : "🏪 "} ${item.name} </div>`,
      )
      .join("");

    // 🔹 Делегирование кликов (исправлено под div)
    container.addEventListener("click", (e) => {
      const link = e.target.closest(".filter-link");
      if (!link) return;
      // e.preventDefault() удалён, т.к. это не ссылка

      const id = parseInt(link.getAttribute(attr), 10);
      const isCategory = type === "category";
      const current = isCategory ? state.category : state.shop;

      // 🔁 Тоггл состояния
      if (current === id) {
        if (isCategory) state.category = null;
        else state.shop = null;
      } else {
        if (isCategory) state.category = id;
        else state.shop = id;
      }

      state.page = 1;
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

    // 🔓 Если магазин выбран, держим дропдаун открытым
    const dropdown = document.querySelector(".shops-dropdown");
    if (dropdown) {
      dropdown.classList.toggle("force-open", state.shop !== null);
    }
  }

  // 📦 2. Загрузка товаров
  function loadProducts() {
    const grid = document.getElementById("products-grid");
    if (!grid) return;
    grid.innerHTML =
      '<p style="text-align:center; padding:40px;">🔍 Ищем волшебные товары...</p>';

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
