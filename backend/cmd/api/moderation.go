package main

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/dapoadedire/offloadr/backend/internal/store"
)

// POST /v1/moderation/scan - Trigger scan for an item (internal/admin)
func (app *application) scanItemHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

	// Check admin role
	if !user.IsAdmin {
		app.forbiddenResponse(w, r, fmt.Errorf("admin access required"))
		return
	}

	var payload struct {
		ItemID int64 `json:"item_id" validate:"required,gt=0"`
	}

	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	// Get item with details
	item, err := app.store.Items.GetByIDWithDetails(ctx, payload.ItemID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, fmt.Errorf("item not found"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	// Check if moderation service is available
	if app.moderationService == nil {
		app.internalServerError(w, r, fmt.Errorf("moderation service not available"))
		return
	}

	// Perform the scan
	result, err := app.moderationService.ScanItem(ctx, item)
	if err != nil {
		app.internalServerError(w, r, fmt.Errorf("failed to scan item: %w", err))
		return
	}

	// Save the result
	moderationResult, err := app.moderationService.SaveModerationResult(ctx, item.ID, item.SchoolID, result)
	if err != nil {
		app.internalServerError(w, r, fmt.Errorf("failed to save moderation result: %w", err))
		return
	}

	// If item was flagged or rejected, update the item status
	if result.Status == store.ModerationStatusFlagged || result.Status == store.ModerationStatusRejected {
		if err := app.store.Items.UpdateStatus(ctx, item.ID, store.ItemStatusFlagged); err != nil {
			app.logger.Errorw("failed to update item status to flagged", "error", err, "item_id", item.ID)
		}
	}

	response := map[string]any{
		"moderation_result": moderationResult,
		"scan_details": map[string]any{
			"passed":              result.Passed,
			"status":              result.Status,
			"confidence_score":    result.ConfidenceScore,
			"flags_count":         len(result.Flags),
			"explanation":         result.Explanation,
			"suggested_condition": result.SuggestedCondition,
			"category_match":      result.CategoryMatch,
		},
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// GET /v1/moderation/queue - Get items pending review (admin)
func (app *application) getModerationQueueHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

	if !user.IsAdmin {
		app.forbiddenResponse(w, r, fmt.Errorf("admin access required"))
		return
	}

	// Parse query parameters
	var filter store.ModerationQueueFilter
	filter.Limit = 20
	filter.Page = 1

	if err := filter.Parse(r); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Parse status filter
	if statusStr := r.URL.Query().Get("status"); statusStr != "" {
		status := store.ModerationStatus(statusStr)
		filter.Status = &status
	}

	// Parse school_id filter
	if schoolIDStr := r.URL.Query().Get("school_id"); schoolIDStr != "" {
		schoolID, err := strconv.ParseInt(schoolIDStr, 10, 64)
		if err != nil {
			app.badRequestResponse(w, r, fmt.Errorf("invalid school_id"))
			return
		}
		filter.SchoolID = &schoolID
	}

	// Parse date filters
	if fromDateStr := r.URL.Query().Get("from_date"); fromDateStr != "" {
		fromDate, err := time.Parse("2006-01-02", fromDateStr)
		if err != nil {
			app.badRequestResponse(w, r, fmt.Errorf("invalid from_date format (use YYYY-MM-DD)"))
			return
		}
		filter.FromDate = &fromDate
	}

	if toDateStr := r.URL.Query().Get("to_date"); toDateStr != "" {
		toDate, err := time.Parse("2006-01-02", toDateStr)
		if err != nil {
			app.badRequestResponse(w, r, fmt.Errorf("invalid to_date format (use YYYY-MM-DD)"))
			return
		}
		filter.ToDate = &toDate
	}

	ctx := r.Context()

	results, total, err := app.store.Moderation.GetModerationQueue(ctx, filter)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	pagination := store.CalculatePaginationMeta(filter.Page, filter.Limit, total)

	response := store.PaginatedResponse{
		Data:       results,
		Pagination: pagination,
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// GET /v1/moderation/item/{id} - Get moderation details for item
func (app *application) getModerationResultHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

	itemID, ok := app.parseIDParam(w, r, "id")
	if !ok {
		return
	}

	ctx := r.Context()

	// Get the item to check ownership
	item, err := app.store.Items.GetByID(ctx, itemID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, fmt.Errorf("item not found"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	// Only allow access to item owner or admin
	if user.ID != item.UserID && !user.IsAdmin {
		app.forbiddenResponse(w, r, fmt.Errorf("access denied"))
		return
	}

	// Get moderation result
	result, err := app.store.Moderation.GetModerationResultByItemID(ctx, itemID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, fmt.Errorf("no moderation result found for this item"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	// Get image moderation results
	imageResults, err := app.store.Moderation.GetImageModerationByResultID(ctx, result.ID)
	if err != nil {
		app.logger.Warnw("failed to get image moderation results", "error", err)
	}

	response := map[string]any{
		"moderation_result": result,
		"image_results":     imageResults,
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// PATCH /v1/moderation/item/{id}/review - Submit review decision (admin)
func (app *application) submitModerationReviewHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

	if !user.IsAdmin {
		app.forbiddenResponse(w, r, fmt.Errorf("admin access required"))
		return
	}

	resultID, ok := app.parseIDParam(w, r, "id")
	if !ok {
		return
	}

	var payload struct {
		Decision store.ReviewDecision `json:"decision" validate:"required,oneof=approved rejected"`
		Notes    *string              `json:"notes"`
	}

	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	// Get the moderation result to find the item
	result, err := app.store.Moderation.GetModerationResultByID(ctx, resultID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, fmt.Errorf("moderation result not found"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	// Submit the review
	if err := app.store.Moderation.SubmitReview(ctx, resultID, user.ID, payload.Decision, payload.Notes); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Update item status based on decision
	var newItemStatus store.ItemStatus
	if payload.Decision == store.ReviewDecisionApproved {
		newItemStatus = store.ItemStatusPublished
	} else {
		newItemStatus = store.ItemStatusFlagged // Keep as flagged for rejected items
	}

	if err := app.store.Items.UpdateStatus(ctx, result.ItemID, newItemStatus); err != nil {
		app.logger.Errorw("failed to update item status after review", "error", err, "item_id", result.ItemID)
	}

	// Invalidate caches
	if app.cacheStorage.Items != nil {
		app.cacheStorage.Items.Delete(ctx, result.ItemID)
	}

	// Return updated result
	updatedResult, err := app.store.Moderation.GetModerationResultByID(ctx, resultID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, updatedResult); err != nil {
		app.internalServerError(w, r, err)
	}
}

// POST /v1/moderation/appeals - Submit appeal (user)
func (app *application) submitAppealHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

	var payload struct {
		ModerationResultID int64  `json:"moderation_result_id" validate:"required,gt=0"`
		Reason             string `json:"reason" validate:"required,min=10,max=1000"`
	}

	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	// Verify the moderation result exists and belongs to user's item
	result, err := app.store.Moderation.GetModerationResultByID(ctx, payload.ModerationResultID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, fmt.Errorf("moderation result not found"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	// Verify the item belongs to the user
	item, err := app.store.Items.GetByID(ctx, result.ItemID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if item.UserID != user.ID {
		app.forbiddenResponse(w, r, fmt.Errorf("you can only appeal moderation decisions for your own items"))
		return
	}

	// Only allow appeals for flagged or rejected items
	if result.Status != store.ModerationStatusFlagged && result.Status != store.ModerationStatusRejected {
		app.badRequestResponse(w, r, fmt.Errorf("can only appeal flagged or rejected items"))
		return
	}

	// Create the appeal
	appeal := &store.ModerationAppeal{
		ModerationResultID: payload.ModerationResultID,
		UserID:             user.ID,
		Reason:             payload.Reason,
		Status:             store.AppealStatusPending,
	}

	if err := app.store.Moderation.CreateAppeal(ctx, appeal); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Update analytics
	analytics := &store.ModerationAnalytics{
		Date:             time.Now().Truncate(24 * time.Hour),
		SchoolID:         &item.SchoolID,
		AppealsSubmitted: 1,
	}
	app.store.Moderation.UpdateAnalytics(ctx, analytics)

	if err := app.jsonResponse(w, http.StatusCreated, appeal); err != nil {
		app.internalServerError(w, r, err)
	}
}

// GET /v1/moderation/appeals - Get user's appeals
func (app *application) getUserAppealsHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

	// Parse pagination
	limit := 20
	page := 1

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	offset := (page - 1) * limit
	ctx := r.Context()

	appeals, total, err := app.store.Moderation.GetUserAppeals(ctx, user.ID, limit, offset)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	pagination := store.CalculatePaginationMeta(page, limit, total)

	response := store.PaginatedResponse{
		Data:       appeals,
		Pagination: pagination,
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// GET /v1/moderation/appeals/{id} - Get appeal details
func (app *application) getAppealHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

	appealID, ok := app.parseIDParam(w, r, "id")
	if !ok {
		return
	}

	ctx := r.Context()

	appeal, err := app.store.Moderation.GetAppealByID(ctx, appealID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, fmt.Errorf("appeal not found"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	// Check access - user can only see their own appeals, admins can see all
	if appeal.UserID != user.ID && !user.IsAdmin {
		app.forbiddenResponse(w, r, fmt.Errorf("access denied"))
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, appeal); err != nil {
		app.internalServerError(w, r, err)
	}
}

// GET /v1/moderation/appeals/pending - Get pending appeals (admin)
func (app *application) getPendingAppealsHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

	if !user.IsAdmin {
		app.forbiddenResponse(w, r, fmt.Errorf("admin access required"))
		return
	}

	// Parse pagination
	limit := 20
	page := 1

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	offset := (page - 1) * limit
	ctx := r.Context()

	appeals, total, err := app.store.Moderation.GetPendingAppeals(ctx, limit, offset)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	pagination := store.CalculatePaginationMeta(page, limit, total)

	response := store.PaginatedResponse{
		Data:       appeals,
		Pagination: pagination,
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// PATCH /v1/moderation/appeals/{id}/resolve - Resolve an appeal (admin)
func (app *application) resolveAppealHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

	if !user.IsAdmin {
		app.forbiddenResponse(w, r, fmt.Errorf("admin access required"))
		return
	}

	appealID, ok := app.parseIDParam(w, r, "id")
	if !ok {
		return
	}

	var payload struct {
		Status store.AppealStatus `json:"status" validate:"required,oneof=approved denied"`
		Notes  *string            `json:"notes"`
	}

	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	// Get the appeal first
	appeal, err := app.store.Moderation.GetAppealByID(ctx, appealID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, fmt.Errorf("appeal not found"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	if appeal.Status != store.AppealStatusPending {
		app.badRequestResponse(w, r, fmt.Errorf("appeal has already been resolved"))
		return
	}

	// Resolve the appeal
	if err := app.store.Moderation.ResolveAppeal(ctx, appealID, user.ID, payload.Status, payload.Notes); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// If approved, update the item status to published
	if payload.Status == store.AppealStatusApproved {
		result, err := app.store.Moderation.GetModerationResultByID(ctx, appeal.ModerationResultID)
		if err == nil {
			if err := app.store.Items.UpdateStatus(ctx, result.ItemID, store.ItemStatusPublished); err != nil {
				app.logger.Errorw("failed to update item status after appeal approval", "error", err)
			}

			// Invalidate caches
			if app.cacheStorage.Items != nil {
				app.cacheStorage.Items.Delete(ctx, result.ItemID)
			}

			// Update analytics
			item, _ := app.store.Items.GetByID(ctx, result.ItemID)
			if item != nil {
				analytics := &store.ModerationAnalytics{
					Date:            time.Now().Truncate(24 * time.Hour),
					SchoolID:        &item.SchoolID,
					AppealsApproved: 1,
				}
				app.store.Moderation.UpdateAnalytics(ctx, analytics)
			}
		}
	}

	// Return updated appeal
	updatedAppeal, err := app.store.Moderation.GetAppealByID(ctx, appealID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, updatedAppeal); err != nil {
		app.internalServerError(w, r, err)
	}
}

// GET /v1/moderation/analytics - Get moderation statistics (admin)
func (app *application) getModerationAnalyticsHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

	if !user.IsAdmin {
		app.forbiddenResponse(w, r, fmt.Errorf("admin access required"))
		return
	}

	ctx := r.Context()

	// Parse date range (default to last 30 days)
	toDate := time.Now()
	fromDate := toDate.AddDate(0, 0, -30)

	if fromDateStr := r.URL.Query().Get("from_date"); fromDateStr != "" {
		if fd, err := time.Parse("2006-01-02", fromDateStr); err == nil {
			fromDate = fd
		}
	}

	if toDateStr := r.URL.Query().Get("to_date"); toDateStr != "" {
		if td, err := time.Parse("2006-01-02", toDateStr); err == nil {
			toDate = td
		}
	}

	// Parse school_id filter
	var schoolID *int64
	if schoolIDStr := r.URL.Query().Get("school_id"); schoolIDStr != "" {
		if id, err := strconv.ParseInt(schoolIDStr, 10, 64); err == nil {
			schoolID = &id
		}
	}

	// Get summary
	summary, err := app.store.Moderation.GetAnalyticsSummary(ctx, fromDate, toDate, schoolID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Get daily breakdown
	daily, err := app.store.Moderation.GetAnalytics(ctx, fromDate, toDate, schoolID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Calculate rates
	var autoApprovalRate, flagRate, rejectRate, appealSuccessRate float64
	if summary.TotalScanned > 0 {
		autoApprovalRate = float64(summary.AutoApproved) / float64(summary.TotalScanned) * 100
		flagRate = float64(summary.FlaggedForReview) / float64(summary.TotalScanned) * 100
		rejectRate = float64(summary.Rejected) / float64(summary.TotalScanned) * 100
	}
	if summary.AppealsSubmitted > 0 {
		appealSuccessRate = float64(summary.AppealsApproved) / float64(summary.AppealsSubmitted) * 100
	}

	response := map[string]any{
		"summary": summary,
		"daily":   daily,
		"rates": map[string]any{
			"auto_approval_rate":  autoApprovalRate,
			"flag_rate":           flagRate,
			"reject_rate":         rejectRate,
			"appeal_success_rate": appealSuccessRate,
		},
		"period": map[string]any{
			"from_date": fromDate.Format("2006-01-02"),
			"to_date":   toDate.Format("2006-01-02"),
		},
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// GET /v1/moderation/analytics/trends - Get trend data (admin)
func (app *application) getModerationTrendsHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

	if !user.IsAdmin {
		app.forbiddenResponse(w, r, fmt.Errorf("admin access required"))
		return
	}

	ctx := r.Context()

	// Get last 7 days and compare to previous 7 days
	now := time.Now()
	currentPeriodEnd := now
	currentPeriodStart := now.AddDate(0, 0, -7)
	previousPeriodEnd := currentPeriodStart
	previousPeriodStart := currentPeriodStart.AddDate(0, 0, -7)

	// Parse school_id filter
	var schoolID *int64
	if schoolIDStr := r.URL.Query().Get("school_id"); schoolIDStr != "" {
		if id, err := strconv.ParseInt(schoolIDStr, 10, 64); err == nil {
			schoolID = &id
		}
	}

	currentSummary, err := app.store.Moderation.GetAnalyticsSummary(ctx, currentPeriodStart, currentPeriodEnd, schoolID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	previousSummary, err := app.store.Moderation.GetAnalyticsSummary(ctx, previousPeriodStart, previousPeriodEnd, schoolID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Calculate percentage changes
	calcChange := func(current, previous int) float64 {
		if previous == 0 {
			if current == 0 {
				return 0
			}
			return 100
		}
		return float64(current-previous) / float64(previous) * 100
	}

	response := map[string]any{
		"current_period": map[string]any{
			"from":    currentPeriodStart.Format("2006-01-02"),
			"to":      currentPeriodEnd.Format("2006-01-02"),
			"summary": currentSummary,
		},
		"previous_period": map[string]any{
			"from":    previousPeriodStart.Format("2006-01-02"),
			"to":      previousPeriodEnd.Format("2006-01-02"),
			"summary": previousSummary,
		},
		"changes": map[string]any{
			"total_scanned":        calcChange(currentSummary.TotalScanned, previousSummary.TotalScanned),
			"auto_approved":        calcChange(currentSummary.AutoApproved, previousSummary.AutoApproved),
			"flagged_for_review":   calcChange(currentSummary.FlaggedForReview, previousSummary.FlaggedForReview),
			"rejected":             calcChange(currentSummary.Rejected, previousSummary.Rejected),
			"flagged_inappropriate": calcChange(currentSummary.FlaggedInappropriate, previousSummary.FlaggedInappropriate),
			"flagged_scam":         calcChange(currentSummary.FlaggedScam, previousSummary.FlaggedScam),
		},
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}
