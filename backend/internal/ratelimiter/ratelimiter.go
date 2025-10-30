package ratelimiter

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type Config struct {
	RequestsPerWindow int
	Window            time.Duration
	Enabled           bool
}

type Limiter interface {
	Allow(key string) (bool, time.Duration)
}

type RedisRateLimiter struct {
	client  *redis.Client
	config  Config
}

func NewRedisRateLimiter(client *redis.Client, cfg Config) *RedisRateLimiter {
	return &RedisRateLimiter{
		client: client,
		config: cfg,
	}
}

func (r *RedisRateLimiter) Allow(key string) (bool, time.Duration) {
	ctx := context.Background()
	rateLimitKey := fmt.Sprintf("rate_limit:%s", key)

	// Get current count
	count, err := r.client.Get(ctx, rateLimitKey).Int()
	if err != nil && err != redis.Nil {
		// If Redis fails, allow the request (fail open)
		return true, 0
	}

	// Check if limit exceeded
	if count >= r.config.RequestsPerWindow {
		ttl, _ := r.client.TTL(ctx, rateLimitKey).Result()
		return false, ttl
	}

	// Increment counter
	pipe := r.client.Pipeline()
	pipe.Incr(ctx, rateLimitKey)

	// Set expiry only on first request
	if count == 0 {
		pipe.Expire(ctx, rateLimitKey, r.config.Window)
	}

	_, err = pipe.Exec(ctx)
	if err != nil {
		// If Redis fails, allow the request (fail open)
		return true, 0
	}

	return true, 0
}
