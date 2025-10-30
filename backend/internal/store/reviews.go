package store

import (
	"context"
	"database/sql"
	"time"
)

type Review struct {
	ID         int64     `json:"id"`
	ReviewerID int64     `json:"reviewer_id"`
	SellerID   int64     `json:"seller_id"`
	ItemID     int64     `json:"item_id"`
	Rating     int       `json:"rating"`
	Comment    *string   `json:"comment,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type ReviewWithDetails struct {
	Review
	Reviewer *PublicUser `json:"reviewer"`
	Item     *Item       `json:"item,omitempty"`
}

type SellerRating struct {
	SellerID      int64   `json:"seller_id"`
	AverageRating float64 `json:"average_rating"`
	TotalReviews  int     `json:"total_reviews"`
	RatingCounts  map[int]int `json:"rating_counts"` // e.g., {5: 10, 4: 5, 3: 2, 2: 1, 1: 0}
}

type ReviewStore struct {
	db *sql.DB
}

func (s *ReviewStore) Create(ctx context.Context, review *Review) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		INSERT INTO reviews (reviewer_id, seller_id, item_id, rating, comment)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`

	err := s.db.QueryRowContext(
		ctx, query,
		review.ReviewerID,
		review.SellerID,
		review.ItemID,
		review.Rating,
		review.Comment,
	).Scan(&review.ID, &review.CreatedAt, &review.UpdatedAt)

	return err
}

