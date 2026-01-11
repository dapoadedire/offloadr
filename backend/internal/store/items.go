package store

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type ItemStatus string
type ItemCondition string

const (
	ItemStatusDraft     ItemStatus = "draft"
	ItemStatusPublished ItemStatus = "published"
	ItemStatusSold      ItemStatus = "sold"
	ItemStatusArchived  ItemStatus = "archived"
	ItemStatusFlagged   ItemStatus = "flagged"

	ItemConditionNew     ItemCondition = "new"
	ItemConditionLikeNew ItemCondition = "like_new"
	ItemConditionGood    ItemCondition = "good"
	ItemConditionFair    ItemCondition = "fair"
	ItemConditionPoor    ItemCondition = "poor"
)

type Item struct {
	ID          int64         `json:"id"`
	Title       string        `json:"title"`
	Description string        `json:"description"`
	Price       float64       `json:"price"`
	Condition   ItemCondition `json:"condition"`
	CategoryID  int64         `json:"category_id"`
	UserID      int64         `json:"user_id"`
	BuyerID     *int64        `json:"buyer_id,omitempty"`
	SchoolID    int64         `json:"school_id"`
	Negotiable  bool          `json:"negotiable"`
	Status      ItemStatus    `json:"status"`
	Location    string        `json:"location"`
	ViewsCount  int           `json:"views_count"`
	ExpiresAt   *time.Time    `json:"expires_at,omitempty"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
	SoldAt      *time.Time    `json:"sold_at,omitempty"`
}

type ItemWithDetails struct {
	Item
	Category *Category      `json:"category"`
	Seller   *PublicUser    `json:"seller"`
	School   *School        `json:"school"`
	Photos   []*ItemPhoto   `json:"photos"`
}

type PublicUser struct {
	ID        int64   `json:"id"`
	Username  string  `json:"username"`
	Firstname string  `json:"firstname"`
	Lastname  string  `json:"lastname"`
	AvatarURL *string `json:"avatar_url,omitempty"`
}

type ItemPhoto struct {
	ID        int64     `json:"id"`
	ItemID    int64     `json:"item_id"`
	URL       string    `json:"url"`
	IsPrimary bool      `json:"is_primary"`
	Position  int       `json:"position"`
	UploadedAt time.Time `json:"uploaded_at"`
}

type ItemsFilterQuery struct {
	PaginationQuery
	SchoolID   *int64         `json:"school_id"`
	CategoryID *int64         `json:"category_id"`
	MinPrice   *float64       `json:"min_price"`
	MaxPrice   *float64       `json:"max_price"`
	Condition  *ItemCondition `json:"condition"`
	Negotiable *bool          `json:"negotiable"`
	Search     string         `json:"search"`
	UserID     *int64         `json:"user_id"`
	Status     *ItemStatus    `json:"status"`
}

func (fq *ItemsFilterQuery) Parse(r *http.Request) error {
	// Parse pagination first
	if err := fq.PaginationQuery.Parse(r); err != nil {
		return err
	}

	qp := r.URL.Query()

	// Set default sort
	if fq.Sort == "" {
		fq.Sort = "newest"
	}

	// Parse school_id
	if schoolID := qp.Get("school_id"); schoolID != "" {
		id, err := strconv.ParseInt(schoolID, 10, 64)
		if err != nil {
			return fmt.Errorf("invalid school_id parameter")
		}
		fq.SchoolID = &id
	}

	// Parse category_id
	if categoryID := qp.Get("category_id"); categoryID != "" {
		id, err := strconv.ParseInt(categoryID, 10, 64)
		if err != nil {
			return fmt.Errorf("invalid category_id parameter")
		}
		fq.CategoryID = &id
	}

	// Parse min_price
	if minPrice := qp.Get("min_price"); minPrice != "" {
		price, err := strconv.ParseFloat(minPrice, 64)
		if err != nil {
			return fmt.Errorf("invalid min_price parameter")
		}
		if price < 0 {
			return fmt.Errorf("min_price cannot be negative")
		}
		fq.MinPrice = &price
	}

	// Parse max_price
	if maxPrice := qp.Get("max_price"); maxPrice != "" {
		price, err := strconv.ParseFloat(maxPrice, 64)
		if err != nil {
			return fmt.Errorf("invalid max_price parameter")
		}
		if price < 0 {
			return fmt.Errorf("max_price cannot be negative")
		}
		fq.MaxPrice = &price
	}

	// Parse condition
	if condition := qp.Get("condition"); condition != "" {
		cond := ItemCondition(condition)
		// Validate condition
		validConditions := []ItemCondition{
			ItemConditionNew, ItemConditionLikeNew, ItemConditionGood,
			ItemConditionFair, ItemConditionPoor,
		}
		valid := false
		for _, vc := range validConditions {
			if cond == vc {
				valid = true
				break
			}
		}
		if !valid {
			return fmt.Errorf("invalid condition parameter")
		}
		fq.Condition = &cond
	}

	// Parse negotiable
	if negotiable := qp.Get("negotiable"); negotiable != "" {
		neg, err := strconv.ParseBool(negotiable)
		if err != nil {
			return fmt.Errorf("invalid negotiable parameter")
		}
		fq.Negotiable = &neg
	}

	// Parse search
	if search := qp.Get("search"); search != "" {
		if len(search) > 100 {
			return fmt.Errorf("search query too long (max 100 characters)")
		}
		fq.Search = search
	}

	return nil
}

type ItemStore struct {
	db *sql.DB
}

func (s *ItemStore) Create(ctx context.Context, item *Item) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		INSERT INTO items (title, description, price, condition, category_id, user_id, school_id, negotiable, status, location)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at, updated_at
	`

	err := s.db.QueryRowContext(
		ctx, query,
		item.Title,
		item.Description,
		item.Price,
		item.Condition,
		item.CategoryID,
		item.UserID,
		item.SchoolID,
		item.Negotiable,
		item.Status,
		item.Location,
	).Scan(&item.ID, &item.CreatedAt, &item.UpdatedAt)

	return err
}

