package validation

import (
	"strings"
)

// restrictedUsernames is a list of usernames that cannot be used for registration
var restrictedUsernames = []string{
	// Religious/offensive terms
	"god", "allah", "jesus", "satan", "devil", "lucifer",
	// System/admin terms
	"admin", "administrator", "root", "system", "moderator", "mod",
	"support", "help", "superuser", "sysadmin",
	// Platform/reserved terms
	"offloadr", "official", "staff", "team", "api", "www",
	"mail", "email", "noreply", "no-reply",
	// Common service accounts
	"info", "contact", "sales", "billing", "legal", "abuse",
	"security", "privacy", "webmaster", "postmaster",
	// Potentially confusing
	"null", "undefined", "anonymous", "guest", "user", "test",
	"example", "sample", "demo", "default",
}

// IsUsernameRestricted checks if a username is in the restricted list
// It performs a case-insensitive comparison
func IsUsernameRestricted(username string) bool {
	lowerUsername := strings.ToLower(strings.TrimSpace(username))
	
	for _, restricted := range restrictedUsernames {
		if lowerUsername == restricted {
			return true
		}
	}
	
	return false
}

// ValidateUsername checks if a username meets all requirements
// Returns an error message if invalid, empty string if valid
func ValidateUsername(username string) string {
	username = strings.TrimSpace(username)
	
	if len(username) < 3 {
		return "username must be at least 3 characters"
	}
	
	if len(username) > 50 {
		return "username must not exceed 50 characters"
	}
	
	if IsUsernameRestricted(username) {
		return "this username is not allowed"
	}
	
	return ""
}
