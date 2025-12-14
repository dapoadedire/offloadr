package main

import (
	"fmt"
	"net/http"

	"github.com/dapoadedire/offloadr/backend/internal/store"
)

// GET /v1/schools
func (app *application) listSchoolsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var schools []*store.School
	var err error

	// Try to get from cache first (if Redis is enabled)
	if app.cacheStorage.Schools != nil {
		schools, err = app.cacheStorage.Schools.GetAll(ctx)
		if err != nil {
			// Log cache error but continue to database
			app.logger.Errorw("failed to get schools from cache", "error", err)
		}
	}

	// If cache miss or error, fetch from database
	if schools == nil {
		schools, err = app.store.Schools.GetAll(ctx)
		if err != nil {
			app.internalServerError(w, r, err)
			return
		}

		// Populate cache (don't fail on cache error)
		if app.cacheStorage.Schools != nil {
			if err := app.cacheStorage.Schools.SetAll(ctx, schools); err != nil {
				app.logger.Errorw("failed to set schools in cache", "error", err)
			}
		}
	}

	if err := app.jsonResponse(w, http.StatusOK, schools); err != nil {
		app.internalServerError(w, r, err)
	}
}

// GET /v1/schools/{id}
func (app *application) getSchoolByIDHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	if idStr == "" {
		app.badRequestResponse(w, r, fmt.Errorf("school ID is required"))
		return
	}

	var schoolID int64
	if _, err := fmt.Sscanf(idStr, "%d", &schoolID); err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("invalid school ID"))
		return
	}

	ctx := r.Context()

	var school *store.School
	var err error

	// Try to get from cache first (if Redis is enabled)
	if app.cacheStorage.Schools != nil {
		school, err = app.cacheStorage.Schools.Get(ctx, schoolID)
		if err != nil {
			// Log cache error but continue to database
			app.logger.Errorw("failed to get school from cache", "error", err, "school_id", schoolID)
		}
	}

	// If cache miss or error, fetch from database
	if school == nil {
		school, err = app.store.Schools.GetByID(ctx, schoolID)
		if err != nil {
			switch err {
			case store.ErrNotFound:
				app.notFoundResponse(w, r, fmt.Errorf("school not found"))
			default:
				app.internalServerError(w, r, err)
			}
			return
		}

		// Populate cache (don't fail on cache error)
		if app.cacheStorage.Schools != nil {
			if err := app.cacheStorage.Schools.Set(ctx, school); err != nil {
				app.logger.Errorw("failed to set school in cache", "error", err, "school_id", schoolID)
			}
		}
	}

	// Only return active schools
	if !school.IsActive {
		app.notFoundResponse(w, r, fmt.Errorf("school not found"))
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, school); err != nil {
		app.internalServerError(w, r, err)
	}
}

// GET /v1/schools/{school_id}/items
func (app *application) listSchoolItemsHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("school_id")
	if idStr == "" {
		app.badRequestResponse(w, r, fmt.Errorf("school ID is required"))
		return
	}

	var schoolID int64
	if _, err := fmt.Sscanf(idStr, "%d", &schoolID); err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("invalid school ID"))
		return
	}

	ctx := r.Context()

	// Verify school exists
	school, err := app.store.Schools.GetByID(ctx, schoolID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, fmt.Errorf("school not found"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	// Only show items from active schools
	if !school.IsActive {
		app.notFoundResponse(w, r, fmt.Errorf("school not found"))
		return
	}

	// Parse filter query with school_id filter
	var filter store.ItemsFilterQuery
	filter.Limit = 20
	filter.Page = 1
	filter.SchoolID = &schoolID

	if err := filter.Parse(r); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Force school_id filter (override any user-provided value)
	filter.SchoolID = &schoolID

	if err := Validate.Struct(filter); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	items, total, err := app.store.Items.GetAll(ctx, filter)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	pagination := store.CalculatePaginationMeta(filter.Page, filter.Limit, total)

	response := store.PaginatedResponse{
		Data:       items,
		Pagination: pagination,
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}
