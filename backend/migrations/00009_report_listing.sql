-- +goose Up
-- +goose StatementBegin
-- Create enum types for reports
CREATE TYPE report_type AS ENUM ('scam', 'inappropriate', 'spam', 'sold', 'wrong_category', 'duplicate', 'other');
CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');

CREATE TABLE IF NOT EXISTS report_listing (
    id BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    report_type report_type NOT NULL,
    comment TEXT,
    status report_status NOT NULL DEFAULT 'pending',
    resolved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_report_listing_item_id ON report_listing(item_id);
CREATE INDEX IF NOT EXISTS idx_report_listing_reporter_id ON report_listing(reporter_id);
CREATE INDEX IF NOT EXISTS idx_report_listing_status ON report_listing(status);
CREATE INDEX IF NOT EXISTS idx_report_listing_created_at ON report_listing(created_at DESC);

-- Composite index for pending reports
CREATE INDEX IF NOT EXISTS idx_report_listing_status_created 
    ON report_listing(status, created_at DESC) 
    WHERE status = 'pending';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS report_listing;
DROP TYPE IF EXISTS report_type;
DROP TYPE IF EXISTS report_status;
-- +goose StatementEnd
