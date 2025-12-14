package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/dapoadedire/offloadr/backend/internal/store"
	"github.com/redis/go-redis/v9"
)

type CategoryStore struct {
	rdb *redis.Client
}

const CategoryExpTime = 24 * time.Hour // Categories are static data, cache for 24 hours

// Get retrieves a category from cache by ID
// Returns nil, nil on cache miss (not found is not an error)
func (s *CategoryStore) Get(ctx context.Context, categoryID int64) (*store.Category, error) {
	cacheKey := fmt.Sprintf("cache:category:%d", categoryID)

	data, err := s.rdb.Get(ctx, cacheKey).Result()
	if err == redis.Nil {
		return nil, nil // Cache miss - return nil without error
	} else if err != nil {
		return nil, err // Redis error
	}

	var category store.Category
	if data != "" {
		err := json.Unmarshal([]byte(data), &category)
		if err != nil {
			return nil, err
		}
	}

	return &category, nil
}

// GetAll retrieves all categories from cache (with subcategories)
// Returns nil, nil on cache miss
func (s *CategoryStore) GetAll(ctx context.Context) ([]*store.Category, error) {
	cacheKey := "cache:categories:all"

	data, err := s.rdb.Get(ctx, cacheKey).Result()
	if err == redis.Nil {
		return nil, nil // Cache miss
	} else if err != nil {
		return nil, err // Redis error
	}

	var categories []*store.Category
	if data != "" {
		err := json.Unmarshal([]byte(data), &categories)
		if err != nil {
			return nil, err
		}
	}

	return categories, nil
}

// Set stores a category in cache with automatic expiration
func (s *CategoryStore) Set(ctx context.Context, category *store.Category) error {
	cacheKey := fmt.Sprintf("cache:category:%d", category.ID)

	jsonData, err := json.Marshal(category)
	if err != nil {
		return err
	}

	// SetEx sets value with expiration atomically
	return s.rdb.SetEx(ctx, cacheKey, jsonData, CategoryExpTime).Err()
}

// SetAll stores all categories in cache
func (s *CategoryStore) SetAll(ctx context.Context, categories []*store.Category) error {
	cacheKey := "cache:categories:all"

	jsonData, err := json.Marshal(categories)
	if err != nil {
		return err
	}

	return s.rdb.SetEx(ctx, cacheKey, jsonData, CategoryExpTime).Err()
}

// Delete removes a category from cache (cache invalidation)
func (s *CategoryStore) Delete(ctx context.Context, categoryID int64) {
	cacheKey := fmt.Sprintf("cache:category:%d", categoryID)
	s.rdb.Del(ctx, cacheKey)
	// Also invalidate the all categories cache
	s.DeleteAll(ctx)
}

// DeleteAll removes all categories from cache
func (s *CategoryStore) DeleteAll(ctx context.Context) {
	cacheKey := "cache:categories:all"
	s.rdb.Del(ctx, cacheKey)
}
