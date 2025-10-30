package main

import (
	"fmt"
	"net/http"

	"github.com/dapoadedire/offloadr/backend/internal/store"
)

// UpdateUserPayload represents the update profile request
type UpdateUserPayload struct {
	Firstname *string `json:"firstname" validate:"omitempty,min=2,max=100"`
	Lastname  *string `json:"lastname" validate:"omitempty,min=2,max=100"`
	Phone     *string `json:"phone" validate:"omitempty,max=20"`
	Snapchat  *string `json:"snapchat" validate:"omitempty,max=50"`
	Whatsapp  *string `json:"whatsapp" validate:"omitempty,max=20"`
	AvatarURL *string `json:"avatar_url" validate:"omitempty,url"`
}

// ChangePasswordPayload represents the change password request
type ChangePasswordPayload struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8,max=72"`
	ConfirmPassword string `json:"confirm_password" validate:"required,eqfield=NewPassword"`
}

// DeactivateAccountPayload represents the deactivate account request
type DeactivateAccountPayload struct {
	Password string `json:"password" validate:"required"`
}

// DeleteAccountPayload represents the delete account request
type DeleteAccountPayload struct {
	Password     string `json:"password" validate:"required"`
	Confirmation string `json:"confirmation" validate:"required,eq=DELETE"`
}

// UserProfileResponse represents full user profile with school info
type UserProfileResponse struct {
	ID            int64          `json:"id"`
	Username      string         `json:"username"`
	Firstname     string         `json:"firstname"`
	Lastname      string         `json:"lastname"`
	Email         string         `json:"email"`
	EmailVerified bool           `json:"email_verified"`
	School        SchoolResponse `json:"school"`
	AvatarURL     *string        `json:"avatar_url,omitempty"`
	Phone         *string        `json:"phone,omitempty"`
	Snapchat      *string        `json:"snapchat,omitempty"`
	Whatsapp      *string        `json:"whatsapp,omitempty"`
	IsActive      bool           `json:"is_active"`
	CreatedAt     string         `json:"created_at"`
	UpdatedAt     string         `json:"updated_at"`
	LastLoginAt   *string        `json:"last_login_at,omitempty"`
}

// SchoolResponse represents school data
type SchoolResponse struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Domain   string `json:"domain"`
	Location string `json:"location"`
}

// PublicUserResponse represents public user profile
type PublicUserResponse struct {
	ID        int64          `json:"id"`
	Username  string         `json:"username"`
	Firstname string         `json:"firstname"`
	Lastname  string         `json:"lastname"`
	School    SchoolResponse `json:"school"`
	AvatarURL *string        `json:"avatar_url,omitempty"`
	JoinedAt  string         `json:"joined_at"`
}

