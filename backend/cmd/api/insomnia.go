package main

import (
	"net/http"
	"os"
	"path/filepath"
)

// GET /insomnia.yaml
func (app *application) serveInsomniaCollection(w http.ResponseWriter, r *http.Request) {
	// Get the path to insomnia.yaml file
	insomniaPath := filepath.Join(".", "insomnia.yaml")

	// Read the file
	data, err := os.ReadFile(insomniaPath)
	if err != nil {
		app.logger.Errorw("failed to read insomnia.yaml", "error", err)
		app.notFoundResponse(w, r, err)
		return
	}

	// Set appropriate headers
	w.Header().Set("Content-Type", "application/x-yaml")
	w.Header().Set("Content-Disposition", "inline; filename=\"insomnia.yaml\"")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Write the file content
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}
