package main

import (
	"fmt"
	"net/http"

	"github.com/dapoadedire/offloadr/backend/internal/store"
)

// GET /v1/favorites - Get user's favorited items
func (app *application) listFavoritesHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

	ctx := r.Context()

	var pq store.PaginationQuery
	pq.Limit = 20
	pq.Page = 1

	if err := pq.Parse(r); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	items, total, err := app.store.Favorites.GetUserFavorites(ctx, user.ID, pq.Limit, pq.Offset)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	pagination := store.CalculatePaginationMeta(pq.Page, pq.Limit, total)

	response := store.PaginatedResponse{
		Data:       items,
		Pagination: pagination,
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

type AddFavoritePayload struct {
	ItemID int64 `json:"item_id" validate:"required,gt=0"`
}

// POST /v1/favorites - Add item to favorites
func (app *application) addFavoriteHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

	var payload AddFavoritePayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	// Verify item exists and is published
	item, err := app.store.Items.GetByID(ctx, payload.ItemID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, fmt.Errorf("item not found"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	// Check if item is published
	if item.Status != store.ItemStatusPublished {
		app.badRequestResponse(w, r, fmt.Errorf("item is not available"))
		return
	}

	// Users cannot favorite their own items
	if item.UserID == user.ID {
		app.badRequestResponse(w, r, fmt.Errorf("cannot favorite your own item"))
		return
	}

	// Add to favorites
	favorite, err := app.store.Favorites.Add(ctx, user.ID, payload.ItemID)
	if err != nil {
		switch err {
		case store.ErrDuplicateResource:
			app.badRequestResponse(w, r, fmt.Errorf("item already in favorites"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	if err := app.jsonResponse(w, http.StatusCreated, favorite); err != nil {
		app.internalServerError(w, r, err)
	}
}

// DELETE /v1/favorites/{item_id} - Remove from favorites
func (app *application) removeFavoriteHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

	idStr := r.PathValue("item_id")
	if idStr == "" {
		app.badRequestResponse(w, r, fmt.Errorf("item ID is required"))
		return
	}

	var itemID int64
	if _, err := fmt.Sscanf(idStr, "%d", &itemID); err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("invalid item ID"))
		return
	}

	ctx := r.Context()

	if err := app.store.Favorites.Remove(ctx, user.ID, itemID); err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, fmt.Errorf("favorite not found"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	response := MessageResponse{
		Message: "Item removed from favorites.",
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// GET /v1/favorites/check/{item_id} - Check if item is favorited
func (app *application) checkFavoriteHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

	idStr := r.PathValue("item_id")
	if idStr == "" {
		app.badRequestResponse(w, r, fmt.Errorf("item ID is required"))
		return
	}

	var itemID int64
	if _, err := fmt.Sscanf(idStr, "%d", &itemID); err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("invalid item ID"))
		return
	}

	ctx := r.Context()

	isFavorited, err := app.store.Favorites.CheckFavorite(ctx, user.ID, itemID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	response := map[string]bool{
		"is_favorited": isFavorited,
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}
