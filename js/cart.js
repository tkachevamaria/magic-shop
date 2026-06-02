// cart.js - Финальная версия с картинками
const API_URL = "http://localhost:8080";
const processing = new Set();

if (window.__cartInitialized) {
  console.warn("⚠️ cart.js уже загружен. Пропускаю.");
}
window.__cartInitialized = true;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

async function getCart() {
  const res = await fetch(`${API_URL}/api/cart`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (res.status === 401) {
    window.location.href = "auth.html";
    return null;
  }
  if (!res.ok) throw new Error(`Ошибка загрузки: ${res.status}`);
  return await res.json();
}

async function incrementItem(itemID) {
  const res = await fetch(`${API_URL}/api/cart/${itemID}`, {
    method: "POST",
    headers: authHeaders(),
    cache: "no-store",
  });
  if (res.status === 409) return "limit";
  if (res.status === 401) {
    window.location.href = "auth.html";
    return "auth";
  }
  if (!res.ok) throw new Error(`Сервер: ${res.status}`);
  return "success";
}

async function decrementItem(itemID) {
  const res = await fetch(`${API_URL}/api/cart/${itemID}/decrement`, {
    method: "POST",
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Сервер: ${res.status}`);
  return "success";
}

async function removeFromCart(itemID) {
  const res = await fetch(`${API_URL}/api/cart/${itemID}`, {
    method: "DELETE",
    headers: authHeaders(),
    cache: "no-store",
  });
  if (res.status === 401) {
    window.location.href = "auth.html";
    return;
  }
  if (!res.ok) throw new Error(`Сервер: ${res.status}`);
}

function showCartToast(message) {
  const old = document.querySelector(".cart-toast");
  if (old) old.remove();
  const toast = document.createElement("div");
  toast.className = "cart-toast";
  toast.style.cssText = `position: fixed; bottom: 20px; right: 20px; background: #1e293b; color: #fff; padding: 12px 24px; border-radius: 12px; border: 1px solid var(--gold-glow); z-index: 1000; transition: 0.3s;`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

async function updateCartCount() {
  try {
    const cart = await getCart();
    const count = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
    const cartIcon = document.querySelector(
      '#header-container .icon-btn[title="Корзина"], #header-container a[title="Корзина"]',
    );
    if (!cartIcon) return;

    cartIcon.querySelector(".cart-badge")?.remove();
    if (count > 0) {
      const b = document.createElement("span");
      b.className = "cart-badge";
      b.textContent = count;
      b.style.cssText = `position:absolute; top:-8px; right:-8px; background:#e74c3c; color:#fff; font-size:12px; border-radius:50%; width:18px; height:18px; display:flex; align-items:center; justify-content:center;`;
      cartIcon.style.position = "relative";
      cartIcon.appendChild(b);
    }
  } catch (e) {
    console.error("Счётчик: ", e);
  }
}

function recalcTotal() {
  let sum = 0;
  document.querySelectorAll(".cart-item").forEach((r) => {
    sum +=
      parseFloat(r.dataset.price) *
      parseInt(r.querySelector(".cart-qty-display").textContent);
  });
  const totalEl = document.querySelector(".total-price");
  if (totalEl) totalEl.textContent = `${sum.toFixed(0)} Галлеонов`;
}

async function renderCart() {
  const container = document.getElementById("cart-content");
  if (!container) return;
  container.innerHTML =
    '<div style="text-align:center; padding:40px;">Загрузка...</div>';

  const cart = await getCart();
  if (!cart) return;

  if (!cart.items?.length) {
    container.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon">🛒</div>
        <h2>Корзина пуста</h2>
        <p>Добавьте товары из каталога</p>
        <a href="index.html" class="back-to-shop">Вернуться в магазин</a>
      </div>`;
    return;
  }

  // ✅ ОДИН цикл, с отрисовкой картинки
  let html = "";
  cart.items.forEach((item) => {
    const isMax = item.quantity >= (item.stock_quantity || 999);
    const imgSrc = item.image_url ? `${API_URL}${item.image_url}` : "";

    html += `
      <div class="cart-item" data-id="${item.item_id}" data-max="${item.stock_quantity || 999}" data-price="${item.price}">
        <div class="cart-item-image">
          ${imgSrc ? `<img src="${imgSrc}" alt="${item.product_name}">` : `<div class="cart-item-image-fallback">🧙‍♂️</div>`}
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.product_name}</div>
          <div class="cart-item-details">${item.color} / ${item.size}</div>
          <div class="cart-item-price">${item.price} Галлеонов</div>
        </div>
        <div class="cart-item-controls">
          <button class="option-btn cart-btn-minus" ${item.quantity <= 1 ? "disabled" : ""}>−</button>
          <span class="cart-qty-display" style="font-size:22px; min-width:30px; text-align:center; color:#fff;">${item.quantity}</span>
          <button class="option-btn cart-btn-plus" ${isMax ? "disabled" : ""}>+</button>
          <button class="cart-item-remove cart-btn-delete">×</button>
        </div>
      </div>`;
  });

  container.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items">
        <h2>Ваша корзина</h2>
        ${html}
      </div>
      <div class="cart-summary">
        <h2>Итого</h2>
        <div class="summary-total">
          <span>Сумма:</span>
          <span class="total-price">0 Галлеонов</span>
        </div>
        <button class="order-btn">Оформить заказ</button>
      </div>
    </div>`;

  recalcTotal();
  updateCartCount();
  bindCartEvents();
}

function bindCartEvents() {
  document.querySelectorAll(".cart-item").forEach((row) => {
    const id = row.dataset.id;
    const max = parseInt(row.dataset.max);
    const price = parseFloat(row.dataset.price);
    const qtyEl = row.querySelector(".cart-qty-display");
    const priceEl = row.querySelector(".cart-item-price");
    const plusBtn = row.querySelector(".cart-btn-plus");
    const minusBtn = row.querySelector(".cart-btn-minus");
    const delBtn = row.querySelector(".cart-btn-delete");

    const lock = (state) => {
      plusBtn.disabled = state;
      minusBtn.disabled = state;
    };

    plusBtn.addEventListener("click", async () => {
      if (processing.has(id) || plusBtn.disabled) return;
      processing.add(id);
      lock(true);
      try {
        const res = await incrementItem(id);
        if (res === "limit") {
          showCartToast("Больше нет в наличии");
          plusBtn.disabled = true;
        } else if (res === "success") {
          let q = parseInt(qtyEl.textContent) + 1;
          qtyEl.textContent = q;
          priceEl.textContent = `${(price * q).toFixed(0)} Галлеонов`;
          plusBtn.disabled = q >= max;
        }
      } catch (e) {
        showCartToast("Ошибка сервера");
      } finally {
        processing.delete(id);
        if (row.isConnected) lock(false);
        recalcTotal();
        updateCartCount();
      }
    });

    minusBtn.addEventListener("click", async () => {
      if (processing.has(id)) return;
      processing.add(id);
      lock(true);
      try {
        let q = parseInt(qtyEl.textContent);
        if (q > 1) {
          await decrementItem(id);
          q--;
          qtyEl.textContent = q;
          priceEl.textContent = `${(price * q).toFixed(0)} Галлеонов`;
        } else {
          await removeFromCart(id);
          row.remove();
          if (!document.querySelectorAll(".cart-item").length) {
            document.getElementById("cart-content").innerHTML = `
              <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h2>Корзина пуста</h2>
                <p>Добавьте товары из каталога</p>
                <a href="index.html" class="back-to-shop">Вернуться в магазин</a>
              </div>`;
          }
        }
      } catch (e) {
        showCartToast("Ошибка изменения");
      } finally {
        processing.delete(id);
        if (row.isConnected) lock(false);
        recalcTotal();
        updateCartCount();
      }
    });

    delBtn.addEventListener("click", async () => {
      if (processing.has(id)) return;
      processing.add(id);
      delBtn.disabled = true;
      try {
        await removeFromCart(id);
        showCartToast("Товар удалён");
        row.remove();
        if (!document.querySelectorAll(".cart-item").length) {
          document.getElementById("cart-content").innerHTML = `
            <div class="empty-cart">
              <div class="empty-cart-icon">🛒</div>
              <h2>Корзина пуста</h2>
              <p>Добавьте товары из каталога</p>
              <a href="index.html" class="back-to-shop">Вернуться в магазин</a>
            </div>`;
        }
      } finally {
        processing.delete(id);
        recalcTotal();
        updateCartCount();
      }
    });
  });

  document.querySelector(".order-btn")?.addEventListener("click", async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (res.status === 401) {
        window.location.href = "auth.html";
        return;
      }
      if (!res.ok) {
        showCartToast("Ошибка оформления заказа");
        return;
      }
      await res.json();
      showCartToast("Заказ успешно оформлен! 🎉");

      const container = document.getElementById("cart-content");
      if (container) {
        container.innerHTML = `
          <div class="empty-cart">
            <div class="empty-cart-icon">🎉</div>
            <h2>Заказ оформлен</h2>
            <p>Спасибо за покупку!</p>
            <a href="index.html" class="back-to-shop">Вернуться в магазин</a>
          </div>`;
      }
      updateCartCount();
    } catch (err) {
      console.error(err);
      showCartToast("Ошибка оформления заказа");
    }
  });
}

document.addEventListener("DOMContentLoaded", renderCart);
