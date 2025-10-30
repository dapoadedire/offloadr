-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    parent_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Insert initial categories
INSERT INTO categories (name, slug, description, icon) VALUES
    ('Electronics', 'electronics', 'Phones, laptops, tablets, and accessories', '📱'),
    ('Textbooks', 'textbooks', 'Course materials and academic books', '📚'),
    ('Furniture', 'furniture', 'Desks, chairs, beds, and room decor', '🪑'),
    ('Clothing', 'clothing', 'Apparel and accessories', '👕'),
    ('Sports & Fitness', 'sports-fitness', 'Sports equipment and fitness gear', '⚽'),
    ('Kitchen & Appliances', 'kitchen-appliances', 'Kitchen items and small appliances', '🍳'),
    ('Other', 'other', 'Everything else', '📦')
ON CONFLICT (slug) DO NOTHING;

-- Insert subcategories for Electronics
INSERT INTO categories (name, slug, description, parent_id) 
SELECT 'Laptops', 'laptops', 'Laptop computers', id FROM categories WHERE slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, description, parent_id) 
SELECT 'Phones', 'phones', 'Mobile phones and smartphones', id FROM categories WHERE slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, description, parent_id) 
SELECT 'Accessories', 'accessories', 'Tech accessories and peripherals', id FROM categories WHERE slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS categories;
-- +goose StatementEnd
