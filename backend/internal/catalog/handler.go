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
	filter.Pagination.Limit = 12

	if catStr := q.Get("category"); catStr != "" {
		if id, err := strconv.Atoi(catStr); err == nil {
			filter.CategoryID = &id
		}
	}
	if pageStr := q.Get("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			filter.Pagination.Page = page
		}
	}
	if limitStr := q.Get("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 {
			filter.Pagination.Limit = limit
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

// GetDarkProducts - отдельный эндпоинт для тёмных артефактов (666)
func (h *ProductHandler) GetDarkProducts(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	var filter ProductFilter
	filter.Pagination.Page = 1
	filter.Pagination.Limit = 12

	if catStr := q.Get("category"); catStr != "" {
		if id, err := strconv.Atoi(catStr); err == nil {
			filter.CategoryID = &id
		}
	}
	if pageStr := q.Get("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			filter.Pagination.Page = page
		}
	}
	if limitStr := q.Get("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 {
			filter.Pagination.Limit = limit
		}
	}

	products, err := h.service.GetDarkProducts(r.Context(), filter)
	if err != nil {
		log.Printf("❌ Ошибка тёмных товаров: %v", err)
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