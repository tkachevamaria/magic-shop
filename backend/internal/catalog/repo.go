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

// GetProducts — основная лента (исключает 666)
func (r *ProductRepo) GetProducts(ctx context.Context, filter ProductFilter) (CatalogResponse, error) {
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
		SELECT p.ProductID, p.ProductName, p.Price, p.Description, p.ImageURL, p.RequiredLevel,
			   p.CategoryID, p.ShopID, p.DeliveryMethodID, dm.Name, dm.DurationDays,
			   c.CategoryName, s.ShopName
		FROM Products p
		LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
		LEFT JOIN Shops s ON p.ShopID = s.ShopID
		LEFT JOIN DeliveryMethods dm ON p.DeliveryMethodID = dm.DeliveryMethodID
		WHERE ` + strings.Join(conditions, " AND ") + `
		ORDER BY p.ProductID LIMIT ? OFFSET ?
	`
	args = append(args, filter.Pagination.Limit, (filter.Pagination.Page-1)*filter.Pagination.Limit)

	rows, err := r.db.QueryContext(ctx, baseQuery, args...)
	if err != nil { return CatalogResponse{}, err }
	defer rows.Close()

	products := make([]Product, 0)
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Description, &p.ImageURL, &p.RequiredLevel,
			&p.CategoryID, &p.ShopID, &p.DeliveryMethodID, &p.DeliveryName, &p.DeliveryDays,
			&p.CategoryName, &p.ShopName); err != nil {
			return CatalogResponse{}, err
		}
		products = append(products, p)
	}
	return r.buildCatalogResponse(products, filter)
}

// GetDarkProducts — только тёмные товары (категория 666)
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
		SELECT p.ProductID, p.ProductName, p.Price, p.Description, p.ImageURL, p.RequiredLevel,
			   p.CategoryID, p.ShopID, p.DeliveryMethodID, dm.Name, dm.DurationDays,
			   c.CategoryName, s.ShopName
		FROM Products p
		LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
		LEFT JOIN Shops s ON p.ShopID = s.ShopID
		LEFT JOIN DeliveryMethods dm ON p.DeliveryMethodID = dm.DeliveryMethodID
		WHERE ` + strings.Join(conditions, " AND ") + `
		ORDER BY p.ProductID LIMIT ? OFFSET ?
	`
	args = append(args, filter.Pagination.Limit, (filter.Pagination.Page-1)*filter.Pagination.Limit)

	rows, err := r.db.QueryContext(ctx, baseQuery, args...)
	if err != nil { return CatalogResponse{}, err }
	defer rows.Close()

	products := make([]Product, 0)
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Description, &p.ImageURL, &p.RequiredLevel,
			&p.CategoryID, &p.ShopID, &p.DeliveryMethodID, &p.DeliveryName, &p.DeliveryDays,
			&p.CategoryName, &p.ShopName); err != nil {
			return CatalogResponse{}, err
		}
		products = append(products, p)
	}
	return r.buildCatalogResponse(products, filter)
}

// SearchProducts — поиск по названию/описанию/категории/магазину/доставке/цвету/размеру
func (r *ProductRepo) SearchProducts(ctx context.Context, query string, filter ProductFilter) (CatalogResponse, error) {
	trimmed := strings.TrimSpace(query)
	if trimmed == "" {
		return r.GetProducts(ctx, filter)
	}

	conditions := []string{"p.CategoryID != 666"}
	var args []interface{}
	if filter.CategoryID != nil { conditions = append(conditions, "p.CategoryID = ?"); args = append(args, *filter.CategoryID) }
	if filter.ShopID != nil { conditions = append(conditions, "p.ShopID = ?"); args = append(args, *filter.ShopID) }
	if filter.DeliveryMethodID != nil { conditions = append(conditions, "p.DeliveryMethodID = ?"); args = append(args, *filter.DeliveryMethodID) }

	baseQuery := `
		SELECT p.ProductID, p.ProductName, p.Price, p.Description, p.ImageURL, p.RequiredLevel,
			   p.CategoryID, p.ShopID, p.DeliveryMethodID, dm.Name, dm.DurationDays,
			   c.CategoryName, s.ShopName
		FROM Products p
		LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
		LEFT JOIN Shops s ON p.ShopID = s.ShopID
		LEFT JOIN DeliveryMethods dm ON p.DeliveryMethodID = dm.DeliveryMethodID
		WHERE ` + strings.Join(conditions, " AND ") + ` ORDER BY p.ProductID
	`
	rows, err := r.db.QueryContext(ctx, baseQuery, args...)
	if err != nil { return CatalogResponse{}, err }
	defer rows.Close()

	products := make([]Product, 0)
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Description, &p.ImageURL, &p.RequiredLevel,
			&p.CategoryID, &p.ShopID, &p.DeliveryMethodID, &p.DeliveryName, &p.DeliveryDays,
			&p.CategoryName, &p.ShopName); err != nil {
			return CatalogResponse{}, err
		}
		products = append(products, p)
	}

	normalize := func(s string) string {
		s = strings.ToLower(s)
		return strings.ReplaceAll(s, "ё", "е")
	}
	searchWords := strings.Fields(normalize(trimmed))
	var matched []Product

	if len(searchWords) > 0 {
		for _, p := range products {
			text := normalize(p.Name + " " + p.Description + " " + p.CategoryName + " " + p.ShopName + " " + p.DeliveryName)
			
			// Добавляем цвет/размер в текст поиска
			itemRows, _ := r.db.QueryContext(ctx, `SELECT Color, Size FROM Items WHERE ProductID=?`, p.ID)
			if itemRows != nil {
				defer itemRows.Close()
				for itemRows.Next() {
					var c, sz string
					itemRows.Scan(&c, &sz)
					text += " " + normalize(c) + " " + normalize(sz)
				}
			}

			found := true
			for _, word := range searchWords {
				if !strings.Contains(text, word) { found = false; break }
			}
			if found { matched = append(matched, p) }
		}
	} else {
		matched = products
	}

	return r.buildCatalogResponse(matched, filter)
}

