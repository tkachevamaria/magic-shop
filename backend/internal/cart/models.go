package cart

type CartItem struct {
	CartItemID  int     `json:"cart_item_id"`
	ItemID      int     `json:"item_id"`
	ProductName string  `json:"product_name"`
	CategoryID  int     `json:"category_id"`
	ImageURL    string  `json:"image_url"`
	Color       string  `json:"color"`
	Size        string  `json:"size"`
	Price       float64 `json:"price"`
	Quantity    int     `json:"quantity"`
	// StockQuantity int     `json:"stock_quantity"`
}

type Cart struct {
	CartID int        `json:"cart_id"`
	UserID int        `json:"user_id"`
	Items  []CartItem `json:"items"`
}
