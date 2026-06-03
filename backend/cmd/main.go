package main

import (
	"context"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"magic-shop/internal/auth"
	"magic-shop/internal/cart"
	"magic-shop/internal/catalog"
	"magic-shop/internal/db"
	"magic-shop/internal/logger"
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
	log.Println("✅ Подключение к БД установлено")

	// 2. Настройка логирования
	logFile, err := os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		log.Fatalf("Ошибка открытия лог-файла: %v", err)
	}
	defer logFile.Close()
	log.SetOutput(io.MultiWriter(os.Stdout, logFile))
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	log.Println("✅ Логирование настроено → app.log")

	// 3. Контекст приложения — отменяется при SIGINT/SIGTERM
	appCtx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	// 4. Инициализация модулей
	//  Каталог
	productRepo := catalog.NewProductRepo(database)
	productService := catalog.NewProductService(productRepo)
	productHandler := catalog.NewProductHandler(productService)

	//  Аутентификация
	authRepo := auth.NewRepo(database)
	authService := auth.NewService(authRepo)
	authHandler := auth.NewHandler(authService)

	//  Корзина
	cartRepo := cart.NewRepo(database)
	cartService := cart.NewService(cartRepo)
	cartHandler := cart.NewHandler(cartService)

	//  Заказы
	orderRepo := orders.NewRepo(database)
	orderService := orders.NewService(orderRepo)
	orderHandler := orders.NewHandler(orderService)

	//  Профиль
	profileHandler := users.NewProfileHandler(database)

	// 5. Настройка роутера
	r := chi.NewRouter()

	//  CORS
	r.Use(cors.Handler(cors.Options{
		//AllowedOrigins:   []string{"*"},
		AllowedOrigins:   []string{"http://127.0.0.1:5500", "http://127.0.0.1:3000", "http://localhost:3000", "http://localhost:5500"}, // порты фронта
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	//  Базовые эндпоинты
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Magic Market API is running!"))
	})
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	//Раздача статических файлов
	r.Handle("/static/*", http.StripPrefix("/static/", http.FileServer(http.Dir("../static"))))
	r.Handle("/images/*", http.StripPrefix("/images/", http.FileServer(http.Dir("../static/images"))))

	//Аутентификация
	r.Post("/auth/register", authHandler.Register)
	r.Post("/auth/login", authHandler.Login)
	r.Delete("/auth/user/{id}", authHandler.DeleteUser)

	// Каталог
	r.Get("/api/filters", productHandler.GetSidebarFilters)
	r.Get("/api/products", productHandler.GetProducts)
	r.Get("/api/products/dark", productHandler.GetDarkProducts)
	r.Get("/api/products/search", productHandler.SearchProducts)
	r.Get("/api/products/{id}", productHandler.GetProductByID)

	// Защищенные маршруты
	//сколько живет токен?
	r.Group(func(r chi.Router) {
		r.Use(auth.Middleware)

		// Профиль
		r.Get("/api/users/profile/me", profileHandler.GetProfile)
		r.Put("/api/users/profile/me/address", authHandler.UpdateDeliveryAddress)

		// Корзина
		r.Get("/api/cart", cartHandler.GetCart)
		r.Post("/api/cart/{itemID}", cartHandler.IncrementItem)
		r.Post("/api/cart/{itemID}/decrement", cartHandler.DecrementItem)
		r.Delete("/api/cart/{itemID}", cartHandler.DeleteItem)

		// Логи с фронта
		r.Post("/api/log", logger.HandleFrontendLog)

		// Заказы
		r.Post("/api/orders", orderHandler.CreateOrder)
		r.Get("/api/orders", orderHandler.GetActiveOrders)
		r.Get("/api/purchases", orderHandler.GetPurchases)
		r.Get("/api/orders/{orderID}", orderHandler.GetOrderDetails)
	})

	// 6. Запуск воркера доставки
	go orderRepo.StartDeliveryWorker(appCtx, 15*time.Minute)

	// 7. Запуск сервера с graceful shutdown
	addr := ":8080"
	srv := &http.Server{Addr: addr, Handler: r}

	go func() {
		log.Printf("Сервер запущен на http://localhost%s", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Ошибка запуска сервера: %v", err)
		}
	}()

	<-appCtx.Done()
	log.Println("Завершение работы...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("Ошибка при остановке сервера: %v", err)
	}
	log.Println("Сервер остановлен")
}
