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

func (s *WaitlistStore) Create(ctx context.Context, w *Waitlist) (int64, error) {
	query := `
	INSERT INTO waitlist (first_name, university, email)
	VALUES ($1, $2, $3)
	RETURNING 
		id,
		(SELECT COUNT(*) FROM waitlist) AS total_count
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	var totalCount int64
	err := s.db.QueryRowContext(ctx, query, w.FirstName, w.University, w.Email).Scan(&w.ID, &totalCount)
	if err != nil {
		switch {
		case strings.Contains(err.Error(), "waitlist_email_key"):
			return 0, ErrDuplicateEmail
		default:
			return 0, err
		}
	}
	return totalCount, nil
}
