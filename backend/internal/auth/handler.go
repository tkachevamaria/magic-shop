package auth

import (
	"encoding/json"
	"errors"
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

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	if req.DeliveryAddress == "" {
		http.Error(w, "delivery_address is required", http.StatusBadRequest)
		return
	}

	if err := h.service.Register(req); err != nil {
		switch {
		case errors.Is(err, ErrEmailTaken):
			log.Printf("[AUTH] registration failed: email already taken email=%s", req.Email)
			http.Error(w, "email already taken", http.StatusConflict) // 409
		case errors.Is(err, ErrInvalidRole):
			http.Error(w, "invalid role", http.StatusBadRequest)
		case errors.Is(err, ErrInvalidPassword):
			http.Error(w, "password must be at least 6 characters", http.StatusBadRequest)
		default:
			log.Printf("[AUTH] registration error: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	log.Printf("[AUTH] registered email=%s role=%s", req.Email, req.Role)
	w.WriteHeader(http.StatusCreated)
}

func (h *Handler) UpdateDeliveryAddress(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(CtxUserID).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		DeliveryAddress string `json:"delivery_address"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	if req.DeliveryAddress == "" {
		http.Error(w, "delivery_address is required", http.StatusBadRequest)
		return
	}

	if err := h.service.UpdateDeliveryAddress(userID, req.DeliveryAddress); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	user, err := h.service.Login(req)
	if err != nil {
		log.Printf("[AUTH] login failed: invalid credentials email=%s", req.Email)
		http.Error(w, "invalid email or password", http.StatusUnauthorized) // 401
		return
	}

	token, err := GenerateToken(user)
	if err != nil {
		http.Error(w, "token error", http.StatusInternalServerError)
		return
	}

	log.Printf("[AUTH] login success userID=%d email=%s", user.UserID, user.Email)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token":        token,
		"user_id":      user.UserID,
		"access_level": user.AccessLevel,
	})
}

func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	userID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	if err := h.service.DeleteUser(userID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("[AUTH] deleted userID=%d", userID)
	w.WriteHeader(http.StatusNoContent)
}
