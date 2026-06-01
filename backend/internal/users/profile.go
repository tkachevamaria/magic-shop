package users

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type ProfileHandler struct {
	db *sql.DB
}

func NewProfileHandler(db *sql.DB) *ProfileHandler {
	return &ProfileHandler{db: db}
}

type UserProfile struct {
	ID          int     `json:"id"`
	FirstName   string  `json:"first_name"`
	AccessLevel int     `json:"access_level"`
	TotalSpent  float64 `json:"total_spent"`
}

func (h *ProfileHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	// Берём ID из пути /api/users/profile/1
	uid, err := strconv.Atoi(chi.URLParam(r, "userID"))
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	var profile UserProfile
	err = h.db.QueryRowContext(r.Context(), `
		SELECT UserID, FirstName, AccessLevel, TotalSpent FROM Users WHERE UserID=?`, uid).
		Scan(&profile.ID, &profile.FirstName, &profile.AccessLevel, &profile.TotalSpent)

	if err == sql.ErrNoRows {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	if err != nil {
		log.Printf("❌ Ошибка профиля: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}