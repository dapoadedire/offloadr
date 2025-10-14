package main

import (
	"errors"
	"net/http"

	"github.com/dapoadedire/offloadr/backend/internal/store"
)

type waitlistPayload struct {
	FirstName  string `json:"first_name" validate:"required,alphaunicode,min=2,max=50"`
	University string `json:"university" validate:"required,min=2,max=100"`
	Email      string `json:"email" validate:"required,email,max=100"`
}

type waitlistResponse struct {
	TotalCount int64  `json:"total_count"`
	Message    string `json:"message"`
}

func (app *application) createWaitlistHandler(w http.ResponseWriter, r *http.Request) {
	// Placeholder implementation
	var payload waitlistPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.validationErrorResponse(w, r, err)
		return
	}

	waitlist := &store.Waitlist{
		FirstName:  payload.FirstName,
		University: payload.University,
		Email:      payload.Email,
	}
	ctx := r.Context()

	// Create waitlist entry and get total count in a single atomic operation
	totalCount, err := app.store.Waitlist.Create(ctx, waitlist)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrDuplicateEmail):
			app.conflictResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	response := waitlistResponse{
		TotalCount: totalCount,
		Message:    "Successfully joined the waitlist",
	}

	if err := app.jsonResponse(w, http.StatusCreated, response); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}
