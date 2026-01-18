package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

type ModerationStatus string
type ReviewDecision string

const (
	ModerationStatusPending  ModerationStatus = "pending"
	ModerationStatusPassed   ModerationStatus = "passed"
	ModerationStatusFlagged  ModerationStatus = "flagged"
	ModerationStatusRejected ModerationStatus = "rejected"

	ReviewDecisionApproved ReviewDecision = "approved"
	ReviewDecisionRejected ReviewDecision = "rejected"
)

type AppealStatus string

const (
	AppealStatusPending  AppealStatus = "pending"
	AppealStatusApproved AppealStatus = "approved"
	AppealStatusDenied   AppealStatus = "denied"
)

// ModerationResult represents the overall moderation result for an item
type ModerationResult struct {
	ID               int64            `json:"id"`
	ItemID           int64            `json:"item_id"`
	Status           ModerationStatus `json:"status"`
	ConfidenceScore  *float64         `json:"confidence_score,omitempty"`

	// Flags
	FlaggedInappropriate    bool `json:"flagged_inappropriate"`
	FlaggedScam             bool `json:"flagged_scam"`
	FlaggedProhibited       bool `json:"flagged_prohibited"`
	FlaggedPriceAnomaly     bool `json:"flagged_price_anomaly"`
	FlaggedContactLeak      bool `json:"flagged_contact_leak"`
	FlaggedConditionMismatch bool `json:"flagged_condition_mismatch"`

	// AI analysis
	AIExplanation        *string        `json:"ai_explanation,omitempty"`
	AISuggestedCondition *string        `json:"ai_suggested_condition,omitempty"`
	AICategoryMatch      *bool          `json:"ai_category_match,omitempty"`
	AIRawResponse        json.RawMessage `json:"ai_raw_response,omitempty"`

	// Review
	ReviewedBy     *int64          `json:"reviewed_by,omitempty"`
	ReviewedAt     *time.Time      `json:"reviewed_at,omitempty"`
	ReviewDecision *ReviewDecision `json:"review_decision,omitempty"`
	ReviewNotes    *string         `json:"review_notes,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ModerationResultWithDetails includes item and reviewer details
type ModerationResultWithDetails struct {
	ModerationResult
	Item     *ItemWithDetails `json:"item,omitempty"`
	Reviewer *PublicUser      `json:"reviewer,omitempty"`
	Images   []*ImageModeration `json:"images,omitempty"`
}

// ImageModeration represents the analysis result for a single image
type ImageModeration struct {
	ID                  int64    `json:"id"`
	PhotoID             int64    `json:"photo_id"`
	ModerationResultID  int64    `json:"moderation_result_id"`
	IsAppropriate       *bool    `json:"is_appropriate,omitempty"`
	IsStockPhoto        *bool    `json:"is_stock_photo,omitempty"`
	IsDuplicate         *bool    `json:"is_duplicate,omitempty"`
	MatchesDescription  *bool    `json:"matches_description,omitempty"`
	DetectedObjects     []string `json:"detected_objects,omitempty"`
	ConfidenceScore     *float64 `json:"confidence_score,omitempty"`
	AINotes             *string  `json:"ai_notes,omitempty"`
	CreatedAt           time.Time `json:"created_at"`
}

// ModerationAppeal represents an appeal for a moderation decision
type ModerationAppeal struct {
	ID                 int64       `json:"id"`
	ModerationResultID int64       `json:"moderation_result_id"`
	UserID             int64       `json:"user_id"`
	Reason             string      `json:"reason"`
	Status             AppealStatus `json:"status"`
	ResolvedBy         *int64      `json:"resolved_by,omitempty"`
	ResolvedAt         *time.Time  `json:"resolved_at,omitempty"`
	ResolutionNotes    *string     `json:"resolution_notes,omitempty"`
	CreatedAt          time.Time   `json:"created_at"`
}

// ModerationAppealWithDetails includes user and moderation result details
type ModerationAppealWithDetails struct {
	ModerationAppeal
	User             *PublicUser       `json:"user,omitempty"`
	ModerationResult *ModerationResult `json:"moderation_result,omitempty"`
	Resolver         *PublicUser       `json:"resolver,omitempty"`
}

// ModerationAnalytics represents daily analytics
type ModerationAnalytics struct {
	ID              int64      `json:"id"`
	Date            time.Time  `json:"date"`
	SchoolID        *int64     `json:"school_id,omitempty"`
	TotalScanned    int        `json:"total_scanned"`
	AutoApproved    int        `json:"auto_approved"`
	FlaggedForReview int       `json:"flagged_for_review"`
	Rejected        int        `json:"rejected"`
	AppealsSubmitted int       `json:"appeals_submitted"`
	AppealsApproved int        `json:"appeals_approved"`
	FlaggedInappropriate int   `json:"flagged_inappropriate"`
	FlaggedScam     int        `json:"flagged_scam"`
	FlaggedProhibited int      `json:"flagged_prohibited"`
	FlaggedPrice    int        `json:"flagged_price"`
}

// ModerationQueueFilter for filtering the moderation queue
type ModerationQueueFilter struct {
	PaginationQuery
	Status   *ModerationStatus `json:"status"`
	SchoolID *int64            `json:"school_id"`
	FromDate *time.Time        `json:"from_date"`
	ToDate   *time.Time        `json:"to_date"`
}

type ModerationStore struct {
	db *sql.DB
}

// CreateModerationResult creates a new moderation result for an item
func (s *ModerationStore) CreateModerationResult(ctx context.Context, result *ModerationResult) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		INSERT INTO moderation_results (
			item_id, status, confidence_score,
			flagged_inappropriate, flagged_scam, flagged_prohibited,
			flagged_price_anomaly, flagged_contact_leak, flagged_condition_mismatch,
			ai_explanation, ai_suggested_condition, ai_category_match, ai_raw_response
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, created_at, updated_at
	`

	err := s.db.QueryRowContext(
		ctx, query,
		result.ItemID,
		result.Status,
		result.ConfidenceScore,
		result.FlaggedInappropriate,
		result.FlaggedScam,
		result.FlaggedProhibited,
		result.FlaggedPriceAnomaly,
		result.FlaggedContactLeak,
		result.FlaggedConditionMismatch,
		result.AIExplanation,
		result.AISuggestedCondition,
		result.AICategoryMatch,
		result.AIRawResponse,
	).Scan(&result.ID, &result.CreatedAt, &result.UpdatedAt)

	return err
}

