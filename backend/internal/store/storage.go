package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)


var (
	ErrNotFound          = errors.New("resource not found")
	ErrDuplicateUsername = errors.New("a user with this username already exists")
	ErrDuplicateEmail    = errors.New("a user with this email already exists")
	ErrDuplicateResource = errors.New("this resource already exists")
	ErrInvalidReference  = errors.New("invalid reference to related resource")
	ErrMissingField      = errors.New("required field is missing")
	ErrConflict          = errors.New("resource was modified by another request")
	ErrSelfFollow        = errors.New("users cannot follow themselves")

	QueryTimeoutDuration = time.Second * 5
)

type Storage struct {
	Waitlist interface {
		Create(context.Context, *Waitlist) error
		GetTotalCount(context.Context) (int64, error)
	}
}

func NewStorage(db *sql.DB) Storage {
	return Storage{
		Waitlist: &WaitlistStore{db: db},
	}
}
