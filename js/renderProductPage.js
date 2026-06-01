(function () {
  const API_URL = "http://localhost:8080/api";
  const PHOTO_URL = "http://localhost:8080";
  const container = document.getElementById("product-content");
  if (!container) return;

  const TOKEN_KEY = "token";
  function getAuthHeaders() {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  const deliveryMeta = {
    Сова: { icon: "🦉", name: "Совиная почта" },
    Камин: { icon: "🔥", name: "Каминная сеть" },
    "Delivery Guy": { icon: "🧙‍♂️", name: "Курьер-волшебник" },
  };

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

  const productState = {
    product: null,
    items: [],
    selectedColor: null,
    selectedSize: null,
    currentItemId: null,
    quantity: 1,
  };

  function getDeliveryInfo(name) {
    const key = name?.trim();
    return deliveryMeta[key] || deliveryMeta["Сова"];
  }

  function renderProduct(product) {
    const { icon, name } = getDeliveryInfo(product.delivery_name);
    container.innerHTML = `
    <div class="product-card-large">
      <div class="product-image">
        <img src="${PHOTO_URL}${product.image_url || ""}" alt="${product.name}">
      </div>
      <div class="product-info">
        <h1 class="product-title">${product.name}</h1>
        
        <div class="product-meta">
          <div class="product-price">${product.price} Галлеонов</div>
          <div class="product-delivery-compact">
            <span class="delivery-icon">${icon}</span>
            <span class="delivery-text">${name} · ${product.delivery_days} дн.</span>
          </div>
        </div>

        <div class="product-description">${product.description || "Описание отсутствует"}</div>

        <div id="options-container"></div>
        <div id="action-container"></div>
        <a href="index.html" class="back-link">Вернуться в каталог</a>
      </div>
    </div>
  `;
  }

  function renderOptions() {
    const { items } = productState;
    if (!items.length) return;

    const colors = [...new Set(items.map((i) => i.color))];
    const sizes = [...new Set(items.map((i) => i.size))];
    const optionsContainer = document.getElementById("options-container");
    if (!optionsContainer) return;

    optionsContainer.innerHTML = `
      ${
        colors.length > 0
          ? `
        <span class="section-label">Цвет:</span>
        <div class="options-group" id="colors-group">
          ${colors
            .map((color) => {
              const hex = colorMap[color] || "#555";
              return `<button class="color-circle-btn" style="background-color: ${hex};" title="${color}" data-value="${color}"></button>`;
            })
            .join("")}
        </div>
      `
          : ""
      }
      ${
        sizes.length > 0
          ? `
        <span class="section-label">Размер:</span>
        <div class="options-group" id="sizes-group">
          ${sizes.map((size) => `<button class="option-btn size-btn" data-value="${size}">${size}</button>`).join("")}
        </div>
      `
          : ""
      }
      <span id="stock-hint" class="stock-status"></span>
    `;

    optionsContainer.querySelectorAll(".color-circle-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        optionsContainer
          .querySelectorAll(".color-circle-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        productState.selectedColor = btn.dataset.value;
        updateStockInfo();
      });
    });

    optionsContainer.querySelectorAll(".size-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        optionsContainer
          .querySelectorAll(".size-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        productState.selectedSize = btn.dataset.value;
        updateStockInfo();
      });
    });
  }

  function updateStockInfo() {
    const { items, selectedColor, selectedSize } = productState;
    const hint = document.getElementById("stock-hint");

    if (!selectedColor || !selectedSize) {
      if (hint) {
        hint.textContent = "Выберите цвет и размер";
        hint.className = "stock-status";
      }
      renderAddButton();
      return;
    }

    const variant = items.find(
      (i) => i.color === selectedColor && i.size === selectedSize,
    );
    const stock = variant?.stock_quantity || 0;
    productState.currentItemId = variant?.item_id || null;

    if (stock > 0) {
      if (hint) {
        hint.textContent = `В наличии: ${stock} шт.`;
        hint.className = "stock-status in-stock";
      }
      renderAddButton();
    } else {
      if (hint) {
        hint.textContent = "Нет в наличии";
        hint.className = "stock-status out-of-stock";
      }
      renderOutOfStock();
    }
  }

  function renderAddButton() {
    const container = document.getElementById("action-container");
    if (!container) return;
    container.innerHTML = `<button id="add-to-cart-btn" class="add-to-cart" ${!productState.currentItemId ? "disabled" : ""}>Добавить в корзину</button>`;
    const btn = document.getElementById("add-to-cart-btn");
    if (btn && productState.currentItemId)
      btn.addEventListener("click", addToCart);
  }

  function renderOutOfStock() {
    const container = document.getElementById("action-container");
    if (!container) return;
    container.innerHTML = `<button class="add-to-cart" disabled>Нет в наличии</button>`;
  }

  function renderQuantityControls(initialQty = 1) {
    const { currentItemId, items } = productState;
    const variant = items.find((i) => i.item_id === currentItemId);
    const maxStock = variant?.stock_quantity || 1;
    const container = document.getElementById("action-container");
    if (!container) return;

    container.innerHTML = `
      <div class="qty-controls">
        <button id="btn-minus" class="option-btn">−</button>
        <span id="qty-display">${initialQty}</span>
        <button id="btn-plus" class="option-btn" ${initialQty >= maxStock ? "disabled" : ""}>+</button>
        <button id="btn-remove" class="remove-btn">Убрать</button>
      </div>
    `;

    const qtyDisplay = document.getElementById("qty-display");
    const btnPlus = document.getElementById("btn-plus");

    document.getElementById("btn-minus").addEventListener("click", async () => {
      let qty = parseInt(qtyDisplay.textContent);
      if (qty > 1) {
        qty--;
        qtyDisplay.textContent = qty;
        await syncQuantityWithBackend("decrement");
        btnPlus.disabled = false;
      }
    });

    btnPlus.addEventListener("click", async () => {
      let qty = parseInt(qtyDisplay.textContent);
      if (qty < maxStock) {
        qty++;
        qtyDisplay.textContent = qty;
        await syncQuantityWithBackend("increment");
        if (qty >= maxStock) btnPlus.disabled = true;
      } else {
        showToast("Достигнут лимит наличия");
        btnPlus.disabled = true;
      }
    });

    document
      .getElementById("btn-remove")
      .addEventListener("click", async () => {
        if (!productState.currentItemId) return;
        try {
          const res = await fetch(
            `${API_URL}/cart/${productState.currentItemId}`,
            {
              method: "DELETE",
              headers: getAuthHeaders(),
            },
          );
          if (res.status === 401) return (window.location.href = "/auth.html");
          if (!res.ok) throw new Error("Ошибка сети");
          renderAddButton();
          showToast("Товар убран из корзины");
        } catch (err) {
          console.error(err);
          showToast("Не удалось убрать товар");
        }
      });
  }

  async function syncQuantityWithBackend(action) {
    if (!productState.currentItemId) return;
    try {
      const endpoint =
        action === "increment"
          ? `${API_URL}/cart/${productState.currentItemId}`
          : `${API_URL}/cart/${productState.currentItemId}/decrement`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (res.status === 401) return (window.location.href = "/auth.html");
      if (!res.ok) throw new Error("Ошибка сети");
    } catch (err) {
      console.error(err);
      showToast("Не удалось обновить количество");
    }
  }

  async function addToCart() {
    if (!productState.currentItemId) {
      showToast("Выберите цвет и размер");
      return;
    }
    try {
      const response = await fetch(
        `${API_URL}/cart/${productState.currentItemId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        },
      );

      if (response.status === 401) return (window.location.href = "/auth.html");

      // ✅ Показываем реальное сообщение от бэкенда
      if (response.status === 409) {
        const errData = await response.json().catch(() => ({}));
        return showToast(
          errData.message ||
            errData.error ||
            "Не удалось добавить: товар отсутствует или уже в корзине",
        );
      }
      if (response.status === 403) {
        return showToast("Ваш уровень доступа недостаточен для этого товара");
      }
      if (!response.ok) throw new Error("Ошибка сети");

      renderQuantityControls(1);
      showToast("Добавлено в корзину");
    } catch (err) {
      console.error(err);
      showToast("Не удалось добавить в корзину");
    }
  }

  function showToast(message) {
    const old = document.querySelector(".cart-toast");
    if (old) old.remove();
    const toast = document.createElement("div");
    toast.className = "cart-toast";
    toast.style.cssText = `
      position: fixed; bottom: 20px; right: 20px;
      background: #1e293b; color: #fff; padding: 12px 24px;
      border-radius: 12px; border: 1px solid var(--gold-glow);
      z-index: 1000; animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");
    if (!productId) {
      container.innerHTML = "<div>Товар не найден</div>";
      return;
    }

    try {
      const response = await fetch(`${API_URL}/products/${productId}`);
      if (!response.ok) throw new Error("Ошибка загрузки");

      const product = await response.json();
      productState.product = product;
      productState.items = product.items || [];

      renderProduct(product);
      renderOptions();
      updateStockInfo();
    } catch (err) {
      console.error(err);
      container.innerHTML = "<div>Не удалось загрузить товар</div>";
    }
  }

  init();
})();
