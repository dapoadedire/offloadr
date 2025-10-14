package main

import (
	"github.com/dapoadedire/offloadr/backend/internal/env"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	// Logger
	logger := zap.Must(zap.NewProduction()).Sugar()
	defer logger.Sync()
	if err := godotenv.Load(".env"); err != nil {
		logger.Warnw("error loading .env file", "error", err)
	}

	cfg := loadConfig()

	app := &application{
		config: cfg,
		logger: logger,
	}

	chi := app.mount()
	if err := app.run(chi); err != nil {
		logger.Fatal("server error", "error", err)
	}
}

func loadConfig() config {

	return config{
		addr:    env.GetEnv("ADDR", ":8080"),
		env:     env.GetEnv("GO_ENV", "development"),
		version: env.GetEnv("VERSION", "v1"),
	}
}
