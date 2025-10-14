-- +goose Up
-- +goose StatementBegin
-- First enable the citext extension if not already enabled
CREATE EXTENSION IF NOT EXISTS citext;

-- Now create the waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    university TEXT NOT NULL,
    email CITEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an index on the email column for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS waitlist;
-- +goose StatementEnd
