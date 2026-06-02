(function () {

  /** Сколько миллисекунд живёт сессия пользователя. 1 час по умолчанию. */
  const USER_SESSION_TTL_MS = 1 * 60 * 60 * 1000;

  const token     = localStorage.getItem("token");
  const loginTime = parseInt(localStorage.getItem("login_time"), 10);

  if (!token) {
    console.warn("auth-guard: нет токена → редирект на auth.html");
    window.location.href = "auth.html";
    return;
  }

  // Проверяем TTL только если login_time есть
  if (loginTime && !isNaN(loginTime)) {
    if (Date.now() - loginTime > USER_SESSION_TTL_MS) {
      console.warn("auth-guard: сессия истекла → очищаем и редиректим");
      _clearUserSession();
      window.location.href = "auth.html?expired=session";
      return;
    }
  }

  console.log("auth-guard: пользователь авторизован");

  /** Удаляет все данные сессии из localStorage. */
  function _clearUserSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("access_level");
    localStorage.removeItem("login_time");
  }

  /** Публичная функция ручного выхода — вызывать из кнопки "Выйти". */
  window.logout = function () {
    _clearUserSession();
    window.location.href = "auth.html";
  };

})();