package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/dapoadedire/offloadr/backend/internal/store"
	"github.com/redis/go-redis/v9"
)

type RatingStore struct {
	rdb *redis.Client
}

const RatingExpTime = 1 * time.Hour // User ratings cached for 1 hour

// Get retrieves a seller rating from cache by seller ID
// Returns nil, nil on cache miss (not found is not an error)
func (s *RatingStore) Get(ctx context.Context, sellerID int64) (*store.SellerRating, error) {
	cacheKey := fmt.Sprintf("cache:rating:%d", sellerID)

	data, err := s.rdb.Get(ctx, cacheKey).Result()
	if err == redis.Nil {
		return nil, nil // Cache miss - return nil without error
	} else if err != nil {
		return nil, err // Redis error
	}

	var rating store.SellerRating
	if data != "" {
		err := json.Unmarshal([]byte(data), &rating)
		if err != nil {
			return nil, err
		}
	}

	return &rating, nil
}

// Set stores a seller rating in cache with automatic expiration
func (s *RatingStore) Set(ctx context.Context, rating *store.SellerRating) error {
	cacheKey := fmt.Sprintf("cache:rating:%d", rating.SellerID)

	jsonData, err := json.Marshal(rating)
	if err != nil {
		return err
	}

	// SetEx sets value with expiration atomically
	return s.rdb.SetEx(ctx, cacheKey, jsonData, RatingExpTime).Err()
}

// Delete removes a seller rating from cache (cache invalidation)
func (s *RatingStore) Delete(ctx context.Context, sellerID int64) {
	cacheKey := fmt.Sprintf("cache:rating:%d", sellerID)
	s.rdb.Del(ctx, cacheKey)
}
