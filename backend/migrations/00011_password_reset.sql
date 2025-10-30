-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS password_reset (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires_at ON password_reset(expires_at);

-- Index for finding valid unused tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_valid 
    ON password_reset(token, expires_at) 
    WHERE used = false;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS password_reset;
-- +goose StatementEnd
