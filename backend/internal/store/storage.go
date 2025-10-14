package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

var (
	ErrNotFound          = errors.New("resource not found")
	ErrDuplicateEmail    = errors.New("a record with this email already exists")
	ErrDuplicateResource = errors.New("this resource already exists")
	ErrInvalidReference  = errors.New("invalid reference to related resource")
	ErrMissingField      = errors.New("required field is missing")
	ErrConflict          = errors.New("resource was modified by another request")
	ErrSelfFollow        = errors.New("users cannot follow themselves")

	QueryTimeoutDuration = time.Second * 5
)

type Storage struct {
	Waitlist interface {
		Create(context.Context, *Waitlist) (int64, error)
	}
}

func NewStorage(db *sql.DB) Storage {
	return Storage{
		Waitlist: &WaitlistStore{db: db},
	}
}
