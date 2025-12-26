-- +goose Up
-- +goose StatementBegin
INSERT INTO categories (name, slug, description, icon) VALUES
-- Study & School Supplies
('Study Materials', 'study-materials', 'Notebooks, stationery, calculators, and academic supplies', 'BookOpen'),

-- Dorm & Living
('Dorm Essentials', 'dorm-essentials', 'Bedding, storage, decor, and room supplies', 'Home'),

-- Personal Care & Beauty
('Health & Beauty', 'health-beauty', 'Personal care products, cosmetics, and grooming items', 'Heart'),

-- Entertainment & Media
('Entertainment', 'entertainment', 'Games, movies, music, and hobby items', 'Gamepad2'),

-- Bikes & Transportation
('Transportation', 'transportation', 'Bicycles, scooters, and accessories', 'Bike'),

-- Food & Cooking
('Food & Cooking', 'food-cooking', 'Kitchen gadgets, meal prep containers, and small appliances', 'Utensils'),

-- Accessories & Jewelry
('Accessories', 'accessories', 'Bags, jewelry, watches, and fashion accessories', 'Watch'),

-- Tickets & Events
('Tickets & Events', 'tickets-events', 'Event tickets, parking passes, and memberships', 'Ticket')
ON CONFLICT (slug) DO NOTHING;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM categories WHERE slug IN (
    'study-materials',
    'dorm-essentials',
    'health-beauty',
    'entertainment',
    'transportation',
    'food-cooking',
    'accessories',
    'tickets-events'
);
-- +goose StatementEnd