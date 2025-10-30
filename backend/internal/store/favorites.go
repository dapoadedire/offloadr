package store

import (
	"context"
	"database/sql"
	"time"
)

type Favorite struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	ItemID    int64     `json:"item_id"`
	CreatedAt time.Time `json:"created_at"`
}

type FavoriteStore struct {
	db *sql.DB
}

func (s *FavoriteStore) Add(ctx context.Context, userID, itemID int64) (*Favorite, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		INSERT INTO favorites (user_id, item_id)
		VALUES ($1, $2)
		RETURNING id, created_at
	`

	favorite := &Favorite{
		UserID: userID,
		ItemID: itemID,
	}

	err := s.db.QueryRowContext(ctx, query, userID, itemID).Scan(
		&favorite.ID,
		&favorite.CreatedAt,
	)

	if err != nil {
		// Check for duplicate
		if err.Error() == "pq: duplicate key value violates unique constraint \"idx_favorites_user_item\"" {
			return nil, ErrDuplicateResource
		}
		return nil, err
	}

	return favorite, nil
}

func (s *FavoriteStore) Remove(ctx context.Context, userID, itemID int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `DELETE FROM favorites WHERE user_id = $1 AND item_id = $2`

	result, err := s.db.ExecContext(ctx, query, userID, itemID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return ErrNotFound
	}

	return nil
}

func (s *FavoriteStore) GetUserFavorites(ctx context.Context, userID int64, limit, offset int) ([]*ItemWithDetails, int, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	// Get total count
	countQuery := `
		SELECT COUNT(*)
		FROM favorites f
		INNER JOIN items i ON f.item_id = i.id
		WHERE f.user_id = $1 AND i.status = 'published'
	`

	var total int
	err := s.db.QueryRowContext(ctx, countQuery, userID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get favorites with item details
	query := `
		SELECT
			i.id, i.title, i.description, i.price, i.condition, i.category_id, i.user_id, i.buyer_id,
			i.school_id, i.negotiable, i.status, i.location, i.views_count, i.expires_at,
			i.created_at, i.updated_at, i.sold_at,
			c.id, c.name, c.slug, c.description, c.icon, c.parent_id, c.created_at,
			u.id, u.username, u.firstname, u.lastname, u.avatar_url,
			s.id, s.name, s.domain, s.location, s.is_active, s.created_at, s.updated_at,
			f.created_at as favorited_at
		FROM favorites f
		INNER JOIN items i ON f.item_id = i.id
		LEFT JOIN categories c ON i.category_id = c.id
		LEFT JOIN users u ON i.user_id = u.id
		LEFT JOIN schools s ON i.school_id = s.id
		WHERE f.user_id = $1 AND i.status = 'published'
		ORDER BY f.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := []*ItemWithDetails{}
	for rows.Next() {
		itemWithDetails := &ItemWithDetails{
			Category: &Category{},
			Seller:   &PublicUser{},
			School:   &School{},
		}

		var categoryDesc, categoryIcon *string
		var categoryParentID *int64
		var categoryCreatedAt time.Time
		var favoritedAt time.Time

		err := rows.Scan(
			&itemWithDetails.ID,
			&itemWithDetails.Title,
			&itemWithDetails.Description,
			&itemWithDetails.Price,
			&itemWithDetails.Condition,
			&itemWithDetails.CategoryID,
			&itemWithDetails.UserID,
			&itemWithDetails.BuyerID,
			&itemWithDetails.SchoolID,
			&itemWithDetails.Negotiable,
			&itemWithDetails.Status,
			&itemWithDetails.Location,
			&itemWithDetails.ViewsCount,
			&itemWithDetails.ExpiresAt,
			&itemWithDetails.CreatedAt,
			&itemWithDetails.UpdatedAt,
			&itemWithDetails.SoldAt,
			&itemWithDetails.Category.ID,
			&itemWithDetails.Category.Name,
			&itemWithDetails.Category.Slug,
			&categoryDesc,
			&categoryIcon,
			&categoryParentID,
			&categoryCreatedAt,
			&itemWithDetails.Seller.ID,
			&itemWithDetails.Seller.Username,
			&itemWithDetails.Seller.Firstname,
			&itemWithDetails.Seller.Lastname,
			&itemWithDetails.Seller.AvatarURL,
			&itemWithDetails.School.ID,
			&itemWithDetails.School.Name,
			&itemWithDetails.School.Domain,
			&itemWithDetails.School.Location,
			&itemWithDetails.School.IsActive,
			&itemWithDetails.School.CreatedAt,
			&itemWithDetails.School.UpdatedAt,
			&favoritedAt,
		)

		if err != nil {
			return nil, 0, err
		}

		itemWithDetails.Category.Description = categoryDesc
		itemWithDetails.Category.Icon = categoryIcon
		itemWithDetails.Category.ParentID = categoryParentID
		itemWithDetails.Category.CreatedAt = categoryCreatedAt

		items = append(items, itemWithDetails)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (s *FavoriteStore) CheckFavorite(ctx context.Context, userID, itemID int64) (bool, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `SELECT EXISTS(SELECT 1 FROM favorites WHERE user_id = $1 AND item_id = $2)`

	var exists bool
	err := s.db.QueryRowContext(ctx, query, userID, itemID).Scan(&exists)
	if err != nil {
		return false, err
	}

	return exists, nil
}
