(function () {
  const state = {
    category: null,
    shop: null,
    searchQuery: null,
    sort: null,
    miniFilters: { color: null, size: null, deliveryId: null },
    availableFilters: { colors: [], sizes: [], deliveryMethods: [] },
    page: 1,
    limit: 12,
  };

  const API = "http://localhost:8080";

 const colorMap = {
  // Было
  Чёрный: "#1a1a1a",
  Черный: "#1a1a1a",
  Синий: "#1e3a8a",
  Белый: "#f8fafc",
  Серебристый: "#c0c0c0",
  Прозрачный: "rgba(255,255,255,0.15)",
  Матовый: "#4b5563",
  Коричневый: "#8B4513",
  Зелёный: "#22c55e",
  Фиолетовый: "#9333ea",
  "Светло-коричневый": "#D2B48C",
  Золотистый: "#FFD700",
  Тис: "#5C4033",       
  Красный: "#ef4444",
  Оранжевый: "#f97316",
  Серый: "#6b7280",
  Жёлтый: "#eab308",
  "Тёмно-синий": "#1e3a5f",
  Золотой: "#FFD700",
  Серебряный: "#C0C0C0",
  Стеклянный: "rgba(200,230,255,0.4)",
  Хрустальный: "rgba(230,245,255,0.6)",
  Бежевый: "#f5f5dc",
  Старинный: "#D4C4A8",
  Подарочный: "#E8D8B0",   // праздничный золотисто-бежевый
  "Тёмный дуб": "#5C3A1E",
  "Светлый дуб": "#B8860B",
  "Красное дерево": "#800000",
  "Тёмный": "#2d2d2d",     // универсальный темный
  Янтарный: "#FFBF00",
  Розовый: "#f472b6",
  Оловянный: "#A9A9A9",
  Медный: "#B87333",
  "Тёмно-красный": "#991b1b",
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
    setupSort();
    updateFilterIconState();
  });

  /* 🔍 ПОИСК */
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
    resetMiniFilters();
    updateFilterIconState();
    updateActiveUI();
    loadProducts();
  }

  /* 📥 БОЛЬШИЕ ФИЛЬТРЫ */
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
      .catch((err) => console.error("❌ Ошибка загрузки фильтров:", err));
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
      resetMiniFilters();
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

  /* 📦 ЗАГРУЗКА ТОВАРОВ + ФАСЕТЫ */
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
    if (state.sort) params.set("sort", state.sort);

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

  /* 🎛 МИНИ-ФИЛЬТР */
  function initMiniFilter() {
    const panel = document.createElement("div");
    panel.id = "mini-filter-panel";
    panel.className = "mini-filter-panel";
    document.body.appendChild(panel);
    panel.addEventListener("click", (e) => e.stopPropagation());
  }

  function renderMiniFilterOptions() {
    const panel = document.getElementById("mini-filter-panel");
    if (!panel) return;

    const hasActive =
      state.miniFilters.color ||
      state.miniFilters.size ||
      state.miniFilters.deliveryId;
    let html = "";

    if (state.availableFilters.colors?.length) {
      html += `<div class="mini-filter-section"><span class="section-label">Цвет</span><div class="mini-filter-options">`;
      state.availableFilters.colors.forEach((c) => {
        const bg = colorMap[c] || "#555";
        const active = state.miniFilters.color === c ? "active" : "";
        html += `<button class="mf-color ${active}" style="background:${bg};" data-value="${c}" title="${c}"></button>`;
      });
      html += `</div></div>`;
    }

    if (state.availableFilters.sizes?.length) {
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
        // ВАЖНО: используем d.name и d.id (с маленькой буквы), как отдаёт Go
        const meta = deliveryMeta[d.name] || { icon: "📦", name: d.name };
        const active = state.miniFilters.deliveryId === d.id ? "active" : "";
        html += `<button class="mf-btn mf-delivery ${active}" data-id="${d.id}"> <span class="d-icon">${meta.icon}</span>${meta.name}</button>`;
      });
      html += `</div></div>`;
    }

    // Кнопки управления
    html += `<div class="mf-controls">`;
    if (hasActive) html += `<button id="mf-clear">Сбросить</button>`;
    html += `<button id="mf-apply" class="mf-btn mf-apply"> Применить</button>`;
    html += `</div>`;

    panel.innerHTML = html;

    // Привязка событий (только обновление UI)
    panel
      .querySelectorAll(".mf-color")
      .forEach((btn) =>
        btn.addEventListener("click", () =>
          toggleMiniFilterValue("color", btn.dataset.value),
        ),
      );
    panel
      .querySelectorAll(".mf-btn[data-value]")
      .forEach((btn) =>
        btn.addEventListener("click", () =>
          toggleMiniFilterValue("size", btn.dataset.value),
        ),
      );
    panel
      .querySelectorAll(".mf-btn[data-id]")
      .forEach((btn) =>
        btn.addEventListener("click", () =>
          toggleMiniFilterValue("deliveryId", parseInt(btn.dataset.id)),
        ),
      );

    panel.querySelector("#mf-clear")?.addEventListener("click", () => {
      resetMiniFilters();
      loadProducts();
      toggleMiniPanel(false);
    });
    panel.querySelector("#mf-apply")?.addEventListener("click", () => {
      loadProducts();
      toggleMiniPanel(false);
    });
  }

  function toggleMiniFilterValue(type, value) {
    state.miniFilters[type] = state.miniFilters[type] === value ? null : value;
    state.page = 1;
    renderMiniFilterOptions();
    updateFilterIconState();
  }

  function resetMiniFilters() {
    state.miniFilters = { color: null, size: null, deliveryId: null };
    updateFilterIconState();
    renderMiniFilterOptions();
  }

  function updateFilterIconState() {
    const icon = document.querySelector(
      '.icon-btn[title="Фильтр"], .header-icons button.filter-toggle',
    );
    if (!icon) return;

    const hasAnyFilter =
      state.category ||
      state.shop ||
      state.searchQuery ||
      state.miniFilters.color ||
      state.miniFilters.size ||
      state.miniFilters.deliveryId;

    icon.style.opacity = hasAnyFilter ? "1" : "0.4";
    icon.style.pointerEvents = hasAnyFilter ? "auto" : "none";
    icon.classList.toggle("filter-icon-active", !!hasAnyFilter);
  }

  function toggleMiniPanel(show) {
    const panel = document.getElementById("mini-filter-panel");
    if (panel) panel.classList.toggle("open", show);
  }

  // Глобальная функция для шапки
  window.toggleMiniFilter = () => {
    const hasMainFilter = state.category || state.shop || state.searchQuery;
    if (!hasMainFilter) {
      showToast("🔍 Сначала примените поиск, категорию или магазин");
      return;
    }
    const panel = document.getElementById("mini-filter-panel");
    if (panel) panel.classList.toggle("open");
  };

  function setupClickOutside() {
    document.addEventListener("click", (e) => {
      const panel = document.getElementById("mini-filter-panel");
      const btn = document.querySelector('.icon-btn[title="Фильтр"]');
      if (
        panel?.classList.contains("open") &&
        !panel.contains(e.target) &&
        e.target !== btn &&
        !btn?.contains(e.target)
      ) {
        toggleMiniPanel(false);
      }
    });
  }

  /* СОРТИРОВКА */
  function setupSort() {
    const sortSelect = document.getElementById("sort-select");
    if (!sortSelect) return;
    sortSelect.addEventListener("change", (e) => {
      state.sort = e.target.value || null;
      state.page = 1;
      loadProducts();
    });
  }

  /*  TOAST */
  function showToast(message) {
    const old = document.querySelector(".cart-toast");
    if (old) old.remove();
    const toast = document.createElement("div");
    toast.className = "cart-toast";
    toast.style.cssText = `position: fixed; bottom: 20px; right: 20px; background: #1e293b; color: #fff; padding: 12px 24px; border-radius: 12px; border: 1px solid var(--gold-glow); z-index: 1000; animation: slideIn 0.3s ease;`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }
})();
