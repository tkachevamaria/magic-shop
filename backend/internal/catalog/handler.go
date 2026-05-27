package catalog

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
)

type ProductHandler struct {
	service *ProductService
}

func NewProductHandler(service *ProductService) *ProductHandler {
	return &ProductHandler{service: service}
}

func (h *ProductHandler) GetProducts(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	var filter ProductFilter

	// Парсим ?category=1
	if cat := q.Get("category"); cat != "" {
		if id, err := strconv.Atoi(cat); err == nil {
			filter.CategoryID = &id
		}
	}
	// Парсим ?shop=2
	if shop := q.Get("shop"); shop != "" {
		if id, err := strconv.Atoi(shop); err == nil {
			filter.ShopID = &id
		}
	}

	products, err := h.service.GetProducts(r.Context(), filter)
	if err != nil {
		log.Printf("❌ Ошибка получения товаров: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(products); err != nil {
		log.Printf("❌ Ошибка кодирования JSON: %v", err)
		http.Error(w, "Encoding Error", http.StatusInternalServerError)
	}
}