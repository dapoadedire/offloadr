package store

import (
	"context"
	"database/sql"
	"time"
)

type School struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Domain    string    `json:"domain"`
	Location  string    `json:"location"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type SchoolStore struct {
	db *sql.DB
}

func (s *SchoolStore) GetByID(ctx context.Context, id int64) (*School, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, name, domain, location, is_active, created_at, updated_at
		FROM schools
		WHERE id = $1
	`

	school := &School{}
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&school.ID,
		&school.Name,
		&school.Domain,
		&school.Location,
		&school.IsActive,
		&school.CreatedAt,
		&school.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return school, nil
}

func (s *SchoolStore) GetByDomain(ctx context.Context, domain string) (*School, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, name, domain, location, is_active, created_at, updated_at
		FROM schools
		WHERE domain = $1
	`

	school := &School{}
	err := s.db.QueryRowContext(ctx, query, domain).Scan(
		&school.ID,
		&school.Name,
		&school.Domain,
		&school.Location,
		&school.IsActive,
		&school.CreatedAt,
		&school.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return school, nil
}

func (s *SchoolStore) GetAll(ctx context.Context) ([]*School, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, name, domain, location, is_active, created_at, updated_at
		FROM schools
		WHERE is_active = true
		ORDER BY name ASC
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	schools := []*School{}
	for rows.Next() {
		school := &School{}
		err := rows.Scan(
			&school.ID,
			&school.Name,
			&school.Domain,
			&school.Location,
			&school.IsActive,
			&school.CreatedAt,
			&school.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		schools = append(schools, school)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return schools, nil
}
