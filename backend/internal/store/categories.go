package store

import (
	"context"
	"database/sql"
	"time"
)

type Category struct {
	ID          int64      `json:"id"`
	Name        string     `json:"name"`
	Slug        string     `json:"slug"`
	Description *string    `json:"description,omitempty"`
	Icon        *string    `json:"icon,omitempty"`
	ParentID    *int64     `json:"parent_id,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	SubCategories []*Category `json:"subcategories,omitempty"`
}

type CategoryStore struct {
	db *sql.DB
}

func (s *CategoryStore) GetByID(ctx context.Context, id int64) (*Category, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, name, slug, description, icon, parent_id, created_at
		FROM categories
		WHERE id = $1
	`

	category := &Category{}
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&category.ID,
		&category.Name,
		&category.Slug,
		&category.Description,
		&category.Icon,
		&category.ParentID,
		&category.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	// If this is a parent category, fetch subcategories
	if category.ParentID == nil {
		subcategories, err := s.GetSubCategories(ctx, category.ID)
		if err != nil {
			return nil, err
		}
		category.SubCategories = subcategories
	}

	return category, nil
}

func (s *CategoryStore) GetAll(ctx context.Context) ([]*Category, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	// Get all parent categories
	query := `
		SELECT id, name, slug, description, icon, parent_id, created_at
		FROM categories
		WHERE parent_id IS NULL
		ORDER BY name ASC
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	categories := []*Category{}
	for rows.Next() {
		category := &Category{}
		err := rows.Scan(
			&category.ID,
			&category.Name,
			&category.Slug,
			&category.Description,
			&category.Icon,
			&category.ParentID,
			&category.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Fetch subcategories for each parent
		subcategories, err := s.GetSubCategories(ctx, category.ID)
		if err != nil {
			return nil, err
		}
		category.SubCategories = subcategories

		categories = append(categories, category)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return categories, nil
}

func (s *CategoryStore) GetSubCategories(ctx context.Context, parentID int64) ([]*Category, error) {
	query := `
		SELECT id, name, slug, description, icon, parent_id, created_at
		FROM categories
		WHERE parent_id = $1
		ORDER BY name ASC
	`

	rows, err := s.db.QueryContext(ctx, query, parentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	subcategories := []*Category{}
	for rows.Next() {
		category := &Category{}
		err := rows.Scan(
			&category.ID,
			&category.Name,
			&category.Slug,
			&category.Description,
			&category.Icon,
			&category.ParentID,
			&category.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		subcategories = append(subcategories, category)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return subcategories, nil
}
