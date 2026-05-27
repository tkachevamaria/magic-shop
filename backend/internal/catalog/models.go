package catalog

// Product - компактная карточка для главной ленты
type Product struct {
	ID            int     `json:"id"`
	Name          string  `json:"name"`
	Price         float64 `json:"price"`
	RequiredLevel int     `json:"required_level"`
	DeliveryType  string  `json:"delivery_type"`
	CategoryID    int     `json:"category_id"`
	ShopID        int     `json:"shop_id"`
	CategoryName  string  `json:"category_name,omitempty"`
	ShopName      string  `json:"shop_name,omitempty"`
	ImageURL      string  `json:"image_url"`
}

// ItemVariant - конкретный экземпляр товара (цвет/размер/остаток)
type ItemVariant struct {
	ItemID        int    `json:"item_id"`
	Color         string `json:"color"`
	Size          string `json:"size"`
	StockQuantity int    `json:"stock_quantity"`
}

// ProductDetail - полная карточка для страницы товара
type ProductDetail struct {
	ID            int           `json:"id"`
	Name          string        `json:"name"`
	Description   string        `json:"description"`
	Price         float64       `json:"price"`
	RequiredLevel int           `json:"required_level"`
	DeliveryType  string        `json:"delivery_type"`
	CategoryID    int           `json:"category_id"`
	ShopID        int           `json:"shop_id"`
	ImageURL      string        `json:"image_url"`
	Items         []ItemVariant `json:"items"`
}

// PaginationParams - параметры пагинации
type PaginationParams struct {
	Page  int
	Limit int
}

// ProductFilter - фильтры + пагинация
type ProductFilter struct {
	CategoryIDs []int
	ShopID     *int
	Pagination PaginationParams
}