(function () {
  const API_URL = "http://localhost:8080/api";
  const PHOTO_URL = "http://localhost:8080";
  const container = document.getElementById("product-content");
  if (!container) return;

  // 🔑 УКАЖИТЕ ТОЧНЫЙ КЛЮЧ, ПОД КОТОРЫМ У ВАС СОХРАНЯЕТСЯ ТОКЕН
  const TOKEN_KEY = "token";

  const productState = {
    product: null,
    items: [],
    selectedColor: null,
    selectedSize: null,
    currentItemId: null,
    quantity: 1,
  };

  // Хелпер для получения заголовков авторизации
  function getAuthHeaders() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return {};
    // Если бэкенд ждёт не "Bearer", а например "Token", замените слово Bearer
    return { Authorization: `Bearer ${token}` };
  }

  function renderProduct(product) {
    container.innerHTML = `
      <div class="product-card-large">
        <div class="product-image">
          <img src="${PHOTO_URL}${product.image_url || ""}" alt="${product.name}">
        </div>
        <div class="product-info">
          <h1 class="product-title">${product.name}</h1>
          <div class="product-price">${product.price} Галлеонов</div>
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
          ${colors.map((color) => `<button class="option-btn color-btn" data-value="${color}">${color}</button>`).join("")}
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

    optionsContainer.querySelectorAll(".color-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        optionsContainer
          .querySelectorAll(".color-btn")
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
      <div style="display: flex; align-items: center; gap: 20px; justify-content: center;">
        <button id="btn-minus" class="option-btn" style="padding: 10px 20px; font-size: 24px;">−</button>
        <span id="qty-display" style="font-size: 28px; min-width: 40px; text-align: center;">${initialQty}</span>
        <button id="btn-plus" class="option-btn" style="padding: 10px 20px; font-size: 24px;">+</button>
        <button id="btn-remove" class="option-btn" style="background: #7f1d1d; margin-left: 10px;">Убрать</button>
      </div>
    `;

    const qtyDisplay = document.getElementById("qty-display");
    const btnMinus = document.getElementById("btn-minus");
    const btnPlus = document.getElementById("btn-plus");
    const btnRemove = document.getElementById("btn-remove");

    btnMinus.addEventListener("click", async () => {
      let qty = parseInt(qtyDisplay.textContent);
      if (qty > 1) {
        qty--;
        qtyDisplay.textContent = qty;
        productState.quantity = qty;
        await syncQuantityWithBackend("decrement");
      }
    });

    btnPlus.addEventListener("click", async () => {
      let qty = parseInt(qtyDisplay.textContent);
      if (qty < maxStock) {
        qty++;
        qtyDisplay.textContent = qty;
        productState.quantity = qty;
        await syncQuantityWithBackend("increment");
      } else {
        showToast(`Максимум ${maxStock} шт. в наличии`);
      }
    });

    btnRemove.addEventListener("click", async () => {
      if (!productState.currentItemId) return;
      try {
        const res = await fetch(
          `${API_URL}/cart/${productState.currentItemId}`,
          {
            method: "DELETE",
            headers: getAuthHeaders(),
          },
        );
        if (res.status === 401) return handleAuthRequired();
        if (!res.ok) throw new Error("Ошибка сети");

        productState.quantity = 1;
        renderAddButton();
        showToast("Товар убран из корзины");
      } catch (err) {
        console.error("Ошибка удаления:", err);
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
      if (res.status === 401) return handleAuthRequired();
      if (!res.ok) throw new Error("Ошибка сети");
    } catch (err) {
      console.error("Ошибка синхронизации:", err);
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
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        },
      );

      if (response.status === 401) return handleAuthRequired();
      if (!response.ok) throw new Error("Ошибка сети");

      productState.quantity = 1;
      renderQuantityControls(1);
      showToast("Добавлено в корзину");
    } catch (err) {
      console.error("Ошибка добавления:", err);
      showToast("Не удалось добавить в корзину");
    }
  }

  function handleAuthRequired() {
    const msg = "Для работы с корзиной необходимо войти в аккаунт";
    showToast(msg);
    // Раскомментируйте, если нужен редирект на страницу входа:
    // setTimeout(() => window.location.href = '/login.html', 1500);
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
    setTimeout(() => toast.remove(), 3000);
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