func (s *ItemStore) GetByID(ctx context.Context, id int64) (*Item, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, title, description, price, condition, category_id, user_id, buyer_id, school_id,
			   negotiable, status, location, views_count, expires_at, created_at, updated_at, sold_at
		FROM items
		WHERE id = $1
	`

	item := &Item{}
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&item.ID,
		&item.Title,
		&item.Description,
		&item.Price,
		&item.Condition,
		&item.CategoryID,
		&item.UserID,
		&item.BuyerID,
		&item.SchoolID,
		&item.Negotiable,
		&item.Status,
		&item.Location,
		&item.ViewsCount,
		&item.ExpiresAt,
		&item.CreatedAt,
		&item.UpdatedAt,
		&item.SoldAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return item, nil
}

func (s *ItemStore) GetByIDWithDetails(ctx context.Context, id int64) (*ItemWithDetails, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT
			i.id, i.title, i.description, i.price, i.condition, i.category_id, i.user_id, i.buyer_id,
			i.school_id, i.negotiable, i.status, i.location, i.views_count, i.expires_at,
			i.created_at, i.updated_at, i.sold_at,
			c.id, c.name, c.slug, c.description, c.icon, c.parent_id, c.created_at,
			u.id, u.username, u.firstname, u.lastname, u.avatar_url,
			s.id, s.name, s.domain, s.location, s.is_active, s.created_at, s.updated_at
		FROM items i
		LEFT JOIN categories c ON i.category_id = c.id
		LEFT JOIN users u ON i.user_id = u.id
		LEFT JOIN schools s ON i.school_id = s.id
		WHERE i.id = $1
	`

	dest := newItemWithDetailsScanDest()

	err := s.db.QueryRowContext(ctx, query, id).Scan(dest.scanArgs()...)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	itemWithDetails := dest.finalize()

	// Fetch photos
	photos, err := s.GetItemPhotos(ctx, id)
	if err != nil {
		return nil, err
	}
	itemWithDetails.Photos = photos

	return itemWithDetails, nil
}

