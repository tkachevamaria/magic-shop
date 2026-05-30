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

func (r *ProductRepo) getBaseProducts(ctx context.Context, filter ProductFilter) ([]Product, error) {
	baseQuery := `
		SELECT p.ProductID, p.ProductName, p.Price, p.RequiredLevel,
			   p.CategoryID, p.ShopID, p.DeliveryMethodID, dm.Name, dm.DurationDays,
			   c.CategoryName, s.ShopName, p.ImageURL
		FROM Products p
		LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
		LEFT JOIN Shops s ON p.ShopID = s.ShopID
		LEFT JOIN DeliveryMethods dm ON p.DeliveryMethodID = dm.DeliveryMethodID
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
	if filter.DeliveryMethodID != nil {
		conditions = append(conditions, "p.DeliveryMethodID = ?")
		args = append(args, *filter.DeliveryMethodID)
	}

	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

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
		if err := rows.Scan(
			&p.ID, &p.Name, &p.Price, &p.RequiredLevel,
			&p.CategoryID, &p.ShopID, &p.DeliveryMethodID, &p.DeliveryName, &p.DeliveryDays,
			&p.CategoryName, &p.ShopName, &p.ImageURL,
		); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, rows.Err()
}

func (r *ProductRepo) GetProducts(ctx context.Context, filter ProductFilter) (CatalogResponse, error) {
	// Исключаем тёмные товары (категория 666) из обычной выдачи
	conditions := []string{"p.CategoryID != 666"}
	var args []interface{}

	if filter.CategoryID != nil {
		conditions = append(conditions, "p.CategoryID = ?")
		args = append(args, *filter.CategoryID)
	}
	if filter.ShopID != nil {
		conditions = append(conditions, "p.ShopID = ?")
		args = append(args, *filter.ShopID)
	}
	if filter.DeliveryMethodID != nil {
		conditions = append(conditions, "p.DeliveryMethodID = ?")
		args = append(args, *filter.DeliveryMethodID)
	}

	baseQuery := `
		SELECT p.ProductID, p.ProductName, p.Price, p.RequiredLevel,
			   p.CategoryID, p.ShopID, p.DeliveryMethodID, dm.Name, dm.DurationDays,
			   c.CategoryName, s.ShopName, p.ImageURL
		FROM Products p
		LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
		LEFT JOIN Shops s ON p.ShopID = s.ShopID
		LEFT JOIN DeliveryMethods dm ON p.DeliveryMethodID = dm.DeliveryMethodID
		WHERE ` + strings.Join(conditions, " AND ") + `
		ORDER BY p.ProductID LIMIT ? OFFSET ?
	`
	args = append(args, filter.Pagination.Limit, (filter.Pagination.Page-1)*filter.Pagination.Limit)

	rows, err := r.db.QueryContext(ctx, baseQuery, args...)
	if err != nil {
		return CatalogResponse{}, err
	}
	defer rows.Close()

	products := make([]Product, 0)
	for rows.Next() {
		var p Product
		if err := rows.Scan(
			&p.ID, &p.Name, &p.Price, &p.RequiredLevel,
			&p.CategoryID, &p.ShopID, &p.DeliveryMethodID, &p.DeliveryName, &p.DeliveryDays,
			&p.CategoryName, &p.ShopName, &p.ImageURL,
		); err != nil {
			return CatalogResponse{}, err
		}
		products = append(products, p)
	}
	return r.buildCatalogResponse(products, filter)
}

func (r *ProductRepo) GetDarkProducts(ctx context.Context, filter ProductFilter) (CatalogResponse, error) {
	conditions := []string{"p.CategoryID = 666"}
	var args []interface{}

	if filter.ShopID != nil {
		conditions = append(conditions, "p.ShopID = ?")
		args = append(args, *filter.ShopID)
	}
	if filter.DeliveryMethodID != nil {
		conditions = append(conditions, "p.DeliveryMethodID = ?")
		args = append(args, *filter.DeliveryMethodID)
	}

	baseQuery := `
		SELECT p.ProductID, p.ProductName, p.Price, p.RequiredLevel,
			   p.CategoryID, p.ShopID, p.DeliveryMethodID, dm.Name, dm.DurationDays,
			   c.CategoryName, s.ShopName, p.ImageURL
		FROM Products p
		LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
		LEFT JOIN Shops s ON p.ShopID = s.ShopID
		LEFT JOIN DeliveryMethods dm ON p.DeliveryMethodID = dm.DeliveryMethodID
		WHERE ` + strings.Join(conditions, " AND ") + `
		ORDER BY p.ProductID LIMIT ? OFFSET ?
	`
	args = append(args, filter.Pagination.Limit, (filter.Pagination.Page-1)*filter.Pagination.Limit)

	rows, err := r.db.QueryContext(ctx, baseQuery, args...)
	if err != nil {
		return CatalogResponse{}, err
	}
	defer rows.Close()

	products := make([]Product, 0)
	for rows.Next() {
		var p Product
		if err := rows.Scan(
			&p.ID, &p.Name, &p.Price, &p.RequiredLevel,
			&p.CategoryID, &p.ShopID, &p.DeliveryMethodID, &p.DeliveryName, &p.DeliveryDays,
			&p.CategoryName, &p.ShopName, &p.ImageURL,
		); err != nil {
			return CatalogResponse{}, err
		}
		products = append(products, p)
	}
	return r.buildCatalogResponse(products, filter)
}

func (r *ProductRepo) SearchProducts(ctx context.Context, query string, filter ProductFilter) (CatalogResponse, error) {
	trimmed := strings.TrimSpace(query)
	if trimmed == "" {
		return r.GetProducts(ctx, filter) // GetProducts уже исключает 666
	}

	//  Загружаем товары с учётом ВСЕХ фильтров (включая delivery) и исключаем 666
	conditions := []string{"p.CategoryID != 666"}
	var args []interface{}

	if filter.CategoryID != nil {
		conditions = append(conditions, "p.CategoryID = ?")
		args = append(args, *filter.CategoryID)
	}
	if filter.ShopID != nil {
		conditions = append(conditions, "p.ShopID = ?")
		args = append(args, *filter.ShopID)
	}
	if filter.DeliveryMethodID != nil {
		conditions = append(conditions, "p.DeliveryMethodID = ?")
		args = append(args, *filter.DeliveryMethodID)
	}

	baseQuery := `
		SELECT p.ProductID, p.ProductName, p.Price, p.RequiredLevel,
			   p.CategoryID, p.ShopID, p.DeliveryMethodID, dm.Name, dm.DurationDays,
			   c.CategoryName, s.ShopName, p.ImageURL
		FROM Products p
		LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
		LEFT JOIN Shops s ON p.ShopID = s.ShopID
		LEFT JOIN DeliveryMethods dm ON p.DeliveryMethodID = dm.DeliveryMethodID
		WHERE ` + strings.Join(conditions, " AND ") + `
		ORDER BY p.ProductID
	`

	rows, err := r.db.QueryContext(ctx, baseQuery, args...)
	if err != nil {
		return CatalogResponse{}, err
	}
	defer rows.Close()

	products := make([]Product, 0)
	for rows.Next() {
		var p Product
		if err := rows.Scan(
			&p.ID, &p.Name, &p.Price, &p.RequiredLevel,
			&p.CategoryID, &p.ShopID, &p.DeliveryMethodID, &p.DeliveryName, &p.DeliveryDays,
			&p.CategoryName, &p.ShopName, &p.ImageURL,
		); err != nil {
			return CatalogResponse{}, err
		}
		products = append(products, p)
	}

	//  Поиск по тексту (нормализация ё/е)
	normalize := func(s string) string {
		s = strings.ToLower(s)
		return strings.ReplaceAll(s, "ё", "е")
	}

	searchWords := strings.Fields(normalize(trimmed))
	var matched []Product

	// Загружаем Items для поиска по цвету/размеру
	productIDs := make([]interface{}, len(products))
	for i, p := range products {
		productIDs[i] = p.ID
	}
	if len(productIDs) > 0 {
		placeholders := make([]string, len(productIDs))
		for i := range placeholders {
			placeholders[i] = "?"
		}
		itemsQuery := `SELECT ProductID, Color, Size FROM Items WHERE ProductID IN (` + strings.Join(placeholders, ",") + `)`
		itemRows, err := r.db.QueryContext(ctx, itemsQuery, productIDs...)
		if err == nil {
			defer itemRows.Close()
			itemsByProduct := make(map[int][]ItemVariant)
			for itemRows.Next() {
				var pid int
				var item ItemVariant
				if err := itemRows.Scan(&pid, &item.Color, &item.Size); err == nil {
					itemsByProduct[pid] = append(itemsByProduct[pid], item)
				}
			}

			for _, p := range products {
				text := normalize(p.Name + " " + p.CategoryName + " " + p.ShopName + " " + p.DeliveryName)
				for _, item := range itemsByProduct[p.ID] {
					text += " " + normalize(item.Color) + " " + normalize(item.Size)
				}
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
		}
	}

	// Применяем фильтры цвета/размера/доставки к результатам поиска
	var filtered []Product
	for _, p := range matched {
		// Цвет/размер
		matchColor := filter.Color == nil
		matchSize := filter.Size == nil
		if filter.Color != nil || filter.Size != nil {
			var items []ItemVariant
			rows, _ := r.db.QueryContext(ctx, `SELECT Color, Size FROM Items WHERE ProductID=?`, p.ID)
			if rows != nil {
				defer rows.Close()
				for rows.Next() {
					var it ItemVariant
					if err := rows.Scan(&it.Color, &it.Size); err == nil {
						items = append(items, it)
					}
				}
				for _, item := range items {
					if filter.Color != nil && item.Color == *filter.Color {
						matchColor = true
					}
					if filter.Size != nil && item.Size == *filter.Size {
						matchSize = true
					}
				}
			}
		}
		// Доставка
		matchDelivery := filter.DeliveryMethodID == nil || p.DeliveryMethodID == *filter.DeliveryMethodID

		if matchColor && matchSize && matchDelivery {
			filtered = append(filtered, p)
		}
	}

	return r.buildCatalogResponse(filtered, ProductFilter{Pagination: filter.Pagination})
}

func (r *ProductRepo) buildCatalogResponse(products []Product, filter ProductFilter) (CatalogResponse, error) {
	if len(products) == 0 {
		return CatalogResponse{Products: []Product{}, Filters: AvailableFilters{}}, nil
	}

	// Загружаем Items для фасетов цвета/размера
	productIDs := make([]interface{}, len(products))
	for i, p := range products {
		productIDs[i] = p.ID
	}
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

	// Применяем фильтры цвета/размера/доставки
	var filtered []Product
	for _, p := range products {
		items := itemsByProduct[p.ID]
		matchColor := filter.Color == nil
		matchSize := filter.Size == nil
		matchDelivery := filter.DeliveryMethodID == nil || p.DeliveryMethodID == *filter.DeliveryMethodID

		for _, item := range items {
			if filter.Color != nil && item.Color == *filter.Color {
				matchColor = true
			}
			if filter.Size != nil && item.Size == *filter.Size {
				matchSize = true
			}
		}
		if matchColor && matchSize && matchDelivery {
			filtered = append(filtered, p)
		}
	}

	// Собираем фасеты ТОЛЬКО для отфильтрованных товаров
	colorSet := make(map[string]bool)
	sizeSet := make(map[string]bool)
	deliverySet := make(map[int]string)

	for _, p := range filtered {
		for _, item := range itemsByProduct[p.ID] {
			colorSet[item.Color] = true
			sizeSet[item.Size] = true
		}
		deliverySet[p.DeliveryMethodID] = p.DeliveryName
	}

	var colors, sizes []string
	for c := range colorSet {
		colors = append(colors, c)
	}
	for s := range sizeSet {
		sizes = append(sizes, s)
	}
	var deliveryMethods []FilterOption
	for id, name := range deliverySet {
		deliveryMethods = append(deliveryMethods, FilterOption{ID: id, Name: name})
	}

	return CatalogResponse{
		Products: filtered,
		Filters: AvailableFilters{
			Colors:          colors,
			Sizes:           sizes,
			DeliveryMethods: deliveryMethods,
		},
	}, nil
}

func (r *ProductRepo) GetProductByID(ctx context.Context, id int) (*ProductDetail, error) {
	var p ProductDetail
	err := r.db.QueryRowContext(ctx, `
		SELECT p.ProductID, p.ProductName, p.Price, p.RequiredLevel, 
			   p.DeliveryMethodID, dm.Name, dm.DurationDays, p.CategoryID, p.ShopID, p.ImageURL
		FROM Products p 
		LEFT JOIN DeliveryMethods dm ON p.DeliveryMethodID = dm.DeliveryMethodID
		WHERE p.ProductID=?`, id).
		Scan(&p.ID, &p.Name, &p.Price, &p.RequiredLevel, &p.DeliveryMethodID, &p.DeliveryName, &p.DeliveryDays, &p.CategoryID, &p.ShopID, &p.ImageURL)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	p.Description = "Описание артефакта..."
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

func (r *ProductRepo) GetSidebarFilters(ctx context.Context) (SidebarFilter, error) {
	var sf SidebarFilter

	rows, err := r.db.QueryContext(ctx, `SELECT CategoryID, CategoryName FROM Categories WHERE CategoryID != 666 ORDER BY CategoryName`)
	if err != nil {
		return SidebarFilter{}, err
	}
	defer rows.Close()
	for rows.Next() {
		var opt FilterOption
		if err := rows.Scan(&opt.ID, &opt.Name); err != nil {
			continue
		}
		sf.Categories = append(sf.Categories, opt)
	}

	// Магазины (все)
	rows, err = r.db.QueryContext(ctx, `SELECT ShopID, ShopName FROM Shops ORDER BY ShopName`)
	if err != nil {
		return SidebarFilter{}, err
	}
	defer rows.Close()
	for rows.Next() {
		var opt FilterOption
		if err := rows.Scan(&opt.ID, &opt.Name); err != nil {
			continue
		}
		sf.Shops = append(sf.Shops, opt)
	}

	return sf, rows.Err()
}
