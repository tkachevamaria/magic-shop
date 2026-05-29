package orders

import (
	"context"
	"database/sql"
	"strconv"
	"strings"
	"time"
)

type Repo struct {
	db *sql.DB
}

func NewRepo(db *sql.DB) *Repo {
	return &Repo{db: db}
}

func (r *Repo) GetActiveOrders(ctx context.Context, userID int) ([]OrderSummary, error) {
	// Запрашиваем заказы, которые еще не в архиве (PENDING или IN_TRANSIT)
	rows, err := r.db.QueryContext(ctx, `
		SELECT o.OrderID, o.Status, dm.Name, o.EstimatedDeliveryDate, o.ItemID, o.DeliveryAddress
		FROM Orders o
		JOIN DeliveryMethods dm ON o.DeliveryMethodID = dm.DeliveryMethodID
		WHERE o.UserID = ? AND o.Status != 'DELIVERED'
		ORDER BY o.OrderDate DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []OrderSummary
	for rows.Next() {
		var o OrderSummary
		var itemIDsStr string
		var estDateStr string
		err := rows.Scan(&o.OrderID, &o.Status, &o.DeliveryName, &estDateStr, &itemIDsStr, &o.DeliveryAddress)
		if err != nil {
			return nil, err
		}
		// Считаем количество товаров по строке "1;2;3"
		o.ItemsCount = len(strings.Split(itemIDsStr, ";"))
		
		// Форматируем дату (29 May, 14:00)
		if t, err := time.Parse("2006-01-02 15:04:05", estDateStr); err == nil {
			o.EstimatedDate = t.Format("02 Jan 15:04")
		} else {
			o.EstimatedDate = estDateStr
		}
		orders = append(orders, o)
	}
	return orders, rows.Err()
}

func (r *Repo) GetOrderDetails(ctx context.Context, orderID int) (*OrderDetails, error) {
	// 1. Инфо о заказе
	var od OrderDetails
	var estDateStr, itemIDsStr string
	err := r.db.QueryRowContext(ctx, `
		SELECT o.OrderID, o.Status, dm.Name, o.EstimatedDeliveryDate, o.ItemID, o.DeliveryAddress
		FROM Orders o JOIN DeliveryMethods dm ON o.DeliveryMethodID = dm.DeliveryMethodID
		WHERE o.OrderID = ?
	`, orderID).Scan(&od.OrderID, &od.Status, &od.DeliveryName, &estDateStr, &itemIDsStr, &od.DeliveryAddress)
	
	if err == sql.ErrNoRows { return nil, nil }
	if err != nil { return nil, err }

	if t, err := time.Parse("2006-01-02 15:04:05", estDateStr); err == nil {
		od.EstimatedDate = t.Format("02 Jan 15:04")
	} else {
		od.EstimatedDate = estDateStr
	}
	od.ItemsCount = len(strings.Split(itemIDsStr, ";"))

	// 2. Инфо о товарах внутри заказа
	// Парсим "1;2;3" -> [1, 2, 3]
	idStrs := strings.Split(itemIDsStr, ";")
	ids := make([]interface{}, len(idStrs))
	for i, s := range idStrs {
		ids[i], _ = strconv.Atoi(s)
	}
	
	// Генерируем плейсхолдеры (?, ?, ?)
	ph := make([]string, len(ids))
	for i := range ph { ph[i] = "?" }
	
	// Запрос к Items + Products
	query := `
		SELECT i.ItemID, p.ProductName, p.Price, p.CategoryID, i.Color, i.Size
		FROM Items i JOIN Products p ON i.ProductID = p.ProductID
		WHERE i.ItemID IN (` + strings.Join(ph, ",") + `)
	`
	rows, err := r.db.QueryContext(ctx, query, ids...)
	if err != nil { return nil, err }
	defer rows.Close()

	var items []OrderItemDetail
	for rows.Next() {
		var item OrderItemDetail
		var catID int
		err := rows.Scan(&item.ProductID, &item.Name, &item.Price, &catID, &item.Color, &item.Size)
		if err != nil { continue }
		item.ImageURL = "/images/default.png" // Заглушка, можно привязать к catID
		item.Quantity = 1 // В Orders у нас просто ID, считаем каждый вхождение за 1 шт
		items = append(items, item)
	}
	od.Items = items

	return &od, rows.Err()
}