package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/dapoadedire/offloadr/backend/internal/store"
	"github.com/dapoadedire/offloadr/backend/internal/validation"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// RegisterUserPayload represents the registration request
type RegisterUserPayload struct {
	Username  string `json:"username" validate:"required,max=50"`
	Firstname string `json:"firstname" validate:"required,min=2,max=100"`
	Lastname  string `json:"lastname" validate:"required,min=2,max=100"`
	Email     string `json:"email" validate:"required,email,max=100"`
	Password  string `json:"password" validate:"required,min=8,max=72"`
	SchoolID  int64  `json:"school_id" validate:"required,gt=0"`
}

// LoginPayload represents the login request
type LoginPayload struct {
	Email    string `json:"email" validate:"omitempty,email"`
	Username string `json:"username" validate:"omitempty,max=50"`
	Password string `json:"password" validate:"required"`
}

// ResendVerificationPayload represents resend verification request
type ResendVerificationPayload struct {
	Email string `json:"email" validate:"required,email"`
}

// ForgotPasswordPayload represents forgot password request
type ForgotPasswordPayload struct {
	Email string `json:"email" validate:"required,email"`
}

// ResetPasswordPayload represents reset password request
type ResetPasswordPayload struct {
	Token           string `json:"token" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8,max=72"`
	ConfirmPassword string `json:"confirm_password" validate:"required,eqfield=NewPassword"`
}

// UserResponse represents user data in responses
type UserResponse struct {
	ID            int64   `json:"id"`
	Username      string  `json:"username"`
	Firstname     string  `json:"firstname"`
	Lastname      string  `json:"lastname"`
	Email         string  `json:"email"`
	EmailVerified bool    `json:"email_verified"`
	SchoolID      int64   `json:"school_id"`
	IsActive      bool    `json:"is_active"`
	AvatarURL     *string `json:"avatar_url,omitempty"`
	CreatedAt     string  `json:"created_at"`
}

// AuthResponse represents login response with token
type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

// MessageResponse represents message-only response
type MessageResponse struct {
	Message string `json:"message"`
}

// UserWithMessageResponse represents response with message and user
type UserWithMessageResponse struct {
	Message string       `json:"message"`
	User    UserResponse `json:"user"`
}

// UsernameAvailabilityResponse represents username availability check response
type UsernameAvailabilityResponse struct {
	Available bool   `json:"available"`
	Message   string `json:"message,omitempty"`
}

