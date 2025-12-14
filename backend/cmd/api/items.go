package main

import (
	"fmt"
	"net/http"

	"github.com/dapoadedire/offloadr/backend/internal/cache"
	"github.com/dapoadedire/offloadr/backend/internal/store"
)

type CreateItemPayload struct {
	Title       string                `json:"title" validate:"required,min=3,max=255"`
	Description string                `json:"description" validate:"required,min=10,max=5000"`
	Price       float64               `json:"price" validate:"required,gte=0"`
	Condition   store.ItemCondition   `json:"condition" validate:"required,oneof=new like_new good fair poor"`
	CategoryID  int64                 `json:"category_id" validate:"required,gt=0"`
	Negotiable  bool                  `json:"negotiable"`
	Location    string                `json:"location" validate:"required,min=2,max=255"`
	Status      *store.ItemStatus     `json:"status" validate:"omitempty,oneof=draft published"`
	Photos      []PhotoPayload        `json:"photos" validate:"omitempty,dive"`
}

type PhotoPayload struct {
	URL       string `json:"url" validate:"required,url"`
	Position  int    `json:"position" validate:"gte=0"`
	IsPrimary bool   `json:"is_primary"`
}

type UpdateItemPayload struct {
	Title       *string                `json:"title" validate:"omitempty,min=3,max=255"`
	Description *string                `json:"description" validate:"omitempty,min=10,max=5000"`
	Price       *float64               `json:"price" validate:"omitempty,gte=0"`
	Condition   *store.ItemCondition   `json:"condition" validate:"omitempty,oneof=new like_new good fair poor"`
	CategoryID  *int64                 `json:"category_id" validate:"omitempty,gt=0"`
	Negotiable  *bool                  `json:"negotiable"`
	Location    *string                `json:"location" validate:"omitempty,min=2,max=255"`
}

type UpdateStatusPayload struct {
	Status store.ItemStatus `json:"status" validate:"required,oneof=draft published archived"`
}

type MarkSoldPayload struct {
	BuyerID *int64 `json:"buyer_id"`
}

