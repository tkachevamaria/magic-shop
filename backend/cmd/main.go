package main

import (
	"log"
	"magic-shop/internal/auth"
	"magic-shop/internal/cart"
	"magic-shop/internal/db"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func main() {
	// Инициализация БД
	cfg := db.DefaultConfig()
	database, err := db.InitDB(cfg)
	if err != nil {
		log.Fatalf("Ошибка инициализации БД: %v", err)
	}
	defer database.Close()
	log.Println("Подключение к БД установлено")

	// Настройка роутера
	r := chi.NewRouter()

	//регистрация маршрутов для аутентификации
	authRepo := auth.NewRepo(database)
	authService := auth.NewService(authRepo)
	authHandler := auth.NewHandler(authService)

	r.Post("/auth/register", authHandler.Register)
	r.Post("/auth/login", authHandler.Login)
	r.Delete("/auth/user/{id}", authHandler.DeleteUser)

	//регистрация маршрутов для корзины
	cartRepo := cart.NewRepo(database)
	cartService := cart.NewService(cartRepo)
	cartHandler := cart.NewHandler(cartService)

	r.Get("/cart/{userID}", cartHandler.GetCart)
	r.Post("/cart/{userID}/items/{itemID}/increment", cartHandler.IncrementItem)
	r.Post("/cart/{userID}/items/{itemID}/decrement", cartHandler.DecrementItem)
	r.Delete("/cart/{userID}/items/{itemID}", cartHandler.DeleteItem)

	// Тестовые маршруты
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Magic Market API is running!"))
	})
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// 3. Запуск сервера
	addr := ":8080"
	log.Printf("Сервер запущен на http://localhost%s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}
