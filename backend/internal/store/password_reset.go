package store

import (
	"context"
	"database/sql"
	"time"
)

type PasswordReset struct {
	ID        int64     `json:"id"`
	Token     string    `json:"token"`
	UserID    int64     `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
	Used      bool      `json:"used"`
}

type PasswordResetStore struct {
	db *sql.DB
}

func (s *PasswordResetStore) Create(ctx context.Context, pr *PasswordReset) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		INSERT INTO password_reset (token, user_id, expires_at)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`

	err := s.db.QueryRowContext(
		ctx,
		query,
		pr.Token,
		pr.UserID,
		pr.ExpiresAt,
	).Scan(&pr.ID, &pr.CreatedAt)

	return err
}

func (s *PasswordResetStore) GetByToken(ctx context.Context, token string) (*PasswordReset, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, token, user_id, created_at, expires_at, used
		FROM password_reset
		WHERE token = $1 AND used = false AND expires_at > NOW()
	`

	pr := &PasswordReset{}
	err := s.db.QueryRowContext(ctx, query, token).Scan(
		&pr.ID,
		&pr.Token,
		&pr.UserID,
		&pr.CreatedAt,
		&pr.ExpiresAt,
		&pr.Used,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrTokenExpired
		}
		return nil, err
	}

	return pr, nil
}

func (s *PasswordResetStore) MarkAsUsed(ctx context.Context, token string) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		UPDATE password_reset
		SET used = true
		WHERE token = $1
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
		return ErrNotFound
	}

	return nil
}

func (s *PasswordResetStore) DeleteForUser(ctx context.Context, userID int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		DELETE FROM password_reset
		WHERE user_id = $1
	`

	_, err := s.db.ExecContext(ctx, query, userID)
	return err
}
