package main

import (
	"fmt"
	"net/http"
	"strconv"
)

// parseIDParam extracts and validates an int64 ID from the request path.
// Returns the parsed ID and true if successful, or 0 and false if the ID
// is missing or invalid (with appropriate error response already sent).
func (app *application) parseIDParam(w http.ResponseWriter, r *http.Request, paramName string) (int64, bool) {
	idStr := r.PathValue(paramName)
	if idStr == "" {
		app.badRequestResponse(w, r, fmt.Errorf("%s is required", paramName))
		return 0, false
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id < 1 {
		app.badRequestResponse(w, r, fmt.Errorf("invalid %s", paramName))
		return 0, false
	}

	return id, true
}

// parseItemID is a convenience wrapper for parsing "id" parameter as an item ID.
func (app *application) parseItemID(w http.ResponseWriter, r *http.Request) (int64, bool) {
	return app.parseIDParam(w, r, "id")
}
