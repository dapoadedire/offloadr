package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/dapoadedire/offloadr/backend/internal/store"
	"github.com/redis/go-redis/v9"
)

type SchoolStore struct {
	rdb *redis.Client
}

const SchoolExpTime = 24 * time.Hour // Schools rarely change, cache for 24 hours

// Get retrieves a school from cache by ID
// Returns nil, nil on cache miss (not found is not an error)
func (s *SchoolStore) Get(ctx context.Context, schoolID int64) (*store.School, error) {
	cacheKey := fmt.Sprintf("cache:school:%d", schoolID)

	data, err := s.rdb.Get(ctx, cacheKey).Result()
	if err == redis.Nil {
		return nil, nil // Cache miss - return nil without error
	} else if err != nil {
		return nil, err // Redis error
	}

	var school store.School
	if data != "" {
		err := json.Unmarshal([]byte(data), &school)
		if err != nil {
			return nil, err
		}
	}

	return &school, nil
}

// GetAll retrieves all schools from cache
// Returns nil, nil on cache miss
func (s *SchoolStore) GetAll(ctx context.Context) ([]*store.School, error) {
	cacheKey := "cache:schools:all"

	data, err := s.rdb.Get(ctx, cacheKey).Result()
	if err == redis.Nil {
		return nil, nil // Cache miss
	} else if err != nil {
		return nil, err // Redis error
	}

	var schools []*store.School
	if data != "" {
		err := json.Unmarshal([]byte(data), &schools)
		if err != nil {
			return nil, err
		}
	}

	return schools, nil
}

// Set stores a school in cache with automatic expiration
func (s *SchoolStore) Set(ctx context.Context, school *store.School) error {
	cacheKey := fmt.Sprintf("cache:school:%d", school.ID)

	jsonData, err := json.Marshal(school)
	if err != nil {
		return err
	}

	// SetEx sets value with expiration atomically
	return s.rdb.SetEx(ctx, cacheKey, jsonData, SchoolExpTime).Err()
}

// SetAll stores all schools in cache
func (s *SchoolStore) SetAll(ctx context.Context, schools []*store.School) error {
	cacheKey := "cache:schools:all"

	jsonData, err := json.Marshal(schools)
	if err != nil {
		return err
	}

	return s.rdb.SetEx(ctx, cacheKey, jsonData, SchoolExpTime).Err()
}

// Delete removes a school from cache (cache invalidation)
func (s *SchoolStore) Delete(ctx context.Context, schoolID int64) {
	cacheKey := fmt.Sprintf("cache:school:%d", schoolID)
	s.rdb.Del(ctx, cacheKey)
	// Also invalidate the all schools cache
	s.DeleteAll(ctx)
}

// DeleteAll removes all schools from cache
func (s *SchoolStore) DeleteAll(ctx context.Context) {
	cacheKey := "cache:schools:all"
	s.rdb.Del(ctx, cacheKey)
}
