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

	if cat := q.Get("category"); cat != "" {
		if id, err := strconv.Atoi(cat); err == nil { filter.CategoryID = &id }
	}
	if color := q.Get("color"); color != "" { filter.Color = &color }
	if size := q.Get("size"); size != "" { filter.Size = &size }
	if p := q.Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 { filter.Pagination.Page = v }
	}
	if l := q.Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 { filter.Pagination.Limit = v }
	}

	resp, err := h.service.GetProducts(r.Context(), filter)
	if err != nil { logError(w, "Ошибка списка товаров", err); return }
	writeJSON(w, resp)
}

func (h *ProductHandler) GetDarkProducts(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	var filter ProductFilter
	filter.Pagination.Page = 1
	filter.Pagination.Limit = 12

	if p := q.Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 { filter.Pagination.Page = v }
	}
	if l := q.Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 { filter.Pagination.Limit = v }
	}

	resp, err := h.service.GetDarkProducts(r.Context(), filter)
	if err != nil { logError(w, "Ошибка тёмных товаров", err); return }
	writeJSON(w, resp)
}

func (h *ProductHandler) SearchProducts(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	query := q.Get("q")
	var filter ProductFilter
	filter.Pagination.Page = 1
	filter.Pagination.Limit = 12

	if cat := q.Get("category"); cat != "" {
		if id, err := strconv.Atoi(cat); err == nil { filter.CategoryID = &id }
	}
	if color := q.Get("color"); color != "" { filter.Color = &color }
	if size := q.Get("size"); size != "" { filter.Size = &size }
	if p := q.Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 { filter.Pagination.Page = v }
	}
	if l := q.Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 { filter.Pagination.Limit = v }
	}

	resp, err := h.service.SearchProducts(r.Context(), query, filter)
	if err != nil { logError(w, "Ошибка поиска", err); return }
	writeJSON(w, resp)
}

func (h *ProductHandler) GetProductByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil { http.Error(w, "Invalid product ID", http.StatusBadRequest); return }

	product, err := h.service.GetProductByID(r.Context(), id)
	if err != nil { logError(w, "Ошибка получения товара", err); return }
	if product == nil { http.Error(w, "Product not found", http.StatusNotFound); return }

	writeJSON(w, product)
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

func logError(w http.ResponseWriter, msg string, err error) {
	log.Printf("❌ %s: %v", msg, err)
	http.Error(w, "Internal Server Error", http.StatusInternalServerError)
}