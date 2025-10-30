package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

var (
	ErrNotFound           = errors.New("resource not found")
	ErrDuplicateEmail     = errors.New("a record with this email already exists")
	ErrDuplicateUsername  = errors.New("a user with this username already exists")
	ErrDuplicateResource  = errors.New("this resource already exists")
	ErrInvalidReference   = errors.New("invalid reference to related resource")
	ErrMissingField       = errors.New("required field is missing")
	ErrConflict           = errors.New("resource was modified by another request")
	ErrSelfFollow         = errors.New("users cannot follow themselves")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrEmailNotVerified   = errors.New("email not verified")
	ErrTokenExpired       = errors.New("token expired")
	ErrTokenUsed          = errors.New("token already used")
	ErrInvalidToken       = errors.New("invalid token")
	ErrAccountInactive    = errors.New("account is inactive")
	ErrPasswordMismatch   = errors.New("passwords do not match")
	ErrEmailDomainMismatch = errors.New("email domain does not match school")

	QueryTimeoutDuration = time.Second * 5
)

type Storage struct {
	Waitlist interface {
		Create(context.Context, *Waitlist) (int64, error)
	}
	Schools interface {
		GetByID(context.Context, int64) (*School, error)
		GetByDomain(context.Context, string) (*School, error)
	}
	Users interface {
		Create(context.Context, *User) error
		GetByID(context.Context, int64) (*User, error)
		GetByEmail(context.Context, string) (*User, error)
		GetByUsername(context.Context, string) (*User, error)
		Update(context.Context, *User) error
		Delete(context.Context, int64) error
		Activate(context.Context, string) error
	}
	PasswordResets interface {
		Create(context.Context, *PasswordReset) error
		GetByToken(context.Context, string) (*PasswordReset, error)
		MarkAsUsed(context.Context, string) error
		DeleteForUser(context.Context, int64) error
	}
	UserInvitations interface {
		Create(context.Context, *UserInvitation) error
		GetByToken(context.Context, string) (*UserInvitation, error)
		MarkAsUsed(context.Context, string) error
		DeleteForUser(context.Context, int64) error
	}
}

func NewStorage(db *sql.DB) Storage {
	return Storage{
		Waitlist:        &WaitlistStore{db: db},
		Schools:         &SchoolStore{db: db},
		Users:           &UserStore{db: db},
		PasswordResets:  &PasswordResetStore{db: db},
		UserInvitations: &UserInvitationStore{db: db},
	}
}
