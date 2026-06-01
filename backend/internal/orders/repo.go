package orders

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
)

var ErrCartEmpty = errors.New("cart is empty")
var ErrOutOfStock = errors.New("one or more items are out of stock")
var ErrNoDeliveryAddress = errors.New("delivery address not set in profile")

type Repo struct {
	db *sql.DB
}

func NewRepo(db *sql.DB) *Repo {
	return &Repo{db: db}
}

// parseDate пробует несколько форматов SQLite и возвращает отформатированную строку.
func parseDate(s string) string {
	formats := []string{
		"2006-01-02 15:04:05",
		"2006-01-02T15:04:05Z",
		"2006-01-02T15:04:05",
		"2006-01-02",
	}
	for _, f := range formats {
		if t, err := time.Parse(f, s); err == nil {
			return t.Format("02 Jan 15:04")
		}
	}
	return s // вернём как есть, чтобы хоть что-то показать
}

// getOrdersByStatus — универсальный метод для заказов/покупок
func (r *Repo) getOrdersByStatus(ctx context.Context, userID int, statusCondition string) ([]OrderSummary, error) {
	query := `
		SELECT o.OrderID, o.Status, dm.Name, o.EstimatedDeliveryDate, o.ActualDeliveryDate,
		       o.ItemID, o.DeliveryAddress
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
		if err := rows.Scan(&o.OrderID, &o.Status, &o.DeliveryName, &estDateStr, &actDateStr, &itemIDsStr, &o.DeliveryAddress); err != nil {
			return nil, err
		}

		if estDateStr.Valid && estDateStr.String != "" {
			o.EstimatedDate = parseDate(estDateStr.String)
		}
		if actDateStr.Valid && actDateStr.String != "" {
			o.ActualDate = parseDate(actDateStr.String)
		}

		if itemIDsStr.Valid && itemIDsStr.String != "" {
			items, err := r.loadItems(ctx, itemIDsStr.String)
			if err != nil {
				return nil, err
			}
			o.Items = items
			o.ItemsCount = calcItemsCount(items)
			o.TotalPrice = calcTotal(items)
		}

		orders = append(orders, o)
	}
	return orders, rows.Err()
}

// loadItems загружает товары по строке вида "1;2;2;3", считая повторы как quantity.
func (r *Repo) loadItems(ctx context.Context, itemIDsStr string) ([]OrderItemDetail, error) {
	quantityMap := map[int]int{}
	var orderedIDs []int
	for _, s := range strings.Split(itemIDsStr, ";") {
		id, err := strconv.Atoi(strings.TrimSpace(s))
		if err != nil {
			continue
		}
		if quantityMap[id] == 0 {
			orderedIDs = append(orderedIDs, id)
		}
		quantityMap[id]++
	}
	if len(orderedIDs) == 0 {
		return nil, nil
	}

	ph := make([]string, len(orderedIDs))
	args := make([]interface{}, len(orderedIDs))
	for i, id := range orderedIDs {
		ph[i] = "?"
		args[i] = id
	}

	rows, err := r.db.QueryContext(ctx, `
		SELECT i.ItemID, p.ProductID, p.ProductName, p.Price, p.ImageURL, i.Color, i.Size
		FROM Items i
		JOIN Products p ON i.ProductID = p.ProductID
		WHERE i.ItemID IN (`+strings.Join(ph, ",")+`)
	`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []OrderItemDetail
	for rows.Next() {
		var item OrderItemDetail
		var itemID int
		if err := rows.Scan(&itemID, &item.ProductID, &item.Name, &item.Price, &item.ImageURL, &item.Color, &item.Size); err != nil {
			continue
		}
		item.Quantity = quantityMap[itemID]
		items = append(items, item)
	}
	return items, rows.Err()
}

// calcTotal считает сумму с учётом quantity каждого товара.
func calcTotal(items []OrderItemDetail) float64 {
	var total float64
	for _, item := range items {
		total += item.Price * float64(item.Quantity)
	}
	return total
}

// calcItemsCount считает общее количество товаров с учётом quantity.
func calcItemsCount(items []OrderItemDetail) int {
	var count int
	for _, item := range items {
		count += item.Quantity
	}
	return count
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
		       o.ItemID, o.DeliveryAddress
		FROM Orders o
		JOIN DeliveryMethods dm ON o.DeliveryMethodID = dm.DeliveryMethodID
		WHERE o.OrderID = ?
	`, orderID).Scan(&od.OrderID, &od.Status, &od.DeliveryName, &estDateStr, &actDateStr, &itemIDsStr, &od.DeliveryAddress)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if estDateStr.Valid && estDateStr.String != "" {
		od.EstimatedDate = parseDate(estDateStr.String)
	}
	if actDateStr.Valid && actDateStr.String != "" {
		od.ActualDate = parseDate(actDateStr.String)
	}

	if itemIDsStr.Valid && itemIDsStr.String != "" {
		items, err := r.loadItems(ctx, itemIDsStr.String)
		if err != nil {
			return nil, err
		}
		od.Items = items
		od.ItemsCount = calcItemsCount(items)
		od.TotalPrice = calcTotal(items)
	}

	return &od, nil
}