func (s *ReviewStore) GetByID(ctx context.Context, id int64) (*ReviewWithDetails, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT
			r.id, r.reviewer_id, r.seller_id, r.item_id, r.rating, r.comment,
			r.created_at, r.updated_at,
			u.id, u.username, u.firstname, u.lastname, u.avatar_url
		FROM reviews r
		LEFT JOIN users u ON r.reviewer_id = u.id
		WHERE r.id = $1
	`

	reviewWithDetails := &ReviewWithDetails{
		Reviewer: &PublicUser{},
	}

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&reviewWithDetails.ID,
		&reviewWithDetails.ReviewerID,
		&reviewWithDetails.SellerID,
		&reviewWithDetails.ItemID,
		&reviewWithDetails.Rating,
		&reviewWithDetails.Comment,
		&reviewWithDetails.CreatedAt,
		&reviewWithDetails.UpdatedAt,
		&reviewWithDetails.Reviewer.ID,
		&reviewWithDetails.Reviewer.Username,
		&reviewWithDetails.Reviewer.Firstname,
		&reviewWithDetails.Reviewer.Lastname,
		&reviewWithDetails.Reviewer.AvatarURL,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return reviewWithDetails, nil
}

func (s *ReviewStore) Update(ctx context.Context, review *Review) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		UPDATE reviews
		SET rating = $1, comment = $2, updated_at = NOW()
		WHERE id = $3
	`

	result, err := s.db.ExecContext(ctx, query, review.Rating, review.Comment, review.ID)
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

func (s *ReviewStore) Delete(ctx context.Context, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `DELETE FROM reviews WHERE id = $1`

	result, err := s.db.ExecContext(ctx, query, id)
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

func (s *ReviewStore) GetItemReviews(ctx context.Context, itemID int64, limit, offset int) ([]*ReviewWithDetails, int, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	// Get total count
	countQuery := `SELECT COUNT(*) FROM reviews WHERE item_id = $1`

	var total int
	err := s.db.QueryRowContext(ctx, countQuery, itemID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get reviews
	query := `
		SELECT
			r.id, r.reviewer_id, r.seller_id, r.item_id, r.rating, r.comment,
			r.created_at, r.updated_at,
			u.id, u.username, u.firstname, u.lastname, u.avatar_url
		FROM reviews r
		LEFT JOIN users u ON r.reviewer_id = u.id
		WHERE r.item_id = $1
		ORDER BY r.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.QueryContext(ctx, query, itemID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	reviews := []*ReviewWithDetails{}
	for rows.Next() {
		reviewWithDetails := &ReviewWithDetails{
			Reviewer: &PublicUser{},
		}

		err := rows.Scan(
			&reviewWithDetails.ID,
			&reviewWithDetails.ReviewerID,
			&reviewWithDetails.SellerID,
			&reviewWithDetails.ItemID,
			&reviewWithDetails.Rating,
			&reviewWithDetails.Comment,
			&reviewWithDetails.CreatedAt,
			&reviewWithDetails.UpdatedAt,
			&reviewWithDetails.Reviewer.ID,
			&reviewWithDetails.Reviewer.Username,
			&reviewWithDetails.Reviewer.Firstname,
			&reviewWithDetails.Reviewer.Lastname,
			&reviewWithDetails.Reviewer.AvatarURL,
		)

		if err != nil {
			return nil, 0, err
		}

		reviews = append(reviews, reviewWithDetails)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, err
	}

	return reviews, total, nil
}

func (s *ReviewStore) GetSellerReviews(ctx context.Context, sellerID int64, limit, offset int) ([]*ReviewWithDetails, int, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	// Get total count
	countQuery := `SELECT COUNT(*) FROM reviews WHERE seller_id = $1`

	var total int
	err := s.db.QueryRowContext(ctx, countQuery, sellerID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get reviews
	query := `
		SELECT
			r.id, r.reviewer_id, r.seller_id, r.item_id, r.rating, r.comment,
			r.created_at, r.updated_at,
			u.id, u.username, u.firstname, u.lastname, u.avatar_url
		FROM reviews r
		LEFT JOIN users u ON r.reviewer_id = u.id
		WHERE r.seller_id = $1
		ORDER BY r.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.QueryContext(ctx, query, sellerID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	reviews := []*ReviewWithDetails{}
	for rows.Next() {
		reviewWithDetails := &ReviewWithDetails{
			Reviewer: &PublicUser{},
		}

		err := rows.Scan(
			&reviewWithDetails.ID,
			&reviewWithDetails.ReviewerID,
			&reviewWithDetails.SellerID,
			&reviewWithDetails.ItemID,
			&reviewWithDetails.Rating,
			&reviewWithDetails.Comment,
			&reviewWithDetails.CreatedAt,
			&reviewWithDetails.UpdatedAt,
			&reviewWithDetails.Reviewer.ID,
			&reviewWithDetails.Reviewer.Username,
			&reviewWithDetails.Reviewer.Firstname,
			&reviewWithDetails.Reviewer.Lastname,
			&reviewWithDetails.Reviewer.AvatarURL,
		)

		if err != nil {
			return nil, 0, err
		}

		reviews = append(reviews, reviewWithDetails)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, err
	}

	return reviews, total, nil
}

func (s *ReviewStore) GetSellerRating(ctx context.Context, sellerID int64) (*SellerRating, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT
			COUNT(*) as total_reviews,
			COALESCE(AVG(rating), 0) as average_rating,
			COUNT(CASE WHEN rating = 5 THEN 1 END) as rating_5,
			COUNT(CASE WHEN rating = 4 THEN 1 END) as rating_4,
			COUNT(CASE WHEN rating = 3 THEN 1 END) as rating_3,
			COUNT(CASE WHEN rating = 2 THEN 1 END) as rating_2,
			COUNT(CASE WHEN rating = 1 THEN 1 END) as rating_1
		FROM reviews
		WHERE seller_id = $1
	`

	var rating5, rating4, rating3, rating2, rating1 int
	sellerRating := &SellerRating{
		SellerID:     sellerID,
		RatingCounts: make(map[int]int),
	}

	err := s.db.QueryRowContext(ctx, query, sellerID).Scan(
		&sellerRating.TotalReviews,
		&sellerRating.AverageRating,
		&rating5,
		&rating4,
		&rating3,
		&rating2,
		&rating1,
	)

	if err != nil {
		return nil, err
	}

	sellerRating.RatingCounts[5] = rating5
	sellerRating.RatingCounts[4] = rating4
	sellerRating.RatingCounts[3] = rating3
	sellerRating.RatingCounts[2] = rating2
	sellerRating.RatingCounts[1] = rating1

	return sellerRating, nil
}
