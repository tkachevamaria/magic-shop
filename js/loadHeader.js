fetch("header.html")
  .then((response) => {
    if (!response.ok) throw new Error("Блокировка браузера");
    return response.text();
  })
  .then((data) => {
    document.getElementById("header-container").innerHTML = data;

    // Логотип
    const logo = document.querySelector("#header-container .logo");
    if (logo) {
      logo.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "index.html";
      });
      logo.style.cursor = "pointer";
    }

    // Иконки шапки
    const cartBtn = document.querySelector(
      '#header-container .icon-btn[title="Корзина"], #header-container a[title="Корзина"]',
    );
    if (cartBtn) {
      cartBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "cart.html";
      });
      cartBtn.style.cursor = "pointer";
    }

    const ordersBtn = document.querySelector(
      '#header-container .icon-btn[title="История заказов"], #header-container a[title="История заказов"]',
    );
    if (ordersBtn) {
      ordersBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "orders.html";
      });
      ordersBtn.style.cursor = "pointer";
    }
  })
  .catch((err) => {
    console.warn("Header fallback:", err);
    document.getElementById("header-container").innerHTML = `
      <div class="header-content">
        <div class="logo" id="fallbackLogo" style="cursor:pointer;">DA <span class="logo-sub">Logo</span></div>
        <div class="search-container">
          <input type="text" placeholder="ПОИСК..." class="search-input">
          <span class="search-arrow">🔍</span>
        </div>
        <div class="header-icons">
          <button class="icon-btn" id="fallbackCart" title="Корзина">🛒</button>
          <button class="icon-btn" id="fallbackOrders" title="История заказов">📜</button>
        </div>
      </div>`;
  });

// ✅ Единый обработчик для кнопки фильтра (делегирование)
(function () {
  if (window._miniFilterListener) return;
  window._miniFilterListener = true;

  document.addEventListener("click", (e) => {
    const btn = e.target.closest('.icon-btn[title="Фильтр"]');
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation(); // Останавливаем всплытие, чтобы не срабатывали другие клики

    if (typeof window.toggleMiniFilter === "function") {
      window.toggleMiniFilter();
    }
  });
})();
