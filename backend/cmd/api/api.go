package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/dapoadedire/offloadr/backend/internal/auth"
	"github.com/dapoadedire/offloadr/backend/internal/env"
	"github.com/dapoadedire/offloadr/backend/internal/mailer"
	"github.com/dapoadedire/offloadr/backend/internal/ratelimiter"
	"github.com/dapoadedire/offloadr/backend/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"go.uber.org/zap"
)

type application struct {
	config        config
	logger        *zap.SugaredLogger
	store         store.Storage
	authenticator auth.Authenticator
	mailer        *mailer.Client
	rateLimiter   ratelimiter.Limiter
}

type config struct {
	addr         string
	env          string
	version      string
	readTimeout  time.Duration
	writeTimeout time.Duration
	idleTimeout  time.Duration
	frontendURL  string
	db           dbConfig
	auth         authConfig
	mailer       mailerConfig
	rateLimiter  ratelimiter.Config
}

type dbConfig struct {
	addr         string
	maxOpenConns int
	maxIdleConns int
	maxIdleTime  time.Duration
}

type authConfig struct {
	token tokenConfig
}

type tokenConfig struct {
	secretKey string
	audience  string
	issuer    string
	expiry    time.Duration
}

type mailerConfig struct {
	apiKey    string
	fromEmail string
}


func (app *application) mount() *chi.Mux {
	version := env.GetEnv("API_VERSION", "/v1")

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Heartbeat("/ping"))
	r.Use(middleware.Timeout(60 * time.Second))

	// CORS middleware
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{app.config.frontendURL},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// this is offload API, read the docs at ... to get started
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Welcome to Offloadr API! Visit /docs for more information."))
	})

	// Serve Insomnia collection for easy API testing
	r.Get("/insomnia.yaml", app.serveInsomniaCollection)

	r.Route(version, func(r chi.Router) {
		r.Get("/health", app.healthCheckHandler)
		r.Post("/waitlist", app.createWaitlistHandler)

		// Public authentication routes
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", app.registerUserHandler)
			r.Put("/verify-email/{token}", app.verifyEmailHandler)
			r.Post("/resend-verification", app.resendVerificationHandler)
			r.Post("/login", app.loginHandler)
			r.Post("/forgot-password", app.forgotPasswordHandler)
			r.Post("/reset-password", app.resetPasswordHandler)
		})

		// Protected user routes
		r.Route("/users", func(r chi.Router) {
			r.Use(app.AuthTokenMiddleware)

			// Current user routes
			r.Get("/me", app.getCurrentUserHandler)
			r.Patch("/me", app.updateUserHandler)
			r.Patch("/me/password", app.changePasswordHandler)
			r.Delete("/me", app.deactivateAccountHandler)
			r.Delete("/me/permanent", app.deleteAccountPermanentlyHandler)
			r.Get("/me/items", app.getCurrentUserItemsHandler)
			r.Get("/me/items/sold", app.getCurrentUserSoldItemsHandler)
			r.Get("/me/reports", app.getUserReportsHandler)

			// Public user routes
			r.Get("/{id}", app.getUserByIDHandler)
			r.Get("/{id}/items", app.getUserItemsHandler)
			r.Get("/{id}/reviews", app.getUserReviewsHandler)
			r.Get("/{id}/rating", app.getUserRatingHandler)
		})

		// Public schools routes
		r.Route("/schools", func(r chi.Router) {
			r.Get("/", app.listSchoolsHandler)
			r.Get("/{id}", app.getSchoolByIDHandler)
			r.Get("/{school_id}/items", app.listSchoolItemsHandler)
		})

		// Public categories routes
		r.Route("/categories", func(r chi.Router) {
			r.Get("/", app.listCategoriesHandler)
			r.Get("/{id}", app.getCategoryByIDHandler)
			r.Get("/{category_id}/items", app.listCategoryItemsHandler)
		})

		// Items routes
		r.Route("/items", func(r chi.Router) {
			// Public/Browse routes
			r.Get("/", app.listItemsHandler)
			r.Get("/search", app.searchItemsHandler)
			r.Get("/{id}", app.getItemByIDHandler)
			r.Get("/{id}/related", app.getRelatedItemsHandler)
			r.Get("/{id}/reviews", app.getItemReviewsHandler)

			// Protected routes
			r.Group(func(r chi.Router) {
				r.Use(app.AuthTokenMiddleware)

				r.Get("/{id}/contact", app.getItemContactHandler)
				r.Post("/", app.createItemHandler)
				r.Patch("/{id}", app.updateItemHandler)
				r.Delete("/{id}", app.deleteItemHandler)
				r.Patch("/{id}/status", app.updateItemStatusHandler)
				r.Post("/{id}/mark-sold", app.markItemAsSoldHandler)
				r.Post("/{id}/repost", app.repostItemHandler)

				// Photo routes
				r.Post("/{id}/photos", app.uploadItemPhotoHandler)
				r.Delete("/{id}/photos/{photo_id}", app.deleteItemPhotoHandler)
				r.Patch("/{id}/photos/{photo_id}/primary", app.setItemPhotoPrimaryHandler)
			})
		})

		// Favorites routes (protected)
		r.Route("/favorites", func(r chi.Router) {
			r.Use(app.AuthTokenMiddleware)

			r.Get("/", app.listFavoritesHandler)
			r.Post("/", app.addFavoriteHandler)
			r.Delete("/{item_id}", app.removeFavoriteHandler)
			r.Get("/check/{item_id}", app.checkFavoriteHandler)
		})

		// Reviews routes
		r.Route("/reviews", func(r chi.Router) {
			r.Use(app.AuthTokenMiddleware)

			r.Post("/", app.createReviewHandler)
			r.Get("/{id}", app.getReviewByIDHandler)
			r.Patch("/{id}", app.updateReviewHandler)
			r.Delete("/{id}", app.deleteReviewHandler)
		})

		// Reports routes (protected)
		r.Route("/reports", func(r chi.Router) {
			r.Use(app.AuthTokenMiddleware)

			r.Post("/", app.createReportHandler)
		})
	})

	return r
}

func (app *application) run(mux http.Handler) error {
	srv := &http.Server{
		Addr:         app.config.addr,
		Handler:      mux,
		WriteTimeout: app.config.writeTimeout,
		ReadTimeout:  app.config.readTimeout,
		IdleTimeout:  app.config.idleTimeout,
	}

	// Create a channel to listen for shutdown signals
	shutdown := make(chan error, 1)

	// Start the server in a goroutine
	go func() {
		app.logger.Infow("server has started", "addr", app.config.addr, "env", app.config.env)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			shutdown <- err
		}
	}()

	// Create a channel to listen for OS signals
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// Block until we receive a signal or an error
	select {
	case err := <-shutdown:
		return err
	case sig := <-quit:
		app.logger.Infow("shutting down server", "signal", sig.String())

		// Create a context with timeout for shutdown
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		// Attempt graceful shutdown
		if err := srv.Shutdown(ctx); err != nil {
			app.logger.Errorw("server forced to shutdown", "error", err)
			return err
		}

		app.logger.Info("server stopped gracefully")
		return nil
	}
}
