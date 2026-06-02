const API_URL = "http://localhost:8080";

// Добавьте функцию escapeHtml в начало файла
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

async function loadPurchases() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/purchases`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    window.location.href = "auth.html";
    return [];
  }
  if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);

  const data = await res.json();
  console.log("Loaded purchases:", data);
  return data;
}

function renderPurchasesPage() {
  const container = document.getElementById("purchases-content");
  if (!container) return;

  container.innerHTML = `<div style="text-align:center; padding:100px; font-size:28px;">Загрузка...</div>`;

  loadPurchases()
    .then((orders) => {
      if (!orders || orders.length === 0) {
        container.innerHTML = `
                <div class="empty-purchases">
                    <div class="empty-icon">🛍️</div>
                    <h2>У вас пока нет покупок</h2>
                    <p>Совершите первую покупку в нашем магазине</p>
                    <a href="index.html" class="back-to-shop">Перейти к покупкам</a>
                </div>`;
        return;
      }

      let totalAmount = 0;
      let totalItems = 0;
      orders.forEach((order) => {
        totalAmount += order.total_price;
        totalItems += order.items_count;
      });

      let html = `
            <div class="stats-header">
                <h1>Мои покупки</h1>
                <div class="total-stats">
                    <div class="total-amount">💰 ${totalAmount} Галлеонов</div>
                    <div class="total-orders-count">Всего товаров: ${totalItems}</div>
                </div>
            </div>
            <div class="products-grid">
        `;

      orders.forEach((order) => {
        // 🔮 ПРИМЕНЯЕМ МАСКУ К ТОВАРАМ ЗАКАЗА
        const maskedItems = window.DarkMask
          ? window.DarkMask.maskDarkItems(order.items ?? [])
          : (order.items ?? []);

        maskedItems.forEach((item) => {
          const image = item.image_url
            ? `<img src="${API_URL}${item.image_url}" alt="${item.name}" class="card-img">`
            : `<div class="card-image">🛍️</div>`;

          const quantityBadge =
            item.quantity > 1
              ? `<span class="quantity-badge">×${item.quantity}</span>`
              : "";

          html += `
                    <div class="purchase-card" data-product-id="${item.product_id}" style="cursor:pointer;">
                        <div class="card-image-wrap" style="position:relative;">
                            ${image}
                            ${quantityBadge}
                        </div>
                        <div class="card-footer">
                            <span class="product-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
                            ${item.color ? `<span class="product-meta">${escapeHtml(item.color)}${item.size ? `, ${escapeHtml(item.size)}` : ""}</span>` : ""}
                            <span class="product-price">${item.price} Галлеонов</span>
                            <span class="delivery-date">Доставлено: ${order.actual_date || order.estimated_date}</span>
                        </div>
                    </div>
                `;
        });
      });

      html += `</div>`;
      container.innerHTML = html;

      document.querySelectorAll(".purchase-card").forEach((card) => {
        card.addEventListener("click", function () {
          const productId = this.getAttribute("data-product-id");
          if (productId) window.location.href = `product.html?id=${productId}`;
        });
      });
    })
    .catch(() => {
      container.innerHTML = `<div style="text-align:center; padding:100px; font-size:24px; color:#ff6b6b;">⚠️ Не удалось загрузить покупки</div>`;
    });
}
