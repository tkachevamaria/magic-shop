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

// GetProducts возвращает товары с учётом фильтров и случайным порядком
func (r *ProductRepo) GetProducts(ctx context.Context, filter ProductFilter) ([]Product, error) {
	baseQuery := `
		SELECT p.ProductID, p.ProductName, p.Price,
			   c.CategoryName, p.RequiredLevel, p.DeliveryType, s.ShopName
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
	baseQuery += " ORDER BY RANDOM()"

	rows, err := r.db.QueryContext(ctx, baseQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Category, &p.RequiredLevel, &p.DeliveryType, &p.ShopName); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, rows.Err()
}