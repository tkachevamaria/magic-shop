package main

import (
	"log"
	"magic-shop/internal/auth"
	"magic-shop/internal/catalog"
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

	// 📦 Инициализация модуля catalog
	productRepo := catalog.NewProductRepo(database)
	productService := catalog.NewProductService(productRepo)
	productHandler := catalog.NewProductHandler(productService)


	// Настройка роутера
	r := chi.NewRouter()

	//регистрация маршрутов для аутентификации
	authRepo := auth.NewRepo(database)
	authService := auth.NewService(authRepo)
	authHandler := auth.NewHandler(authService)

	r.Post("/auth/register", authHandler.Register)
	r.Post("/auth/login", authHandler.Login)
	r.Delete("/auth/user/{id}", authHandler.DeleteUser)

	// Тестовые маршруты
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Magic Market API is running!"))
	})
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	r.Get("/api/products", productHandler.GetProducts)

	// 3. Запуск сервера
	addr := ":8080"
	log.Printf("Сервер запущен на http://localhost%s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}