// GET /v1/items - Browse all published items with filters
func (app *application) listItemsHandler(w http.ResponseWriter, r *http.Request) {
	var filter store.ItemsFilterQuery
	filter.Limit = 20
	filter.Page = 1

	if err := filter.Parse(r); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(filter); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	var items []*store.ItemWithDetails
	var total int
	var err error

	// Generate cache key from filter parameters
	filterParams := map[string]interface{}{
		"school_id":   filter.SchoolID,
		"category_id": filter.CategoryID,
		"min_price":   filter.MinPrice,
		"max_price":   filter.MaxPrice,
		"condition":   filter.Condition,
		"negotiable":  filter.Negotiable,
		"search":      filter.Search,
		"user_id":     filter.UserID,
		"status":      filter.Status,
		"page":        filter.Page,
		"limit":       filter.Limit,
		"sort":        filter.Sort,
	}
	listKey := cache.GenerateListKey(filterParams)

	// Try to get from cache first (if Redis is enabled)
	if app.cacheStorage.Items != nil {
		items, total, err = app.cacheStorage.Items.GetList(ctx, listKey)
		if err != nil {
			// Log cache error but continue to database
			app.logger.Errorw("failed to get item list from cache", "error", err)
		}
	}

	// If cache miss or error, fetch from database
	if items == nil {
		items, total, err = app.store.Items.GetAll(ctx, filter)
		if err != nil {
			app.internalServerError(w, r, err)
			return
		}

		// Populate cache (don't fail on cache error)
		if app.cacheStorage.Items != nil {
			if err := app.cacheStorage.Items.SetList(ctx, listKey, items, total); err != nil {
				app.logger.Errorw("failed to set item list in cache", "error", err)
			}
		}
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

// GET /v1/items/search - Advanced search (same as browse with filters)
func (app *application) searchItemsHandler(w http.ResponseWriter, r *http.Request) {
	// Reuse the listItemsHandler since it already supports all filters
	app.listItemsHandler(w, r)
}

// GET /v1/items/{id} - View item details (increments views)
func (app *application) getItemByIDHandler(w http.ResponseWriter, r *http.Request) {
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

	ctx := r.Context()

	var item *store.ItemWithDetails
	var err error

	// Try to get from cache first (if Redis is enabled)
	if app.cacheStorage.Items != nil {
		item, err = app.cacheStorage.Items.Get(ctx, itemID)
		if err != nil {
			// Log cache error but continue to database
			app.logger.Errorw("failed to get item from cache", "error", err, "item_id", itemID)
		}
	}

	// If cache miss or error, fetch from database
	if item == nil {
		item, err = app.store.Items.GetByIDWithDetails(ctx, itemID)
		if err != nil {
			switch err {
			case store.ErrNotFound:
				app.notFoundResponse(w, r, fmt.Errorf("item not found"))
			default:
				app.internalServerError(w, r, err)
			}
			return
		}

		// Populate cache (don't fail on cache error)
		if app.cacheStorage.Items != nil {
			if err := app.cacheStorage.Items.Set(ctx, item); err != nil {
				app.logger.Errorw("failed to set item in cache", "error", err, "item_id", itemID)
			}
		}
	}

	// Only show published items to non-owners
	user := getUserFromContext(r)
	if item.Status != store.ItemStatusPublished {
		// Check if user is the owner
		if user == nil || user.ID != item.UserID {
			app.notFoundResponse(w, r, fmt.Errorf("item not found"))
			return
		}
	}

	// Increment views count asynchronously (don't wait for it)
	go func() {
		_ = app.store.Items.IncrementViews(r.Context(), itemID)
	}()

	if err := app.jsonResponse(w, http.StatusOK, item); err != nil {
		app.internalServerError(w, r, err)
	}
}

// GET /v1/items/{id}/contact - Get seller contact info (protected)
func (app *application) getItemContactHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

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

	ctx := r.Context()

	// Get item
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

	// Only allow access to published items
	if item.Status != store.ItemStatusPublished {
		app.notFoundResponse(w, r, fmt.Errorf("item not found"))
		return
	}

	// Get seller info
	seller, err := app.store.Users.GetByID(ctx, item.UserID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Return contact information
	contactInfo := map[string]interface{}{
		"seller_id":  seller.ID,
		"username":   seller.Username,
		"firstname":  seller.Firstname,
		"lastname":   seller.Lastname,
		"email":      seller.Email,
		"phone":      seller.Phone,
		"whatsapp":   seller.Whatsapp,
		"snapchat":   seller.Snapchat,
		"avatar_url": seller.AvatarURL,
	}

	if err := app.jsonResponse(w, http.StatusOK, contactInfo); err != nil {
		app.internalServerError(w, r, err)
	}
}

// GET /v1/items/{id}/related - Get related items (same category)
func (app *application) getRelatedItemsHandler(w http.ResponseWriter, r *http.Request) {
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

	ctx := r.Context()

	// Get the item to find its category
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

	// Get related items
	relatedItems, err := app.store.Items.GetRelated(ctx, itemID, item.CategoryID, 10)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, relatedItems); err != nil {
		app.internalServerError(w, r, err)
	}
}

// POST /v1/items - Create new listing
func (app *application) createItemHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

	var payload CreateItemPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	// Verify category exists
	_, err := app.store.Categories.GetByID(ctx, payload.CategoryID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.badRequestResponse(w, r, fmt.Errorf("invalid category_id"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	// Validate photos: only one can be primary
	if len(payload.Photos) > 0 {
		primaryCount := 0
		for _, photo := range payload.Photos {
			if photo.IsPrimary {
				primaryCount++
			}
		}
		if primaryCount > 1 {
			app.badRequestResponse(w, r, fmt.Errorf("only one photo can be marked as primary"))
			return
		}
	}

	// Create item
	status := store.ItemStatusDraft
	if payload.Status != nil {
		status = *payload.Status
	}

	item := &store.Item{
		Title:       payload.Title,
		Description: payload.Description,
		Price:       payload.Price,
		Condition:   payload.Condition,
		CategoryID:  payload.CategoryID,
		UserID:      user.ID,
		SchoolID:    user.SchoolID,
		Negotiable:  payload.Negotiable,
		Status:      status,
		Location:    payload.Location,
	}

	if err := app.store.Items.Create(ctx, item); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Create photos if provided
	if len(payload.Photos) > 0 {
		for _, photoPayload := range payload.Photos {
			photo := &store.ItemPhoto{
				ItemID:    item.ID,
				URL:       photoPayload.URL,
				Position:  photoPayload.Position,
				IsPrimary: photoPayload.IsPrimary,
			}
			if err := app.store.Items.CreatePhoto(ctx, photo); err != nil {
				// Log error but don't fail the entire request
				// The item was created successfully
				app.logger.Errorw("failed to create photo", "error", err, "item_id", item.ID)
			}
		}
	}

	// Get item with details
	itemWithDetails, err := app.store.Items.GetByIDWithDetails(ctx, item.ID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Invalidate item list caches (new item affects listings)
	if app.cacheStorage.Items != nil {
		app.cacheStorage.Items.DeleteBySchool(ctx, item.SchoolID)
		app.cacheStorage.Items.DeleteByCategory(ctx, item.CategoryID)
		app.cacheStorage.Items.DeleteByUser(ctx, item.UserID)
	}

	if err := app.jsonResponse(w, http.StatusCreated, itemWithDetails); err != nil {
		app.internalServerError(w, r, err)
	}
}

// PATCH /v1/items/{id} - Update own listing
func (app *application) updateItemHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

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

	ctx := r.Context()

	// Get existing item
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

	// Check ownership
	if item.UserID != user.ID {
		app.forbiddenResponse(w, r, fmt.Errorf("you don't have permission to update this item"))
		return
	}

	var payload UpdateItemPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Update only provided fields
	if payload.Title != nil {
		item.Title = *payload.Title
	}
	if payload.Description != nil {
		item.Description = *payload.Description
	}
	if payload.Price != nil {
		item.Price = *payload.Price
	}
	if payload.Condition != nil {
		item.Condition = *payload.Condition
	}
	if payload.CategoryID != nil {
		// Verify category exists
		_, err := app.store.Categories.GetByID(ctx, *payload.CategoryID)
		if err != nil {
			switch err {
			case store.ErrNotFound:
				app.badRequestResponse(w, r, fmt.Errorf("invalid category_id"))
			default:
				app.internalServerError(w, r, err)
			}
			return
		}
		item.CategoryID = *payload.CategoryID
	}
	if payload.Negotiable != nil {
		item.Negotiable = *payload.Negotiable
	}
	if payload.Location != nil {
		item.Location = *payload.Location
	}

	if err := app.store.Items.Update(ctx, item); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Get updated item with details
	itemWithDetails, err := app.store.Items.GetByIDWithDetails(ctx, item.ID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Invalidate item caches (item updated)
	if app.cacheStorage.Items != nil {
		app.cacheStorage.Items.Delete(ctx, item.ID)
		app.cacheStorage.Items.DeleteBySchool(ctx, item.SchoolID)
		app.cacheStorage.Items.DeleteByCategory(ctx, item.CategoryID)
		app.cacheStorage.Items.DeleteByUser(ctx, item.UserID)
	}

	if err := app.jsonResponse(w, http.StatusOK, itemWithDetails); err != nil {
		app.internalServerError(w, r, err)
	}
}

// DELETE /v1/items/{id} - Delete own listing
func (app *application) deleteItemHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

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

	ctx := r.Context()

	// Get existing item
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

	// Check ownership
	if item.UserID != user.ID {
		app.forbiddenResponse(w, r, fmt.Errorf("you don't have permission to delete this item"))
		return
	}

	if err := app.store.Items.Delete(ctx, itemID); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Invalidate item caches (item deleted)
	if app.cacheStorage.Items != nil {
		app.cacheStorage.Items.Delete(ctx, item.ID)
		app.cacheStorage.Items.DeleteBySchool(ctx, item.SchoolID)
		app.cacheStorage.Items.DeleteByCategory(ctx, item.CategoryID)
		app.cacheStorage.Items.DeleteByUser(ctx, item.UserID)
	}

	response := MessageResponse{
		Message: "Item deleted successfully.",
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// PATCH /v1/items/{id}/status - Change item status
func (app *application) updateItemStatusHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

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

	ctx := r.Context()

	// Get existing item
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

	// Check ownership
	if item.UserID != user.ID {
		app.forbiddenResponse(w, r, fmt.Errorf("you don't have permission to update this item"))
		return
	}

	var payload UpdateStatusPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := app.store.Items.UpdateStatus(ctx, itemID, payload.Status); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Invalidate item caches (status changed)
	if app.cacheStorage.Items != nil {
		app.cacheStorage.Items.Delete(ctx, item.ID)
		app.cacheStorage.Items.DeleteBySchool(ctx, item.SchoolID)
		app.cacheStorage.Items.DeleteByCategory(ctx, item.CategoryID)
		app.cacheStorage.Items.DeleteByUser(ctx, item.UserID)
	}

	response := MessageResponse{
		Message: "Item status updated successfully.",
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// POST /v1/items/{id}/mark-sold - Mark as sold
func (app *application) markItemAsSoldHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

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

	ctx := r.Context()

	// Get existing item
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

	// Check ownership
	if item.UserID != user.ID {
		app.forbiddenResponse(w, r, fmt.Errorf("you don't have permission to update this item"))
		return
	}

	var payload MarkSoldPayload
	if err := readJSON(w, r, &payload); err != nil {
		// If no body provided, that's ok
		payload.BuyerID = nil
	}

	if err := app.store.Items.MarkAsSold(ctx, itemID, payload.BuyerID); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Invalidate item caches (item marked as sold)
	if app.cacheStorage.Items != nil {
		app.cacheStorage.Items.Delete(ctx, item.ID)
		app.cacheStorage.Items.DeleteBySchool(ctx, item.SchoolID)
		app.cacheStorage.Items.DeleteByCategory(ctx, item.CategoryID)
		app.cacheStorage.Items.DeleteByUser(ctx, item.UserID)
	}

	response := MessageResponse{
		Message: "Item marked as sold successfully.",
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// POST /v1/items/{id}/repost - Repost sold item as new listing
func (app *application) repostItemHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

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

	ctx := r.Context()

	// Get existing item
	oldItem, err := app.store.Items.GetByID(ctx, itemID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, fmt.Errorf("item not found"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	// Check ownership
	if oldItem.UserID != user.ID {
		app.forbiddenResponse(w, r, fmt.Errorf("you don't have permission to repost this item"))
		return
	}

	// Check if item is sold
	if oldItem.Status != store.ItemStatusSold {
		app.badRequestResponse(w, r, fmt.Errorf("only sold items can be reposted"))
		return
	}

	// Create new item with same details
	newItem := &store.Item{
		Title:       oldItem.Title,
		Description: oldItem.Description,
		Price:       oldItem.Price,
		Condition:   oldItem.Condition,
		CategoryID:  oldItem.CategoryID,
		UserID:      user.ID,
		SchoolID:    user.SchoolID,
		Negotiable:  oldItem.Negotiable,
		Status:      store.ItemStatusDraft,
		Location:    oldItem.Location,
	}

	if err := app.store.Items.Create(ctx, newItem); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Get new item with details
	itemWithDetails, err := app.store.Items.GetByIDWithDetails(ctx, newItem.ID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusCreated, itemWithDetails); err != nil {
		app.internalServerError(w, r, err)
	}
}

// Item Photos Handlers

type UploadPhotoPayload struct {
	URL      string `json:"url" validate:"required,url"`
	Position int    `json:"position" validate:"gte=0"`
}

// POST /v1/items/{id}/photos - Upload photo(s) for item
func (app *application) uploadItemPhotoHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

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

	ctx := r.Context()

	// Get existing item
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

	// Check ownership
	if item.UserID != user.ID {
		app.forbiddenResponse(w, r, fmt.Errorf("you don't have permission to upload photos for this item"))
		return
	}

	var payload UploadPhotoPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Get existing photos to determine if this should be primary
	existingPhotos, err := app.store.Items.GetItemPhotos(ctx, itemID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// If no photos exist, make this the primary
	isPrimary := len(existingPhotos) == 0

	photo := &store.ItemPhoto{
		ItemID:    itemID,
		URL:       payload.URL,
		IsPrimary: isPrimary,
		Position:  payload.Position,
	}

	if err := app.store.Items.CreatePhoto(ctx, photo); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusCreated, photo); err != nil {
		app.internalServerError(w, r, err)
	}
}

// DELETE /v1/items/{id}/photos/{photo_id} - Delete photo
func (app *application) deleteItemPhotoHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

	idStr := r.PathValue("id")
	if idStr == "" {
		app.badRequestResponse(w, r, fmt.Errorf("item ID is required"))
		return
	}

	photoIDStr := r.PathValue("photo_id")
	if photoIDStr == "" {
		app.badRequestResponse(w, r, fmt.Errorf("photo ID is required"))
		return
	}

	var itemID, photoID int64
	if _, err := fmt.Sscanf(idStr, "%d", &itemID); err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("invalid item ID"))
		return
	}
	if _, err := fmt.Sscanf(photoIDStr, "%d", &photoID); err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("invalid photo ID"))
		return
	}

	ctx := r.Context()

	// Get existing item
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

	// Check ownership
	if item.UserID != user.ID {
		app.forbiddenResponse(w, r, fmt.Errorf("you don't have permission to delete photos from this item"))
		return
	}

	// Get photo to verify it belongs to this item
	photo, err := app.store.Items.GetPhotoByID(ctx, photoID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, fmt.Errorf("photo not found"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	if photo.ItemID != itemID {
		app.badRequestResponse(w, r, fmt.Errorf("photo does not belong to this item"))
		return
	}

	if err := app.store.Items.DeletePhoto(ctx, photoID); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	response := MessageResponse{
		Message: "Photo deleted successfully.",
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// PATCH /v1/items/{id}/photos/{photo_id}/primary - Set photo as primary
func (app *application) setItemPhotoPrimaryHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("authentication required"))
		return
	}

	idStr := r.PathValue("id")
	if idStr == "" {
		app.badRequestResponse(w, r, fmt.Errorf("item ID is required"))
		return
	}

	photoIDStr := r.PathValue("photo_id")
	if photoIDStr == "" {
		app.badRequestResponse(w, r, fmt.Errorf("photo ID is required"))
		return
	}

	var itemID, photoID int64
	if _, err := fmt.Sscanf(idStr, "%d", &itemID); err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("invalid item ID"))
		return
	}
	if _, err := fmt.Sscanf(photoIDStr, "%d", &photoID); err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("invalid photo ID"))
		return
	}

	ctx := r.Context()

	// Get existing item
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

	// Check ownership
	if item.UserID != user.ID {
		app.forbiddenResponse(w, r, fmt.Errorf("you don't have permission to modify photos for this item"))
		return
	}

	// Get photo to verify it belongs to this item
	photo, err := app.store.Items.GetPhotoByID(ctx, photoID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, fmt.Errorf("photo not found"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	if photo.ItemID != itemID {
		app.badRequestResponse(w, r, fmt.Errorf("photo does not belong to this item"))
		return
	}

	if err := app.store.Items.SetPrimaryPhoto(ctx, itemID, photoID); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	response := MessageResponse{
		Message: "Photo set as primary successfully.",
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}