// CreatedOrderInfo — внутренний результат создания одного заказа.
type CreatedOrderInfo struct {
	OrderID       int
	DeliveryName  string
	EstimatedDate string
}

// CreateOrderFromCart оформляет заказы из корзины пользователя.
// Товары группируются по DeliveryMethodID продукта — на каждую группу создаётся
// отдельный заказ. EstimatedDeliveryDate = MAX(DurationDays) в группе.
// Адрес доставки берётся из Users.DeliveryAddress.
func (r *Repo) CreateOrderFromCart(ctx context.Context, userID int) ([]CreatedOrderInfo, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// 1. Адрес доставки из профиля
	var deliveryAddress sql.NullString
	err = tx.QueryRowContext(ctx,
		`SELECT DeliveryAddress FROM Users WHERE UserID = ?`, userID,
	).Scan(&deliveryAddress)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	if !deliveryAddress.Valid || deliveryAddress.String == "" {
		return nil, ErrNoDeliveryAddress
	}

	// 2. Товары корзины с методом доставки и его длительностью
	type cartLine struct {
		itemID           int
		quantity         int
		inStock          int
		deliveryMethodID int
		durationDays     int
		deliveryName     string
	}

	rows, err := tx.QueryContext(ctx, `
		SELECT ci.ItemID, ci.Quantity, i.StockQuantity,
		       p.DeliveryMethodID, dm.DurationDays, dm.Name
		FROM Cart c
		JOIN CartItems ci ON c.CartID = ci.CartID
		JOIN Items i      ON ci.ItemID = i.ItemID
		JOIN Products p   ON i.ProductID = p.ProductID
		JOIN DeliveryMethods dm ON p.DeliveryMethodID = dm.DeliveryMethodID
		WHERE c.UserID = ?
	`, userID)
	if err != nil {
		return nil, err
	}

	var lines []cartLine
	for rows.Next() {
		var l cartLine
		if err := rows.Scan(&l.itemID, &l.quantity, &l.inStock,
			&l.deliveryMethodID, &l.durationDays, &l.deliveryName); err != nil {
			rows.Close()
			return nil, err
		}
		lines = append(lines, l)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(lines) == 0 {
		return nil, ErrCartEmpty
	}

	// 3. Проверяем наличие
	for _, l := range lines {
		if l.inStock < l.quantity {
			return nil, ErrOutOfStock
		}
	}

	// 4. Группируем по DeliveryMethodID, сохраняем порядок
	type group struct {
		lines        []cartLine
		maxDuration  int
		deliveryName string
	}
	groups := map[int]*group{}
	var groupOrder []int
	for _, l := range lines {
		if _, ok := groups[l.deliveryMethodID]; !ok {
			groups[l.deliveryMethodID] = &group{deliveryName: l.deliveryName}
			groupOrder = append(groupOrder, l.deliveryMethodID)
		}
		g := groups[l.deliveryMethodID]
		g.lines = append(g.lines, l)
		if l.durationDays > g.maxDuration {
			g.maxDuration = l.durationDays
		}
	}

	// 5. Создаём заказ на каждую группу
	var created []CreatedOrderInfo
	now := time.Now()

	for _, methodID := range groupOrder {
		g := groups[methodID]

		var idParts []string
		for _, l := range g.lines {
			for i := 0; i < l.quantity; i++ {
				idParts = append(idParts, strconv.Itoa(l.itemID))
			}
		}
		itemIDStr := strings.Join(idParts, ";")
		estimatedTime := now.AddDate(0, 0, g.maxDuration)

		res, err := tx.ExecContext(ctx, `
			INSERT INTO Orders (UserID, ItemID, Status, DeliveryMethodID, EstimatedDeliveryDate, DeliveryAddress)
			VALUES (?, ?, 'PENDING', ?, ?, ?)
		`, userID, itemIDStr, methodID, estimatedTime.Format("2006-01-02 15:04:05"), deliveryAddress.String)
		if err != nil {
			return nil, err
		}
		orderID64, err := res.LastInsertId()
		if err != nil {
			return nil, err
		}

		created = append(created, CreatedOrderInfo{
			OrderID:       int(orderID64),
			DeliveryName:  g.deliveryName,
			EstimatedDate: estimatedTime.Format("02 Jan 15:04"),
		})
	}

	// 6. Уменьшаем StockQuantity
	for _, l := range lines {
		if _, err = tx.ExecContext(ctx,
			`UPDATE Items SET StockQuantity = StockQuantity - ? WHERE ItemID = ?`,
			l.quantity, l.itemID,
		); err != nil {
			return nil, err
		}
	}

	// 7. Очищаем корзину
	if _, err = tx.ExecContext(ctx, `
		DELETE FROM CartItems
		WHERE CartID = (SELECT CartID FROM Cart WHERE UserID = ?)
	`, userID); err != nil {
		return nil, err
	}

	return created, tx.Commit()
}
