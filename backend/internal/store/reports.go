package store

import (
	"context"
	"database/sql"
	"time"
)

type ReportType string
type ReportStatus string

const (
	ReportTypeScam          ReportType = "scam"
	ReportTypeInappropriate ReportType = "inappropriate"
	ReportTypeSpam          ReportType = "spam"
	ReportTypeSold          ReportType = "sold"
	ReportTypeWrongCategory ReportType = "wrong_category"
	ReportTypeDuplicate     ReportType = "duplicate"
	ReportTypeOther         ReportType = "other"

	ReportStatusPending   ReportStatus = "pending"
	ReportStatusReviewing ReportStatus = "reviewing"
	ReportStatusResolved  ReportStatus = "resolved"
	ReportStatusDismissed ReportStatus = "dismissed"
)

type Report struct {
	ID         int64        `json:"id"`
	ReporterID int64        `json:"reporter_id"`
	ItemID     int64        `json:"item_id"`
	ReportType ReportType   `json:"report_type"`
	Comment    *string      `json:"comment,omitempty"`
	Status     ReportStatus `json:"status"`
	ResolvedBy *int64       `json:"resolved_by,omitempty"`
	CreatedAt  time.Time    `json:"created_at"`
	ResolvedAt *time.Time   `json:"resolved_at,omitempty"`
}

type ReportStore struct {
	db *sql.DB
}

func (s *ReportStore) Create(ctx context.Context, report *Report) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		INSERT INTO report_listing (reporter_id, item_id, report_type, comment, status)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`

	err := s.db.QueryRowContext(
		ctx, query,
		report.ReporterID,
		report.ItemID,
		report.ReportType,
		report.Comment,
		report.Status,
	).Scan(&report.ID, &report.CreatedAt)

	return err
}

func (s *ReportStore) GetUserReports(ctx context.Context, userID int64, limit, offset int) ([]*Report, int, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	// Get total count
	countQuery := `SELECT COUNT(*) FROM report_listing WHERE reporter_id = $1`

	var total int
	err := s.db.QueryRowContext(ctx, countQuery, userID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get reports
	query := `
		SELECT id, reporter_id, item_id, report_type, comment, status, resolved_by, created_at, resolved_at
		FROM report_listing
		WHERE reporter_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	reports := []*Report{}
	for rows.Next() {
		report := &Report{}

		err := rows.Scan(
			&report.ID,
			&report.ReporterID,
			&report.ItemID,
			&report.ReportType,
			&report.Comment,
			&report.Status,
			&report.ResolvedBy,
			&report.CreatedAt,
			&report.ResolvedAt,
		)

		if err != nil {
			return nil, 0, err
		}

		reports = append(reports, report)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, err
	}

	return reports, total, nil
}
