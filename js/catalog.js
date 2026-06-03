(function () {
  // ─── Константы ────────────────────────────────────────────────────────────
  const API = "http://localhost:8080";
  const LIMIT = 12;
  const TOAST_DURATION = 2500;
  const DARK_CATEGORY_ID = 666;

  // ─── Состояние ────────────────────────────────────────────────────────────
  const state = {
    category: null,
    shop: null,
    searchQuery: null,
    sort: null,
    miniFilters: { color: null, size: null, deliveryId: null },
    availableFilters: { colors: [], sizes: [], deliveryMethods: [] },
    page: 1,
    hasMore: true, // есть ли ещё страницы
    isLoading: false, // идёт ли запрос сейчас
  };

  // ─── Цвета ────────────────────────────────────────────────────────────────
  const colorMap = {
    Чёрный: "#1a1a1a",
    Черный: "#1a1a1a",
    Синий: "#1e3a8a",
    Белый: "#f8fafc",
    Серебристый: "#c0c0c0",
    Серебряный: "#c0c0c0",
    Прозрачный: "rgba(255,255,255,0.15)",
    Матовый: "#6a7f8f",
    Коричневый: "#8B4513",
    Зелёный: "#1aad50",
    Фиолетовый: "#9333ea",
    "Светло-коричневый": "#d2b48c",
    Золотистый: "#FFD700",
    Золотой: "#FFD700",
    Тис: "#5C4033",
    Красный: "#ef4444",
    Оранжевый: "#f97316",
    Серый: "#6b7280",
    Жёлтый: "rgb(248, 245, 46)",
    "Тёмно-синий": "#1e3a5f",
    Стеклянный: "rgba(200,230,255,0.4)",
    Хрустальный: "rgba(230,245,255,0.6)",
    Бежевый: "#f5f5dc",
    Старинный: "#095029",
    Подарочный: "rgb(228, 62, 104)",
    "Тёмный дуб": "#5C3A1E",
    "Светлый дуб": "#B8860B",
    "Красное дерево": "#800000",
    Тёмный: "#2d2d2d",
    Янтарный: "#FFBF00",
    Розовый: "#f472b6",
    Оловянный: "#A9A9A9",
    Медный: "#B87333",
    "Тёмно-красный": "rgb(97, 17, 17)",
  };

  // ─── Метаданные доставки ──────────────────────────────────────────────────
  const deliveryMeta = {
    Сова: { icon: "🦉", name: "Совиная почта" },
    Камин: { icon: "🔥", name: "Каминная сеть" },
    "Delivery Guy": { icon: "🧙‍♂️", name: "Курьер-волшебник" },
  };

  // ─── IntersectionObserver для infinite scroll ─────────────────────────────
  let scrollObserver = null;

  function initScrollObserver() {
    // Создаём sentinel-элемент внизу грида
    let sentinel = document.getElementById("scroll-sentinel");
    if (!sentinel) {
      sentinel = document.createElement("div");
      sentinel.id = "scroll-sentinel";
      sentinel.style.cssText = "height:1px; width:100%;";
      const grid = document.getElementById("products-grid");
      grid?.parentNode?.insertBefore(sentinel, grid.nextSibling);
    }

    if (scrollObserver) scrollObserver.disconnect();

    scrollObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && state.hasMore && !state.isLoading) {
          state.page += 1;
          loadProducts({ append: true });
        }
      },
      { rootMargin: "200px" }, // начинаем подгрузку за 200px до конца
    );

    scrollObserver.observe(sentinel);
  }

  // ─── Спиннер подгрузки ────────────────────────────────────────────────────
  function setLoadingSpinner(visible) {
    let spinner = document.getElementById("scroll-spinner");
    if (!spinner) {
      spinner = document.createElement("p");
      spinner.id = "scroll-spinner";
      spinner.style.cssText = "text-align:center; padding:20px;";
      spinner.textContent = "✨ Загружаем ещё...";
      const grid = document.getElementById("products-grid");
      grid?.parentNode?.insertBefore(spinner, grid.nextSibling);
    }
    spinner.style.display = visible ? "block" : "none";
  }

  // ─── Инициализация ────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    loadFilters();
    loadProducts();
    setupSearch();
    initMiniFilter();
    setupClickOutside();
    setupSort();
    updateFilterIconState();
    initScrollObserver();
  });

  // ─── ПОИСК ────────────────────────────────────────────────────────────────
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
    state.hasMore = true;
    resetMiniFilters();
    updateFilterIconState();
    updateActiveUI();
    loadProducts();
  }

  // ─── БОЛЬШИЕ ФИЛЬТРЫ ──────────────────────────────────────────────────────
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
          // Убираем двойную привязку: вызываем только раз
          renderFilterGroup(".shops-list", data.shops, "shop", "data-shop-id");
        }

        // 👇 ДОБАВИТЬ ЭТО: если режим включен, рисуем тёмную категорию ПОСЛЕ обычных
        if (sessionStorage.getItem("darkModeUnlocked") === "true") {
          renderDarkCategory();
        }
      })
      .catch((err) => console.error("❌ Ошибка загрузки фильтров: ", err));
  }

  // 👇 ДОБАВИТЬ ЭТУ ФУНКЦИЮ (например, сразу после loadFilters)
  function renderDarkCategory() {
    const container = document.querySelector(".categories-menu");
    if (!container) return;
    if (document.querySelector(".filter-link.dark-category")) return; // Уже есть

    const darkLink = document.createElement("div");
    darkLink.className = "filter-link category dark-category";
    darkLink.setAttribute("data-category-id", "dark");
    darkLink.innerHTML = "🌑 Тёмные товары";

    container.appendChild(darkLink);

    // Анимация плавного появления
    darkLink.style.opacity = "0";
    darkLink.style.transform = "translateY(-10px)";
    requestAnimationFrame(() => {
      darkLink.style.transition = "all 0.5s ease";
      darkLink.style.opacity = "1";
      darkLink.style.transform = "translateY(0)";
    });

    // Обработка клика
    darkLink.addEventListener("click", (e) => {
      e.stopPropagation(); // Защита от всплытия
      e.preventDefault();
      if (typeof window.applyDarkCategoryFilter === "function") {
        window.applyDarkCategoryFilter();
      }
    });
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

    // Один listener на контейнер — не дублируется при повторном вызове,
    // потому что innerHTML пересоздаёт узлы
    container.addEventListener("click", (e) => {
      const link = e.target.closest(".filter-link");
      if (!link) return;

      const id = parseInt(link.getAttribute(attr), 10);
      const isCategory = type === "category";
      const current = isCategory ? state.category : state.shop;

      if (isCategory) state.category = current === id ? null : id;
      else state.shop = current === id ? null : id;

      state.page = 1;
      state.hasMore = true;
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

    document.querySelectorAll(".filter-link.dark-category").forEach((el) => {
      el.classList.toggle("active", state.category === "dark");
    });
  }

  // ─── ЗАГРУЗКА ТОВАРОВ ─────────────────────────────────────────────────────
  /**
   * @param {{ append?: boolean }} options
   *   append=true  — добавляем карточки к существующим (infinite scroll)
   *   append=false — сбрасываем грид и рендерим с нуля (новый фильтр/поиск)
   */
  function loadProducts({ append = false } = {}) {
    if (state.isLoading) return;
    state.isLoading = true;

    const grid = document.getElementById("products-grid");
    if (!grid) return;

    if (!append) {
      document.getElementById("end-of-catalog")?.remove();
      grid.innerHTML =
        '<p style="text-align:center; padding:40px;">🔍 Ищем волшебные товары...</p>';
    } else {
      setLoadingSpinner(true);
    }

    const params = new URLSearchParams({ page: state.page, limit: LIMIT });
    if (state.category) params.set("category", state.category);
    if (state.shop) params.set("shop", state.shop);
    if (state.searchQuery) params.set("q", state.searchQuery);
    if (state.miniFilters.color) params.set("color", state.miniFilters.color);
    if (state.miniFilters.size) params.set("size", state.miniFilters.size);
    if (state.miniFilters.deliveryId)
      params.set("delivery", state.miniFilters.deliveryId);
    if (state.sort) params.set("sort", state.sort);

    let endpoint = `${API}/api/products`;

    if (state.category === "dark") {
      endpoint = `${API}/api/products/dark`;
    } else if (state.searchQuery) {
      endpoint = `${API}/api/products/search`;
    }

    fetch(`${endpoint}?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка сети");
        return res.json();
      })
      .then((data) => {
        setLoadingSpinner(false);

        const products = data.products || [];

        // Определяем, есть ли ещё страницы
        // Если бэкенд возвращает total — используем его, иначе смотрим на длину
        if (typeof data.total === "number") {
          state.hasMore = state.page * LIMIT < data.total;
        } else {
          state.hasMore = products.length === LIMIT;
        }

        if (!append) grid.innerHTML = "";

        if (!products.length && !append) {
          grid.innerHTML = `<p style="text-align:center; padding:40px;">📦 Ничего не найдено. Сбросьте фильтры или попробуйте другие.</p>`;
          state.isLoading = false;
          return;
        }

        // Обновляем фасеты только при первой загрузке (не при догрузке)
        if (!append && data.filters) {
          state.availableFilters = data.filters;
          renderMiniFilterOptions();
        }

        const fragment = document.createDocumentFragment();
        products.forEach((product) => {
          const card = document.createElement("div");
          card.className = "product-card";
          card.innerHTML = `
            <div class="card-image-area"><img src="${API}${product.image_url}" alt="${product.name}" loading="lazy"></div>
            <div class="card-footer">
              <span class="product-name">${product.name}</span>
              <span class="product-price">${product.price} Галлеонов</span>
            </div>`;
          card.addEventListener("click", () => {
            window.location.href = `/frontend/product.html?id=${product.id}`;
          });
          fragment.appendChild(card);
        });
        grid.appendChild(fragment);

        // Если товары кончились — показываем сообщение
        if (!state.hasMore) {
          let endMsg = document.getElementById("end-of-catalog");
          if (!endMsg) {
            endMsg = document.createElement("p");
            endMsg.id = "end-of-catalog";
            endMsg.style.cssText =
              "text-align:center; padding-bottom:30px; opacity:0.5; width:100%; margin: 0 auto;";
            endMsg.textContent = "✨ Все товары загружены";
            grid.parentNode.parentNode.insertBefore(
              endMsg,
              grid.parentNode.nextSibling,
            );
          }
        }

        state.isLoading = false;
      })
      .catch((err) => {
        console.error(err);
        setLoadingSpinner(false);
        state.isLoading = false;
        if (!append) {
          grid.innerHTML =
            '<p style="text-align:center; padding:40px; color:#e74c3c;">⚠️ Ошибка загрузки товаров</p>';
        } else {
          showToast("⚠️ Не удалось загрузить следующую страницу");
        }
      });
  }

  // ─── МИНИ-ФИЛЬТР ──────────────────────────────────────────────────────────
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

    // Не рендерим если фильтры пустые (например при resetMiniFilters до первого loadProducts)
    const { colors, sizes, deliveryMethods } = state.availableFilters;
    if (!colors?.length && !sizes?.length && !deliveryMethods?.length) return;

    const hasActive =
      state.miniFilters.color ||
      state.miniFilters.size ||
      state.miniFilters.deliveryId;
    let html = "";

    if (colors?.length) {
      html += `<div class="mini-filter-section"><span class="section-label">Цвет</span><div class="mini-filter-options">`;
      colors.forEach((c) => {
        const bg = colorMap[c] || "#555";
        const active = state.miniFilters.color === c ? "active" : "";
        html += `<button class="mf-color ${active}" style="background:${bg};" data-value="${c}" title="${c}"></button>`;
      });
      html += `</div></div>`;
    }

    if (sizes?.length) {
      html += `<div class="mini-filter-section"><span class="section-label">Размер</span><div class="mini-filter-options">`;
      sizes.forEach((s) => {
        const active = state.miniFilters.size === s ? "active" : "";
        html += `<button class="mf-btn ${active}" data-value="${s}">${s}</button>`;
      });
      html += `</div></div>`;
    }

    if (deliveryMethods?.length) {
      html += `<div class="mini-filter-section"><span class="section-label">Доставка</span><div class="mini-filter-options">`;
      deliveryMethods.forEach((d) => {
        const meta = deliveryMeta[d.name] || { icon: "📦", name: d.name };
        const active = state.miniFilters.deliveryId === d.id ? "active" : "";
        html += `<button class="mf-btn mf-delivery ${active}" data-id="${d.id}"><span class="d-icon">${meta.icon}</span>${meta.name}</button>`;
      });
      html += `</div></div>`;
    }

    html += `<div class="mf-controls">`;
    if (hasActive) html += `<button id="mf-clear">Сбросить</button>`;
    html += `<button id="mf-apply" class="mf-btn mf-apply"> Применить</button>`;
    html += `</div>`;

    panel.innerHTML = html;

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
      state.page = 1;
      state.hasMore = true;
      loadProducts();
      toggleMiniPanel(false);
    });
    panel.querySelector("#mf-apply")?.addEventListener("click", () => {
      state.page = 1;
      state.hasMore = true;
      loadProducts();
      toggleMiniPanel(false);
    });
  }

  function toggleMiniFilterValue(type, value) {
    state.miniFilters[type] = state.miniFilters[type] === value ? null : value;
    state.page = 1;
    renderMiniFilterOptions();
  }

  function resetMiniFilters() {
    state.miniFilters = { color: null, size: null, deliveryId: null };
    updateFilterIconState();
    renderMiniFilterOptions();
  }

  // ─── ИКОНКА ФИЛЬТРА ───────────────────────────────────────────────────────
  function updateFilterIconState() {
    // Исправлено: опечатка "Фильтr" → "Фильтр", единый надёжный селектор
    const icon =
      document.querySelector('.icon-btn[title="Фильтр"]') ||
      document.querySelector(".header-icons button.filter-toggle");
    if (!icon) return;

    const hasMainFilter = state.category || state.shop || state.searchQuery;
    icon.style.opacity = hasMainFilter ? "1" : "0.4";
    icon.style.pointerEvents = hasMainFilter ? "auto" : "none";
    icon.classList.toggle("filter-icon-active", !!hasMainFilter);
  }

  function toggleMiniPanel(show) {
    const panel = document.getElementById("mini-filter-panel");
    if (panel) panel.classList.toggle("open", show);
  }

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

  // ─── СОРТИРОВКА ───────────────────────────────────────────────────────────
  function setupSort() {
    const sortSelect = document.getElementById("sort-select");
    if (!sortSelect) return;
    sortSelect.addEventListener("change", (e) => {
      state.sort = e.target.value || null;
      state.page = 1;
      state.hasMore = true;
      loadProducts();
    });
  }

  // ─── TOAST ────────────────────────────────────────────────────────────────
  function showToast(message) {
    const old = document.querySelector(".cart-toast");
    if (old) old.remove();
    const toast = document.createElement("div");
    toast.className = "cart-toast"; // стили берём из CSS, не из инлайна
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), TOAST_DURATION);
  }

  window.applyDarkCategoryFilter = function () {
    state.category = state.category === "dark" ? null : "dark";
    state.shop = null; // Сбрасываем магазин при выборе тёмных товаров
    state.page = 1;
    resetMiniFilters();
    updateFilterIconState();
    updateActiveUI();
    loadProducts();
  };
})();
