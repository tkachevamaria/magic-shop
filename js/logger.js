/**
 * logger.js — отправляет логи на бэк (POST /api/log) и дублирует в консоль.
 * Подключать один раз на каждой странице: <script src="logger.js"></script>
 * Требует: токен в localStorage под ключом "token".
 * Требует: переменная API_URL должна быть объявлена до подключения этого файла.
 */

/**
 * Базовая функция. level: "debug" | "info" | "warn" | "error"
 * Не бросает исключений — если лог не доставлен, просто молчим.
 */
async function sendLog(level, message, details = "") {
  // Дублируем в консоль
  const consoleFn = level === "error" ? console.error
                  : level === "warn"  ? console.warn
                  : console.log;
  consoleFn(`[${level.toUpperCase()}] ${message}`, details || "");

  const token = localStorage.getItem("token");
  if (!token) return; // не залогинен — на бэк не шлём (эндпоинт закрыт авторизацией)

  try {
    await fetch(`${API_URL}/api/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ level, message, details: String(details) }),
    });
  } catch {
    // намеренно игнорируем — падение логгера не должно ломать UI
  }
}

// Удобные shortcut-функции
function logInfo(message, details)  { return sendLog("info",  message, details); }
function logWarn(message, details)  { return sendLog("warn",  message, details); }
function logError(message, details) { return sendLog("error", message, details); }