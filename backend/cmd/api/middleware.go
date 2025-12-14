package main

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/dapoadedire/offloadr/backend/internal/store"
	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const userCtxKey contextKey = "user"

func getUserFromContext(r *http.Request) *store.User {
	user, _ := r.Context().Value(userCtxKey).(*store.User)
	return user
}

func (app *application) AuthTokenMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			app.unauthorizedErrorResponse(w, r, fmt.Errorf("authorization header is missing"))
			return
		}

		// Check Bearer format
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			app.unauthorizedErrorResponse(w, r, fmt.Errorf("invalid authorization header format"))
			return
		}

		token := parts[1]

		// Validate JWT token
		jwtToken, err := app.authenticator.ValidateToken(token)
		if err != nil {
			app.unauthorizedErrorResponse(w, r, fmt.Errorf("invalid token: %w", err))
			return
		}

		// Extract claims
		claims, ok := jwtToken.Claims.(jwt.MapClaims)
		if !ok {
			app.unauthorizedErrorResponse(w, r, fmt.Errorf("invalid token claims"))
			return
		}

		// Get user ID from subject claim
		userID, err := strconv.ParseInt(fmt.Sprintf("%v", claims["sub"]), 10, 64)
		if err != nil {
			app.unauthorizedErrorResponse(w, r, fmt.Errorf("invalid user ID in token"))
			return
		}

		// Load user from database
		ctx := r.Context()
		user, err := app.store.Users.GetByID(ctx, userID)
		if err != nil {
			switch err {
			case store.ErrNotFound:
				app.unauthorizedErrorResponse(w, r, fmt.Errorf("user not found"))
			default:
				app.internalServerError(w, r, err)
			}
			return
		}

		// Check if user is active
		if !user.IsActive {
			app.forbiddenResponse(w, r, fmt.Errorf("account is inactive"))
			return
		}

		// Store user in context
		ctx = context.WithValue(ctx, userCtxKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (app *application) RequireEmailVerification(next http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := getUserFromContext(r)
		if user == nil {
			app.unauthorizedErrorResponse(w, r, fmt.Errorf("user not found in context"))
			return
		}

		if !user.EmailVerified {
			app.forbiddenResponse(w, r, fmt.Errorf("please verify your email before performing this action"))
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (app *application) RateLimiterMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if app.config.rateLimiter.Enabled {
			ip := getRealIP(r)
			allowed, retryAfter := app.rateLimiter.Allow(ip)
			if !allowed {
				app.rateLimitExceededResponse(w, r, retryAfter.String())
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

// EndpointRateLimiterMiddleware creates a rate limiter middleware for specific endpoints
// Each endpoint gets its own independent rate limit bucket using the rateLimiters map
func (app *application) EndpointRateLimiterMiddleware(endpointName string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !app.config.rateLimiter.Enabled {
				next.ServeHTTP(w, r)
				return
			}

			// Get the rate limiter for this specific endpoint
			limiter, exists := app.rateLimiters[endpointName]
			if !exists {
				// If no specific limiter exists, allow the request
				next.ServeHTTP(w, r)
				return
			}

			ip := getRealIP(r)
			// Use just the IP as the key since the limiter is already endpoint-specific
			allowed, retryAfter := limiter.Allow(ip)

			if !allowed {
				app.rateLimitExceededResponse(w, r, retryAfter.String())
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func getRealIP(r *http.Request) string {
	// Try X-Forwarded-For header
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	// Try X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}

	// Fall back to RemoteAddr
	ip := r.RemoteAddr
	if colon := strings.LastIndex(ip, ":"); colon != -1 {
		ip = ip[:colon]
	}
	return ip
}
