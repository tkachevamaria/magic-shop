package orders

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	"magic-shop/internal/auth"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetActiveOrders(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.CtxUserID).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	orders, err := h.service.GetActiveOrders(r.Context(), userID)
	if err != nil {
		log.Printf("Ошибка активных заказов: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, orders)
}

func (h *Handler) GetPurchases(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.CtxUserID).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	purchases, err := h.service.GetPurchases(r.Context(), userID)
	if err != nil {
		log.Printf("Ошибка покупок: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, purchases)
}

func (h *Handler) GetOrderDetails(w http.ResponseWriter, r *http.Request) {
	orderID, err := strconv.Atoi(chi.URLParam(r, "orderID"))
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	details, err := h.service.GetOrderDetails(r.Context(), orderID)
	if err != nil {
		log.Printf("Ошибка деталей заказа: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	if details == nil {
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}
	writeJSON(w, details)
}

func (h *Handler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.CtxUserID).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	created, err := h.service.CreateOrderFromCart(r.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, ErrCartEmpty):
			http.Error(w, "Cart is empty", http.StatusBadRequest)
		case errors.Is(err, ErrOutOfStock):
			http.Error(w, "One or more items are out of stock", http.StatusConflict)
		case errors.Is(err, ErrNoDeliveryAddress):
			http.Error(w, "Delivery address not set in profile", http.StatusUnprocessableEntity)
		default:
			log.Printf("Ошибка создания заказа: %v", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	resp := CreateOrderResponse{}
	for _, o := range created {
		resp.Orders = append(resp.Orders, CreatedOrder{
			OrderID:       o.OrderID,
			DeliveryName:  o.DeliveryName,
			EstimatedDate: o.EstimatedDate,
		})
	}

	w.WriteHeader(http.StatusCreated)
	writeJSON(w, resp)
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}