func (s *ItemStore) GetItemPhotos(ctx context.Context, itemID int64) ([]*ItemPhoto, error) {
	query := `
		SELECT id, item_id, url, is_primary, position, uploaded_at
		FROM item_photos
		WHERE item_id = $1
		ORDER BY is_primary DESC, position ASC
	`

	rows, err := s.db.QueryContext(ctx, query, itemID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	photos := []*ItemPhoto{}
	for rows.Next() {
		photo := &ItemPhoto{}
		err := rows.Scan(
			&photo.ID,
			&photo.ItemID,
			&photo.URL,
			&photo.IsPrimary,
			&photo.Position,
			&photo.UploadedAt,
		)
		if err != nil {
			return nil, err
		}
		photos = append(photos, photo)
	}

	return photos, rows.Err()
}

func (s *ItemStore) GetAll(ctx context.Context, filter ItemsFilterQuery) ([]*ItemWithDetails, int, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	// Build WHERE clause
	// Only filter by 'published' status for public browsing (when UserID is not set and Status is not explicitly set)
	// When UserID is set (user viewing their own items), show all statuses unless Status is explicitly filtered
	whereClauses := []string{}
	if filter.UserID == nil && filter.Status == nil {
		whereClauses = append(whereClauses, "i.status = 'published'")
	}
	args := []interface{}{}
	argPos := 1

	if filter.SchoolID != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("i.school_id = $%d", argPos))
		args = append(args, *filter.SchoolID)
		argPos++
	}

	if filter.CategoryID != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("i.category_id = $%d", argPos))
		args = append(args, *filter.CategoryID)
		argPos++
	}

	if filter.MinPrice != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("i.price >= $%d", argPos))
		args = append(args, *filter.MinPrice)
		argPos++
	}

	if filter.MaxPrice != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("i.price <= $%d", argPos))
		args = append(args, *filter.MaxPrice)
		argPos++
	}

	if filter.Condition != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("i.condition = $%d", argPos))
		args = append(args, *filter.Condition)
		argPos++
	}

	if filter.Negotiable != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("i.negotiable = $%d", argPos))
		args = append(args, *filter.Negotiable)
		argPos++
	}

	if filter.Search != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("(i.title ILIKE $%d OR i.description ILIKE $%d)", argPos, argPos))
		args = append(args, "%"+filter.Search+"%")
		argPos++
	}

	if filter.UserID != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("i.user_id = $%d", argPos))
		args = append(args, *filter.UserID)
		argPos++
	}

	if filter.Status != nil {
		// Add explicit status filter (overrides the default 'published' filter if present)
		whereClauses = append(whereClauses, fmt.Sprintf("i.status = $%d", argPos))
		args = append(args, *filter.Status)
		argPos++
	}

	whereClause := strings.Join(whereClauses, " AND ")

	// Build ORDER BY clause
	orderClause := "i.created_at DESC"
	switch filter.Sort {
	case "newest":
		orderClause = "i.created_at DESC"
	case "oldest":
		orderClause = "i.created_at ASC"
	case "price_asc":
		orderClause = "i.price ASC"
	case "price_desc":
		orderClause = "i.price DESC"
	case "most_viewed":
		orderClause = "i.views_count DESC"
	}

	// Get total count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM items i WHERE %s", whereClause)
	var total int
	err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get items with details
	query := fmt.Sprintf(`
		SELECT
			i.id, i.title, i.description, i.price, i.condition, i.category_id, i.user_id, i.buyer_id,
			i.school_id, i.negotiable, i.status, i.location, i.views_count, i.expires_at,
			i.created_at, i.updated_at, i.sold_at,
			c.id, c.name, c.slug, c.description, c.icon, c.parent_id, c.created_at,
			u.id, u.username, u.firstname, u.lastname, u.avatar_url,
			s.id, s.name, s.domain, s.location, s.is_active, s.created_at, s.updated_at
		FROM items i
		LEFT JOIN categories c ON i.category_id = c.id
		LEFT JOIN users u ON i.user_id = u.id
		LEFT JOIN schools s ON i.school_id = s.id
		WHERE %s
		ORDER BY %s
		LIMIT $%d OFFSET $%d
	`, whereClause, orderClause, argPos, argPos+1)

	args = append(args, filter.Limit, filter.Offset)

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := []*ItemWithDetails{}
	itemIDs := []int64{}
	for rows.Next() {
		dest := newItemWithDetailsScanDest()

		err := rows.Scan(dest.scanArgs()...)
		if err != nil {
			return nil, 0, err
		}

		itemWithDetails := dest.finalize()
		items = append(items, itemWithDetails)
		itemIDs = append(itemIDs, itemWithDetails.ID)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, err
	}

	// Batch fetch photos for all items (solves N+1 problem)
	if len(itemIDs) > 0 {
		photosByItemID, err := s.GetItemPhotosBatch(ctx, itemIDs)
		if err != nil {
			return nil, 0, err
		}

		// Assign photos to their respective items
		for _, item := range items {
			item.Photos = photosByItemID[item.ID]
		}
	}

	return items, total, nil
}

