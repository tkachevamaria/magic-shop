package auth

import (
	"context"
	"net/http"
	"strings"
)

type contextKey string

const CtxUserID contextKey = "userID"

func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		claims, err := ParseToken(strings.TrimPrefix(header, "Bearer "))
		if err != nil {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), CtxUserID, claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
