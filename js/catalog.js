(function () {
  const state = {
    category: null,
    shop: null,
    searchQuery: null,
    miniFilters: { color: null, size: null, deliveryId: null },
    availableFilters: { colors: [], sizes: [], deliveryMethods: [] },
    page: 1,
    limit: 12,
  };
  const API = "http://localhost:8080";

  // Маппинг цветов для кружочков
  const colorMap = {
    Чёрный: "#1a1a1a",
    Черный: "#1a1a1a",
    Синий: "#1e3a8a",
    Белый: "#f8fafc",
    Серебристый: "#c0c0c0",
    Прозрачный: "rgba(255,255,255,0.15)",
    Матовый: "#4b5563",
    Золотистый: "#d97706",
    Янтарный: "#f59e0b",
    Фиолетовый: "#7c3aed",
    Зелёный: "#166534",
    Зеленый: "#166534",
    "Тёмно-зелёный": "#064e3b",
    Изумрудный: "#10b981",
    Красный: "#dc2626",
    "Тёмный дуб": "#5c3a21",
    "Светлый дуб": "#b58b4c",
    "Красное дерево": "#7f2d1f",
    Кожаный: "#8b5a2b",
    Тканевый: "#9ca3af",
    Бархатный: "#4c1d95",
    Розовый: "#f472b6",
    Перламутровый: "#e9d5ff",
    Серый: "#6b7280",
    Бурый: "#78350f",
    Стеклянный: "rgba(200,230,255,0.4)",
    Хрустальный: "#bae6fd",
  };
  const deliveryMeta = {
    Сова: { icon: "🦉", name: "Совиная почта" },
    Камин: { icon: "🔥", name: "Каминная сеть" },
    "Delivery Guy": { icon: "🧙‍♂️", name: "Курьер-волшебник" },
  };

  document.addEventListener("DOMContentLoaded", () => {
    loadFilters();
    loadProducts();
    setupSearch();
    initMiniFilter();
    setupClickOutside();
  });

  // 🔍 Поиск
  function setupSearch() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.matches(".search-input"))
        handleSearch(e.target.value.trim());
    });
    document.addEventListener("click", (e) => {
      if (e.target.closest(".search-arrow")) {
        const input = document.querySelector(".search-input");
        if (input) handleSearch(input.value.trim());
      }
    });
  }

  function handleSearch(query) {
    state.searchQuery = query || null;
    state.page = 1;
    resetMiniFilters(); // Сброс мини-фильтра при поиске
    updateFilterIconState();
    updateActiveUI();
    loadProducts();
  }

  // 📥 Большие фильтры
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
    container.innerHTML = items
      .map(
        (item) =>
          `<div class="filter-link ${type}" ${attr}="${item.id}">${type === "category" ? "⚡ " : "🏪 "}${item.name}</div>`,
      )
      .join("");

    container.addEventListener("click", (e) => {
      const link = e.target.closest(".filter-link");
      if (!link) return;
      const id = parseInt(link.getAttribute(attr), 10);
      const isCategory = type === "category";
      const current = isCategory ? state.category : state.shop;

      if (current === id) {
        if (isCategory) state.category = null;
        else state.shop = null;
      } else {
        if (isCategory) state.category = id;
        else state.shop = id;
      }

      state.page = 1;
      resetMiniFilters(); // Сброс мини-фильтра при смене больших фильтров
      updateFilterIconState();
      updateActiveUI();
      loadProducts();
    });
  }

  function updateActiveUI() {
    document
      .querySelectorAll(".filter-link.category")
      .forEach((el) =>
        el.classList.toggle(
          "active",
          parseInt(el.dataset.categoryId) === state.category,
        ),
      );
    document
      .querySelectorAll(".filter-link.shop")
      .forEach((el) =>
        el.classList.toggle(
          "active",
          parseInt(el.dataset.shopId) === state.shop,
        ),
      );
  }

  // 📦 Загрузка товаров + захват фасетов
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
    if (state.searchQuery) params.set("q", state.searchQuery);
    if (state.miniFilters.color) params.set("color", state.miniFilters.color);
    if (state.miniFilters.size) params.set("size", state.miniFilters.size);
    if (state.miniFilters.deliveryId)
      params.set("delivery", state.miniFilters.deliveryId);

    const endpoint = state.searchQuery
      ? `${API}/api/products/search`
      : `${API}/api/products`;

    fetch(`${endpoint}?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка сети");
        return res.json();
      })
      .then((data) => {
        grid.innerHTML = "";
        const products = data.products || [];
        if (!products.length) {
          grid.innerHTML = `<p style="text-align:center; padding:40px;">📦 Ничего не найдено. Сбросьте фильтры или попробуйте другие.</p>`;
          return;
        }

        // Обновляем доступные фильтры для мини-панели
        if (data.filters) {
          state.availableFilters = data.filters;
          renderMiniFilterOptions();
        }

        products.forEach((product) => {
          const card = document.createElement("div");
          card.className = "product-card";
          card.innerHTML = `
            <div class="card-image-area"><img src="${API}${product.image_url}" alt="${product.name}"></div>
            <div class="card-footer">
              <span class="product-name">${product.name}</span>
              <span class="product-price">${product.price} Галлеонов</span>
            </div>`;
          card.addEventListener(
            "click",
            () =>
              (window.location.href = `/frontend/product.html?id=${product.id}`),
          );
          grid.appendChild(card);
        });
      })
      .catch((err) => {
        console.error(err);
        grid.innerHTML =
          '<p style="text-align:center; padding:40px; color:#e74c3c;">⚠️ Ошибка загрузки товаров</p>';
      });
  }

  // 🎛 Мини-фильтр
  function initMiniFilter() {
    const panel = document.createElement("div");
    panel.id = "mini-filter-panel";
    panel.className = "mini-filter-panel";
    document.body.appendChild(panel);

    panel.addEventListener("click", (e) => e.stopPropagation()); // Не закрывать при клике внутри
  }

  function renderMiniFilterOptions() {
    const panel = document.getElementById("mini-filter-panel");
    if (!panel) return;

    const hasActive =
      state.miniFilters.color ||
      state.miniFilters.size ||
      state.miniFilters.deliveryId;

    let html = "";
    if (state.availableFilters.colors.length) {
      html += `<div class="mini-filter-section"><span class="section-label">Цвет</span><div class="mini-filter-options">`;
      state.availableFilters.colors.forEach((c) => {
        const bg = colorMap[c] || "#555";
        const active = state.miniFilters.color === c ? "active" : "";
        html += `<button class="mf-color ${active}" style="background:${bg};" data-value="${c}" title="${c}"></button>`;
      });
      html += `</div></div>`;
    }

    if (state.availableFilters.sizes.length) {
      html += `<div class="mini-filter-section"><span class="section-label">Размер</span><div class="mini-filter-options">`;
      state.availableFilters.sizes.forEach((s) => {
        const active = state.miniFilters.size === s ? "active" : "";
        html += `<button class="mf-btn ${active}" data-value="${s}">${s}</button>`;
      });
      html += `</div></div>`;
    }

    if (state.availableFilters.deliveryMethods?.length) {
      html += `<div class="mini-filter-section"><span class="section-label">Доставка</span><div class="mini-filter-options">`;
      state.availableFilters.deliveryMethods.forEach((d) => {
        const meta = deliveryMeta[d.Name] || { icon: "📦", name: d.Name };
        const active = state.miniFilters.deliveryId === d.ID ? "active" : "";
        html += `<button class="mf-btn mf-delivery ${active}" data-id="${d.ID}"><span class="d-icon">${meta.icon}</span>${meta.name}</button>`;
      });
      html += `</div></div>`;
    }

    if (hasActive) {
      html += `<button id="mf-clear">Сбросить фильтр</button>`;
    }

    panel.innerHTML = html;

    // Привязка событий
    panel
      .querySelectorAll(".mf-color")
      .forEach((btn) =>
        btn.addEventListener("click", () =>
          applyMiniFilter("color", btn.dataset.value),
        ),
      );
    panel
      .querySelectorAll(".mf-btn[data-value]")
      .forEach((btn) =>
        btn.addEventListener("click", () =>
          applyMiniFilter("size", btn.dataset.value),
        ),
      );
    panel
      .querySelectorAll(".mf-btn[data-id]")
      .forEach((btn) =>
        btn.addEventListener("click", () =>
          applyMiniFilter("deliveryId", parseInt(btn.dataset.id)),
        ),
      );
    panel.querySelector("#mf-clear")?.addEventListener("click", () => {
      resetMiniFilters();
      loadProducts();
      toggleMiniPanel(false);
    });
  }

  function applyMiniFilter(type, value) {
    state.miniFilters[type] = state.miniFilters[type] === value ? null : value; // Тоггл
    state.page = 1;
    updateFilterIconState();
    renderMiniFilterOptions(); // Перерисовать кнопки
    loadProducts();
    toggleMiniPanel(false); // Закрыть панель после выбора
  }

  function resetMiniFilters() {
    state.miniFilters = { color: null, size: null, deliveryId: null };
    updateFilterIconState();
  }

  function updateFilterIconState() {
    const icon = document.querySelector(
      '.icon-btn[title="Фильтр"], .header-icons button[onclick*="Фильтр"]',
    );
    if (!icon) return;
    const hasAnyFilter =
      state.category ||
      state.shop ||
      state.searchQuery ||
      state.miniFilters.color ||
      state.miniFilters.size ||
      state.miniFilters.deliveryId;
    icon.classList.toggle("filter-icon-active", !!hasAnyFilter);
  }

  function toggleMiniPanel(show) {
    const panel = document.getElementById("mini-filter-panel");
    if (panel) panel.classList.toggle("open", show);
  }

  function setupClickOutside() {
    document.addEventListener("click", (e) => {
      const panel = document.getElementById("mini-filter-panel");
      const btn = document.querySelector('.icon-btn[title="Фильтр"]');
      if (
        panel &&
        panel.classList.contains("open") &&
        !panel.contains(e.target) &&
        e.target !== btn &&
        !btn?.contains(e.target)
      ) {
        toggleMiniPanel(false);
      }
    });
  }
})();
