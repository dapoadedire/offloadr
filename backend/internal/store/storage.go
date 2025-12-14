package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

var (
	ErrNotFound            = errors.New("resource not found")
	ErrDuplicateEmail      = errors.New("a record with this email already exists")
	ErrDuplicateUsername   = errors.New("a user with this username already exists")
	ErrRestrictedUsername  = errors.New("this username is not allowed")
	ErrDuplicateResource   = errors.New("this resource already exists")
	ErrInvalidReference    = errors.New("invalid reference to related resource")
	ErrMissingField        = errors.New("required field is missing")
	ErrConflict            = errors.New("resource was modified by another request")
	ErrSelfFollow          = errors.New("users cannot follow themselves")
	ErrInvalidCredentials  = errors.New("invalid credentials")
	ErrEmailNotVerified    = errors.New("email not verified")
	ErrTokenExpired        = errors.New("token expired")
	ErrTokenUsed           = errors.New("token already used")
	ErrInvalidToken        = errors.New("invalid token")
	ErrAccountInactive     = errors.New("account is inactive")
	ErrPasswordMismatch    = errors.New("passwords do not match")
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
		GetAll(context.Context) ([]*School, error)
	}
	Categories interface {
		GetByID(context.Context, int64) (*Category, error)
		GetAll(context.Context) ([]*Category, error)
		GetSubCategories(context.Context, int64) ([]*Category, error)
	}
	Items interface {
		Create(context.Context, *Item) error
		GetByID(context.Context, int64) (*Item, error)
		GetByIDWithDetails(context.Context, int64) (*ItemWithDetails, error)
		GetAll(context.Context, ItemsFilterQuery) ([]*ItemWithDetails, int, error)
		Update(context.Context, *Item) error
		UpdateStatus(context.Context, int64, ItemStatus) error
		MarkAsSold(context.Context, int64, *int64) error
		IncrementViews(context.Context, int64) error
		Delete(context.Context, int64) error
		GetRelated(context.Context, int64, int64, int) ([]*ItemWithDetails, error)
		GetItemPhotos(context.Context, int64) ([]*ItemPhoto, error)
		CreatePhoto(context.Context, *ItemPhoto) error
		DeletePhoto(context.Context, int64) error
		GetPhotoByID(context.Context, int64) (*ItemPhoto, error)
		SetPrimaryPhoto(context.Context, int64, int64) error
	}
	Favorites interface {
		Add(context.Context, int64, int64) (*Favorite, error)
		Remove(context.Context, int64, int64) error
		GetUserFavorites(context.Context, int64, int, int) ([]*ItemWithDetails, int, error)
		CheckFavorite(context.Context, int64, int64) (bool, error)
	}
	Reviews interface {
		Create(context.Context, *Review) error
		GetByID(context.Context, int64) (*ReviewWithDetails, error)
		Update(context.Context, *Review) error
		Delete(context.Context, int64) error
		GetItemReviews(context.Context, int64, int, int) ([]*ReviewWithDetails, int, error)
		GetSellerReviews(context.Context, int64, int, int) ([]*ReviewWithDetails, int, error)
		GetSellerRating(context.Context, int64) (*SellerRating, error)
	}
	Reports interface {
		Create(context.Context, *Report) error
		GetUserReports(context.Context, int64, int, int) ([]*Report, int, error)
	}
	Users interface {
		Create(context.Context, *User) error
		GetByID(context.Context, int64) (*User, error)
		GetByEmail(context.Context, string) (*User, error)
		GetByUsername(context.Context, string) (*User, error)
		CheckUsernameAvailability(context.Context, string) (bool, error)
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
		Categories:      &CategoryStore{db: db},
		Items:           &ItemStore{db: db},
		Favorites:       &FavoriteStore{db: db},
		Reviews:         &ReviewStore{db: db},
		Reports:         &ReportStore{db: db},
		Users:           &UserStore{db: db},
		PasswordResets:  &PasswordResetStore{db: db},
		UserInvitations: &UserInvitationStore{db: db},
	}
}
