package orders

type OrderSummary struct {
	OrderID         int               `json:"id"`
	Status          string            `json:"status"`
	DeliveryName    string            `json:"delivery_name"`
	EstimatedDate   string            `json:"estimated_date"`
	ActualDate      string            `json:"actual_date,omitempty"`
	ItemsCount      int               `json:"items_count"`
	TotalPrice      float64           `json:"total_price"`
	DeliveryAddress string            `json:"delivery_address"`
	Items           []OrderItemDetail `json:"items"`
}

type OrderItemDetail struct {
	ProductID  int     `json:"product_id"`
	Name       string  `json:"name"`
	CategoryID int     `json:"category_id"`
	Price      float64 `json:"price"`
	ImageURL   string  `json:"image_url"`
	Quantity   int     `json:"quantity"`
	Color      string  `json:"color"`
	Size       string  `json:"size"`
}

type OrderDetails struct {
	OrderSummary
	Items []OrderItemDetail `json:"items"`
}

// список созданных заказов (один на каждый метод доставки).
type CreateOrderResponse struct {
	Orders []CreatedOrder `json:"orders"`
}

type CreatedOrder struct {
	OrderID       int    `json:"order_id"`
	DeliveryName  string `json:"delivery_name"`
	EstimatedDate string `json:"estimated_date"`
}
