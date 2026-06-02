/* dark-music.js - музыка для тёмного режима */
(function () {
  // МУЗЫКАЛЬНЫЕ НАСТРОЙКИ
  const MUSIC_URL = "/static/DarkNecessities.mp3";
  const MUSIC_START_TIME = 90;
  const MUSIC_VOLUME = 0.5;

  let musicPlayer = null;
  let musicStarted = false;

  // Инициализация плеера (без воспроизведения)
  function initPlayer() {
    if (musicPlayer) return;

    musicPlayer = new Audio(MUSIC_URL);
    musicPlayer.loop = true;
    musicPlayer.volume = MUSIC_VOLUME;
    musicPlayer.currentTime = MUSIC_START_TIME;

    musicPlayer.addEventListener("error", () => {
      console.error("🔇 Ошибка загрузки музыки:", MUSIC_URL);
    });

    musicPlayer.addEventListener("play", () => {
      isMusicPlaying = true;
      console.log("🎵 Музыка тёмного режима запущена");
    });

    musicPlayer.addEventListener("pause", () => {
      isMusicPlaying = false;
    });
  }

  // Запуск музыки
  function start() {
    if (!musicPlayer) initPlayer();

    // Если уже играет — не трогаем
    if (isMusicPlaying) return;

    // Сбрасываем на нужную позицию
    musicPlayer.currentTime = MUSIC_START_TIME;

    // Запускаем
    musicPlayer.play().catch((e) => {
      console.log("🎵 Не удалось запустить музыку автоматически");
    });
  }

  // Остановка музыки
  function stop() {
    if (musicPlayer && !musicPlayer.paused) {
      musicPlayer.pause();
      isMusicPlaying = false;
      console.log("🎵 Музыка тёмного режима остановлена");
    }
  }

  // Изменить громкость
  function setVolume(volume) {
    if (musicPlayer) {
      musicPlayer.volume = Math.max(0, Math.min(1, volume));
    }
  }

  // Изменить позицию (секунды)
  function setPosition(seconds) {
    if (musicPlayer) {
      musicPlayer.currentTime = seconds;
    }
  }

  // Проверить, играет ли музыка
  function isPlaying() {
    return isMusicPlaying;
  }

  // Экспортируем API
  window.DarkMusic = {
    start,
    stop,
    setVolume,
    setPosition,
    isPlaying,
    init: initPlayer,
  };
})();
