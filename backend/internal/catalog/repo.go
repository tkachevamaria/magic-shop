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

func (r *ProductRepo) buildProductQuery(ctx context.Context, conditions []string, args []interface{}, pagination PaginationParams) ([]Product, error) {
	baseQuery := `
		SELECT p.ProductID, p.ProductName, p.Price, p.RequiredLevel, p.DeliveryType,
			   p.CategoryID, p.ShopID, c.CategoryName, s.ShopName
		FROM Products p
		LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
		LEFT JOIN Shops s ON p.ShopID = s.ShopID
	`
	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}
	baseQuery += " ORDER BY p.ProductID LIMIT ? OFFSET ?"
	args = append(args, pagination.Limit, (pagination.Page-1)*pagination.Limit)

	rows, err := r.db.QueryContext(ctx, baseQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := make([]Product, 0)
	for rows.Next() {
		var p Product
		p.ImageURL = "/images/default.png"
		if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.RequiredLevel, &p.DeliveryType, &p.CategoryID, &p.ShopID, &p.CategoryName, &p.ShopName); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, rows.Err()
}

// GetProducts - главная лента (скрывает категорию 666)
func (r *ProductRepo) GetProducts(ctx context.Context, filter ProductFilter) ([]Product, error) {
	conditions := []string{"p.CategoryID != 666"}
	var args []interface{}
	if filter.CategoryID != nil {
		conditions = append(conditions, "p.CategoryID = ?")
		args = append(args, *filter.CategoryID)
	}
	return r.buildProductQuery(ctx, conditions, args, filter.Pagination)
}

// GetDarkProducts - только тёмные товары (категория 666)
func (r *ProductRepo) GetDarkProducts(ctx context.Context, filter ProductFilter) ([]Product, error) {
	conditions := []string{"p.CategoryID = 666"}
	var args []interface{}
	// Фильтр по категории здесь не нужен, т.к. все тёмные уже в cat=666
	return r.buildProductQuery(ctx, conditions, args, filter.Pagination)
}

func (r *ProductRepo) GetProductByID(ctx context.Context, id int) (*ProductDetail, error) {
	var p ProductDetail
	err := r.db.QueryRowContext(ctx, `
		SELECT ProductID, ProductName, Price, RequiredLevel, DeliveryType, CategoryID, ShopID
		FROM Products WHERE ProductID=?`, id).
		Scan(&p.ID, &p.Name, &p.Price, &p.RequiredLevel, &p.DeliveryType, &p.CategoryID, &p.ShopID)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	p.Description = "Описание артефакта..."
	p.ImageURL = "/images/default.png"
	p.Items = make([]ItemVariant, 0)

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