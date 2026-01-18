package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/dapoadedire/offloadr/backend/internal/store"
	"github.com/redis/go-redis/v9"
)

type ModerationStore struct {
	rdb *redis.Client
}

const ModerationExpTime = 30 * time.Minute // Moderation results are relatively stable

// GetByItemID retrieves a moderation result from cache by item ID
func (s *ModerationStore) GetByItemID(ctx context.Context, itemID int64) (*store.ModerationResult, error) {
	cacheKey := fmt.Sprintf("cache:moderation:item:%d", itemID)

	data, err := s.rdb.Get(ctx, cacheKey).Result()
	if err == redis.Nil {
		return nil, nil // Cache miss
	} else if err != nil {
		return nil, err // Redis error
	}

	var result store.ModerationResult
	if data != "" {
		err := json.Unmarshal([]byte(data), &result)
		if err != nil {
			return nil, err
		}
	}

	return &result, nil
}

// Set stores a moderation result in cache
func (s *ModerationStore) Set(ctx context.Context, result *store.ModerationResult) error {
	cacheKey := fmt.Sprintf("cache:moderation:item:%d", result.ItemID)

	jsonData, err := json.Marshal(result)
	if err != nil {
		return err
	}

	return s.rdb.SetEx(ctx, cacheKey, string(jsonData), ModerationExpTime).Err()
}

// Delete removes a moderation result from cache
func (s *ModerationStore) Delete(ctx context.Context, itemID int64) {
	cacheKey := fmt.Sprintf("cache:moderation:item:%d", itemID)
	s.rdb.Del(ctx, cacheKey)
}

// GetQueueCount gets the count of items in the moderation queue (cached)
func (s *ModerationStore) GetQueueCount(ctx context.Context, status string) (int, error) {
	cacheKey := fmt.Sprintf("cache:moderation:queue:count:%s", status)

	data, err := s.rdb.Get(ctx, cacheKey).Result()
	if err == redis.Nil {
		return -1, nil // Cache miss, return -1 to indicate need to fetch from DB
	} else if err != nil {
		return 0, err
	}

	var count int
	if err := json.Unmarshal([]byte(data), &count); err != nil {
		return 0, err
	}

	return count, nil
}

// SetQueueCount caches the moderation queue count
func (s *ModerationStore) SetQueueCount(ctx context.Context, status string, count int) error {
	cacheKey := fmt.Sprintf("cache:moderation:queue:count:%s", status)
	jsonData, _ := json.Marshal(count)
	return s.rdb.SetEx(ctx, cacheKey, string(jsonData), 5*time.Minute).Err()
}

// InvalidateQueueCount invalidates all queue count caches
func (s *ModerationStore) InvalidateQueueCount(ctx context.Context) {
	// Delete all queue count caches
	statuses := []string{"pending", "flagged", "passed", "rejected"}
	for _, status := range statuses {
		cacheKey := fmt.Sprintf("cache:moderation:queue:count:%s", status)
		s.rdb.Del(ctx, cacheKey)
	}
}
