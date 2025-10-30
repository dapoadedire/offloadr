-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS schools (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    domain VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_schools_domain ON schools(domain);
CREATE INDEX IF NOT EXISTS idx_schools_is_active ON schools(is_active);

-- Insert initial school
INSERT INTO schools (name, domain, location) VALUES
    ('Obafemi Awolowo University', 'oauife.edu.ng', 'Ile-Ife, Osun State, Nigeria')
ON CONFLICT (domain) DO NOTHING;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS schools;
-- +goose StatementEnd
