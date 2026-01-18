package main

import (
	"time"

	"github.com/dapoadedire/offloadr/backend/internal/auth"
	"github.com/dapoadedire/offloadr/backend/internal/cache"
	"github.com/dapoadedire/offloadr/backend/internal/db"
	"github.com/dapoadedire/offloadr/backend/internal/env"
	"github.com/dapoadedire/offloadr/backend/internal/mailer"
	"github.com/dapoadedire/offloadr/backend/internal/moderation"
	"github.com/dapoadedire/offloadr/backend/internal/ratelimiter"
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

	// Initialize mailer
	mailerClient := mailer.NewClient(cfg.mailer.apiKey, cfg.mailer.fromEmail)

	// Initialize JWT authenticator
	jwtAuthenticator := auth.NewJWTAuthenticator(
		cfg.auth.token.secretKey,
		cfg.auth.token.audience,
		cfg.auth.token.issuer,
	)

	// Initialize Redis client (used for both rate limiting and caching)
	var rateLimiter ratelimiter.Limiter
	rateLimiters := make(map[string]ratelimiter.Limiter)
	var cacheStorage cache.Storage

	// Redis is enabled if either caching or rate limiting is enabled
	redisEnabled := env.GetEnv("REDIS_ENABLED", "true") == "true"

	if redisEnabled {
		redisClient := cache.NewRedisClient(
			env.GetEnv("REDIS_ADDR", "localhost:6379"),
			env.GetEnv("REDIS_USERNAME", ""),
			env.GetEnv("REDIS_PASSWORD", ""),
			env.GetEnvInt("REDIS_DB", 0),
			env.GetEnvInt("REDIS_POOL_SIZE", 10),
			env.GetEnvInt("REDIS_MIN_IDLE_CONNS", 3),
		)
		defer redisClient.Close()
		logger.Info("connected to Redis successfully")

		// Initialize cache storage
		cacheStorage = cache.NewRedisStorage(redisClient)
		logger.Info("cache storage initialized")

		// Initialize rate limiters if enabled
		if cfg.rateLimiter.Enabled {
			rateLimiter = ratelimiter.NewRedisRateLimiter(redisClient, cfg.rateLimiter)

			// Initialize endpoint-specific rate limiters with industry-standard limits
			// High Priority - Authentication & Security Endpoints
			rateLimiters["auth:login"] = ratelimiter.NewRedisRateLimiter(redisClient, ratelimiter.Config{
				RequestsPerWindow: 10,
				Window:            1 * time.Minute, // 10 requests per minute
				Enabled:           true,
			})

			rateLimiters["auth:register"] = ratelimiter.NewRedisRateLimiter(redisClient, ratelimiter.Config{
				RequestsPerWindow: 3,
				Window:            1 * time.Hour, // 3 requests per hour
				Enabled:           true,
			})

			rateLimiters["auth:forgot-password"] = ratelimiter.NewRedisRateLimiter(redisClient, ratelimiter.Config{
				RequestsPerWindow: 5,
				Window:            15 * time.Minute, // 5 requests per 15 minutes
				Enabled:           true,
			})

			rateLimiters["auth:resend-verification"] = ratelimiter.NewRedisRateLimiter(redisClient, ratelimiter.Config{
				RequestsPerWindow: 5,
				Window:            1 * time.Hour, // 5 requests per hour
				Enabled:           true,
			})

			rateLimiters["reports:create"] = ratelimiter.NewRedisRateLimiter(redisClient, ratelimiter.Config{
				RequestsPerWindow: 10,
				Window:            1 * time.Hour, // 10 requests per hour
				Enabled:           true,
			})

			// Medium Priority - Content Creation Endpoints
			rateLimiters["items:create"] = ratelimiter.NewRedisRateLimiter(redisClient, ratelimiter.Config{
				RequestsPerWindow: 20,
				Window:            1 * time.Hour, // 20 requests per hour
				Enabled:           true,
			})

			rateLimiters["reviews:create"] = ratelimiter.NewRedisRateLimiter(redisClient, ratelimiter.Config{
				RequestsPerWindow: 30,
				Window:            1 * time.Hour, // 30 requests per hour
				Enabled:           true,
			})

			logger.Info("rate limiter enabled with Redis and endpoint-specific limits configured")
		}
	} else {
		logger.Info("Redis is disabled - caching and Redis rate limiting unavailable")
	}

	// Initialize moderation service
	var moderationService *moderation.Service
	geminiAPIKey := env.GetEnv("GEMINI_API_KEY", "")
	geminiModel := env.GetEnv("GEMINI_MODEL", "gemini-2.0-flash")
	moderationEnabled := env.GetEnv("MODERATION_ENABLED", "true") == "true"

	if geminiAPIKey != "" && moderationEnabled {
		geminiClient, err := moderation.NewGeminiClient(geminiAPIKey, geminiModel)
		if err != nil {
			logger.Warnw("failed to create Gemini client, moderation will use pattern matching only", "error", err)
		}

		moderationConfig := moderation.Config{
			AutoApproveThreshold: env.GetEnvFloat("MODERATION_AUTO_APPROVE_THRESHOLD", 0.95),
			FlagThreshold:        env.GetEnvFloat("MODERATION_FLAG_THRESHOLD", 0.70),
			RejectThreshold:      env.GetEnvFloat("MODERATION_REJECT_THRESHOLD", 0.30),
			Enabled:              moderationEnabled,
		}

		moderationService = moderation.NewService(geminiClient, store, moderationConfig, logger)
		logger.Info("moderation service initialized with Gemini AI")
	} else if moderationEnabled {
		// Pattern matching only (no AI)
		moderationConfig := moderation.Config{
			AutoApproveThreshold: 0.95,
			FlagThreshold:        0.70,
			RejectThreshold:      0.30,
			Enabled:              true,
		}
		moderationService = moderation.NewService(nil, store, moderationConfig, logger)
		logger.Warn("moderation service initialized without Gemini AI (pattern matching only)")
	} else {
		logger.Info("moderation service disabled")
	}

	app := &application{
		config:            cfg,
		logger:            logger,
		store:             store,
		cacheStorage:      cacheStorage,
		authenticator:     jwtAuthenticator,
		mailer:            mailerClient,
		rateLimiter:       rateLimiter,
		rateLimiters:      rateLimiters,
		moderationService: moderationService,
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
		auth: authConfig{
			token: tokenConfig{
				secretKey: env.GetEnv("JWT_SECRET_KEY", "your-super-secret-key-change-in-production"),
				audience:  env.GetEnv("JWT_AUDIENCE", "offloadr-users"),
				issuer:    env.GetEnv("JWT_ISSUER", "offloadr-api"),
				expiry:    env.GetEnvDuration("JWT_EXPIRY", 168*time.Hour), // 7 days
			},
		},
		mailer: mailerConfig{
			apiKey:    env.GetEnv("RESEND_API_KEY", ""),
			fromEmail: env.GetEnv("FROM_EMAIL", "noreply@offloadr.com"),
		},
		rateLimiter: ratelimiter.Config{
			Enabled:           env.GetEnv("RATE_LIMITER_ENABLED", "false") == "true",
			RequestsPerWindow: env.GetEnvInt("RATE_LIMITER_REQUESTS_PER_WINDOW", 20),
			Window:            env.GetEnvDuration("RATE_LIMITER_WINDOW", 60*time.Second),
		},
	}
}
