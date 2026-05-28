package cart

import (
	"encoding/json"
	"errors"
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
	if errors.Is(err, ErrUserNotFound) {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
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
	if errors.Is(err, ErrUserNotFound) || errors.Is(err, ErrItemNotFound) {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	if errors.Is(err, ErrAccessDenied) {
		http.Error(w, err.Error(), http.StatusForbidden) // 403
		return
	}
	if errors.Is(err, ErrInsufficientStock) {
		http.Error(w, err.Error(), http.StatusConflict) // 409
		return
	}
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
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
	if errors.Is(err, ErrUserNotFound) || errors.Is(err, ErrItemNotInCart) {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
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
	if errors.Is(err, ErrUserNotFound) || errors.Is(err, ErrItemNotInCart) {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
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
