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
	cart, err := h.service.GetCart(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cart)
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

	if err := h.service.IncrementItem(userID, itemID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
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

	if err := h.service.DecrementItem(userID, itemID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
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

	if err := h.service.DeleteItem(userID, itemID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func parseID(r *http.Request, param string) (int, error) {
	return strconv.Atoi(chi.URLParam(r, param))
}
