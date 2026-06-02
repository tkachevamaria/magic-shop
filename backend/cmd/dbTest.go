//go:build ignore

// Запуск: go run test_db.go
// Файл для ручной проверки БД — не входит в основную сборку.

package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

const dbPath = "../hp_market.db"

func main() {
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		log.Fatalf("DB file not found: %s\nRun the server first to create the DB.", dbPath)
	}

	db, err := sql.Open("sqlite", "file:"+dbPath+"?_pragma=foreign_keys(1)")
	if err != nil {
		log.Fatalf("Open error: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Ping failed: %v", err)
	}
	fmt.Println("DB connection OK\n")

	//createTestDeliveredOrder(db)
	checkOrders(db)
}

func checkShops(db *sql.DB) {
	fmt.Println("Shops:")
	rows, err := db.Query("SELECT ShopID, ShopName FROM Shops")
	if err != nil {
		log.Printf("  error: %v", err)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var ShopID int
		var ShopName string
		rows.Scan(&ShopID, &ShopName)
		fmt.Printf("  ShopID=%-3d  ShopName=%s\n", ShopID, ShopName)
	}
	fmt.Println()
}

func checkCategories(db *sql.DB) {
	fmt.Println("Categories:")
	rows, err := db.Query("SELECT CategoryID, CategoryName FROM Categories")
	if err != nil {
		log.Printf("  error: %v", err)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var CategoryID int
		var CategoryName string
		rows.Scan(&CategoryID, &CategoryName)
		fmt.Printf("  CategoryID=%-3d  CategoryName=%s\n", CategoryID, CategoryName)
	}
	fmt.Println()
}

func checkProducts(db *sql.DB) {
	fmt.Println("Products:")
	rows, err := db.Query(`
		SELECT p.ProductID, p.ProductName, p.Price, p.RequiredLevel, p.DeliveryMethodID, c.CategoryName, s.ShopName
		FROM Products p
		LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
		LEFT JOIN Shops s ON p.ShopID = s.ShopID
	`)
	if err != nil {
		log.Printf("  error: %v", err)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var ProductID, RequiredLevel int
		var ProductName, DeliveryMethodID, CategoryName, ShopName string
		var Price float64
		rows.Scan(&ProductID, &ProductName, &Price, &RequiredLevel, &DeliveryMethodID, &CategoryName, &ShopName)
		fmt.Printf("  ProductID=%-3d  ProductName=%-30s  Price=%-8.1f  RequiredLevel=%d  DeliveryMethodID=%-15s  CategoryName=%s  ShopName=%s\n",
			ProductID, ProductName, Price, RequiredLevel, DeliveryMethodID, CategoryName, ShopName)
	}
	fmt.Println()
}

func checkUsers(db *sql.DB) {
	fmt.Println("Users:")
	rows, err := db.Query("SELECT UserID, FirstName, Surname, Email, AccessLevel, TotalSpent, DeliveryAddress FROM Users")
	if err != nil {
		log.Printf("  error: %v", err)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var UserID, AccessLevel int
		var FirstName, Surname, Email, DeliveryAddress string
		var TotalSpent float64
		rows.Scan(&UserID, &FirstName, &Surname, &Email, &AccessLevel, &TotalSpent, &DeliveryAddress)
		fmt.Printf("  UserID=%-3d  FirstName=%-10s  Surname=%-12s  Email=%-25s  AccessLevel=%d  TotalSpent=%.1f  DeliveryAddress=%s\n",
			UserID, FirstName, Surname, Email, AccessLevel, TotalSpent, DeliveryAddress)
	}
	fmt.Println()
}

func checkItems(db *sql.DB) {
	fmt.Println("Items:")
	rows, err := db.Query(`
		SELECT i.ItemID, i.ProductID, p.ProductName, i.Color, i.Size, i.StockQuantity
		FROM Items i
		JOIN Products p ON i.ProductID = p.ProductID
	`)
	if err != nil {
		log.Printf("  error: %v", err)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var ItemID, ProductID, StockQuantity int
		var ProductName, Color, Size string
		rows.Scan(&ItemID, &ProductID, &ProductName, &Color, &Size, &StockQuantity)
		fmt.Printf("  ItemID=%-3d  ProductID=%-3d  ProductName=%-30s  Color=%-12s  Size=%-10s  StockQuantity=%d\n",
			ItemID, ProductID, ProductName, Color, Size, StockQuantity)
	}
	fmt.Println()
}