// GetModerationResultByID gets a moderation result by ID
func (s *ModerationStore) GetModerationResultByID(ctx context.Context, id int64) (*ModerationResult, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, item_id, status, confidence_score,
			flagged_inappropriate, flagged_scam, flagged_prohibited,
			flagged_price_anomaly, flagged_contact_leak, flagged_condition_mismatch,
			ai_explanation, ai_suggested_condition, ai_category_match, ai_raw_response,
			reviewed_by, reviewed_at, review_decision, review_notes,
			created_at, updated_at
		FROM moderation_results
		WHERE id = $1
	`

	result := &ModerationResult{}
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&result.ID,
		&result.ItemID,
		&result.Status,
		&result.ConfidenceScore,
		&result.FlaggedInappropriate,
		&result.FlaggedScam,
		&result.FlaggedProhibited,
		&result.FlaggedPriceAnomaly,
		&result.FlaggedContactLeak,
		&result.FlaggedConditionMismatch,
		&result.AIExplanation,
		&result.AISuggestedCondition,
		&result.AICategoryMatch,
		&result.AIRawResponse,
		&result.ReviewedBy,
		&result.ReviewedAt,
		&result.ReviewDecision,
		&result.ReviewNotes,
		&result.CreatedAt,
		&result.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return result, nil
}

// GetModerationResultByItemID gets the latest moderation result for an item
func (s *ModerationStore) GetModerationResultByItemID(ctx context.Context, itemID int64) (*ModerationResult, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, item_id, status, confidence_score,
			flagged_inappropriate, flagged_scam, flagged_prohibited,
			flagged_price_anomaly, flagged_contact_leak, flagged_condition_mismatch,
			ai_explanation, ai_suggested_condition, ai_category_match, ai_raw_response,
			reviewed_by, reviewed_at, review_decision, review_notes,
			created_at, updated_at
		FROM moderation_results
		WHERE item_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`

	result := &ModerationResult{}
	err := s.db.QueryRowContext(ctx, query, itemID).Scan(
		&result.ID,
		&result.ItemID,
		&result.Status,
		&result.ConfidenceScore,
		&result.FlaggedInappropriate,
		&result.FlaggedScam,
		&result.FlaggedProhibited,
		&result.FlaggedPriceAnomaly,
		&result.FlaggedContactLeak,
		&result.FlaggedConditionMismatch,
		&result.AIExplanation,
		&result.AISuggestedCondition,
		&result.AICategoryMatch,
		&result.AIRawResponse,
		&result.ReviewedBy,
		&result.ReviewedAt,
		&result.ReviewDecision,
		&result.ReviewNotes,
		&result.CreatedAt,
		&result.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return result, nil
}

// UpdateModerationResult updates a moderation result
func (s *ModerationStore) UpdateModerationResult(ctx context.Context, result *ModerationResult) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		UPDATE moderation_results
		SET status = $1, confidence_score = $2,
			flagged_inappropriate = $3, flagged_scam = $4, flagged_prohibited = $5,
			flagged_price_anomaly = $6, flagged_contact_leak = $7, flagged_condition_mismatch = $8,
			ai_explanation = $9, ai_suggested_condition = $10, ai_category_match = $11, ai_raw_response = $12,
			updated_at = NOW()
		WHERE id = $13
	`

	res, err := s.db.ExecContext(
		ctx, query,
		result.Status,
		result.ConfidenceScore,
		result.FlaggedInappropriate,
		result.FlaggedScam,
		result.FlaggedProhibited,
		result.FlaggedPriceAnomaly,
		result.FlaggedContactLeak,
		result.FlaggedConditionMismatch,
		result.AIExplanation,
		result.AISuggestedCondition,
		result.AICategoryMatch,
		result.AIRawResponse,
		result.ID,
	)

	if err != nil {
		return err
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return ErrNotFound
	}

	return nil
}

// SubmitReview submits a review decision for a moderation result
func (s *ModerationStore) SubmitReview(ctx context.Context, resultID int64, reviewerID int64, decision ReviewDecision, notes *string) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	// Determine the new status based on the decision
	var newStatus ModerationStatus
	if decision == ReviewDecisionApproved {
		newStatus = ModerationStatusPassed
	} else {
		newStatus = ModerationStatusRejected
	}

	query := `
		UPDATE moderation_results
		SET reviewed_by = $1, reviewed_at = NOW(), review_decision = $2, review_notes = $3,
			status = $4, updated_at = NOW()
		WHERE id = $5
	`

	res, err := s.db.ExecContext(ctx, query, reviewerID, decision, notes, newStatus, resultID)
	if err != nil {
		return err
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return ErrNotFound
	}

	return nil
}

// GetModerationQueue gets items pending moderation review
func (s *ModerationStore) GetModerationQueue(ctx context.Context, filter ModerationQueueFilter) ([]*ModerationResultWithDetails, int, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	whereClauses := []string{}
	args := []interface{}{}
	argPos := 1

	// Default to flagged status if not specified
	if filter.Status != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("mr.status = $%d", argPos))
		args = append(args, *filter.Status)
		argPos++
	} else {
		whereClauses = append(whereClauses, "mr.status = 'flagged'")
	}

	if filter.SchoolID != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("i.school_id = $%d", argPos))
		args = append(args, *filter.SchoolID)
		argPos++
	}

	if filter.FromDate != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("mr.created_at >= $%d", argPos))
		args = append(args, *filter.FromDate)
		argPos++
	}

	if filter.ToDate != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("mr.created_at <= $%d", argPos))
		args = append(args, *filter.ToDate)
		argPos++
	}

	whereClause := strings.Join(whereClauses, " AND ")

	// Get total count
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM moderation_results mr
		JOIN items i ON mr.item_id = i.id
		WHERE %s
	`, whereClause)

	var total int
	err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get results with item details
	query := fmt.Sprintf(`
		SELECT mr.id, mr.item_id, mr.status, mr.confidence_score,
			mr.flagged_inappropriate, mr.flagged_scam, mr.flagged_prohibited,
			mr.flagged_price_anomaly, mr.flagged_contact_leak, mr.flagged_condition_mismatch,
			mr.ai_explanation, mr.ai_suggested_condition, mr.ai_category_match,
			mr.reviewed_by, mr.reviewed_at, mr.review_decision, mr.review_notes,
			mr.created_at, mr.updated_at,
			i.id, i.title, i.description, i.price, i.condition, i.status,
			u.id, u.username, u.firstname, u.lastname, u.avatar_url
		FROM moderation_results mr
		JOIN items i ON mr.item_id = i.id
		JOIN users u ON i.user_id = u.id
		WHERE %s
		ORDER BY mr.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, filter.Limit, filter.Offset)

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	results := []*ModerationResultWithDetails{}
	for rows.Next() {
		r := &ModerationResultWithDetails{
			Item: &ItemWithDetails{
				Seller: &PublicUser{},
			},
		}

		err := rows.Scan(
			&r.ID,
			&r.ItemID,
			&r.Status,
			&r.ConfidenceScore,
			&r.FlaggedInappropriate,
			&r.FlaggedScam,
			&r.FlaggedProhibited,
			&r.FlaggedPriceAnomaly,
			&r.FlaggedContactLeak,
			&r.FlaggedConditionMismatch,
			&r.AIExplanation,
			&r.AISuggestedCondition,
			&r.AICategoryMatch,
			&r.ReviewedBy,
			&r.ReviewedAt,
			&r.ReviewDecision,
			&r.ReviewNotes,
			&r.CreatedAt,
			&r.UpdatedAt,
			&r.Item.ID,
			&r.Item.Title,
			&r.Item.Description,
			&r.Item.Price,
			&r.Item.Condition,
			&r.Item.Status,
			&r.Item.Seller.ID,
			&r.Item.Seller.Username,
			&r.Item.Seller.Firstname,
			&r.Item.Seller.Lastname,
			&r.Item.Seller.AvatarURL,
		)
		if err != nil {
			return nil, 0, err
		}

		results = append(results, r)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, err
	}

	return results, total, nil
}

// CreateImageModeration creates an image moderation result
func (s *ModerationStore) CreateImageModeration(ctx context.Context, img *ImageModeration) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	detectedObjectsJSON, err := json.Marshal(img.DetectedObjects)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO image_moderation (
			photo_id, moderation_result_id, is_appropriate, is_stock_photo,
			is_duplicate, matches_description, detected_objects, confidence_score, ai_notes
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at
	`

	err = s.db.QueryRowContext(
		ctx, query,
		img.PhotoID,
		img.ModerationResultID,
		img.IsAppropriate,
		img.IsStockPhoto,
		img.IsDuplicate,
		img.MatchesDescription,
		detectedObjectsJSON,
		img.ConfidenceScore,
		img.AINotes,
	).Scan(&img.ID, &img.CreatedAt)

	return err
}

