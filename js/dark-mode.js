/* dark-mode.js - с секретной активацией (6 кликов) */
(function () {
  // ==================================== Защита =========================================================

  const DARK_MODE_KEY = "darkModeUnlocked";
  const DARK_MODE_TIMESTAMP_KEY = "darkModeUnlockedAt";

  function unlockDarkMode() {
    sessionStorage.setItem(DARK_MODE_KEY, "true");
    sessionStorage.setItem(DARK_MODE_TIMESTAMP_KEY, Date.now().toString());

    const encrypted = btoa(
      JSON.stringify({
        unlocked: true,
        timestamp: Date.now(),
        signature: "magic_dark_shop_2024",
      }),
    );
    localStorage.setItem(DARK_MODE_KEY, encrypted);
  }

  function isDarkModeActive() {
    if (sessionStorage.getItem(DARK_MODE_KEY) === "true") {
      return true;
    }

    try {
      const stored = localStorage.getItem(DARK_MODE_KEY);
      if (stored) {
        const decrypted = JSON.parse(atob(stored));
        if (
          decrypted.signature === "magic_dark_shop_2024" &&
          decrypted.unlocked === true
        ) {
          sessionStorage.setItem(DARK_MODE_KEY, "true");
          sessionStorage.setItem(DARK_MODE_TIMESTAMP_KEY, decrypted.timestamp);
          return true;
        }
      }
    } catch (e) {
      console.warn("Ошибка проверки dark mode:", e);
    }

    return false;
  }

  function checkDarkProductAccess(productId) {
    return new Promise((resolve, reject) => {
      fetch(`http://localhost:8080/api/products/${productId}`)
        .then((res) => res.json())
        .then((product) => {
          if (product.is_dark || product.category === "dark") {
            if (!isDarkModeActive()) {
              reject({
                blocked: true,
                message:
                  "🌑 Это тёмный товар! Вы не можете его заказать, не открыв доступ к тёмному каталогу.",
                action: "unlock",
              });
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

  async function checkDarkItemsInCart(cartItems) {
    const darkItems = cartItems.filter((item) => item.is_dark === true);
    if (darkItems.length > 0 && !isDarkModeActive()) {
      return {
        blocked: true,
        message: `🌑 В корзине есть тёмные товары (${darkItems.map((i) => i.name).join(", ")}). Откройте доступ к тёмному каталогу, чтобы оформить заказ.`,
        darkItems: darkItems,
      };
    }
    return { blocked: false };
  }

  window.unlockDarkMode = unlockDarkMode;
  window.isDarkModeActive = isDarkModeActive;
  window.checkDarkProductAccess = checkDarkProductAccess;
  window.checkDarkItemsInCart = checkDarkItemsInCart;

  // ================================= Сам Dark-mode =======================================================

  let clickCount = 0;
  let clickTimer = null;
  let isInitialized = false;

  // Конфиг
  const REQUIRED_CLICKS = 6;
  const RESET_TIMEOUT = 2000; // 2 секунды на серию кликов

  function init() {
    if (isInitialized) return;

    const trigger = document.getElementById("darkModeTrigger");
    if (trigger) {
      attachClickListener(trigger);
      isInitialized = true;
    } else {
      waitForElement("#darkModeTrigger", 5000)
        .then((element) => {
          attachClickListener(element);
          isInitialized = true;
        })
        .catch(() => {
          console.warn("🌑 Кнопка Dark Mode не найдена через 5 секунд");
        });
    }

    // Если режим уже был включён в этой сессии, активируем бейдж при появлении
    if (sessionStorage.getItem("darkModeUnlocked") === "true") {
      waitForElement("#darkModeTrigger", 3000).then((element) => {
        activateBadge(element);
      });
    }
  }

  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const el = document.querySelector(selector);
        if (el) {
          obs.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found`));
      }, timeout);
    });
  }

  function attachClickListener(element) {
    element.removeEventListener("click", handleClick);
    element.addEventListener("click", handleClick);
    console.log("🌑 Обработчик клика повешен на #darkModeTrigger");
  }

  function handleClick(event) {
    event.stopPropagation();

    // Если режим уже активирован, ничего не делаем
    if (sessionStorage.getItem("darkModeUnlocked") === "true") {
      showRippleEffect(event.clientX, event.clientY);
      showToast("🌑 Тёмный режим уже активирован!");
      return;
    }

    // Увеличиваем счётчик
    clickCount++;

    // Показываем визуальный фидбек (маленькая вспышка на кнопке)
    showClickFeedback(event.currentTarget);

    console.log(`🌑 Клик ${clickCount} из ${REQUIRED_CLICKS}`);

    // Если достигли нужного количества
    if (clickCount === REQUIRED_CLICKS) {
      activateDarkMode(event.currentTarget);
      resetClickCounter();
    } else {
      // Сбрасываем счётчик через таймаут
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        resetClickCounter();
      }, RESET_TIMEOUT);

      // Показываем подсказку только на предпоследнем клике
      if (clickCount === REQUIRED_CLICKS - 1) {
        showToast(
          `🔮 Ещё один клик... (${REQUIRED_CLICKS - clickCount} осталось)`,
          1500,
        );
      }
    }
  }

  function resetClickCounter() {
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }
    clickCount = 0;
    console.log("🌑 Счётчик кликов сброшен");
  }

  function showClickFeedback(button) {
    button.style.transform = "scale(0.95)";
    button.style.transition = "transform 0.1s ease";
    setTimeout(() => {
      button.style.transform = "";
    }, 100);
  }

  function showRippleEffect(x, y) {
    const ripple = document.createElement("div");
    ripple.className = "ripple-effect";
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  // 🌟 ГЛАВНОЕ: ФИОЛЕТОВАЯ ПУЛЬСАЦИЯ ПО ПЕРИМЕТРУ 🌟
  // 🌫 Новая версия с туманом и медленной пульсацией
  function showPurplePulse() {
    playOminousSound();

    // 1. Основная пульсация
    const pulseOverlay = document.createElement("div");
    pulseOverlay.className = "purple-pulse-overlay";
    document.body.appendChild(pulseOverlay);

    // 2. КЛУБЫ ДЫМА (вместо обычного тумана)
    const smokeContainer = document.createElement("div");
    smokeContainer.className = "smoke-clouds";
    smokeContainer.innerHTML = `
    <div class="smoke smoke-1"></div>
    <div class="smoke smoke-2"></div>
    <div class="smoke smoke-3"></div>
    <div class="smoke smoke-4"></div>
    <div class="smoke smoke-5"></div>
    <div class="smoke smoke-6"></div>
    <div class="smoke smoke-7"></div>
  `;
    document.body.appendChild(smokeContainer);

    // 3. Лёгкое затемнение
    const darknessOverlay = document.createElement("div");
    darknessOverlay.className = "darkness-overlay";
    document.body.appendChild(darknessOverlay);

    // Запускаем анимации
    requestAnimationFrame(() => {
      pulseOverlay.classList.add("active");
    });

    // Удаляем все слои
    setTimeout(() => {
      pulseOverlay.classList.remove("active");
      setTimeout(() => {
        pulseOverlay.remove();
        smokeContainer.remove();
        darknessOverlay.remove();
      }, 500);
    }, 4000);
  }

  // 🎵 ЗЛОВЕЩИЙ МЕДЛЕННЫЙ ЗВУК (низкий, мрачный)
  function playOminousSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();

      // Основной низкий гул
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(110, audioCtx.currentTime); // A2 — низкий
      osc1.frequency.exponentialRampToValueAtTime(
        55,
        audioCtx.currentTime + 2.5,
      ); // спуск до A1

      // Второй осциллятор — добавляет "зловещесть" (пила)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(165, audioCtx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(
        82.5,
        audioCtx.currentTime + 2,
      );

      // Третий осциллятор — тихий фон (создаёт "дрожь")
      const osc3 = audioCtx.createOscillator();
      const gain3 = audioCtx.createGain();
      osc3.type = "triangle";
      osc3.frequency.setValueAtTime(55, audioCtx.currentTime);
      osc3.frequency.exponentialRampToValueAtTime(
        27.5,
        audioCtx.currentTime + 3,
      );

      // Фильтр низких частот (чтобы звук был глубже)
      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(400, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(
        150,
        audioCtx.currentTime + 2,
      );
      filter.Q.value = 3;

      // Подключаем
      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(gain1);
      gain1.connect(audioCtx.destination);

      // Настройка громкости (главная)
      gain1.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(
        0.0001,
        audioCtx.currentTime + 3.2,
      );

      // Громкость второго — тише, как эхо
      gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(
        0.0001,
        audioCtx.currentTime + 2.5,
      );
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);

      // Громкость третьего — едва слышно
      gain3.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain3.gain.exponentialRampToValueAtTime(
        0.0001,
        audioCtx.currentTime + 3.5,
      );
      osc3.connect(gain3);
      gain3.connect(audioCtx.destination);

      // Запуск
      osc1.start();
      osc2.start();
      osc3.start();

      osc1.stop(audioCtx.currentTime + 3.2);
      osc2.stop(audioCtx.currentTime + 2.8);
      osc3.stop(audioCtx.currentTime + 3.8);

      // Возобновляем AudioContext, если он на паузе
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
    } catch (e) {
      console.log("🔇 Ошибка воспроизведения зловещего звука:", e);
    }
  }

  function activateDarkMode(button) {
    console.log("🌑 ТЁМНЫЙ РЕЖИМ АКТИВИРОВАН! (6 кликов)");
    sessionStorage.setItem("darkModeUnlocked", "true");
    activateBadge(button);

    // 🔥 ЭФФЕКТНАЯ ПУЛЬСАЦИЯ ПО ПЕРИМЕТРУ
    showPurplePulse();

    // Показываем эпичное сообщение
    showEpicToast();

    // Если мы на странице каталога, просим его отрисовать категорию
    if (typeof window.renderDarkCategory === "function") {
      // Небольшая задержка для эпичности
      setTimeout(() => {
        window.renderDarkCategory();
      }, 500);
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
        <span class="epic-sub">Скрытые товары теперь доступны</span>
      </div>
    `;
    toast.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; 
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #d8b4fe; 
      padding: 16px 28px; 
      border-radius: 20px; 
      border: 2px solid #9333ea; 
      z-index: 1000; 
      animation: slideIn 0.3s ease, epicGlow 2s ease-in-out infinite;
      box-shadow: 0 0 30px rgba(147, 51, 234, 0.7);
      font-weight: bold;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  function activateBadge(element) {
    if (!element) return;
    if (!element.classList.contains("dark-activated")) {
      element.classList.add("dark-activated");
      const currentText = element.textContent.trim();
      // Убираем старый эмодзи, если был
      const cleanText = currentText.replace(/[🌑✨]/g, "").trim();
      element.textContent = `🌑 ${cleanText}`;
    }
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

  window.activateDarkMode = function () {
    if (sessionStorage.getItem("darkModeUnlocked") === "true") return;
    console.log("🌑 Ручная активация тёмного режима");
    sessionStorage.setItem("darkModeUnlocked", "true");
    const trigger = document.getElementById("darkModeTrigger");
    if (trigger) {
      activateBadge(trigger);
    }
    showPurplePulse();
    showEpicToast();
    if (typeof window.renderDarkCategory === "function") {
      setTimeout(() => window.renderDarkCategory(), 500);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
