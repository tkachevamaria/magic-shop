/* dark-mode.js — с истечением сессии, авто-сбросом, защитой страниц и live-выбросом */
(function () {

  // КОНФИГ

  const DARK_MODE_KEY           = "darkModeUnlocked";
  const DARK_MODE_TIMESTAMP_KEY = "darkModeUnlockedAt";

  /** Сколько живёт тёмная сессия */
  const SESSION_DURATION_MS = 1 * 60 * 1000;

  /**
   * Как часто фоновый таймер проверяет истечение.
   * На странице каталога — достаточно раз в минуту.
   * На странице тёмного товара — переопределяется ниже на 10 сек.
   */
  const CHECK_INTERVAL_MS = 60 * 1000;

  /** Как часто проверяем на странице тёмного товара */
  const PRODUCT_CHECK_INTERVAL_MS = 10 * 1000;

  /** ID тёмных товаров. */
  const DARK_PRODUCT_IDS = [43, 44, 45]; // нужные ID

  /** Куда редиректить при блокировке. */
  const REDIRECT_URL = "/frontend/index.html";

  // ОПРЕДЕЛЯЕМ КОНТЕКСТ СТРАНИЦЫ

  const _params        = new URLSearchParams(window.location.search);
  const _currentId     = parseInt(_params.get("id"), 10);
  const _isProductPage = !!_currentId && DARK_PRODUCT_IDS.includes(_currentId);

  // ХРАНИЛИЩЕ

  function unlockDarkMode() {
    sessionStorage.setItem(DARK_MODE_KEY, "true");
    sessionStorage.setItem(DARK_MODE_TIMESTAMP_KEY, Date.now().toString());
  }

  function isDarkModeActive() {
    if (sessionStorage.getItem(DARK_MODE_KEY) !== "true") return false;
    const ts = parseInt(sessionStorage.getItem(DARK_MODE_TIMESTAMP_KEY), 10);
    if (!ts || isNaN(ts)) { _clearDarkMode(); return false; }
    if (Date.now() - ts > SESSION_DURATION_MS) { _clearDarkMode(); return false; }
    return true;
  }

  function getDarkModeTimeLeft() {
    if (!isDarkModeActive()) return 0;
    const ts = parseInt(sessionStorage.getItem(DARK_MODE_TIMESTAMP_KEY), 10);
    return Math.max(0, SESSION_DURATION_MS - (Date.now() - ts));
  }

  function _clearDarkMode() {
    sessionStorage.removeItem(DARK_MODE_KEY);
    sessionStorage.removeItem(DARK_MODE_TIMESTAMP_KEY);
    _removeBadge();
  }

  function _removeBadge() {
    const trigger = document.getElementById("darkModeTrigger");
    if (trigger && trigger.classList.contains("dark-activated")) {
      trigger.classList.remove("dark-activated");
      trigger.textContent = trigger.textContent.replace(/[🌑✨]/g, "").trim();
    }
  }

  // ГАРД — блокировка при загрузке страницы товара

  function runPageGuard() {
    if (!_isProductPage) return;
    if (!isDarkModeActive()) {
      document.documentElement.style.visibility = "hidden";
      sessionStorage.setItem("darkRedirectFrom", window.location.href);
      window.location.replace(REDIRECT_URL + "?blocked=dark");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runPageGuard);
  } else {
    runPageGuard();
  }


  let _checkTimer = null;

  function startExpiryWatcher() {
    if (_checkTimer) return;

    const interval = _isProductPage ? PRODUCT_CHECK_INTERVAL_MS : CHECK_INTERVAL_MS;

    _checkTimer = setInterval(() => {
      const wasActive = sessionStorage.getItem(DARK_MODE_KEY) === "true";
      if (!wasActive) return; // уже неактивен, нечего делать

      if (!isDarkModeActive()) {
        // isDarkModeActive() уже вызвал _clearDarkMode()
        if (_isProductPage) {
          // ── ВЫБРОС СО СТРАНИЦЫ ТЁМНОГО ТОВАРА ──
          console.log("🌑 Dark mode expired on product page, redirecting...");
          setTimeout(() => {
            window.location.replace(REDIRECT_URL + "?expired=dark");
          }, 2600);
        } else {
          // ── СБРОС ВИЗУАЛА НА КАТАЛОГЕ ──
          _hideDarkCatalogVisuals();
          console.log("🌑 Dark mode expired, visuals hidden.");
        }
      }
    }, interval);
  }

  /**
   * Скрывает все визуальные элементы тёмного режима на каталоге.
   * Вызывается при истечении сессии.
   *
   * Логика:
   *  1. Убирает бейдж с кнопки #darkModeTrigger
   *  2. Скрывает карточки тёмных товаров (data-dark="true")
   *  3. Скрывает целые секции/категории с классом .dark-category
   *  4. Вызывает window.hideDarkCategory(), если она определена в каталоге
   */
  function _hideDarkCatalogVisuals() {
    // 1. Убираем бейдж
    _removeBadge();

    // 2. Карточки товаров, помеченные как тёмные
    document.querySelectorAll('[data-dark="true"], .dark-product-card').forEach(el => {
      el.style.display = "none";
    });

    // 3. Целые секции тёмного каталога
    document.querySelectorAll('.dark-category, .dark-section, #dark-catalog').forEach(el => {
      el.style.display = "none";
    });

    // 4. Хук для каталога — если там есть своя функция скрытия
    if (typeof window.hideDarkCategory === "function") {
      window.hideDarkCategory();
    }
  }

  // ============================================================
  // ПРОВЕРКА ДОСТУПА (API)
  // ============================================================

  function checkDarkProductAccess(productId) {
    return new Promise((resolve, reject) => {
      fetch(`http://localhost:8080/api/products/${productId}`)
        .then(res => res.json())
        .then(product => {
          if (product.is_dark || product.category === "dark") {
            if (!isDarkModeActive()) {
              reject({
                blocked: true,
                action: "unlock",
              });
              console.log(`🌑 Доступ к товару ${productId} заблокирован`);
            } else {
              resolve(true);
            }
          } else {
            resolve(true);
          }
        })
        .catch(reject);
    });
  }

  // Проверка корзины — фильтруем по category_id
  async function checkDarkItemsInCart(cartItems) {
    const darkItems = cartItems.filter(item => item.is_dark === true);
    if (darkItems.length > 0 && !isDarkModeActive()) {
      return {
        blocked: true,
        darkItems,
      };
      console.log(`🌑 В корзине есть тёмные товары, доступ заблокирован`);
    }
    return { blocked: false };
  }

  // ПУБЛИЧНОЕ API

  window.isDarkModeActive       = isDarkModeActive;
  window.getDarkModeTimeLeft    = getDarkModeTimeLeft;
  window.checkDarkProductAccess = checkDarkProductAccess;
  window.checkDarkItemsInCart = checkDarkItemsInCart;
  window.checkDarkItemsInCart   = checkDarkItemsInCart;

  // АКТИВАЦИЯ ЧЕРЕЗ 6 КЛИКОВ
  let clickCount    = 0;
  let clickTimer    = null;
  let isInitialized = false;

  const REQUIRED_CLICKS = 6;
  const RESET_TIMEOUT   = 2000;

  function init() {
    if (isInitialized) return;

    startExpiryWatcher();

    const trigger = document.getElementById("darkModeTrigger");
    if (trigger) {
      attachClickListener(trigger);
      isInitialized = true;
    } else {
      waitForElement("#darkModeTrigger", 5000)
        .then(el => { attachClickListener(el); isInitialized = true; })
        .catch(() => console.warn("🌑 #darkModeTrigger не найден за 5 сек"));
    }

    if (isDarkModeActive()) {
      waitForElement("#darkModeTrigger", 3000).then(activateBadge);
    }
  }

  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) { resolve(el); return; }
      const obs = new MutationObserver((_, o) => {
        const found = document.querySelector(selector);
        if (found) { o.disconnect(); resolve(found); }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { obs.disconnect(); reject(new Error(`${selector} not found`)); }, timeout);
    });
  }

  function attachClickListener(element) {
    element.removeEventListener("click", handleClick);
    element.addEventListener("click", handleClick);
  }

  function handleClick(event) {
    event.stopPropagation();

    if (isDarkModeActive()) {
      const mins = Math.ceil(getDarkModeTimeLeft() / 60000);
      showRippleEffect(event.clientX, event.clientY);
      console.log(`🌑 Тёмный режим уже активен, осталось примерно ${mins} мин`);
      return;
    }

    clickCount++;
    // showClickFeedback(event.currentTarget);

    if (clickCount === REQUIRED_CLICKS) {
      _doActivate(event.currentTarget);
      resetClickCounter();
    } else {
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = setTimeout(resetClickCounter, RESET_TIMEOUT);
    }
  }

  function _doActivate(button) {
    console.log("🌑 ТЁМНЫЙ РЕЖИМ АКТИВИРОВАН!");
    unlockDarkMode();
    activateBadge(button);
    showPurplePulse();
    showEpicToast();
    if (typeof window.renderDarkCategory === "function") {
      setTimeout(() => window.renderDarkCategory(), 500);
    }
  }

  function resetClickCounter() {
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
    clickCount = 0;
  }

  // ============================================================
  // UI
  // ============================================================

  // function showClickFeedback(button) {
  //   button.style.transform = "scale(0.95)";
  //   button.style.transition = "transform 0.1s ease";
  //   setTimeout(() => { button.style.transform = ""; }, 100);
  // }

  function showRippleEffect(x, y) {
    const ripple = document.createElement("div");
    ripple.className = "ripple-effect";
    ripple.style.left = `${x}px`;
    ripple.style.top  = `${y}px`;
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  function showPurplePulse() {
    playOminousSound();

    const pulseOverlay = document.createElement("div");
    pulseOverlay.className = "purple-pulse-overlay";
    document.body.appendChild(pulseOverlay);

    const smokeContainer = document.createElement("div");
    smokeContainer.className = "smoke-clouds";
    smokeContainer.innerHTML = `
      <div class="smoke smoke-1"></div><div class="smoke smoke-2"></div>
      <div class="smoke smoke-3"></div><div class="smoke smoke-4"></div>
      <div class="smoke smoke-5"></div><div class="smoke smoke-6"></div>
      <div class="smoke smoke-7"></div>
    `;
    document.body.appendChild(smokeContainer);

    const darknessOverlay = document.createElement("div");
    darknessOverlay.className = "darkness-overlay";
    document.body.appendChild(darknessOverlay);

    requestAnimationFrame(() => pulseOverlay.classList.add("active"));

    setTimeout(() => {
      pulseOverlay.classList.remove("active");
      setTimeout(() => {
        pulseOverlay.remove();
        smokeContainer.remove();
        darknessOverlay.remove();
      }, 500);
    }, 4000);
  }

  function playOminousSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();

      const osc1 = audioCtx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(110, audioCtx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(55, audioCtx.currentTime + 2.5);

      const osc2 = audioCtx.createOscillator();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(165, audioCtx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(82.5, audioCtx.currentTime + 2);

      const osc3 = audioCtx.createOscillator();
      osc3.type = "triangle";
      osc3.frequency.setValueAtTime(55, audioCtx.currentTime);
      osc3.frequency.exponentialRampToValueAtTime(27.5, audioCtx.currentTime + 3);

      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(400, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 2);
      filter.Q.value = 3;

      const gain1 = audioCtx.createGain();
      const gain2 = audioCtx.createGain();
      const gain3 = audioCtx.createGain();

      osc1.connect(filter); osc2.connect(filter); osc3.connect(filter);
      filter.connect(gain1); gain1.connect(audioCtx.destination);
      gain1.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 3.2);

      osc2.connect(gain2); gain2.connect(audioCtx.destination);
      gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.5);

      osc3.connect(gain3); gain3.connect(audioCtx.destination);
      gain3.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain3.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 3.5);

      osc1.start(); osc2.start(); osc3.start();
      osc1.stop(audioCtx.currentTime + 3.2);
      osc2.stop(audioCtx.currentTime + 2.8);
      osc3.stop(audioCtx.currentTime + 3.8);

      if (audioCtx.state === "suspended") audioCtx.resume();
    } catch (e) {
      console.log("🔇 Ошибка звука:", e);
    }
  }

  function showEpicToast() {
    const old = document.querySelector(".cart-toast");
    if (old) old.remove();

    const toast = document.createElement("div");
    toast.className = "cart-toast epic-toast";
    toast.innerHTML = `
      <div class="epic-toast-content">
        <span class="epic-icon">🌑✨</span>
        <span class="epic-text">Тёмные силы призваны!</span>
      </div>
    `;
    toast.style.cssText = `
      position: fixed; bottom: 20px; right: 20px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #d8b4fe; padding: 16px 28px; border-radius: 20px;
      border: 2px solid #9333ea; z-index: 1000;
      animation: slideIn 0.3s ease, epicGlow 2s ease-in-out infinite;
      box-shadow: 0 0 30px rgba(147, 51, 234, 0.7); font-weight: bold;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  function activateBadge(element) {
    if (!element || element.classList.contains("dark-activated")) return;
    element.classList.add("dark-activated");
    const cleanText = element.textContent.trim().replace(/[🌑✨]/g, "").trim();
    element.textContent = `🌑 ${cleanText}`;
  }

  function showToast(message, duration = 2000) {
    const old = document.querySelector(".cart-toast:not(.epic-toast)");
    if (old) old.remove();

    const toast = document.createElement("div");
    toast.className = "cart-toast";
    toast.style.cssText = `
      position: fixed; bottom: 20px; right: 20px;
      background: #1e293b; color: #d8b4fe;
      padding: 12px 24px; border-radius: 12px;
      border: 1px solid #9333ea; z-index: 1000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 0 15px rgba(147, 51, 234, 0.5);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  // ============================================================
  // СТАРТ
  // ============================================================

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();