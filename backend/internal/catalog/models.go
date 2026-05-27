package catalog

// Product - DTO для ответа API (объединяет данные из Products, Categories, Shops)
type Product struct {
	ID            int     `json:"id"`
	Name          string  `json:"name"`
	Price         float64 `json:"price"`
	Category      string  `json:"category"`
	RequiredLevel int     `json:"required_level"`
	DeliveryType  string  `json:"delivery_type"`
	ShopName      string  `json:"shop_name"`
}

// ProductFilter хранит опциональные параметры фильтрации (nil = не фильтровать)
type ProductFilter struct {
	CategoryID *int
	ShopID     *int
}