package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/dapoadedire/offloadr/backend/internal/env"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"go.uber.org/zap"
)

type application struct {
	config config
	logger *zap.SugaredLogger
}

type config struct {
	addr         string
	env          string
	version      string
	readTimeout  time.Duration
	writeTimeout time.Duration
	idleTimeout  time.Duration
	frontendURL  string
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

	r.Route(version, func(r chi.Router) {
		r.Get("/health", app.healthCheckHandler)
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
