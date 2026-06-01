const API_URL = "http://localhost:8080";

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

async function getCart() {
  const res = await fetch(`${API_URL}/api/cart`, { headers: authHeaders() });
  if (res.status === 401) {
    window.location.href = "auth.html";
    return null;
  }
  if (!res.ok) throw new Error(`Ошибка загрузки корзины: ${res.status}`);
  return await res.json();
}

async function incrementItem(itemID) {
  const res = await fetch(`${API_URL}/api/cart/${itemID}`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (res.status === 409) return "limit"; // Сервер вернул ошибку "Нет в наличии"
  if (res.status === 401) {
    window.location.href = "auth.html";
    return "auth";
  }
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
  return "success";
}

async function decrementItem(itemID) {
  const res = await fetch(`${API_URL}/api/cart/${itemID}/decrement`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
  return "success";
}

async function removeFromCart(itemID) {
  const res = await fetch(`${API_URL}/api/cart/${itemID}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (res.status === 401) {
    window.location.href = "auth.html";
    return;
  }
  if (!res.ok) throw new Error(`Ошибка удаления: ${res.status}`);
}

function showCartToast(message) {
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; 
    background: #1e293b; color: #fff; padding: 12px 24px; 
    border-radius: 12px; border: 1px solid var(--gold-glow);
    z-index: 1000; transition: 0.3s;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

async function updateCartCount() {
  try {
    const cart = await getCart();
    const count = cart?.items?.length ?? 0;
    const cartIcon = document.querySelector(
      '#header-container .icon-btn[title="Корзина"], #header-container a[title="Корзина"]',
    );
    if (!cartIcon) return;

    const oldBadge = cartIcon.querySelector(".cart-badge");
    if (oldBadge) oldBadge.remove();

    if (count > 0) {
      const badge = document.createElement("span");
      badge.className = "cart-badge";
      badge.textContent = count;
      badge.style.cssText = `
        position: absolute; top: -8px; right: -8px;
        background: #e74c3c; color: white;
        font-size: 12px; font-family: Arial, sans-serif;
        border-radius: 50%; width: 18px; height: 18px;
        display: flex; align-items: center; justify-content: center;
      `;
      cartIcon.style.position = "relative";
      cartIcon.appendChild(badge);
    }
  } catch (err) {
    console.error("Ошибка обновления счетчика:", err);
  }
}

async function renderCart() {
  const container = document.getElementById("cart-content");
  if (!container) return;
  container.innerHTML =
    '<div style="text-align:center; padding:40px;">Загрузка...</div>';

  const cart = await getCart();
  if (!cart) return;

  if (!cart.items || cart.items.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon">Корзина пуста</div>
        <h2>Здесь пока пусто</h2>
        <p>Добавьте товары из каталога</p>
        <a href="index.html" class="back-to-shop">Вернуться в магазин</a>
      </div>
    `;
    return;
  }

  let itemsHtml = "";
  cart.items.forEach((item) => {
    const isLimit = item.quantity >= item.stock_quantity;
    itemsHtml += `
      <div class="cart-item" data-item-id="${item.item_id}" data-max="${item.stock_quantity}" data-price="${item.price}">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.product_name}</div>
          <div class="cart-item-details">${item.color} / ${item.size}</div>
          <div class="cart-item-price">${item.price} Галлеонов</div>
        </div>
        <div style="display: flex; align-items: center; gap: 15px;">
          <button class="option-btn cart-btn-minus" ${item.quantity <= 1 ? "disabled" : ""}>−</button>
          <span class="cart-qty-display" style="font-size: 22px; min-width: 30px; text-align: center; color: #fff;">${item.quantity}</span>
          <button class="option-btn cart-btn-plus" ${isLimit ? "disabled" : ""}>+</button>
          <button class="cart-item-remove cart-btn-delete">×</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items">
        <h2>Ваша корзина</h2>
        ${itemsHtml}
      </div>
      <div class="cart-summary">
        <h2>Итого</h2>
        <div class="summary-total">
          <span>Сумма:</span>
          <span class="total-price">0 Галлеонов</span>
        </div>
        <button class="order-btn">Оформить заказ</button>
      </div>
    </div>
  `;

  recalcTotal();
  updateCartCount();

  document.querySelectorAll(".cart-item").forEach((row) => {
    const id = row.dataset.itemId;
    const max = parseInt(row.dataset.max);
    const basePrice = parseFloat(row.dataset.price);
    const qtySpan = row.querySelector(".cart-qty-display");
    const priceDiv = row.querySelector(".cart-item-price");
    const plusBtn = row.querySelector(".cart-btn-plus");
    const minusBtn = row.querySelector(".cart-btn-minus");
    const deleteBtn = row.querySelector(".cart-btn-delete");

    // ЛОГИКА КНОПКИ "+"
    plusBtn.addEventListener("click", async () => {
      // Сначала ждем ответ сервера, потом меняем UI
      const res = await incrementItem(id);

      if (res === "limit") {
        showCartToast("Больше нет в наличии");
        plusBtn.disabled = true;
        return;
      }

      if (res === "success") {
        let qty = parseInt(qtySpan.textContent);
        qty++;
        qtySpan.textContent = qty;
        priceDiv.textContent = `${(basePrice * qty).toFixed(0)} Галлеонов`;
        if (qty >= max) plusBtn.disabled = true;
        recalcTotal();
        updateCartCount();
      }
    });

    // ЛОГИКА КНОПКИ "−"
    minusBtn.addEventListener("click", async () => {
      let qty = parseInt(qtySpan.textContent);
      if (qty > 1) {
        const res = await decrementItem(id);
        if (res === "success") {
          qty--;
          qtySpan.textContent = qty;
          priceDiv.textContent = `${(basePrice * qty).toFixed(0)} Галлеонов`;
          plusBtn.disabled = false; // Разблокируем плюс, если он был заблокирован
          minusBtn.disabled = qty <= 1;
          recalcTotal();
          updateCartCount();
        }
      }
    });

    // ЛОГИКА УДАЛЕНИЯ
    deleteBtn.addEventListener("click", async () => {
      await removeFromCart(id);
      showCartToast("Товар удален");
      row.remove();
      recalcTotal();
      updateCartCount();

      if (document.querySelectorAll(".cart-item").length === 0) {
        container.innerHTML = `
          <div class="empty-cart">
            <div class="empty-cart-icon">Корзина пуста</div>
            <h2>Здесь пока пусто</h2>
            <p>Добавьте товары из каталога</p>
            <a href="index.html" class="back-to-shop">Вернуться в магазин</a>
          </div>
        `;
      }
    });
  });

  // ЛОГИКА ОФОРМЛЕНИЯ ЗАКАЗА
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

    await res.json(); // можно не использовать, но пусть будет

    showCartToast("Заказ успешно оформлен!");

    // просто очищаем UI корзины
    const container = document.getElementById("cart-content");
    if (container) {
      container.innerHTML = `
        <div class="empty-cart">
          <div class="empty-cart-icon">Корзина пуста</div>
          <h2>Заказ оформлен 🎉</h2>
          <p>Спасибо за покупку!</p>
          <a href="index.html" class="back-to-shop">Вернуться в магазин</a>
        </div>
      `;
    }
    // обновляем счетчик корзины в шапке
    updateCartCount();

  } catch (err) {
    console.error(err);
    showCartToast("Ошибка оформления заказа");
  }
});

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
}
