package main

import (
	"log"
	"net/http"

	"magic-shop/internal/db"

	"github.com/go-chi/chi/v5"
)

func main() {
	// 1. Инициализация БД
	cfg := db.DefaultConfig()
	database, err := db.InitDB(cfg)
	if err != nil {
		log.Fatalf("❌ Ошибка инициализации БД: %v", err)
	}
	defer database.Close()
	log.Println("🟢 Подключение к БД установлено")

	// 2. Настройка роутера
	r := chi.NewRouter()

	// Тестовые маршруты (проверка работоспособности)
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("🪄 Magic Market API is running!"))
	})
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// 3. Запуск сервера
	addr := ":8080"
	log.Printf("🚀 Сервер запущен на http://localhost%s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("❌ Ошибка запуска сервера: %v", err)
	}
}