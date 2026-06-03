package logger

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

var allowedLevels = map[string]bool{
	"debug": true,
	"info":  true,
	"warn":  true,
	"error": true,
}

const maxMessageLen = 500
const maxDetailsLen = 2000

type frontendLogRequest struct {
	Level   string `json:"level"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

func HandleFrontendLog(w http.ResponseWriter, r *http.Request) {
	var req frontendLogRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	req.Level = strings.ToLower(strings.TrimSpace(req.Level))
	if !allowedLevels[req.Level] {
		http.Error(w, "Invalid log level", http.StatusBadRequest)
		return
	}

	req.Message = strings.TrimSpace(req.Message)
	if req.Message == "" {
		http.Error(w, "Message is required", http.StatusBadRequest)
		return
	}
	if len(req.Message) > maxMessageLen {
		req.Message = req.Message[:maxMessageLen] + "...[truncated]"
	}
	if len(req.Details) > maxDetailsLen {
		req.Details = req.Details[:maxDetailsLen] + "...[truncated]"
	}

	if req.Details != "" {
		log.Printf("[FRONTEND] [%s] %s | details: %s", strings.ToUpper(req.Level), req.Message, req.Details)
	} else {
		log.Printf("[FRONTEND] [%s] %s", strings.ToUpper(req.Level), req.Message)
	}

	w.WriteHeader(http.StatusNoContent)
}