// GET /v1/users/me
func (app *application) getCurrentUserHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("user not found in context"))
		return
	}

	ctx := r.Context()

	// Get school info
	school, err := app.store.Schools.GetByID(ctx, user.SchoolID)
	if err != nil {
		app.logger.Errorw("failed to get school", "error", err)
		// Continue without school info
		school = &store.School{ID: user.SchoolID, Name: "Unknown"}
	}

	var lastLogin *string
	if user.LastLoginAt != nil {
		lastLoginStr := user.LastLoginAt.Format("2006-01-02T15:04:05Z07:00")
		lastLogin = &lastLoginStr
	}

	response := UserProfileResponse{
		ID:            user.ID,
		Username:      user.Username,
		Firstname:     user.Firstname,
		Lastname:      user.Lastname,
		Email:         user.Email,
		EmailVerified: user.EmailVerified,
		School: SchoolResponse{
			ID:       school.ID,
			Name:     school.Name,
			Domain:   school.Domain,
			Location: school.Location,
		},
		AvatarURL:   user.AvatarURL,
		Phone:       user.Phone,
		Snapchat:    user.Snapchat,
		Whatsapp:    user.Whatsapp,
		IsActive:    user.IsActive,
		CreatedAt:   user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:   user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		LastLoginAt: lastLogin,
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// GET /v1/users/{id}
func (app *application) getUserByIDHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	if idStr == "" {
		app.badRequestResponse(w, r, fmt.Errorf("user ID is required"))
		return
	}

	var userID int64
	if _, err := fmt.Sscanf(idStr, "%d", &userID); err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("invalid user ID"))
		return
	}

	ctx := r.Context()

	// Get user
	user, err := app.store.Users.GetByID(ctx, userID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, fmt.Errorf("user not found"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	// Check if user is active
	if !user.IsActive {
		app.notFoundResponse(w, r, fmt.Errorf("user not found"))
		return
	}

	// Get school info
	school, err := app.store.Schools.GetByID(ctx, user.SchoolID)
	if err != nil {
		app.logger.Errorw("failed to get school", "error", err)
		school = &store.School{ID: user.SchoolID, Name: "Unknown"}
	}

	// Return public profile (no email, phone, etc.)
	response := PublicUserResponse{
		ID:        user.ID,
		Username:  user.Username,
		Firstname: user.Firstname,
		Lastname:  user.Lastname,
		School: SchoolResponse{
			ID:       school.ID,
			Name:     school.Name,
			Domain:   school.Domain,
			Location: school.Location,
		},
		AvatarURL: user.AvatarURL,
		JoinedAt:  user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// PATCH /v1/users/me
func (app *application) updateUserHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("user not found in context"))
		return
	}

	var payload UpdateUserPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	// Update only provided fields
	if payload.Firstname != nil {
		user.Firstname = *payload.Firstname
	}
	if payload.Lastname != nil {
		user.Lastname = *payload.Lastname
	}
	if payload.Phone != nil {
		user.Phone = payload.Phone
	}
	if payload.Snapchat != nil {
		user.Snapchat = payload.Snapchat
	}
	if payload.Whatsapp != nil {
		user.Whatsapp = payload.Whatsapp
	}
	if payload.AvatarURL != nil {
		user.AvatarURL = payload.AvatarURL
	}

	// Update user
	if err := app.store.Users.Update(ctx, user); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Get updated user with school info
	school, err := app.store.Schools.GetByID(ctx, user.SchoolID)
	if err != nil {
		app.logger.Errorw("failed to get school", "error", err)
		school = &store.School{ID: user.SchoolID, Name: "Unknown"}
	}

	var lastLogin *string
	if user.LastLoginAt != nil {
		lastLoginStr := user.LastLoginAt.Format("2006-01-02T15:04:05Z07:00")
		lastLogin = &lastLoginStr
	}

	response := UserProfileResponse{
		ID:            user.ID,
		Username:      user.Username,
		Firstname:     user.Firstname,
		Lastname:      user.Lastname,
		Email:         user.Email,
		EmailVerified: user.EmailVerified,
		School: SchoolResponse{
			ID:       school.ID,
			Name:     school.Name,
			Domain:   school.Domain,
			Location: school.Location,
		},
		AvatarURL:   user.AvatarURL,
		Phone:       user.Phone,
		Snapchat:    user.Snapchat,
		Whatsapp:    user.Whatsapp,
		IsActive:    user.IsActive,
		CreatedAt:   user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:   user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		LastLoginAt: lastLogin,
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// PATCH /v1/users/me/password
func (app *application) changePasswordHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("user not found in context"))
		return
	}

	var payload ChangePasswordPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	// Verify current password
	if err := user.Password.Compare(payload.CurrentPassword); err != nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("current password is incorrect"))
		return
	}

	// Check if new password is different from current
	if err := user.Password.Compare(payload.NewPassword); err == nil {
		app.badRequestResponse(w, r, fmt.Errorf("new password must be different from current password"))
		return
	}

	// Update password
	if err := user.Password.Set(payload.NewPassword); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.store.Users.Update(ctx, user); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Send confirmation email
	if err := app.mailer.SendPasswordChangedEmail(user.Email, user.Username); err != nil {
		app.logger.Errorw("failed to send password changed email", "error", err)
	}

	response := MessageResponse{
		Message: "Password changed successfully.",
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// DELETE /v1/users/me
func (app *application) deactivateAccountHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("user not found in context"))
		return
	}

	var payload DeactivateAccountPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Verify password
	if err := user.Password.Compare(payload.Password); err != nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("incorrect password"))
		return
	}

	ctx := r.Context()

	// Deactivate account
	user.IsActive = false
	if err := app.store.Users.Update(ctx, user); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	response := MessageResponse{
		Message: "Account deactivated. Login again to reactivate.",
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// DELETE /v1/users/me/permanent
func (app *application) deleteAccountPermanentlyHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	if user == nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("user not found in context"))
		return
	}

	var payload DeleteAccountPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Verify password
	if err := user.Password.Compare(payload.Password); err != nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("incorrect password"))
		return
	}

	ctx := r.Context()

	// Hard delete user (cascade will handle related records)
	if err := app.store.Users.Delete(ctx, user.ID); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	response := MessageResponse{
		Message: "Account permanently deleted. We're sorry to see you go.",
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}
