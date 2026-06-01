package orders

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetActiveOrders(w http.ResponseWriter, r *http.Request) {
	// Получаем UserID из URL (например /api/orders/1)
	userID, err := strconv.Atoi(chi.URLParam(r, "userID"))
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	orders, err := h.service.GetActiveOrders(r.Context(), userID)
	if err != nil {
		log.Printf("❌ Ошибка списка заказов: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	writeJSON(w, orders)
}

func (h *Handler) GetOrderDetails(w http.ResponseWriter, r *http.Request) {
	orderID, err := strconv.Atoi(chi.URLParam(r, "orderID"))
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	details, err := h.service.GetOrderDetails(r.Context(), orderID)
	if err != nil {
		log.Printf("❌ Ошибка деталей заказа: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	if details == nil {
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	writeJSON(w, details)
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}