package main

import (
	"fmt"
	"net/http"

	"github.com/dapoadedire/offloadr/backend/internal/store"
)

// CreateReviewPayload represents the request body for creating a review
type CreateReviewPayload struct {
	ItemID  int64   `json:"item_id" validate:"required"`
	Rating  int     `json:"rating" validate:"required,gte=1,lte=5"`
	Comment *string `json:"comment" validate:"omitempty,max=1000"`
}

// UpdateReviewPayload represents the request body for updating a review
type UpdateReviewPayload struct {
	Rating  int     `json:"rating" validate:"required,gte=1,lte=5"`
	Comment *string `json:"comment" validate:"omitempty,max=1000"`
}

// createReviewHandler creates a new review for an item/seller
// POST /v1/reviews
func (app *application) createReviewHandler(w http.ResponseWriter, r *http.Request) {
	var payload CreateReviewPayload

	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	user := getUserFromContext(r)

	// Get the item to verify it exists and get seller ID
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

	// Prevent user from reviewing their own item
	if item.UserID == user.ID {
		app.badRequestResponse(w, r, fmt.Errorf("cannot review your own item"))
		return
	}

	review := &store.Review{
		ReviewerID: user.ID,
		SellerID:   item.UserID,
		ItemID:     payload.ItemID,
		Rating:     payload.Rating,
		Comment:    payload.Comment,
	}

	if err := app.store.Reviews.Create(r.Context(), review); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Invalidate seller rating cache (new review affects rating)
	if app.cacheStorage.Ratings != nil {
		app.cacheStorage.Ratings.Delete(r.Context(), review.SellerID)
	}

	if err := app.jsonResponse(w, http.StatusCreated, review); err != nil {
		app.internalServerError(w, r, err)
	}
}

// getReviewByIDHandler retrieves a single review by ID
// GET /v1/reviews/{id}
func (app *application) getReviewByIDHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	if idStr == "" {
		app.badRequestResponse(w, r, fmt.Errorf("review ID is required"))
		return
	}

	var reviewID int64
	if _, err := fmt.Sscanf(idStr, "%d", &reviewID); err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("invalid review ID"))
		return
	}

	review, err := app.store.Reviews.GetByID(r.Context(), reviewID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, review); err != nil {
		app.internalServerError(w, r, err)
	}
}

// updateReviewHandler updates an existing review
// PATCH /v1/reviews/{id}
func (app *application) updateReviewHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	if idStr == "" {
		app.badRequestResponse(w, r, fmt.Errorf("review ID is required"))
		return
	}

	var reviewID int64
	_, err := fmt.Sscanf(idStr, "%d", &reviewID)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	var payload UpdateReviewPayload

	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	user := getUserFromContext(r)

	// Get existing review to check ownership
	existingReview, err := app.store.Reviews.GetByID(r.Context(), reviewID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	// Check ownership
	if existingReview.ReviewerID != user.ID {
		app.forbiddenResponse(w, r, fmt.Errorf("you can only update your own reviews"))
		return
	}

	// Update review
	review := &store.Review{
		ID:      reviewID,
		Rating:  payload.Rating,
		Comment: payload.Comment,
	}

	if err := app.store.Reviews.Update(r.Context(), review); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Invalidate seller rating cache (review updated affects rating)
	if app.cacheStorage.Ratings != nil {
		app.cacheStorage.Ratings.Delete(r.Context(), existingReview.SellerID)
	}

	// Return updated review
	updatedReview, err := app.store.Reviews.GetByID(r.Context(), reviewID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, updatedReview); err != nil {
		app.internalServerError(w, r, err)
	}
}

// deleteReviewHandler deletes a review
// DELETE /v1/reviews/{id}
func (app *application) deleteReviewHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	if idStr == "" {
		app.badRequestResponse(w, r, fmt.Errorf("review ID is required"))
		return
	}

	var reviewID int64
	_, err := fmt.Sscanf(idStr, "%d", &reviewID)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	user := getUserFromContext(r)

	// Get existing review to check ownership
	existingReview, err := app.store.Reviews.GetByID(r.Context(), reviewID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	// Check ownership
	if existingReview.ReviewerID != user.ID {
		app.forbiddenResponse(w, r, fmt.Errorf("you can only delete your own reviews"))
		return
	}

	if err := app.store.Reviews.Delete(r.Context(), reviewID); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Invalidate seller rating cache (review deleted affects rating)
	if app.cacheStorage.Ratings != nil {
		app.cacheStorage.Ratings.Delete(r.Context(), existingReview.SellerID)
	}

	if err := app.jsonResponse(w, http.StatusOK, map[string]string{
		"message": "review deleted successfully",
	}); err != nil {
		app.internalServerError(w, r, err)
	}
}

// getItemReviewsHandler retrieves all reviews for a specific item
// GET /v1/items/{id}/reviews
func (app *application) getItemReviewsHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	if idStr == "" {
		app.badRequestResponse(w, r, fmt.Errorf("item ID is required"))
		return
	}

	var itemID int64
	if _, err := fmt.Sscanf(idStr, "%d", &itemID); err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("invalid item ID"))
		return
	}

	// Verify item exists
	_, err := app.store.Items.GetByID(r.Context(), itemID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

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

	// Get reviews
	reviews, total, err := app.store.Reviews.GetItemReviews(r.Context(), itemID, pq.Limit, pq.Offset)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	paginationMeta := store.CalculatePaginationMeta(pq.Page, pq.Limit, total)

	if err := app.jsonResponse(w, http.StatusOK, map[string]interface{}{
		"data":       reviews,
		"pagination": paginationMeta,
	}); err != nil {
		app.internalServerError(w, r, err)
	}
}
