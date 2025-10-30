-- +goose Up
-- +goose StatementBegin
-- Create enum types for items
CREATE TYPE item_status AS ENUM ('draft', 'published', 'sold', 'archived', 'flagged');
CREATE TYPE item_condition AS ENUM ('new', 'like_new', 'good', 'fair', 'poor');

CREATE TABLE IF NOT EXISTS items (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    condition item_condition NOT NULL,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buyer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    school_id BIGINT NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    negotiable BOOLEAN NOT NULL DEFAULT true,
    status item_status NOT NULL DEFAULT 'draft',
    location VARCHAR(255) NOT NULL,
    views_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sold_at TIMESTAMPTZ
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_buyer_id ON items(buyer_id);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_school_id ON items(school_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_price ON items(price);

-- Composite index for common queries (active items by school)
CREATE INDEX IF NOT EXISTS idx_items_school_status ON items(school_id, status) WHERE status = 'published';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS items;
DROP TYPE IF EXISTS item_status;
DROP TYPE IF EXISTS item_condition;
-- +goose StatementEnd
