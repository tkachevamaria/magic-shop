package catalog

type Product struct {
	ID               int     `json:"id"`
	Name             string  `json:"name"`
	Price            float64 `json:"price"`
	Description      string  `json:"description"`
	ImageURL         string  `json:"image_url"`
	RequiredLevel    int     `json:"required_level"`
	DeliveryMethodID int     `json:"delivery_method_id"`
	DeliveryName     string  `json:"delivery_name"`
	DeliveryDays     int     `json:"delivery_days"`
	CategoryID       int     `json:"category_id"`
	ShopID           int     `json:"shop_id"`
	CategoryName     string  `json:"category_name,omitempty"`
	ShopName         string  `json:"shop_name,omitempty"`
}

type ItemVariant struct {
	ItemID        int    `json:"item_id"`
	Color         string `json:"color"`
	Size          string `json:"size"`
	StockQuantity int    `json:"stock_quantity"`
}

type ProductDetail struct {
	ID               int           `json:"id"`
	Name             string        `json:"name"`
	Description      string        `json:"description"`
	Price            float64       `json:"price"`
	RequiredLevel    int           `json:"required_level"`
	DeliveryMethodID int           `json:"delivery_method_id"`
	DeliveryName     string        `json:"delivery_name"`
	DeliveryDays     int           `json:"delivery_days"`
	CategoryID       int           `json:"category_id"`
	ShopID           int           `json:"shop_id"`
	ImageURL         string        `json:"image_url"`
	Items            []ItemVariant `json:"items"`
}

type PaginationParams struct {
	Page  int
	Limit int
}

type ProductFilter struct {
	CategoryID       *int
	ShopID           *int
	Color            *string
	Size             *string
	DeliveryMethodID *int
	Pagination       PaginationParams
}

type AvailableFilters struct {
	Colors          []string       `json:"colors"`
	Sizes           []string       `json:"sizes"`
	DeliveryMethods []FilterOption `json:"deliveryMethods"`
}

type CatalogResponse struct {
	Products []Product        `json:"products"`
	Filters  AvailableFilters `json:"filters"`
}

type FilterOption struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type SidebarFilter struct {
	Categories []FilterOption `json:"categories"`
	Shops      []FilterOption `json:"shops"`
}