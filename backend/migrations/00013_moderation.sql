-- +goose Up
-- +goose StatementBegin

-- Moderation results for each item
CREATE TABLE IF NOT EXISTS moderation_results (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,

    -- Overall result
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, passed, flagged, rejected
    confidence_score DECIMAL(5,4), -- 0.0000 to 1.0000

    -- Flags
    flagged_inappropriate BOOLEAN DEFAULT FALSE,
    flagged_scam BOOLEAN DEFAULT FALSE,
    flagged_prohibited BOOLEAN DEFAULT FALSE,
    flagged_price_anomaly BOOLEAN DEFAULT FALSE,
    flagged_contact_leak BOOLEAN DEFAULT FALSE,
    flagged_condition_mismatch BOOLEAN DEFAULT FALSE,

    -- AI analysis
    ai_explanation TEXT, -- Human-readable explanation
    ai_suggested_condition VARCHAR(20), -- new, like_new, good, fair, poor
    ai_category_match BOOLEAN,
    ai_raw_response JSONB, -- Full Gemini response for debugging

    -- Review
    reviewed_by BIGINT REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_decision VARCHAR(20), -- approved, rejected
    review_notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual image analysis results
CREATE TABLE IF NOT EXISTS image_moderation (
    id BIGSERIAL PRIMARY KEY,
    photo_id BIGINT NOT NULL REFERENCES item_photos(id) ON DELETE CASCADE,
    moderation_result_id BIGINT NOT NULL REFERENCES moderation_results(id) ON DELETE CASCADE,

    is_appropriate BOOLEAN,
    is_stock_photo BOOLEAN,
    is_duplicate BOOLEAN,
    matches_description BOOLEAN,
    detected_objects JSONB, -- ["laptop", "charger", "case"]
    confidence_score DECIMAL(5,4),
    ai_notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Moderation appeals
CREATE TABLE IF NOT EXISTS moderation_appeals (
    id BIGSERIAL PRIMARY KEY,
    moderation_result_id BIGINT NOT NULL REFERENCES moderation_results(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, denied

    resolved_by BIGINT REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics aggregation
CREATE TABLE IF NOT EXISTS moderation_analytics (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    school_id BIGINT REFERENCES schools(id),

    total_scanned INTEGER DEFAULT 0,
    auto_approved INTEGER DEFAULT 0,
    flagged_for_review INTEGER DEFAULT 0,
    rejected INTEGER DEFAULT 0,
    appeals_submitted INTEGER DEFAULT 0,
    appeals_approved INTEGER DEFAULT 0,

    -- Breakdown by flag type
    flagged_inappropriate INTEGER DEFAULT 0,
    flagged_scam INTEGER DEFAULT 0,
    flagged_prohibited INTEGER DEFAULT 0,
    flagged_price INTEGER DEFAULT 0,

    UNIQUE(date, school_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_moderation_results_status ON moderation_results(status);
CREATE INDEX IF NOT EXISTS idx_moderation_results_item ON moderation_results(item_id);
CREATE INDEX IF NOT EXISTS idx_moderation_results_created ON moderation_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_results_flagged ON moderation_results(status) WHERE status = 'flagged';
CREATE INDEX IF NOT EXISTS idx_image_moderation_result ON image_moderation(moderation_result_id);
CREATE INDEX IF NOT EXISTS idx_image_moderation_photo ON image_moderation(photo_id);
CREATE INDEX IF NOT EXISTS idx_moderation_appeals_status ON moderation_appeals(status);
CREATE INDEX IF NOT EXISTS idx_moderation_appeals_user ON moderation_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_analytics_date ON moderation_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_analytics_school ON moderation_analytics(school_id);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS moderation_analytics;
DROP TABLE IF EXISTS moderation_appeals;
DROP TABLE IF EXISTS image_moderation;
DROP TABLE IF EXISTS moderation_results;
-- +goose StatementEnd
