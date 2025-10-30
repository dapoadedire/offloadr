-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS item_photos (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    position INTEGER NOT NULL DEFAULT 0,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_item_photos_item_id ON item_photos(item_id);
CREATE INDEX IF NOT EXISTS idx_item_photos_item_position ON item_photos(item_id, position);

-- Add constraint to ensure only one primary photo per item
CREATE UNIQUE INDEX IF NOT EXISTS idx_item_photos_primary 
    ON item_photos(item_id) 
    WHERE is_primary = true;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS item_photos;
-- +goose StatementEnd
