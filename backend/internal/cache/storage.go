package cache

import (
	"context"

	"github.com/dapoadedire/offloadr/backend/internal/store"
	"github.com/redis/go-redis/v9"
)

// Storage aggregates all cache stores into a single interface
type Storage struct {
	Schools interface {
		Get(context.Context, int64) (*store.School, error)
		GetAll(context.Context) ([]*store.School, error)
		Set(context.Context, *store.School) error
		SetAll(context.Context, []*store.School) error
		Delete(context.Context, int64)
		DeleteAll(context.Context)
	}
	Categories interface {
		Get(context.Context, int64) (*store.Category, error)
		GetAll(context.Context) ([]*store.Category, error)
		Set(context.Context, *store.Category) error
		SetAll(context.Context, []*store.Category) error
		Delete(context.Context, int64)
		DeleteAll(context.Context)
	}
	Items interface {
		Get(context.Context, int64) (*store.ItemWithDetails, error)
		GetList(context.Context, string) ([]*store.ItemWithDetails, int, error)
		Set(context.Context, *store.ItemWithDetails) error
		SetList(context.Context, string, []*store.ItemWithDetails, int) error
		Delete(context.Context, int64)
		DeleteList(context.Context, string)
		DeleteBySchool(context.Context, int64)
		DeleteByCategory(context.Context, int64)
		DeleteByUser(context.Context, int64)
	}
	Users interface {
		Get(context.Context, int64) (*store.User, error)
		Set(context.Context, *store.User) error
		Delete(context.Context, int64)
	}
	Ratings interface {
		Get(context.Context, int64) (*store.SellerRating, error)
		Set(context.Context, *store.SellerRating) error
		Delete(context.Context, int64)
	}
}

// NewRedisStorage creates a new cache storage backed by Redis
func NewRedisStorage(rdb *redis.Client) Storage {
	return Storage{
		Schools:    &SchoolStore{rdb: rdb},
		Categories: &CategoryStore{rdb: rdb},
		Items:      &ItemStore{rdb: rdb},
		Users:      &UserStore{rdb: rdb},
		Ratings:    &RatingStore{rdb: rdb},
	}
}
