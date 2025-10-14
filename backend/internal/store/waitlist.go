package store

import (
	"context"
	"database/sql"
	"strings"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type Waitlist struct {
	ID         int64  `json:"id"`
	FirstName  string `json:"first_name"`
	University string `json:"university"`
	Email      string `json:"email"`
}

type WaitlistStore struct {
	db *sql.DB
}

func (s *WaitlistStore) Create(ctx context.Context, w *Waitlist) error {
	query := `
		INSERT INTO waitlist (first_name, university, email)
		VALUES ($1, $2, $3)
		RETURNING id
	`
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := s.db.QueryRowContext(ctx, query, w.FirstName, w.University, w.Email).Scan(&w.ID)
	if err != nil {
		switch {
		case strings.Contains(err.Error(), "waitlist_email_key"):
			return ErrDuplicateEmail
		default:
			return err
		}
	}
	return nil
}

func (s *WaitlistStore) GetTotalCount(ctx context.Context) (int64, error) {
	query := `
		SELECT COUNT(*) FROM waitlist
	`
	var count int64
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := s.db.QueryRowContext(ctx, query).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}