func checkCartWithItems(db *sql.DB) {
	fmt.Println("Cart + CartItems:")
	rows, err := db.Query(`
		SELECT c.CartID, c.UserID, u.FirstName, u.Surname, ci.CartItemID, ci.ItemID, p.ProductName, ci.Quantity
		FROM Cart c
		JOIN Users u ON c.UserID = u.UserID
		JOIN CartItems ci ON ci.CartID = c.CartID
		JOIN Items i ON ci.ItemID = i.ItemID
		JOIN Products p ON i.ProductID = p.ProductID
	`)
	if err != nil {
		log.Printf("  error: %v", err)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var CartID, UserID, CartItemID, ItemID, Quantity int
		var FirstName, Surname, ProductName string
		rows.Scan(&CartID, &UserID, &FirstName, &Surname, &CartItemID, &ItemID, &ProductName, &Quantity)
		fmt.Printf("  CartID=%-3d  UserID=%-3d  FirstName=%-10s  Surname=%-12s  CartItemID=%-3d  ItemID=%-3d  ProductName=%-30s  Quantity=%d\n",
			CartID, UserID, FirstName, Surname, CartItemID, ItemID, ProductName, Quantity)
	}
	fmt.Println()
}

func testInsertOrder(db *sql.DB) {
	fmt.Println("INSERT into Orders (ItemID as semicolon-separated list):")

	ItemID := "1;3;5"
	_, err := db.Exec(`
		INSERT INTO Orders (UserID, ItemID, DeliveryMethodID, DeliveryAddress)
		VALUES (1, ?, 'OWL', 'Hogwarts, Gryffindor Tower')
	`, ItemID)
	if err != nil {
		log.Printf("  insert error: %v\n", err)
		return
	}
	fmt.Printf("  OK  ItemID=%q\n\n", ItemID)
}

func checkOrders(db *sql.DB) {
	fmt.Println("Orders:")
	rows, err := db.Query(`
		SELECT o.OrderID, o.UserID, u.FirstName, u.Surname, o.ItemID, o.Status, o.DeliveryMethodID, o.DeliveryAddress, o.OrderDate, o.EstimatedDeliveryDate, o.ActualDeliveryDate
		FROM Orders o
		JOIN Users u ON o.UserID = u.UserID
	`)
	if err != nil {
		log.Printf("  error: %v", err)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var OrderID, UserID int
		var FirstName, Surname, ItemID, Status, DeliveryMethodID, DeliveryAddress, OrderDate, EstimatedDeliveryDate, ActualDeliveryDate string
		rows.Scan(&OrderID, &UserID, &FirstName, &Surname, &ItemID, &Status, &DeliveryMethodID, &DeliveryAddress, &OrderDate, &EstimatedDeliveryDate, &ActualDeliveryDate)
		fmt.Printf("  OrderID=%-3d  UserID=%-3d  FirstName=%-10s  Surname=%-12s  ItemID=%-10s  Status=%-10s  DeliveryMethodID=%-15s  DeliveryAddress=%-30s  OrderDate=%s  EstimatedDeliveryDate=%s  ActualDeliveryDate=%s\n",
			OrderID, UserID, FirstName, Surname, ItemID, Status, DeliveryMethodID, DeliveryAddress, OrderDate, EstimatedDeliveryDate, ActualDeliveryDate)
	}
	fmt.Println()
}

func checkUsersAll(db *sql.DB) {
	fmt.Println("Users:")
	rows, err := db.Query("SELECT UserID, FirstName, Surname, Email, PasswordHash, AccessLevel, TotalSpent, DeliveryAddress FROM Users")
	if err != nil {
		log.Printf("  error: %v", err)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var UserID, AccessLevel int
		var FirstName, Surname, Email, PasswordHash, DeliveryAddress string
		var TotalSpent float64
		rows.Scan(&UserID, &FirstName, &Surname, &Email, &PasswordHash, &AccessLevel, &TotalSpent, &DeliveryAddress)
		fmt.Printf("  UserID=%-3d | FirstName=%-10s | Surname=%-12s | Email=%-25s | AccessLevel=%d | TotalSpent=%-6.1f | PasswordHash=%s | DeliveryAddress=%s\n",
			UserID, FirstName, Surname, Email, AccessLevel, TotalSpent, PasswordHash, DeliveryAddress)
	}
	fmt.Println()
}