func (s *ItemStore) Update(ctx context.Context, item *Item) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		UPDATE items
		SET title = $1, description = $2, price = $3, condition = $4, category_id = $5,
			negotiable = $6, location = $7, updated_at = NOW()
		WHERE id = $8
	`

	result, err := s.db.ExecContext(
		ctx, query,
		item.Title,
		item.Description,
		item.Price,
		item.Condition,
		item.CategoryID,
		item.Negotiable,
		item.Location,
		item.ID,
	)

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

func (s *ItemStore) UpdateStatus(ctx context.Context, itemID int64, status ItemStatus) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		UPDATE items
		SET status = $1, updated_at = NOW()
		WHERE id = $2
	`

	result, err := s.db.ExecContext(ctx, query, status, itemID)
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

func (s *ItemStore) MarkAsSold(ctx context.Context, itemID int64, buyerID *int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		UPDATE items
		SET status = 'sold', buyer_id = $1, sold_at = NOW(), updated_at = NOW()
		WHERE id = $2
	`

	result, err := s.db.ExecContext(ctx, query, buyerID, itemID)
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

func (s *ItemStore) IncrementViews(ctx context.Context, itemID int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		UPDATE items
		SET views_count = views_count + 1
		WHERE id = $1
	`

	_, err := s.db.ExecContext(ctx, query, itemID)
	return err
}

