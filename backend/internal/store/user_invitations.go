package store

import (
	"context"
	"database/sql"
	"time"
)

type UserInvitation struct {
	ID        int64     `json:"id"`
	Token     string    `json:"token"`
	UserID    int64     `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
	Used      bool      `json:"used"`
}

type UserInvitationStore struct {
	db *sql.DB
}

func (s *UserInvitationStore) Create(ctx context.Context, ui *UserInvitation) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		INSERT INTO user_invitations (token, user_id, expires_at)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`

	err := s.db.QueryRowContext(
		ctx,
		query,
		ui.Token,
		ui.UserID,
		ui.ExpiresAt,
	).Scan(&ui.ID, &ui.CreatedAt)

	return err
}

func (s *UserInvitationStore) GetByToken(ctx context.Context, token string) (*UserInvitation, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, token, user_id, created_at, expires_at, used
		FROM user_invitations
		WHERE token = $1 AND used = false AND expires_at > NOW()
	`

	ui := &UserInvitation{}
	err := s.db.QueryRowContext(ctx, query, token).Scan(
		&ui.ID,
		&ui.Token,
		&ui.UserID,
		&ui.CreatedAt,
		&ui.ExpiresAt,
		&ui.Used,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrTokenExpired
		}
		return nil, err
	}

	return ui, nil
}

func (s *UserInvitationStore) MarkAsUsed(ctx context.Context, token string) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		UPDATE user_invitations
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

func (s *UserInvitationStore) DeleteForUser(ctx context.Context, userID int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		DELETE FROM user_invitations
		WHERE user_id = $1
	`

	_, err := s.db.ExecContext(ctx, query, userID)
	return err
}
