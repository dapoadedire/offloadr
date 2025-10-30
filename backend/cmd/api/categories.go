package main

import (
	"fmt"
	"net/http"

	"github.com/dapoadedire/offloadr/backend/internal/store"
)

// GET /v1/categories
func (app *application) listCategoriesHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	categories, err := app.store.Categories.GetAll(ctx)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, categories); err != nil {
		app.internalServerError(w, r, err)
	}
}

// GET /v1/categories/{id}
func (app *application) getCategoryByIDHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	if idStr == "" {
		app.badRequestResponse(w, r, fmt.Errorf("category ID is required"))
		return
	}

	var categoryID int64
	if _, err := fmt.Sscanf(idStr, "%d", &categoryID); err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("invalid category ID"))
		return
	}

	ctx := r.Context()

	category, err := app.store.Categories.GetByID(ctx, categoryID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, fmt.Errorf("category not found"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, category); err != nil {
		app.internalServerError(w, r, err)
	}
}

// GET /v1/categories/{category_id}/items
func (app *application) listCategoryItemsHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("category_id")
	if idStr == "" {
		app.badRequestResponse(w, r, fmt.Errorf("category ID is required"))
		return
	}

	var categoryID int64
	if _, err := fmt.Sscanf(idStr, "%d", &categoryID); err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("invalid category ID"))
		return
	}

	ctx := r.Context()

	// Verify category exists
	_, err := app.store.Categories.GetByID(ctx, categoryID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, fmt.Errorf("category not found"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	// Parse filter query with category_id filter
	var filter store.ItemsFilterQuery
	filter.Limit = 20
	filter.Page = 1
	filter.CategoryID = &categoryID

	if err := filter.Parse(r); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Force category_id filter (override any user-provided value)
	filter.CategoryID = &categoryID

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
