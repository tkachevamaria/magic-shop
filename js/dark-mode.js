/* dark-mode.js - исправленная версия */
(function () {
  let isInitialized = false;

  function init() {
    if (isInitialized) return;

    // Пытаемся найти кнопку, если не нашли - ждём через MutationObserver
    const trigger = document.getElementById("darkModeTrigger");
    if (trigger) {
      attachClickListener(trigger);
      isInitialized = true;
    } else {
      // Ждём появления кнопки в DOM (так как sidebar-panel рендерится асинхронно)
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

  // Функция ожидания появления элемента
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
    // Убираем старые обработчики, чтобы не было дублей
    element.removeEventListener("click", handleClick);
    element.addEventListener("click", handleClick);
    console.log("🌑 Обработчик клика повешен на #darkModeTrigger");
  }

  function handleClick(event) {
    event.stopPropagation();
    console.log("🌑 Клик по Dark Mode Trigger! Активация...");
    sessionStorage.setItem("darkModeUnlocked", "true");
    activateBadge(event.currentTarget);
    showToast("🌑 Доступ к тёмным товарам получен. Перейдите в каталог!");

    // Если мы на странице каталога, просим его отрисовать категорию
    if (typeof window.renderDarkCategory === "function") {
      window.renderDarkCategory();
    }
  }

  function activateBadge(element) {
    if (!element) return;
    if (!element.classList.contains("dark-activated")) {
      element.classList.add("dark-activated");
      const currentText = element.textContent.trim();
      if (!currentText.includes("🌑")) {
        element.textContent = `🌑 ${currentText}`;
      }
    }
  }

  function showToast(message) {
    const old = document.querySelector(".cart-toast");
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
    setTimeout(() => toast.remove(), 3000);
  }

  // Глобальная функция для ручного вызова из других скриптов
  window.activateDarkMode = function () {
    console.log("🌑 Ручная активация тёмного режима");
    sessionStorage.setItem("darkModeUnlocked", "true");
    const trigger = document.getElementById("darkModeTrigger");
    if (trigger) {
      activateBadge(trigger);
    }
    showToast("🌑 Доступ к тёмным товарам получен!");
    if (typeof window.renderDarkCategory === "function") {
      window.renderDarkCategory();
    }
  };

  // Запускаем инициализацию после загрузки DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
