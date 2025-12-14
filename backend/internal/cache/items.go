package cache

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"time"

	"github.com/dapoadedire/offloadr/backend/internal/store"
	"github.com/redis/go-redis/v9"
)

type ItemStore struct {
	rdb *redis.Client
}

const ItemExpTime = 10 * time.Minute // Items change frequently, cache for 10 minutes

// Get retrieves an item with details from cache by ID
// Returns nil, nil on cache miss (not found is not an error)
func (s *ItemStore) Get(ctx context.Context, itemID int64) (*store.ItemWithDetails, error) {
	cacheKey := fmt.Sprintf("cache:item:%d", itemID)

	data, err := s.rdb.Get(ctx, cacheKey).Result()
	if err == redis.Nil {
		return nil, nil // Cache miss - return nil without error
	} else if err != nil {
		return nil, err // Redis error
	}

	var item store.ItemWithDetails
	if data != "" {
		err := json.Unmarshal([]byte(data), &item)
		if err != nil {
			return nil, err
		}
	}

	return &item, nil
}

// GetList retrieves a paginated list of items from cache
// The listKey should be a hash of the query parameters
// Returns nil, 0, nil on cache miss
func (s *ItemStore) GetList(ctx context.Context, listKey string) ([]*store.ItemWithDetails, int, error) {
	cacheKey := fmt.Sprintf("cache:items:list:%s", listKey)

	data, err := s.rdb.Get(ctx, cacheKey).Result()
	if err == redis.Nil {
		return nil, 0, nil // Cache miss
	} else if err != nil {
		return nil, 0, err // Redis error
	}

	var result struct {
		Items []*store.ItemWithDetails `json:"items"`
		Total int                      `json:"total"`
	}

	if data != "" {
		err := json.Unmarshal([]byte(data), &result)
		if err != nil {
			return nil, 0, err
		}
	}

	return result.Items, result.Total, nil
}

// Set stores an item with details in cache with automatic expiration
func (s *ItemStore) Set(ctx context.Context, item *store.ItemWithDetails) error {
	cacheKey := fmt.Sprintf("cache:item:%d", item.ID)

	jsonData, err := json.Marshal(item)
	if err != nil {
		return err
	}

	// SetEx sets value with expiration atomically
	return s.rdb.SetEx(ctx, cacheKey, jsonData, ItemExpTime).Err()
}

// SetList stores a paginated list of items in cache
func (s *ItemStore) SetList(ctx context.Context, listKey string, items []*store.ItemWithDetails, total int) error {
	cacheKey := fmt.Sprintf("cache:items:list:%s", listKey)

	result := struct {
		Items []*store.ItemWithDetails `json:"items"`
		Total int                      `json:"total"`
	}{
		Items: items,
		Total: total,
	}

	jsonData, err := json.Marshal(result)
	if err != nil {
		return err
	}

	return s.rdb.SetEx(ctx, cacheKey, jsonData, ItemExpTime).Err()
}

// Delete removes an item from cache (cache invalidation)
func (s *ItemStore) Delete(ctx context.Context, itemID int64) {
	cacheKey := fmt.Sprintf("cache:item:%d", itemID)
	s.rdb.Del(ctx, cacheKey)
	// Also invalidate all item list caches since this item might be in them
	s.deleteAllLists(ctx)
}

// DeleteList removes a specific list from cache
func (s *ItemStore) DeleteList(ctx context.Context, listKey string) {
	cacheKey := fmt.Sprintf("cache:items:list:%s", listKey)
	s.rdb.Del(ctx, cacheKey)
}

// DeleteBySchool removes all item lists that might contain items from a school
func (s *ItemStore) DeleteBySchool(ctx context.Context, schoolID int64) {
	// Delete all list caches since we can't easily identify which ones contain this school
	s.deleteAllLists(ctx)
}

// DeleteByCategory removes all item lists that might contain items from a category
func (s *ItemStore) DeleteByCategory(ctx context.Context, categoryID int64) {
	// Delete all list caches since we can't easily identify which ones contain this category
	s.deleteAllLists(ctx)
}

// DeleteByUser removes all item lists that might contain items from a user
func (s *ItemStore) DeleteByUser(ctx context.Context, userID int64) {
	// Delete all list caches since we can't easily identify which ones contain this user
	s.deleteAllLists(ctx)
}

// deleteAllLists removes all item list caches
func (s *ItemStore) deleteAllLists(ctx context.Context) {
	// Use SCAN to find all keys matching the pattern
	pattern := "cache:items:list:*"
	iter := s.rdb.Scan(ctx, 0, pattern, 0).Iterator()

	keys := []string{}
	for iter.Next(ctx) {
		keys = append(keys, iter.Val())
	}

	if len(keys) > 0 {
		s.rdb.Del(ctx, keys...)
	}
}

// GenerateListKey creates a cache key from query parameters
func GenerateListKey(params map[string]interface{}) string {
	// Convert params to JSON for consistent hashing
	jsonData, _ := json.Marshal(params)
	hash := sha256.Sum256(jsonData)
	return fmt.Sprintf("%x", hash)
}
