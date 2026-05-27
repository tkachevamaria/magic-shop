//go:build ignore

// Запуск: go run test_db.go
// Файл для ручной проверки БД — не входит в основную сборку.

package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

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

	checkUsersAll(db)
	checkCartWithItems(db)
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
		SELECT p.ProductID, p.ProductName, p.Price, p.RequiredLevel, p.DeliveryType, c.CategoryName, s.ShopName
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
		var ProductName, DeliveryType, CategoryName, ShopName string
		var Price float64
		rows.Scan(&ProductID, &ProductName, &Price, &RequiredLevel, &DeliveryType, &CategoryName, &ShopName)
		fmt.Printf("  ProductID=%-3d  ProductName=%-30s  Price=%-8.1f  RequiredLevel=%d  DeliveryType=%-15s  CategoryName=%s  ShopName=%s\n",
			ProductID, ProductName, Price, RequiredLevel, DeliveryType, CategoryName, ShopName)
	}
	fmt.Println()
}

func checkUsers(db *sql.DB) {
	fmt.Println("Users:")
	rows, err := db.Query("SELECT UserID, FirstName, Surname, Email, AccessLevel, TotalSpent FROM Users")
	if err != nil {
		log.Printf("  error: %v", err)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var UserID, AccessLevel int
		var FirstName, Surname, Email string
		var TotalSpent float64
		rows.Scan(&UserID, &FirstName, &Surname, &Email, &AccessLevel, &TotalSpent)
		fmt.Printf("  UserID=%-3d  FirstName=%-10s  Surname=%-12s  Email=%-25s  AccessLevel=%d  TotalSpent=%.1f\n",
			UserID, FirstName, Surname, Email, AccessLevel, TotalSpent)
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
		INSERT INTO Orders (UserID, ItemID, DeliveryType, DeliveryAddress)
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
		SELECT o.OrderID, o.UserID, u.FirstName, u.Surname, o.ItemID, o.Status, o.DeliveryType, o.DeliveryAddress, o.OrderDate
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
		var FirstName, Surname, ItemID, Status, DeliveryType, DeliveryAddress, OrderDate string
		rows.Scan(&OrderID, &UserID, &FirstName, &Surname, &ItemID, &Status, &DeliveryType, &DeliveryAddress, &OrderDate)
		fmt.Printf("  OrderID=%-3d  UserID=%-3d  FirstName=%-10s  Surname=%-12s  ItemID=%-10s  Status=%-10s  DeliveryType=%-15s  DeliveryAddress=%-30s  OrderDate=%s\n",
			OrderID, UserID, FirstName, Surname, ItemID, Status, DeliveryType, DeliveryAddress, OrderDate)
	}
	fmt.Println()
}

func checkUsersAll(db *sql.DB) {
	fmt.Println("Users:")
	rows, err := db.Query("SELECT UserID, FirstName, Surname, Email, PasswordHash, AccessLevel, TotalSpent FROM Users")
	if err != nil {
		log.Printf("  error: %v", err)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var UserID, AccessLevel int
		var FirstName, Surname, Email, PasswordHash string
		var TotalSpent float64
		rows.Scan(&UserID, &FirstName, &Surname, &Email, &PasswordHash, &AccessLevel, &TotalSpent)
		fmt.Printf("  UserID=%-3d | FirstName=%-10s | Surname=%-12s | Email=%-25s | AccessLevel=%d | TotalSpent=%-6.1f | PasswordHash=%s\n",
			UserID, FirstName, Surname, Email, AccessLevel, TotalSpent, PasswordHash)
	}
	fmt.Println()
}