// GetImageModerationByResultID gets all image moderation results for a moderation result
func (s *ModerationStore) GetImageModerationByResultID(ctx context.Context, resultID int64) ([]*ImageModeration, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, photo_id, moderation_result_id, is_appropriate, is_stock_photo,
			is_duplicate, matches_description, detected_objects, confidence_score, ai_notes, created_at
		FROM image_moderation
		WHERE moderation_result_id = $1
		ORDER BY id
	`

	rows, err := s.db.QueryContext(ctx, query, resultID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	images := []*ImageModeration{}
	for rows.Next() {
		img := &ImageModeration{}
		var detectedObjectsJSON []byte

		err := rows.Scan(
			&img.ID,
			&img.PhotoID,
			&img.ModerationResultID,
			&img.IsAppropriate,
			&img.IsStockPhoto,
			&img.IsDuplicate,
			&img.MatchesDescription,
			&detectedObjectsJSON,
			&img.ConfidenceScore,
			&img.AINotes,
			&img.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		if detectedObjectsJSON != nil {
			json.Unmarshal(detectedObjectsJSON, &img.DetectedObjects)
		}

		images = append(images, img)
	}

	return images, rows.Err()
}

// CreateAppeal creates a moderation appeal
func (s *ModerationStore) CreateAppeal(ctx context.Context, appeal *ModerationAppeal) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		INSERT INTO moderation_appeals (moderation_result_id, user_id, reason, status)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`

	err := s.db.QueryRowContext(
		ctx, query,
		appeal.ModerationResultID,
		appeal.UserID,
		appeal.Reason,
		appeal.Status,
	).Scan(&appeal.ID, &appeal.CreatedAt)

	return err
}

