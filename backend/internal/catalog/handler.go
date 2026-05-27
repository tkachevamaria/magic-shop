package catalog

import (
	"encoding/json"
	"log"
	"net/http"
)

type ProductHandler struct {
	service *ProductService
}

func NewProductHandler(service *ProductService) *ProductHandler {
	return &ProductHandler{service: service}
}

func (h *ProductHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	products, err := h.service.GetAllProducts(r.Context())
	if err != nil {
		// 👇 ТЕПЕРЬ ОШИБКА БУДЕТ ВИДНА В КОНСОЛИ
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