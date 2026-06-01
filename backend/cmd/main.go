package main

import (
	"log"
	"net/http"

	"magic-shop/internal/auth"
	"magic-shop/internal/cart"
	"magic-shop/internal/catalog"
	"magic-shop/internal/db"
	"magic-shop/internal/orders"
	"magic-shop/internal/users"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
)

func main() {
	// 1. Инициализация БД
	cfg := db.DefaultConfig()
	database, err := db.InitDB(cfg)
	if err != nil {
		log.Fatalf("Ошибка инициализации БД: %v", err)
	}
	defer database.Close()
	log.Println("Подключение к БД установлено")

	// 2. Инициализация репозиториев, сервисов и хендлеров
	// Каталог
	catalogRepo := catalog.NewProductRepo(database)
	catalogService := catalog.NewProductService(catalogRepo)
	catalogHandler := catalog.NewProductHandler(catalogService)

	// Аутентификация
	authRepo := auth.NewRepo(database)
	authService := auth.NewService(authRepo)
	authHandler := auth.NewHandler(authService)

	// Корзина
	cartRepo := cart.NewRepo(database)
	cartService := cart.NewService(cartRepo)
	cartHandler := cart.NewHandler(cartService)

	// Заказы
	orderRepo := orders.NewRepo(database)
	orderService := orders.NewService(orderRepo)
	orderHandler := orders.NewHandler(orderService)

	// Профиль пользователя
	profileHandler := users.NewProfileHandler(database)

	// Настройка роутера
	r := chi.NewRouter()

	// Настройка CORPS
	r.Use(cors.Handler(cors.Options{
	AllowedOrigins: []string{"http://127.0.0.1:5500", "http://127.0.0.1:3000", "http://localhost:3000", "http://localhost:5500"}, // порты фронта
	AllowedMethods: []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
	AllowedHeaders: []string{"Content-Type"},
	MaxAge:         300,
	}))

	//  Базовые эндпоинты
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Magic Market API is running!"))
	})
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Аутентификация
	r.Post("/auth/register", authHandler.Register)
	r.Post("/auth/login", authHandler.Login)
	r.Delete("/auth/user/{id}", authHandler.DeleteUser)

	// Каталог
	r.Get("/api/products", catalogHandler.GetProducts)
	r.Get("/api/products/dark", catalogHandler.GetDarkProducts)
	r.Get("/api/products/search", catalogHandler.SearchProducts)
	r.Get("/api/products/{id}", catalogHandler.GetProductByID)

	// Корзина
	r.Get("/api/cart/{userID}", cartHandler.GetCart)
	r.Post("/api/cart/{userID}/{itemID}", cartHandler.IncrementItem)           // Добавить / увеличить кол-во
	r.Post("/api/cart/{userID}/{itemID}/decrement", cartHandler.DecrementItem) // Уменьшить кол-во
	r.Delete("/api/cart/{userID}/{itemID}", cartHandler.DeleteItem)            // Удалить из корзины

	// Заказы (активные / в пути)
	r.Get("/api/orders/{userID}", orderHandler.GetActiveOrders)
	r.Get("/api/orders/{userID}/{orderID}", orderHandler.GetOrderDetails)

	// Профиль пользователя
	r.Get("/api/users/profile/{userID}", profileHandler.GetProfile)

	// 4. Запуск сервера
	addr := ":8080"
	log.Printf("Сервер запущен на http://localhost%s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}