// GetAppealByID gets an appeal by ID
func (s *ModerationStore) GetAppealByID(ctx context.Context, id int64) (*ModerationAppeal, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, moderation_result_id, user_id, reason, status,
			resolved_by, resolved_at, resolution_notes, created_at
		FROM moderation_appeals
		WHERE id = $1
	`

	appeal := &ModerationAppeal{}
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&appeal.ID,
		&appeal.ModerationResultID,
		&appeal.UserID,
		&appeal.Reason,
		&appeal.Status,
		&appeal.ResolvedBy,
		&appeal.ResolvedAt,
		&appeal.ResolutionNotes,
		&appeal.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return appeal, nil
}

// GetUserAppeals gets all appeals for a user
func (s *ModerationStore) GetUserAppeals(ctx context.Context, userID int64, limit, offset int) ([]*ModerationAppealWithDetails, int, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	// Get total count
	var total int
	err := s.db.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM moderation_appeals WHERE user_id = $1",
		userID,
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := `
		SELECT ma.id, ma.moderation_result_id, ma.user_id, ma.reason, ma.status,
			ma.resolved_by, ma.resolved_at, ma.resolution_notes, ma.created_at,
			mr.status, mr.ai_explanation, i.title
		FROM moderation_appeals ma
		JOIN moderation_results mr ON ma.moderation_result_id = mr.id
		JOIN items i ON mr.item_id = i.id
		WHERE ma.user_id = $1
		ORDER BY ma.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	appeals := []*ModerationAppealWithDetails{}
	for rows.Next() {
		a := &ModerationAppealWithDetails{
			ModerationResult: &ModerationResult{},
		}
		var itemTitle string

		err := rows.Scan(
			&a.ID,
			&a.ModerationResultID,
			&a.UserID,
			&a.Reason,
			&a.Status,
			&a.ResolvedBy,
			&a.ResolvedAt,
			&a.ResolutionNotes,
			&a.CreatedAt,
			&a.ModerationResult.Status,
			&a.ModerationResult.AIExplanation,
			&itemTitle,
		)
		if err != nil {
			return nil, 0, err
		}

		appeals = append(appeals, a)
	}

	return appeals, total, rows.Err()
}

