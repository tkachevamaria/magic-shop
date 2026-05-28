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

func (r *ProductRepo) getBaseProducts(ctx context.Context, conditions []string, args []interface{}, pagination PaginationParams) ([]Product, error) {
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

func (r *ProductRepo) GetProducts(ctx context.Context, filter ProductFilter) (CatalogResponse, error) {
	conditions := []string{"p.CategoryID != 666"}
	var args []interface{}
	if filter.CategoryID != nil {
		conditions = append(conditions, "p.CategoryID = ?")
		args = append(args, *filter.CategoryID)
	}

	products, err := r.getBaseProducts(ctx, conditions, args, filter.Pagination)
	if err != nil {
		return CatalogResponse{}, err
	}
	return r.buildCatalogResponse(products, filter)
}

func (r *ProductRepo) GetDarkProducts(ctx context.Context, filter ProductFilter) (CatalogResponse, error) {
	conditions := []string{"p.CategoryID = 666"}
	products, err := r.getBaseProducts(ctx, conditions, nil, filter.Pagination)
	if err != nil {
		return CatalogResponse{}, err
	}
	return r.buildCatalogResponse(products, filter)
}

func (r *ProductRepo) SearchProducts(ctx context.Context, query string, filter ProductFilter) (CatalogResponse, error) {
	trimmed := strings.TrimSpace(query)
	if trimmed == "" {
		return r.GetProducts(ctx, filter)
	}

	allProducts, err := r.getBaseProducts(ctx, []string{"p.CategoryID != 666"}, nil, PaginationParams{Limit: 10000})
	if err != nil {
		return CatalogResponse{}, err
	}

	searchWords := strings.Fields(strings.ToLower(trimmed))
	var matched []Product
	for _, p := range allProducts {
		text := strings.ToLower(p.Name + " " + p.CategoryName + " " + p.ShopName)
		found := true
		for _, word := range searchWords {
			if !strings.Contains(text, word) {
				found = false
				break
			}
		}
		if found {
			matched = append(matched, p)
		}
	}
	return r.buildCatalogResponse(matched, filter)
}

// buildCatalogResponse применяет фильтр цвета/размера и собирает доступные фасеты
func (r *ProductRepo) buildCatalogResponse(products []Product, filter ProductFilter) (CatalogResponse, error) {
	if len(products) == 0 {
		return CatalogResponse{Products: []Product{}, Filters: AvailableFilters{}}, nil
	}

	// 1. Собираем ID для загрузки вариантов
	productIDs := make([]interface{}, len(products))
	for i, p := range products {
		productIDs[i] = p.ID
	}

	// 2. Загружаем Items одним запросом
	placeholders := make([]string, len(productIDs))
	for i := range placeholders {
		placeholders[i] = "?"
	}
	query := `SELECT ProductID, Color, Size, StockQuantity FROM Items WHERE ProductID IN (` + strings.Join(placeholders, ",") + `)`
	rows, err := r.db.QueryContext(context.Background(), query, productIDs...)
	if err != nil {
		return CatalogResponse{}, err
	}
	defer rows.Close()

	itemsByProduct := make(map[int][]ItemVariant)
	for rows.Next() {
		var pid int
		var item ItemVariant
		if err := rows.Scan(&pid, &item.Color, &item.Size, &item.StockQuantity); err != nil {
			continue
		}
		itemsByProduct[pid] = append(itemsByProduct[pid], item)
	}

	// 3. Применяем фильтр по цвету/размеру
	var filtered []Product
	for _, p := range products {
		items := itemsByProduct[p.ID]
		matchColor := filter.Color == nil
		matchSize := filter.Size == nil

		for _, item := range items {
			if filter.Color != nil && item.Color == *filter.Color {
				matchColor = true
			}
			if filter.Size != nil && item.Size == *filter.Size {
				matchSize = true
			}
		}

		if matchColor && matchSize {
			filtered = append(filtered, p)
		}
	}

	// 4. Собираем фасеты ТОЛЬКО для отфильтрованных товаров
	colorSet := make(map[string]bool)
	sizeSet := make(map[string]bool)
	for _, p := range filtered {
		for _, item := range itemsByProduct[p.ID] {
			colorSet[item.Color] = true
			sizeSet[item.Size] = true
		}
	}

	var colors, sizes []string
	for c := range colorSet {
		colors = append(colors, c)
	}
	for s := range sizeSet {
		sizes = append(sizes, s)
	}

	return CatalogResponse{
		Products: filtered,
		Filters:  AvailableFilters{Colors: colors, Sizes: sizes},
	}, nil
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