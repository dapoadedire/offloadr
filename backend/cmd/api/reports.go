package main

import (
	"fmt"
	"net/http"

	"github.com/dapoadedire/offloadr/backend/internal/store"
)

// CreateReportPayload represents the request body for creating a report
type CreateReportPayload struct {
	ItemID     int64            `json:"item_id" validate:"required"`
	ReportType store.ReportType `json:"report_type" validate:"required,oneof=scam inappropriate spam sold wrong_category duplicate other"`
	Comment    *string          `json:"comment" validate:"omitempty,max=1000"`
}

// createReportHandler creates a new report for an item
// POST /v1/reports
func (app *application) createReportHandler(w http.ResponseWriter, r *http.Request) {
	var payload CreateReportPayload

	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	user := getUserFromContext(r)

	// Get the item to verify it exists
	item, err := app.store.Items.GetByID(r.Context(), payload.ItemID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	// Prevent user from reporting their own item
	if item.UserID == user.ID {
		app.badRequestResponse(w, r, fmt.Errorf("cannot report your own item"))
		return
	}

	report := &store.Report{
		ReporterID: user.ID,
		ItemID:     payload.ItemID,
		ReportType: payload.ReportType,
		Comment:    payload.Comment,
		Status:     store.ReportStatusPending,
	}

	if err := app.store.Reports.Create(r.Context(), report); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusCreated, report); err != nil {
		app.internalServerError(w, r, err)
	}
}

// getUserReportsHandler retrieves the current user's submitted reports
// GET /v1/users/me/reports
func (app *application) getUserReportsHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)

	// Parse pagination
	pq := store.PaginationQuery{
		Limit: 20,
		Page:  1,
	}

	if err := pq.Parse(r); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(pq); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Get user reports
	reports, total, err := app.store.Reports.GetUserReports(r.Context(), user.ID, pq.Limit, pq.Offset)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	paginationMeta := store.CalculatePaginationMeta(pq.Page, pq.Limit, total)

	if err := app.jsonResponse(w, http.StatusOK, map[string]interface{}{
		"data":       reports,
		"pagination": paginationMeta,
	}); err != nil {
		app.internalServerError(w, r, err)
	}
}
