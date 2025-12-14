package cache

import "github.com/redis/go-redis/v9"

// NewRedisClient creates and configures a new Redis client
func NewRedisClient(addr, username, password string, db, poolSize, minIdleConns int) *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:         addr,         // Redis server address (e.g., "localhost:6379")
		Username:     username,     // Redis username (for Redis 6+ ACL)
		Password:     password,     // Redis password
		DB:           db,           // Database number (0-15)
		PoolSize:     poolSize,     // Maximum number of connections
		MinIdleConns: minIdleConns, // Minimum idle connections to maintain
	})
}