// buildCatalogResponse — фасеты (цвет/размер/доставка)
func (r *ProductRepo) buildCatalogResponse(products []Product, filter ProductFilter) (CatalogResponse, error) {
	if len(products) == 0 {
		return CatalogResponse{Products: []Product{}, Filters: AvailableFilters{}}, nil
	}

	productIDs := make([]interface{}, len(products))
	for i, p := range products { productIDs[i] = p.ID }
	placeholders := make([]string, len(productIDs))
	for i := range placeholders { placeholders[i] = "?" }
	
	query := `SELECT ProductID, Color, Size, StockQuantity FROM Items WHERE ProductID IN (` + strings.Join(placeholders, ",") + `)`
	rows, err := r.db.QueryContext(context.Background(), query, productIDs...)
	if err != nil { return CatalogResponse{}, err }
	defer rows.Close()

	itemsByProduct := make(map[int][]ItemVariant)
	for rows.Next() {
		var pid int; var item ItemVariant
		if err := rows.Scan(&pid, &item.Color, &item.Size, &item.StockQuantity); err == nil {
			itemsByProduct[pid] = append(itemsByProduct[pid], item)
		}
	}

	var filtered []Product
	for _, p := range products {
		items := itemsByProduct[p.ID]
		matchColor := filter.Color == nil
		matchSize := filter.Size == nil
		matchDelivery := filter.DeliveryMethodID == nil || p.DeliveryMethodID == *filter.DeliveryMethodID

		for _, item := range items {
			if filter.Color != nil && item.Color == *filter.Color { matchColor = true }
			if filter.Size != nil && item.Size == *filter.Size { matchSize = true }
		}
		if matchColor && matchSize && matchDelivery { filtered = append(filtered, p) }
	}

	colorSet, sizeSet := make(map[string]bool), make(map[string]bool)
	deliverySet := make(map[int]string)
	for _, p := range filtered {
		for _, item := range itemsByProduct[p.ID] {
			colorSet[item.Color] = true
			sizeSet[item.Size] = true
		}
		deliverySet[p.DeliveryMethodID] = p.DeliveryName
	}

	var colors, sizes []string
	for c := range colorSet { colors = append(colors, c) }
	for s := range sizeSet { sizes = append(sizes, s) }
	var deliveryMethods []FilterOption
	for id, name := range deliverySet {
		deliveryMethods = append(deliveryMethods, FilterOption{ID: id, Name: name})
	}

	return CatalogResponse{
		Products: filtered,
		Filters: AvailableFilters{Colors: colors, Sizes: sizes, DeliveryMethods: deliveryMethods},
	}, nil
}

// GetProductByID — детальная карточка
func (r *ProductRepo) GetProductByID(ctx context.Context, id int) (*ProductDetail, error) {
	var p ProductDetail
	err := r.db.QueryRowContext(ctx, `
		SELECT p.ProductID, p.ProductName, p.Price, p.Description, p.ImageURL, p.RequiredLevel, 
			   p.DeliveryMethodID, dm.Name, dm.DurationDays, p.CategoryID, p.ShopID
		FROM Products p LEFT JOIN DeliveryMethods dm ON p.DeliveryMethodID = dm.DeliveryMethodID
		WHERE p.ProductID=?`, id).
		Scan(&p.ID, &p.Name, &p.Price, &p.Description, &p.ImageURL, &p.RequiredLevel, 
		     &p.DeliveryMethodID, &p.DeliveryName, &p.DeliveryDays, &p.CategoryID, &p.ShopID)

	if err == sql.ErrNoRows { return nil, nil }
	if err != nil { return nil, err }

	p.Items = make([]ItemVariant, 0)
	rows, err := r.db.QueryContext(ctx, `SELECT ItemID, Color, Size, StockQuantity FROM Items WHERE ProductID=?`, id)
	if err != nil { return nil, err }
	defer rows.Close()

	for rows.Next() {
		var item ItemVariant
		if err := rows.Scan(&item.ItemID, &item.Color, &item.Size, &item.StockQuantity); err != nil { continue }
		p.Items = append(p.Items, item)
	}
	return &p, rows.Err()
}

// GetSidebarFilters — категории и магазины для сайдбара
func (r *ProductRepo) GetSidebarFilters(ctx context.Context) (SidebarFilter, error) {
	var sf SidebarFilter
	rows, err := r.db.QueryContext(ctx, `SELECT CategoryID, CategoryName FROM Categories WHERE CategoryID != 666 ORDER BY CategoryName`)
	if err != nil { return SidebarFilter{}, err }
	defer rows.Close()
	for rows.Next() {
		var opt FilterOption
		if err := rows.Scan(&opt.ID, &opt.Name); err == nil { sf.Categories = append(sf.Categories, opt) }
	}

	rows, err = r.db.QueryContext(ctx, `SELECT ShopID, ShopName FROM Shops ORDER BY ShopName`)
	if err != nil { return SidebarFilter{}, err }
	defer rows.Close()
	for rows.Next() {
		var opt FilterOption
		if err := rows.Scan(&opt.ID, &opt.Name); err == nil { sf.Shops = append(sf.Shops, opt) }
	}
	return sf, rows.Err()
}