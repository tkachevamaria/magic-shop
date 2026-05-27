package cart

import (
	"encoding/json"
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

func (h *Handler) GetCart(w http.ResponseWriter, r *http.Request) {
	userID, err := parseID(r, "userID")
	if err != nil {
		http.Error(w, "invalid user id", http.StatusBadRequest)
		return
	}

	cart, err := h.service.GetCart(r.Context(), userID)
	if err != nil {
		http.Error(w, "failed to get cart", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, cart)
}

func (h *Handler) IncrementItem(w http.ResponseWriter, r *http.Request) {
	userID, err := parseID(r, "userID")
	if err != nil {
		http.Error(w, "invalid user id", http.StatusBadRequest)
		return
	}

	itemID, err := parseID(r, "itemID")
	if err != nil {
		http.Error(w, "invalid item id", http.StatusBadRequest)
		return
	}

	err = h.service.IncrementItem(r.Context(), userID, itemID)
	if err != nil {
		http.Error(w, "failed to increment item", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) DecrementItem(w http.ResponseWriter, r *http.Request) {
	userID, err := parseID(r, "userID")
	if err != nil {
		http.Error(w, "invalid user id", http.StatusBadRequest)
		return
	}

	itemID, err := parseID(r, "itemID")
	if err != nil {
		http.Error(w, "invalid item id", http.StatusBadRequest)
		return
	}

	err = h.service.DecrementItem(r.Context(), userID, itemID)
	if err != nil {
		http.Error(w, "failed to decrement item", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) DeleteItem(w http.ResponseWriter, r *http.Request) {
	userID, err := parseID(r, "userID")
	if err != nil {
		http.Error(w, "invalid user id", http.StatusBadRequest)
		return
	}

	itemID, err := parseID(r, "itemID")
	if err != nil {
		http.Error(w, "invalid item id", http.StatusBadRequest)
		return
	}

	err = h.service.DeleteItem(r.Context(), userID, itemID)
	if err != nil {
		http.Error(w, "failed to delete item", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func parseID(r *http.Request, param string) (int, error) {
	return strconv.Atoi(chi.URLParam(r, param))
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	_ = json.NewEncoder(w).Encode(data)
}
