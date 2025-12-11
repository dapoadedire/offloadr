package store

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID            int64      `json:"id"`
	Username      string     `json:"username"`
	Email         string     `json:"email"`
	EmailVerified bool       `json:"email_verified"`
	Password      password   `json:"-"`
	Firstname     string     `json:"firstname"`
	Lastname      string     `json:"lastname"`
	SchoolID      int64      `json:"school_id"`
	IsAdmin       bool       `json:"is_admin"`
	IsActive      bool       `json:"is_active"`
	ActivatedAt   *time.Time `json:"activated_at,omitempty"`
	AvatarURL     *string    `json:"avatar_url,omitempty"`
	Phone         *string    `json:"phone,omitempty"`
	Snapchat      *string    `json:"snapchat,omitempty"`
	Whatsapp      *string    `json:"whatsapp,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	LastLoginAt   *time.Time `json:"last_login_at,omitempty"`
}

type password struct {
	text *string
	hash []byte
}

func (p *password) Set(plainText string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(plainText), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	p.text = &plainText
	p.hash = hashedPassword
	return nil
}

func (p *password) Compare(plainText string) error {
	return bcrypt.CompareHashAndPassword(p.hash, []byte(plainText))
}

type UserStore struct {
	db *sql.DB
}

func (s *UserStore) Create(ctx context.Context, user *User) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		INSERT INTO users (username, email, password, firstname, lastname, school_id)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`

	err := s.db.QueryRowContext(
		ctx,
		query,
		user.Username,
		user.Email,
		user.Password.hash,
		user.Firstname,
		user.Lastname,
		user.SchoolID,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			switch {
			case strings.Contains(pgErr.Message, "users_email_key"):
				return ErrDuplicateEmail
			case strings.Contains(pgErr.Message, "users_username_key"):
				return ErrDuplicateUsername
			case strings.Contains(pgErr.Message, "fk_school_id"):
				return ErrInvalidReference
			}
		}
		return err
	}

	return nil
}

func (s *UserStore) GetByID(ctx context.Context, id int64) (*User, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, username, email, email_verified, password, firstname, lastname,
		       school_id, is_admin, is_active, activated_at, avatar_url, phone,
		       snapchat, whatsapp, created_at, updated_at, last_login_at
		FROM users
		WHERE id = $1
	`

	user := &User{}
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.EmailVerified,
		&user.Password.hash,
		&user.Firstname,
		&user.Lastname,
		&user.SchoolID,
		&user.IsAdmin,
		&user.IsActive,
		&user.ActivatedAt,
		&user.AvatarURL,
		&user.Phone,
		&user.Snapchat,
		&user.Whatsapp,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.LastLoginAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return user, nil
}

func (s *UserStore) GetByEmail(ctx context.Context, email string) (*User, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, username, email, email_verified, password, firstname, lastname,
		       school_id, is_admin, is_active, activated_at, avatar_url, phone,
		       snapchat, whatsapp, created_at, updated_at, last_login_at
		FROM users
		WHERE email = $1
	`

	user := &User{}
	err := s.db.QueryRowContext(ctx, query, email).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.EmailVerified,
		&user.Password.hash,
		&user.Firstname,
		&user.Lastname,
		&user.SchoolID,
		&user.IsAdmin,
		&user.IsActive,
		&user.ActivatedAt,
		&user.AvatarURL,
		&user.Phone,
		&user.Snapchat,
		&user.Whatsapp,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.LastLoginAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return user, nil
}

func (s *UserStore) GetByUsername(ctx context.Context, username string) (*User, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, username, email, email_verified, password, firstname, lastname,
		       school_id, is_admin, is_active, activated_at, avatar_url, phone,
		       snapchat, whatsapp, created_at, updated_at, last_login_at
		FROM users
		WHERE username = $1
	`

	user := &User{}
	err := s.db.QueryRowContext(ctx, query, username).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.EmailVerified,
		&user.Password.hash,
		&user.Firstname,
		&user.Lastname,
		&user.SchoolID,
		&user.IsAdmin,
		&user.IsActive,
		&user.ActivatedAt,
		&user.AvatarURL,
		&user.Phone,
		&user.Snapchat,
		&user.Whatsapp,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.LastLoginAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return user, nil
}

func (s *UserStore) CheckUsernameAvailability(ctx context.Context, username string) (bool, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `SELECT EXISTS(SELECT 1 FROM users WHERE LOWER(username) = LOWER($1))`

	var exists bool
	err := s.db.QueryRowContext(ctx, query, username).Scan(&exists)
	if err != nil {
		return false, err
	}

	// Return true if username is available (does not exist)
	return !exists, nil
}

func (s *UserStore) Update(ctx context.Context, user *User) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		UPDATE users
		SET username = $1, email = $2, email_verified = $3, password = $4,
		    firstname = $5, lastname = $6, is_active = $7, activated_at = $8,
		    avatar_url = $9, phone = $10, snapchat = $11, whatsapp = $12,
		    updated_at = NOW(), last_login_at = $13
		WHERE id = $14
	`

	result, err := s.db.ExecContext(
		ctx,
		query,
		user.Username,
		user.Email,
		user.EmailVerified,
		user.Password.hash,
		user.Firstname,
		user.Lastname,
		user.IsActive,
		user.ActivatedAt,
		user.AvatarURL,
		user.Phone,
		user.Snapchat,
		user.Whatsapp,
		user.LastLoginAt,
		user.ID,
	)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			switch {
			case strings.Contains(pgErr.Message, "users_email_key"):
				return ErrDuplicateEmail
			case strings.Contains(pgErr.Message, "users_username_key"):
				return ErrDuplicateUsername
			}
		}
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

func (s *UserStore) Delete(ctx context.Context, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `DELETE FROM users WHERE id = $1`

	result, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

func (s *UserStore) Activate(ctx context.Context, token string) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		UPDATE users
		SET email_verified = true, is_active = true, activated_at = NOW(), updated_at = NOW()
		WHERE id = (
			SELECT user_id FROM password_reset
			WHERE token = $1 AND used = false AND expires_at > NOW()
		)
	`

	result, err := s.db.ExecContext(ctx, query, token)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrTokenExpired
	}

	return nil
}
