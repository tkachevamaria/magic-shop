package catalog

import (
	"context"
	"database/sql"
	"strings"
)

type ProductRepo struct {
	db *sql.DB
}

func NewProductRepo(db *sql.DB) *ProductRepo {
	return &ProductRepo{db: db}
}

// GetProducts возвращает пагинированный список товаров
func (r *ProductRepo) GetProducts(ctx context.Context, filter ProductFilter) ([]Product, error) {
	baseQuery := `
		SELECT p.ProductID, p.ProductName, p.Price, p.RequiredLevel, p.DeliveryType,
			   p.CategoryID, p.ShopID, c.CategoryName, s.ShopName
		FROM Products p
		LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
		LEFT JOIN Shops s ON p.ShopID = s.ShopID
	`

	var args []interface{}
	var conditions []string

	if filter.CategoryID != nil {
		conditions = append(conditions, "p.CategoryID = ?")
		args = append(args, *filter.CategoryID)
	}
	if filter.ShopID != nil {
		conditions = append(conditions, "p.ShopID = ?")
		args = append(args, *filter.ShopID)
	}

	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}
	// ⚠️ Для пагинации используем ProductID, иначе страницы "будут прыгать" при каждом запросе
	baseQuery += " ORDER BY p.ProductID LIMIT ? OFFSET ?"
	args = append(args, filter.Pagination.Limit, (filter.Pagination.Page-1)*filter.Pagination.Limit)

	rows, err := r.db.QueryContext(ctx, baseQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := make([]Product, 0)
	for rows.Next() {
		var p Product
		p.ImageURL = "/images/product_placeholder.png"
		if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.RequiredLevel, &p.DeliveryType, &p.CategoryID, &p.ShopID, &p.CategoryName, &p.ShopName); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, rows.Err()
}

// GetProductByID возвращает товар со всеми его вариантами (цвет/размер/остаток)
func (r *ProductRepo) GetProductByID(ctx context.Context, id int) (*ProductDetail, error) {
	var p ProductDetail
	err := r.db.QueryRowContext(ctx, `
		SELECT ProductID, ProductName, Price, RequiredLevel, DeliveryType, CategoryID, ShopID
		FROM Products WHERE ProductID=?`, id).
		Scan(&p.ID, &p.Name, &p.Price, &p.RequiredLevel, &p.DeliveryType, &p.CategoryID, &p.ShopID)

	if err == sql.ErrNoRows {
		return nil, nil // товар не найден
	}
	if err != nil {
		return nil, err
	}

	p.Description = "Волшебный артефакт высокого качества, прошедший проверку Министерством Магии."
	p.ImageURL = "/images/product_placeholder.png"
	p.Items = make([]ItemVariant, 0)

	// Загружаем варианты (items)
	rows, err := r.db.QueryContext(ctx, `SELECT ItemID, Color, Size, StockQuantity FROM Items WHERE ProductID=?`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var item ItemVariant
		if err := rows.Scan(&item.ItemID, &item.Color, &item.Size, &item.StockQuantity); err != nil {
			return nil, err
		}
		p.Items = append(p.Items, item)
	}
	return &p, rows.Err()
}