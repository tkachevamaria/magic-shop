// internal/catalog/repo.go
package catalog

import (
	"context"
	"database/sql"
)

type ProductRepo struct {
	db *sql.DB
}

func NewProductRepo(db *sql.DB) *ProductRepo {
	return &ProductRepo{db: db}
}

// GetAll возвращает все товары в случайном порядке
func (r *ProductRepo) GetAll(ctx context.Context) ([]Product, error) {
	query := `
		SELECT p.ProductID, p.ProductName, p.Price,
			   c.CategoryName, p.RequiredLevel, p.DeliveryType, s.ShopName
		FROM Products p
		LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
		LEFT JOIN Shops s ON p.ShopID = s.ShopID
		ORDER BY RANDOM()
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Category, &p.RequiredLevel, &p.DeliveryType, &p.ShopName)
		if err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return products, nil
}