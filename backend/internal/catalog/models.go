package catalog

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

type ItemVariant struct {
	ItemID        int    `json:"item_id"`
	Color         string `json:"color"`
	Size          string `json:"size"`
	StockQuantity int    `json:"stock_quantity"`
}

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

type PaginationParams struct {
	Page  int
	Limit int
}

type ProductFilter struct {
	CategoryID *int
	Color      *string
	Size       *string
	Pagination PaginationParams
}

type AvailableFilters struct {
	Colors []string `json:"colors"`
	Sizes  []string `json:"sizes"`
}

type CatalogResponse struct {
	Products []Product        `json:"products"`
	Filters  AvailableFilters `json:"filters"`
}