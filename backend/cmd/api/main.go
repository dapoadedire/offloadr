package main

import (
	"time"

	"github.com/dapoadedire/offloadr/backend/internal/db"
	"github.com/dapoadedire/offloadr/backend/internal/env"
	"github.com/dapoadedire/offloadr/backend/internal/store"
	"github.com/dapoadedire/offloadr/backend/migrations"
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

	// Database
	database, err := db.New(cfg.db.addr, cfg.db.maxOpenConns, cfg.db.maxIdleConns, cfg.db.maxIdleTime, logger)
	if err != nil {
		logger.Fatalw("failed to connect to database", "error", err)
	}
	defer database.Close()

	// Run database migrations
	if err := db.MigrateFS(database, migrations.FS, "."); err != nil {
		logger.Fatalw("failed to run migrations", "error", err)
	}
	logger.Info("database migrations completed successfully")
	store := store.NewStorage(database)

	app := &application{
		config: cfg,
		logger: logger,
		store:  store,
	}

	chi := app.mount()
	if err := app.run(chi); err != nil {
		logger.Fatalw("server error", "error", err)
	}
}

func loadConfig() config {

	return config{
		addr:         env.GetEnv("ADDR", ":8080"),
		env:          env.GetEnv("GO_ENV", "development"),
		version:      env.GetEnv("VERSION", "v1"),
		readTimeout:  env.GetEnvDuration("READ_TIMEOUT", 5*time.Second),
		writeTimeout: env.GetEnvDuration("WRITE_TIMEOUT", 10*time.Second),
		idleTimeout:  env.GetEnvDuration("IDLE_TIMEOUT", 120*time.Second),
		frontendURL:  env.GetEnv("FRONTEND_URL", "http://localhost:3000"),
		db: dbConfig{
			addr:         env.GetEnv("DB_ADDR", "postgres://offloadr:password@localhost:5432/offloadr?sslmode=disable"),
			maxOpenConns: env.GetEnvInt("DB_MAX_OPEN_CONNS", 25),
			maxIdleConns: env.GetEnvInt("DB_MAX_IDLE_CONNS", 25),
			maxIdleTime:  env.GetEnvDuration("DB_MAX_IDLE_TIME", 15*time.Minute),
		},
	}
}