// ResolveAppeal resolves a moderation appeal
func (s *ModerationStore) ResolveAppeal(ctx context.Context, appealID int64, resolverID int64, status AppealStatus, notes *string) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Update the appeal
	query := `
		UPDATE moderation_appeals
		SET status = $1, resolved_by = $2, resolved_at = NOW(), resolution_notes = $3
		WHERE id = $4
		RETURNING moderation_result_id
	`

	var moderationResultID int64
	err = tx.QueryRowContext(ctx, query, status, resolverID, notes, appealID).Scan(&moderationResultID)
	if err != nil {
		if err == sql.ErrNoRows {
			return ErrNotFound
		}
		return err
	}

	// If appeal is approved, update the moderation result status to passed
	if status == AppealStatusApproved {
		updateQuery := `
			UPDATE moderation_results
			SET status = 'passed', reviewed_by = $1, reviewed_at = NOW(),
				review_decision = 'approved', review_notes = $2, updated_at = NOW()
			WHERE id = $3
		`
		_, err = tx.ExecContext(ctx, updateQuery, resolverID, notes, moderationResultID)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// GetPendingAppeals gets all pending appeals (for admin)
func (s *ModerationStore) GetPendingAppeals(ctx context.Context, limit, offset int) ([]*ModerationAppealWithDetails, int, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	// Get total count
	var total int
	err := s.db.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM moderation_appeals WHERE status = 'pending'",
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := `
		SELECT ma.id, ma.moderation_result_id, ma.user_id, ma.reason, ma.status,
			ma.resolved_by, ma.resolved_at, ma.resolution_notes, ma.created_at,
			u.id, u.username, u.firstname, u.lastname, u.avatar_url,
			mr.status, mr.ai_explanation
		FROM moderation_appeals ma
		JOIN users u ON ma.user_id = u.id
		JOIN moderation_results mr ON ma.moderation_result_id = mr.id
		WHERE ma.status = 'pending'
		ORDER BY ma.created_at ASC
		LIMIT $1 OFFSET $2
	`

	rows, err := s.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	appeals := []*ModerationAppealWithDetails{}
	for rows.Next() {
		a := &ModerationAppealWithDetails{
			User:             &PublicUser{},
			ModerationResult: &ModerationResult{},
		}

		err := rows.Scan(
			&a.ID,
			&a.ModerationResultID,
			&a.UserID,
			&a.Reason,
			&a.Status,
			&a.ResolvedBy,
			&a.ResolvedAt,
			&a.ResolutionNotes,
			&a.CreatedAt,
			&a.User.ID,
			&a.User.Username,
			&a.User.Firstname,
			&a.User.Lastname,
			&a.User.AvatarURL,
			&a.ModerationResult.Status,
			&a.ModerationResult.AIExplanation,
		)
		if err != nil {
			return nil, 0, err
		}

		appeals = append(appeals, a)
	}

	return appeals, total, rows.Err()
}

// UpdateAnalytics updates or creates analytics for a specific date and school
func (s *ModerationStore) UpdateAnalytics(ctx context.Context, analytics *ModerationAnalytics) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		INSERT INTO moderation_analytics (
			date, school_id, total_scanned, auto_approved, flagged_for_review, rejected,
			appeals_submitted, appeals_approved, flagged_inappropriate, flagged_scam,
			flagged_prohibited, flagged_price
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		ON CONFLICT (date, school_id)
		DO UPDATE SET
			total_scanned = moderation_analytics.total_scanned + EXCLUDED.total_scanned,
			auto_approved = moderation_analytics.auto_approved + EXCLUDED.auto_approved,
			flagged_for_review = moderation_analytics.flagged_for_review + EXCLUDED.flagged_for_review,
			rejected = moderation_analytics.rejected + EXCLUDED.rejected,
			appeals_submitted = moderation_analytics.appeals_submitted + EXCLUDED.appeals_submitted,
			appeals_approved = moderation_analytics.appeals_approved + EXCLUDED.appeals_approved,
			flagged_inappropriate = moderation_analytics.flagged_inappropriate + EXCLUDED.flagged_inappropriate,
			flagged_scam = moderation_analytics.flagged_scam + EXCLUDED.flagged_scam,
			flagged_prohibited = moderation_analytics.flagged_prohibited + EXCLUDED.flagged_prohibited,
			flagged_price = moderation_analytics.flagged_price + EXCLUDED.flagged_price
		RETURNING id
	`

	err := s.db.QueryRowContext(
		ctx, query,
		analytics.Date,
		analytics.SchoolID,
		analytics.TotalScanned,
		analytics.AutoApproved,
		analytics.FlaggedForReview,
		analytics.Rejected,
		analytics.AppealsSubmitted,
		analytics.AppealsApproved,
		analytics.FlaggedInappropriate,
		analytics.FlaggedScam,
		analytics.FlaggedProhibited,
		analytics.FlaggedPrice,
	).Scan(&analytics.ID)

	return err
}

// GetAnalytics gets analytics for a date range
func (s *ModerationStore) GetAnalytics(ctx context.Context, fromDate, toDate time.Time, schoolID *int64) ([]*ModerationAnalytics, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	var query string
	var args []interface{}

	if schoolID != nil {
		query = `
			SELECT id, date, school_id, total_scanned, auto_approved, flagged_for_review,
				rejected, appeals_submitted, appeals_approved, flagged_inappropriate,
				flagged_scam, flagged_prohibited, flagged_price
			FROM moderation_analytics
			WHERE date >= $1 AND date <= $2 AND school_id = $3
			ORDER BY date DESC
		`
		args = []interface{}{fromDate, toDate, *schoolID}
	} else {
		query = `
			SELECT id, date, school_id, total_scanned, auto_approved, flagged_for_review,
				rejected, appeals_submitted, appeals_approved, flagged_inappropriate,
				flagged_scam, flagged_prohibited, flagged_price
			FROM moderation_analytics
			WHERE date >= $1 AND date <= $2
			ORDER BY date DESC
		`
		args = []interface{}{fromDate, toDate}
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	analytics := []*ModerationAnalytics{}
	for rows.Next() {
		a := &ModerationAnalytics{}
		err := rows.Scan(
			&a.ID,
			&a.Date,
			&a.SchoolID,
			&a.TotalScanned,
			&a.AutoApproved,
			&a.FlaggedForReview,
			&a.Rejected,
			&a.AppealsSubmitted,
			&a.AppealsApproved,
			&a.FlaggedInappropriate,
			&a.FlaggedScam,
			&a.FlaggedProhibited,
			&a.FlaggedPrice,
		)
		if err != nil {
			return nil, err
		}
		analytics = append(analytics, a)
	}

	return analytics, rows.Err()
}

// GetAnalyticsSummary gets aggregated analytics summary
func (s *ModerationStore) GetAnalyticsSummary(ctx context.Context, fromDate, toDate time.Time, schoolID *int64) (*ModerationAnalytics, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	var query string
	var args []interface{}

	if schoolID != nil {
		query = `
			SELECT COALESCE(SUM(total_scanned), 0), COALESCE(SUM(auto_approved), 0),
				COALESCE(SUM(flagged_for_review), 0), COALESCE(SUM(rejected), 0),
				COALESCE(SUM(appeals_submitted), 0), COALESCE(SUM(appeals_approved), 0),
				COALESCE(SUM(flagged_inappropriate), 0), COALESCE(SUM(flagged_scam), 0),
				COALESCE(SUM(flagged_prohibited), 0), COALESCE(SUM(flagged_price), 0)
			FROM moderation_analytics
			WHERE date >= $1 AND date <= $2 AND school_id = $3
		`
		args = []interface{}{fromDate, toDate, *schoolID}
	} else {
		query = `
			SELECT COALESCE(SUM(total_scanned), 0), COALESCE(SUM(auto_approved), 0),
				COALESCE(SUM(flagged_for_review), 0), COALESCE(SUM(rejected), 0),
				COALESCE(SUM(appeals_submitted), 0), COALESCE(SUM(appeals_approved), 0),
				COALESCE(SUM(flagged_inappropriate), 0), COALESCE(SUM(flagged_scam), 0),
				COALESCE(SUM(flagged_prohibited), 0), COALESCE(SUM(flagged_price), 0)
			FROM moderation_analytics
			WHERE date >= $1 AND date <= $2
		`
		args = []interface{}{fromDate, toDate}
	}

	summary := &ModerationAnalytics{
		Date:     fromDate,
		SchoolID: schoolID,
	}

	err := s.db.QueryRowContext(ctx, query, args...).Scan(
		&summary.TotalScanned,
		&summary.AutoApproved,
		&summary.FlaggedForReview,
		&summary.Rejected,
		&summary.AppealsSubmitted,
		&summary.AppealsApproved,
		&summary.FlaggedInappropriate,
		&summary.FlaggedScam,
		&summary.FlaggedProhibited,
		&summary.FlaggedPrice,
	)

	if err != nil {
		return nil, err
	}

	return summary, nil
}