// POST /v1/auth/register
func (app *application) registerUserHandler(w http.ResponseWriter, r *http.Request) {
	var payload RegisterUserPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Validate username
	if errMsg := validation.ValidateUsername(payload.Username); errMsg != "" {
		app.badRequestResponse(w, r, fmt.Errorf("%s", errMsg))
		return
	}

	ctx := r.Context()

	// Validate email domain matches school
	school, err := app.store.Schools.GetByID(ctx, payload.SchoolID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.badRequestResponse(w, r, fmt.Errorf("invalid school ID"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	emailParts := strings.Split(payload.Email, "@")
	if len(emailParts) != 2 || !strings.HasSuffix(emailParts[1], school.Domain) {
		app.badRequestResponse(w, r, fmt.Errorf("email must match school domain: @%s or @student.%s", school.Domain, school.Domain))
		return
	}

	user := &store.User{
		Username:  payload.Username,
		Email:     payload.Email,
		Firstname: payload.Firstname,
		Lastname:  payload.Lastname,
		SchoolID:  payload.SchoolID,
	}

	// Hash password
	if err := user.Password.Set(payload.Password); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Create user
	if err := app.store.Users.Create(ctx, user); err != nil {
		switch err {
		case store.ErrDuplicateEmail:
			app.conflictResponse(w, r, fmt.Errorf("email already exists"))
		case store.ErrDuplicateUsername:
			app.conflictResponse(w, r, fmt.Errorf("username already exists"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	// Generate verification token
	plainToken := uuid.New().String()
	hashedToken := hashToken(plainToken)

	// Store verification token
	userInvitation := &store.UserInvitation{
		Token:     hashedToken,
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}

	if err := app.store.UserInvitations.Create(ctx, userInvitation); err != nil {
		app.logger.Errorw("failed to create verification token", "error", err)
		// Continue anyway - user can resend verification
	}

	// Send verification email
	verificationURL := fmt.Sprintf("%s/verify-email/%s", app.config.frontendURL, plainToken)
	if err := app.mailer.SendVerificationEmail(user.Email, user.Username, verificationURL); err != nil {
		app.logger.Errorw("failed to send verification email", "error", err)
		// Continue anyway - user can resend verification
	}

	// Return response
	response := UserWithMessageResponse{
		Message: "Registration successful! Please check your email to verify your account.",
		User: UserResponse{
			ID:            user.ID,
			Username:      user.Username,
			Firstname:     user.Firstname,
			Lastname:      user.Lastname,
			Email:         user.Email,
			EmailVerified: user.EmailVerified,
			SchoolID:      user.SchoolID,
			IsActive:      user.IsActive,
			CreatedAt:     user.CreatedAt.Format(time.RFC3339),
		},
	}

	if err := app.jsonResponse(w, http.StatusCreated, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// PUT /v1/auth/verify-email/{token}
func (app *application) verifyEmailHandler(w http.ResponseWriter, r *http.Request) {
	token := r.PathValue("token")
	if token == "" {
		app.badRequestResponse(w, r, fmt.Errorf("token is required"))
		return
	}

	ctx := r.Context()
	hashedToken := hashToken(token)

	// Get verification record
	userInvitation, err := app.store.UserInvitations.GetByToken(ctx, hashedToken)
	if err != nil {
		switch err {
		case store.ErrTokenExpired:
			app.notFoundResponse(w, r, fmt.Errorf("token expired or invalid"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	// Get user
	user, err := app.store.Users.GetByID(ctx, userInvitation.UserID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Check if already verified
	if user.EmailVerified {
		app.conflictResponse(w, r, fmt.Errorf("email already verified"))
		return
	}

	// Update user
	now := time.Now()
	user.EmailVerified = true
	user.IsActive = true
	user.ActivatedAt = &now
	user.LastLoginAt = &now

	if err := app.store.Users.Update(ctx, user); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Mark token as used
	if err := app.store.UserInvitations.MarkAsUsed(ctx, hashedToken); err != nil {
		app.logger.Errorw("failed to mark token as used", "error", err)
	}

	// Send welcome email
	loginURL := fmt.Sprintf("%s/login", app.config.frontendURL)
	if err := app.mailer.SendWelcomeEmail(user.Email, user.Username, loginURL); err != nil {
		app.logger.Errorw("failed to send welcome email", "error", err)
	}

	response := MessageResponse{
		Message: "Email verified successfully. You can now login.",
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// POST /v1/auth/resend-verification
func (app *application) resendVerificationHandler(w http.ResponseWriter, r *http.Request) {
	var payload ResendVerificationPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	// Get user
	user, err := app.store.Users.GetByEmail(ctx, payload.Email)
	if err != nil {
		// Return success even if user not found (prevent email enumeration)
		response := MessageResponse{
			Message: "If that email is registered and not verified, a verification link has been sent.",
		}
		app.jsonResponse(w, http.StatusOK, response)
		return
	}

	// Check if already verified
	if user.EmailVerified {
		// Return success even if already verified (prevent email enumeration)
		response := MessageResponse{
			Message: "If that email is registered and not verified, a verification link has been sent.",
		}
		app.jsonResponse(w, http.StatusOK, response)
		return
	}

	// Delete old verification tokens
	if err := app.store.UserInvitations.DeleteForUser(ctx, user.ID); err != nil {
		app.logger.Errorw("failed to delete old tokens", "error", err)
	}

	// Generate new verification token
	plainToken := uuid.New().String()
	hashedToken := hashToken(plainToken)

	userInvitation := &store.UserInvitation{
		Token:     hashedToken,
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}

	if err := app.store.UserInvitations.Create(ctx, userInvitation); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Send verification email
	verificationURL := fmt.Sprintf("%s/verify-email/%s", app.config.frontendURL, plainToken)
	if err := app.mailer.SendVerificationEmail(user.Email, user.Username, verificationURL); err != nil {
		app.logger.Errorw("failed to send verification email", "error", err)
		// Don't fail the request - token was created successfully
		// User can try again or contact support
	}

	response := MessageResponse{
		Message: "Verification email sent. Please check your inbox.",
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// POST /v1/auth/login
func (app *application) loginHandler(w http.ResponseWriter, r *http.Request) {
	var payload LoginPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Validate that either email or username is provided
	if payload.Email == "" && payload.Username == "" {
		app.badRequestResponse(w, r, fmt.Errorf("email or username is required"))
		return
	}

	ctx := r.Context()

	// Find user by email or username
	var user *store.User
	var err error

	if payload.Email != "" {
		user, err = app.store.Users.GetByEmail(ctx, payload.Email)
	} else {
		user, err = app.store.Users.GetByUsername(ctx, payload.Username)
	}

	if err != nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("invalid credentials"))
		return
	}

	// Check if user is active
	if !user.IsActive {
		app.forbiddenResponse(w, r, fmt.Errorf("account is inactive"))
		return
	}

	// Verify password
	if err := user.Password.Compare(payload.Password); err != nil {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("invalid credentials"))
		return
	}

	// Update last login
	now := time.Now()
	if err := app.store.Users.UpdateLastLogin(ctx, user.ID, now); err != nil {
		app.logger.Errorw("failed to update last login", "error", err)
	}

	// Generate JWT token
	claims := jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(app.config.auth.token.expiry).Unix(),
		"iat": time.Now().Unix(),
		"aud": app.config.auth.token.audience,
		"iss": app.config.auth.token.issuer,
	}

	token, err := app.authenticator.GenerateToken(claims)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Return response
	response := AuthResponse{
		Token: token,
		User: UserResponse{
			ID:            user.ID,
			Username:      user.Username,
			Firstname:     user.Firstname,
			Lastname:      user.Lastname,
			Email:         user.Email,
			EmailVerified: user.EmailVerified,
			SchoolID:      user.SchoolID,
			IsActive:      user.IsActive,
			AvatarURL:     user.AvatarURL,
			CreatedAt:     user.CreatedAt.Format(time.RFC3339),
		},
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// POST /v1/auth/forgot-password
func (app *application) forgotPasswordHandler(w http.ResponseWriter, r *http.Request) {
	var payload ForgotPasswordPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	// Get user (don't reveal if user exists)
	user, err := app.store.Users.GetByEmail(ctx, payload.Email)
	if err != nil {
		// Always return success to prevent email enumeration
		response := MessageResponse{
			Message: "If that email exists, a password reset link has been sent.",
		}
		app.jsonResponse(w, http.StatusOK, response)
		return
	}

	// Generate reset token
	plainToken := uuid.New().String()
	hashedToken := hashToken(plainToken)

	passwordReset := &store.PasswordReset{
		Token:     hashedToken,
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(1 * time.Hour),
	}

	if err := app.store.PasswordResets.Create(ctx, passwordReset); err != nil {
		app.logger.Errorw("failed to create password reset token", "error", err)
		response := MessageResponse{
			Message: "If that email exists, a password reset link has been sent.",
		}
		app.jsonResponse(w, http.StatusOK, response)
		return
	}

	// Send password reset email
	resetURL := fmt.Sprintf("%s/reset-password/%s", app.config.frontendURL, plainToken)
	if err := app.mailer.SendPasswordResetEmail(user.Email, user.Username, resetURL); err != nil {
		app.logger.Errorw("failed to send password reset email", "error", err)
	}

	response := MessageResponse{
		Message: "If that email exists, a password reset link has been sent.",
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// POST /v1/auth/reset-password
func (app *application) resetPasswordHandler(w http.ResponseWriter, r *http.Request) {
	var payload ResetPasswordPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()
	hashedToken := hashToken(payload.Token)

	// Get password reset record
	passwordReset, err := app.store.PasswordResets.GetByToken(ctx, hashedToken)
	if err != nil {
		switch err {
		case store.ErrTokenExpired:
			app.notFoundResponse(w, r, fmt.Errorf("token invalid, expired, or already used"))
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	// Get user
	user, err := app.store.Users.GetByID(ctx, passwordReset.UserID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Update user password
	if err := user.Password.Set(payload.NewPassword); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.store.Users.Update(ctx, user); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Mark token as used
	if err := app.store.PasswordResets.MarkAsUsed(ctx, hashedToken); err != nil {
		app.logger.Errorw("failed to mark token as used", "error", err)
	}

	// Delete all other reset tokens for this user
	if err := app.store.PasswordResets.DeleteForUser(ctx, user.ID); err != nil {
		app.logger.Errorw("failed to delete old tokens", "error", err)
	}

	// Send password changed confirmation email
	if err := app.mailer.SendPasswordChangedEmail(user.Email, user.Username); err != nil {
		app.logger.Errorw("failed to send password changed email", "error", err)
	}

	response := MessageResponse{
		Message: "Password reset successfully. Please login with your new password.",
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// GET /v1/auth/check-username/{username}
func (app *application) checkUsernameAvailabilityHandler(w http.ResponseWriter, r *http.Request) {
	username := r.PathValue("username")
	if username == "" {
		app.badRequestResponse(w, r, fmt.Errorf("username is required"))
		return
	}

	// Sanitize input - trim whitespace
	username = strings.TrimSpace(username)

	// Validate username format and length
	if errMsg := validation.ValidateUsername(username); errMsg != "" {
		response := UsernameAvailabilityResponse{
			Available: false,
			Message:   errMsg,
		}
		if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
			app.internalServerError(w, r, err)
		}
		return
	}

	ctx := r.Context()

	// Check database for availability
	available, err := app.store.Users.CheckUsernameAvailability(ctx, username)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	var message string
	if available {
		message = "Username is available"
	} else {
		message = "Username is already taken"
	}

	response := UsernameAvailabilityResponse{
		Available: available,
		Message:   message,
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

// Helper function to hash tokens
func hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}