func (s *ItemStore) Delete(ctx context.Context, itemID int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `DELETE FROM items WHERE id = $1`

	result, err := s.db.ExecContext(ctx, query, itemID)
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

func (s *ItemStore) GetRelated(ctx context.Context, itemID int64, categoryID int64, limit int) ([]*ItemWithDetails, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT
			i.id, i.title, i.description, i.price, i.condition, i.category_id, i.user_id, i.buyer_id,
			i.school_id, i.negotiable, i.status, i.location, i.views_count, i.expires_at,
			i.created_at, i.updated_at, i.sold_at,
			c.id, c.name, c.slug, c.description, c.icon, c.parent_id, c.created_at,
			u.id, u.username, u.firstname, u.lastname, u.avatar_url,
			s.id, s.name, s.domain, s.location, s.is_active, s.created_at, s.updated_at
		FROM items i
		LEFT JOIN categories c ON i.category_id = c.id
		LEFT JOIN users u ON i.user_id = u.id
		LEFT JOIN schools s ON i.school_id = s.id
		WHERE i.category_id = $1 AND i.id != $2 AND i.status = 'published'
		ORDER BY i.created_at DESC
		LIMIT $3
	`

	rows, err := s.db.QueryContext(ctx, query, categoryID, itemID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []*ItemWithDetails{}
	itemIDs := []int64{}
	for rows.Next() {
		dest := newItemWithDetailsScanDest()

		err := rows.Scan(dest.scanArgs()...)
		if err != nil {
			return nil, err
		}

		itemWithDetails := dest.finalize()
		items = append(items, itemWithDetails)
		itemIDs = append(itemIDs, itemWithDetails.ID)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// Batch fetch photos for all items (solves N+1 problem)
	if len(itemIDs) > 0 {
		photosByItemID, err := s.GetItemPhotosBatch(ctx, itemIDs)
		if err != nil {
			return nil, err
		}

		// Assign photos to their respective items
		for _, item := range items {
			item.Photos = photosByItemID[item.ID]
		}
	}

	return items, nil
}

// Item Photos methods
func (s *ItemStore) CreatePhoto(ctx context.Context, photo *ItemPhoto) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		INSERT INTO item_photos (item_id, url, is_primary, position)
		VALUES ($1, $2, $3, $4)
		RETURNING id, uploaded_at
	`

	err := s.db.QueryRowContext(
		ctx, query,
		photo.ItemID,
		photo.URL,
		photo.IsPrimary,
		photo.Position,
	).Scan(&photo.ID, &photo.UploadedAt)

	return err
}

func (s *ItemStore) DeletePhoto(ctx context.Context, photoID int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `DELETE FROM item_photos WHERE id = $1`

	result, err := s.db.ExecContext(ctx, query, photoID)
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

func (s *ItemStore) DeletePhotosByItemID(ctx context.Context, itemID int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `DELETE FROM item_photos WHERE item_id = $1`

	_, err := s.db.ExecContext(ctx, query, itemID)
	return err
}

func (s *ItemStore) GetPhotoByID(ctx context.Context, photoID int64) (*ItemPhoto, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, item_id, url, is_primary, position, uploaded_at
		FROM item_photos
		WHERE id = $1
	`

	photo := &ItemPhoto{}
	err := s.db.QueryRowContext(ctx, query, photoID).Scan(
		&photo.ID,
		&photo.ItemID,
		&photo.URL,
		&photo.IsPrimary,
		&photo.Position,
		&photo.UploadedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return photo, nil
}

func (s *ItemStore) SetPrimaryPhoto(ctx context.Context, itemID int64, photoID int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	// Start a transaction
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Remove primary flag from all photos for this item
	_, err = tx.ExecContext(ctx, `
		UPDATE item_photos
		SET is_primary = false
		WHERE item_id = $1
	`, itemID)
	if err != nil {
		return err
	}

	// Set the new primary photo
	result, err := tx.ExecContext(ctx, `
		UPDATE item_photos
		SET is_primary = true
		WHERE id = $1 AND item_id = $2
	`, photoID, itemID)
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

	return tx.Commit()
}

// GetItemPhotosBatch fetches photos for multiple items in a single query.
// Returns a map of itemID -> photos, solving the N+1 query problem.
func (s *ItemStore) GetItemPhotosBatch(ctx context.Context, itemIDs []int64) (map[int64][]*ItemPhoto, error) {
	if len(itemIDs) == 0 {
		return make(map[int64][]*ItemPhoto), nil
	}

	// Build placeholders for IN clause
	placeholders := make([]string, len(itemIDs))
	args := make([]interface{}, len(itemIDs))
	for i, id := range itemIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}

	query := fmt.Sprintf(`
		SELECT id, item_id, url, is_primary, position, uploaded_at
		FROM item_photos
		WHERE item_id IN (%s)
		ORDER BY item_id, is_primary DESC, position ASC
	`, strings.Join(placeholders, ", "))

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	photosByItemID := make(map[int64][]*ItemPhoto)
	for rows.Next() {
		photo := &ItemPhoto{}
		err := rows.Scan(
			&photo.ID,
			&photo.ItemID,
			&photo.URL,
			&photo.IsPrimary,
			&photo.Position,
			&photo.UploadedAt,
		)
		if err != nil {
			return nil, err
		}
		photosByItemID[photo.ItemID] = append(photosByItemID[photo.ItemID], photo)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return photosByItemID, nil
}
