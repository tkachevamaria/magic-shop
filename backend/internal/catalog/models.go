package catalog

// Product - DTO для ответа API (объединяет данные из Products, Categories, Shops)
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

// ProductFilter хранит опциональные параметры фильтрации (nil = не фильтровать)
type ProductFilter struct {
	CategoryID *int
	ShopID     *int
}