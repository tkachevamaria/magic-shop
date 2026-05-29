package catalog

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"

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

	// Парсим ОДИН category
	if catStr := q.Get("category"); catStr != "" {
		first := strings.Split(catStr, ",")[0]
		if id, err := strconv.Atoi(strings.TrimSpace(first)); err == nil {
			filter.CategoryID = &id
		}
	}

	// Парсим ОДИН shop
	if shopStr := q.Get("shop"); shopStr != "" {
		first := strings.Split(shopStr, ",")[0]
		if id, err := strconv.Atoi(strings.TrimSpace(first)); err == nil {
			filter.ShopID = &id
		}
	}

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

		// В методе GetProducts / SearchProducts добавь парсинг:
	if dmStr := q.Get("delivery"); dmStr != "" {
		if id, err := strconv.Atoi(dmStr); err == nil {
			filter.DeliveryMethodID = &id
		}
	}

	resp, err := h.service.GetProducts(r.Context(), filter)
	if err != nil {
		log.Printf("❌ Ошибка списка товаров: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, resp)
}

func (h *ProductHandler) GetDarkProducts(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	var filter ProductFilter
	filter.Pagination.Page = 1
	filter.Pagination.Limit = 12

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

	resp, err := h.service.GetDarkProducts(r.Context(), filter)
	if err != nil {
		log.Printf("❌ Ошибка тёмных товаров: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, resp)
}

func (h *ProductHandler) SearchProducts(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	query := q.Get("q")
	var filter ProductFilter
	filter.Pagination.Page = 1
	filter.Pagination.Limit = 12

	if catStr := q.Get("category"); catStr != "" {
		first := strings.Split(catStr, ",")[0]
		if id, err := strconv.Atoi(strings.TrimSpace(first)); err == nil {
			filter.CategoryID = &id
		}
	}
	if shopStr := q.Get("shop"); shopStr != "" {
		first := strings.Split(shopStr, ",")[0]
		if id, err := strconv.Atoi(strings.TrimSpace(first)); err == nil {
			filter.ShopID = &id
		}
	}
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

	resp, err := h.service.SearchProducts(r.Context(), query, filter)
	if err != nil {
		log.Printf("❌ Ошибка поиска: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, resp)
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

	writeJSON(w, product)
}

func (h *ProductHandler) GetSidebarFilters(w http.ResponseWriter, r *http.Request) {
	filters, err := h.service.GetSidebarFilters(r.Context())
	if err != nil {
		log.Printf("❌ Ошибка загрузки фильтров: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, filters)
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}