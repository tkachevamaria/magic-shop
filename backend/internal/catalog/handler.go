package catalog

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
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
	filter.Pagination.Page = 1
	filter.Pagination.Limit = 12 // дефолт

	if p := q.Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			filter.Pagination.Page = v
		}
	}
	if l := q.Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 {
			filter.Pagination.Limit = v
		}
	}
	if cat := q.Get("category"); cat != "" {
		if id, err := strconv.Atoi(cat); err == nil {
			filter.CategoryID = &id
		}
	}
	if shop := q.Get("shop"); shop != "" {
		if id, err := strconv.Atoi(shop); err == nil {
			filter.ShopID = &id
		}
	}

	products, err := h.service.GetProducts(r.Context(), filter)
	if err != nil {
		log.Printf("❌ Ошибка списка товаров: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

func (h *ProductHandler) GetProductByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid product ID", http.StatusBadRequest)
		return
	}

	product, err := h.service.GetProductByID(r.Context(), id)
	if err != nil {
		log.Printf("❌ Ошибка получения товара %d: %v", id, err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	if product == nil {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}