func updateOrderToDelivered(db *sql.DB, orderID int, daysAgo int) {
	pastDate := time.Now().AddDate(0, 0, -daysAgo).Format(time.RFC3339)

	result, err := db.Exec(`
		UPDATE Orders 
		SET Status = 'DELIVERED', 
		    ActualDeliveryDate = ?
		WHERE OrderID = ? AND Status != 'DELIVERED'
	`, pastDate, orderID)

	if err != nil {
		log.Printf("  error updating order %d: %v", orderID, err)
		return
	}

	result, err = db.Exec(`
	UPDATE Orders 
	SET ActualDeliveryDate = datetime('now')
	WHERE Status = 'DELIVERED'`)

	if err != nil {
		log.Printf("  error updating delivery dates: %v", err)
		return
	}

	rows, _ := result.RowsAffected()
	if rows > 0 {
		fmt.Printf("✅ Order %d updated to DELIVERED (delivery date: %s)\n", orderID, pastDate)
	} else {
		fmt.Printf("⚠️ Order %d not found or already delivered\n", orderID)
	}
}

func checkTimeFormat(db *sql.DB) {
	rows, err := db.Query(`
		SELECT OrderID, EstimatedDeliveryDate, ActualDeliveryDate, Status 
		FROM Orders 
		WHERE EstimatedDeliveryDate IS NOT NULL 
		LIMIT 3`)
	if err != nil {
		log.Printf("  error checking time format: %v", err)
		return
	}
	defer rows.Close()

	fmt.Println("-------------------")
	fmt.Println("Recent orders with delivery dates:")

	for rows.Next() {
		var orderID int
		var estimatedDate, actualDate sql.NullString
		var status string

		err := rows.Scan(&orderID, &estimatedDate, &actualDate, &status)
		if err != nil {
			log.Printf("  error scanning row: %v", err)
			continue
		}

		estDate := "NULL"
		if estimatedDate.Valid {
			estDate = estimatedDate.String
		}

		actDate := "NULL"
		if actualDate.Valid {
			actDate = actualDate.String
		}

		fmt.Printf("Order %d: Status=%s, Estimated=%s, Actual=%s\n",
			orderID, status, estDate, actDate)
	}
	fmt.Println("-------------------")
}

func createTestDeliveredOrder(db *sql.DB) {
	fmt.Println("=== Создание тестового заказа для проверки воркера ===")

	// 1. Создаём тестовый заказ с датой доставки в прошлом
	fmt.Println("Создаю тестовый заказ с датой доставки час назад...")

	result, err := db.Exec(`
		INSERT INTO Orders (
			UserID, 
			ItemID,
			Status, 
			EstimatedDeliveryDate,
			DeliveryAddress
		) VALUES (
			1,
			'1,2,3',
			'SHIPPED',
			datetime('now', '-1 hour'),
			'Test Address'
		)
	`)
	if err != nil {
		log.Printf("  ошибка при создании заказа: %v", err)
		return
	}

	orderID, _ := result.LastInsertId()
	fmt.Printf("  ✅ Создан тестовый заказ OrderID=%d\n\n", orderID)

	// 2. Проверяем статус созданного заказа
	fmt.Println("Проверка статуса созданного заказа:")
	rows, err := db.Query(`
		SELECT OrderID, Status, EstimatedDeliveryDate, 
		       COALESCE(ActualDeliveryDate, '---') as ActualDeliveryDate
		FROM Orders 
		WHERE Status = 'SHIPPED'
	`)
	if err != nil {
		log.Printf("  ошибка при запросе: %v", err)
		return
	}
	defer rows.Close()

	fmt.Printf("  %-10s %-12s %-25s %-25s\n", "OrderID", "Status", "EstimatedDeliveryDate", "ActualDeliveryDate")
	fmt.Println("  " + strings.Repeat("-", 75))

	for rows.Next() {
		var id int
		var status, estDelivery, actDelivery string
		rows.Scan(&id, &status, &estDelivery, &actDelivery)
		fmt.Printf("  %-10d %-12s %-25s %-25s\n", id, status, estDelivery, actDelivery)
	}

	fmt.Println("\n💡 Через 15 минут (или после перезапуска сервера) статус изменится на DELIVERED")
	fmt.Println("=== Готово ===\n")
}
