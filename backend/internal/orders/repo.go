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

// getOrdersByStatus — универсальный метод для заказов/покупок
func (r *Repo) getOrdersByStatus(ctx context.Context, userID int, statusCondition string) ([]OrderSummary, error) {
	query := `
		SELECT o.OrderID, o.Status, dm.Name, o.EstimatedDeliveryDate, o.ActualDeliveryDate, 
			   o.ItemID, o.DeliveryAddress, 
			   (SELECT SUM(p.Price * 1) FROM Items i 
			    JOIN Products p ON i.ProductID = p.ProductID 
			    WHERE i.ItemID IN (SELECT value FROM json_each('["' || REPLACE(o.ItemID, ';', '","') || '"]'))) as total
		FROM Orders o
		JOIN DeliveryMethods dm ON o.DeliveryMethodID = dm.DeliveryMethodID
		WHERE o.UserID = ? AND ` + statusCondition + `
		ORDER BY o.OrderDate DESC
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []OrderSummary
	for rows.Next() {
		var o OrderSummary
		var itemIDsStr, estDateStr, actDateStr sql.NullString
		err := rows.Scan(&o.OrderID, &o.Status, &o.DeliveryName, &estDateStr, &actDateStr, &itemIDsStr, &o.DeliveryAddress, &o.TotalPrice)
		if err != nil {
			return nil, err
		}
		
		// Считаем количество товаров
		if itemIDsStr.Valid {
			o.ItemsCount = len(strings.Split(itemIDsStr.String, ";"))
		}
		
		// Форматируем даты
		if estDateStr.Valid {
			if t, err := time.Parse("2006-01-02 15:04:05", estDateStr.String); err == nil {
				o.EstimatedDate = t.Format("02 Jan 15:04")
			}
		}
		if actDateStr.Valid && actDateStr.String != "" {
			if t, err := time.Parse("2006-01-02 15:04:05", actDateStr.String); err == nil {
				o.ActualDate = t.Format("02 Jan 15:04")
			}
		}
		orders = append(orders, o)
	}
	return orders, rows.Err()
}

func (r *Repo) GetActiveOrders(ctx context.Context, userID int) ([]OrderSummary, error) {
	return r.getOrdersByStatus(ctx, userID, "o.Status != 'DELIVERED'")
}

func (r *Repo) GetPurchases(ctx context.Context, userID int) ([]OrderSummary, error) {
	return r.getOrdersByStatus(ctx, userID, "o.Status = 'DELIVERED'")
}

func (r *Repo) GetOrderDetails(ctx context.Context, orderID int) (*OrderDetails, error) {
	var od OrderDetails
	var itemIDsStr, estDateStr, actDateStr sql.NullString
	
	err := r.db.QueryRowContext(ctx, `
		SELECT o.OrderID, o.Status, dm.Name, o.EstimatedDeliveryDate, o.ActualDeliveryDate, 
		       o.ItemID, o.DeliveryAddress,
		       (SELECT SUM(p.Price) FROM Items i 
		        JOIN Products p ON i.ProductID = p.ProductID 
		        WHERE i.ItemID IN (SELECT value FROM json_each('["' || REPLACE(o.ItemID, ';', '","') || '"]')))
		FROM Orders o 
		JOIN DeliveryMethods dm ON o.DeliveryMethodID = dm.DeliveryMethodID
		WHERE o.OrderID = ?
	`, orderID).Scan(&od.OrderID, &od.Status, &od.DeliveryName, &estDateStr, &actDateStr, &itemIDsStr, &od.DeliveryAddress, &od.TotalPrice)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if estDateStr.Valid {
		if t, err := time.Parse("2006-01-02 15:04:05", estDateStr.String); err == nil {
			od.EstimatedDate = t.Format("02 Jan 15:04")
		}
	}
	if actDateStr.Valid && actDateStr.String != "" {
		if t, err := time.Parse("2006-01-02 15:04:05", actDateStr.String); err == nil {
			od.ActualDate = t.Format("02 Jan 15:04")
		}
	}
	if itemIDsStr.Valid {
		od.ItemsCount = len(strings.Split(itemIDsStr.String, ";"))
	}

	// Загружаем детали товаров
	// Парсим "1;2;3" -> [1, 2, 3]
	idStrs := strings.Split(itemIDsStr.String, ";")
	ids := make([]interface{}, len(idStrs))
	for i, s := range idStrs {
		ids[i], _ = strconv.Atoi(s)
	}
	
	ph := make([]string, len(ids))
	for i := range ph { ph[i] = "?" }
	
	query := `
		SELECT i.ItemID, p.ProductName, p.Price, p.CategoryID, i.Color, i.Size
		FROM Items i 
		JOIN Products p ON i.ProductID = p.ProductID
		WHERE i.ItemID IN (` + strings.Join(ph, ",") + `)
	`
	rows, err := r.db.QueryContext(ctx, query, ids...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []OrderItemDetail
	for rows.Next() {
		var item OrderItemDetail
		var catID int
		err := rows.Scan(&item.ProductID, &item.Name, &item.Price, &catID, &item.Color, &item.Size)
		if err != nil { continue }
		item.ImageURL = "/images/default.png"
		item.Quantity = 1
		items = append(items, item)
	}
	od.Items = items

	return &od, rows.Err()
}