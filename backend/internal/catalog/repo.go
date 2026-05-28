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

// Для поисковой строки
func (r *ProductRepo) SearchProducts(ctx context.Context, query string, pagination PaginationParams) ([]Product, error) {
	trimmed := strings.TrimSpace(query)
	if trimmed == "" {
		return r.GetProducts(ctx, ProductFilter{Pagination: pagination})
	}

	// 1. Загружаем все товары (кроме тёмных, если нужно сохранить логику главной)
	// Для поиска можно включить всё, либо оставить фильтр !=666. Оставим как есть.
	allProducts, err := r.GetProducts(ctx, ProductFilter{Pagination: PaginationParams{Limit: 10000}})
	if err != nil {
		return nil, err
	}

	// 2. Разбиваем запрос на слова и приводим к нижнему регистру (Unicode-safe)
	searchWords := strings.Fields(strings.ToLower(trimmed))
	if len(searchWords) == 0 {
		return allProducts[:0], nil
	}

	// 3. Фильтруем в Go (100% корректно для кириллицы)
	var matched []Product
	for _, p := range allProducts {
		// Собираем все текстовые поля товара в одну строку для поиска
		text := strings.ToLower(p.Name + " " + p.CategoryName + " " + p.ShopName)
		
		// Для точного поиска по размерам/цветам нужно подгрузить Items
		items, _ := r.getItemVariants(p.ID) // отдельный метод, если нужно
		for _, it := range items {
			text += " " + strings.ToLower(it.Color) + " " + strings.ToLower(it.Size)
		}

		// Проверяем, что ВСЕ слова из запроса встречаются в тексте товара
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

	// 4. Применяем пагинацию к отфильтрованному срезу
	total := len(matched)
	start := (pagination.Page - 1) * pagination.Limit
	end := start + pagination.Limit
	if start > total {
		return []Product{}, nil
	}
	if end > total {
		end = total
	}

	return matched[start:end], nil
}

// Вспомогательный метод для получения вариантов (если захочешь искать по размеру/цвету)
func (r *ProductRepo) getItemVariants(productID int) ([]ItemVariant, error) {
	rows, err := r.db.QueryContext(context.Background(), 
		`SELECT ItemID, Color, Size, StockQuantity FROM Items WHERE ProductID=?`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []ItemVariant
	for rows.Next() {
		var i ItemVariant
		if err := rows.Scan(&i.ItemID, &i.Color, &i.Size, &i.StockQuantity); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}