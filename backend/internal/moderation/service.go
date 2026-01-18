package moderation

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/dapoadedire/offloadr/backend/internal/store"
	"go.uber.org/zap"
)

// Config holds moderation service configuration
type Config struct {
	AutoApproveThreshold float64 // Items with confidence >= this are auto-approved (e.g., 0.95)
	FlagThreshold        float64 // Items with confidence < this are flagged for review (e.g., 0.70)
	RejectThreshold      float64 // Items with confidence < this are auto-rejected (e.g., 0.30)
	Enabled              bool    // Whether moderation is enabled
}

// Service provides content moderation functionality
type Service struct {
	gemini *GeminiClient
	store  store.Storage
	config Config
	logger *zap.SugaredLogger
}

// NewService creates a new moderation service
func NewService(gemini *GeminiClient, store store.Storage, config Config, logger *zap.SugaredLogger) *Service {
	return &Service{
		gemini: gemini,
		store:  store,
		config: config,
		logger: logger,
	}
}

// ScanResult represents the complete moderation scan result
type ScanResult struct {
	Passed             bool
	Status             store.ModerationStatus
	Flags              []Flag
	Explanation        string
	ConfidenceScore    float64
	SuggestedCondition string
	CategoryMatch      bool
	ImageResults       []*ImageScanResult
	RawResponse        map[string]any
}

// ImageScanResult represents the scan result for a single image
type ImageScanResult struct {
	PhotoID            int64
	IsAppropriate      bool
	IsStockPhoto       bool
	IsDuplicate        bool
	MatchesDescription bool
	DetectedObjects    []string
	ConfidenceScore    float64
	Notes              string
}

// ScanItem performs a complete moderation scan on an item
func (s *Service) ScanItem(ctx context.Context, item *store.ItemWithDetails) (*ScanResult, error) {
	if !s.config.Enabled {
		// If moderation is disabled, auto-approve everything
		return &ScanResult{
			Passed:          true,
			Status:          store.ModerationStatusPassed,
			ConfidenceScore: 1.0,
			Explanation:     "Moderation is disabled - auto-approved",
		}, nil
	}

	s.logger.Infow("starting moderation scan", "item_id", item.ID, "title", item.Title)

	var flags []Flag
	var explanations []string
	var imageResults []*ImageScanResult
	var allDetectedObjects []string
	rawResponse := make(map[string]any)

	// 1. Quick pattern scan (fast, no AI needed)
	contactLeak, scamIndicators, prohibitedItems, evidence := QuickScan(item.Title, item.Description)
	if contactLeak {
		flags = append(flags, Flag{Type: "contact_leak", Severity: "high", Evidence: fmt.Sprintf("Found: %v", evidence)})
		explanations = append(explanations, "Contact information detected that may bypass platform safety")
	}
	if scamIndicators {
		flags = append(flags, Flag{Type: "scam", Severity: "medium", Evidence: fmt.Sprintf("Found: %v", evidence)})
		explanations = append(explanations, "Potential scam indicators detected")
	}
	if prohibitedItems {
		flags = append(flags, Flag{Type: "prohibited", Severity: "high", Evidence: fmt.Sprintf("Found: %v", evidence)})
		explanations = append(explanations, "Potentially prohibited item detected")
	}

	// 2. Check for profanity
	if ContainsProfanity(item.Title) || ContainsProfanity(item.Description) {
		flags = append(flags, Flag{Type: "inappropriate", Severity: "medium", Evidence: "Profanity detected in listing"})
		explanations = append(explanations, "Inappropriate language detected")
	}

	// 3. Check price anomaly
	categoryName := "other"
	if item.Category != nil {
		categoryName = item.Category.Name
	}
	if isAnomaly, reason := CheckPriceAnomaly(item.Price, categoryName); isAnomaly {
		flags = append(flags, Flag{Type: "price_anomaly", Severity: "medium", Evidence: reason})
		explanations = append(explanations, reason)
	}

	// 4. Analyze images with Gemini (if available)
	if s.gemini != nil && len(item.Photos) > 0 {
		for _, photo := range item.Photos {
			imageResult, err := s.gemini.AnalyzeImage(ctx, photo.URL, item.Title, item.Description, categoryName)
			if err != nil {
				s.logger.Warnw("failed to analyze image", "photo_id", photo.ID, "error", err)
				continue
			}

			imgScanResult := &ImageScanResult{
				PhotoID:            photo.ID,
				IsAppropriate:      imageResult.Appropriate,
				IsStockPhoto:       imageResult.StockPhoto,
				MatchesDescription: true, // Default, updated based on detected objects
				DetectedObjects:    imageResult.DetectedObjects,
				ConfidenceScore:    imageResult.Confidence,
				Notes:              imageResult.Notes,
			}
			imageResults = append(imageResults, imgScanResult)
			allDetectedObjects = append(allDetectedObjects, imageResult.DetectedObjects...)

			rawResponse[fmt.Sprintf("image_%d", photo.ID)] = imageResult

			if !imageResult.Appropriate {
				flags = append(flags, Flag{
					Type:     "inappropriate",
					Severity: "high",
					Evidence: fmt.Sprintf("Image %d flagged as inappropriate: %s", photo.ID, imageResult.Notes),
				})
				explanations = append(explanations, "Inappropriate content detected in image")
			}

			if imageResult.StockPhoto {
				flags = append(flags, Flag{
					Type:     "stock_photo",
					Severity: "low",
					Evidence: fmt.Sprintf("Image %d appears to be a stock/professional photo", photo.ID),
				})
				explanations = append(explanations, "Stock or professional image detected")
			}

			for _, rf := range imageResult.RedFlags {
				flags = append(flags, Flag{
					Type:     "image_red_flag",
					Severity: "medium",
					Evidence: rf,
				})
				explanations = append(explanations, rf)
			}
		}
	}

	// 5. Analyze text with Gemini (if available)
	var textResult *TextAnalysisResult
	if s.gemini != nil {
		var err error
		textResult, err = s.gemini.AnalyzeText(ctx, item.Title, item.Description, categoryName, item.Price)
		if err != nil {
			s.logger.Warnw("failed to analyze text", "item_id", item.ID, "error", err)
		} else {
			rawResponse["text_analysis"] = textResult

			if !textResult.CleanLanguage {
				flags = append(flags, Flag{Type: "inappropriate", Severity: "medium", Evidence: "Inappropriate language detected by AI"})
			}

			switch textResult.ScamLikelihood {
case "high":
				flags = append(flags, Flag{Type: "scam", Severity: "high", Evidence: "High scam likelihood detected by AI"})
				explanations = append(explanations, "AI detected high probability of scam")
			case "medium":
				flags = append(flags, Flag{Type: "scam", Severity: "medium", Evidence: "Medium scam likelihood detected by AI"})
				explanations = append(explanations, "AI detected moderate scam indicators")
			}

			if textResult.ProhibitedItem {
				flags = append(flags, Flag{Type: "prohibited", Severity: "high", Evidence: "Prohibited item detected by AI"})
				explanations = append(explanations, "AI detected prohibited item in listing")
			}

			if textResult.ContactLeak {
				flags = append(flags, Flag{Type: "contact_leak", Severity: "high", Evidence: "Contact leak detected by AI"})
			}

			if !textResult.PriceReasonable {
				flags = append(flags, Flag{Type: "price_anomaly", Severity: "medium", Evidence: "Price flagged as unreasonable by AI"})
			}

			// Add AI-detected flags
			for _, f := range textResult.Flags {
				flags = append(flags, f)
			}

			if textResult.Explanation != "" {
				explanations = append(explanations, textResult.Explanation)
			}
		}
	}

	// 6. Validate category match (if we have detected objects)
	var categoryMatch bool = true
	if s.gemini != nil && len(allDetectedObjects) > 0 {
		match, confidence, err := s.gemini.AnalyzeCategory(ctx, item.Title, item.Description, categoryName, allDetectedObjects)
		if err == nil {
			categoryMatch = match
			rawResponse["category_analysis"] = map[string]any{
				"matches":    match,
				"confidence": confidence,
			}
			if !match {
				flags = append(flags, Flag{
					Type:     "category_mismatch",
					Severity: "low",
					Evidence: fmt.Sprintf("Item may not match category '%s' (confidence: %.2f)", categoryName, confidence),
				})
				explanations = append(explanations, "Item may be miscategorized")
			}
		}
	}

	// 7. Calculate overall confidence and determine status
	confidenceScore := s.calculateConfidence(flags)
	status := s.determineStatus(confidenceScore, flags)
	passed := status == store.ModerationStatusPassed

	// Get suggested condition from first image analysis
	var suggestedCondition string
	if len(imageResults) > 0 && s.gemini != nil && len(item.Photos) > 0 {
		// Use the first image's analysis for suggested condition
		if imgResponse, ok := rawResponse[fmt.Sprintf("image_%d", item.Photos[0].ID)].(*ImageAnalysisResult); ok {
			suggestedCondition = imgResponse.SuggestedCondition
		}
	}

	// Build final explanation
	var finalExplanation string
	if len(explanations) > 0 {
		finalExplanation = fmt.Sprintf("Moderation findings: %s", joinUnique(explanations))
	} else {
		finalExplanation = "No issues detected - content approved"
	}

	result := &ScanResult{
		Passed:             passed,
		Status:             status,
		Flags:              flags,
		Explanation:        finalExplanation,
		ConfidenceScore:    confidenceScore,
		SuggestedCondition: suggestedCondition,
		CategoryMatch:      categoryMatch,
		ImageResults:       imageResults,
		RawResponse:        rawResponse,
	}

	s.logger.Infow("moderation scan complete",
		"item_id", item.ID,
		"status", status,
		"confidence", confidenceScore,
		"flags", len(flags),
		"passed", passed,
	)

	return result, nil
}

// SaveModerationResult saves the scan result to the database
func (s *Service) SaveModerationResult(ctx context.Context, itemID int64, schoolID int64, result *ScanResult) (*store.ModerationResult, error) {
	// Convert raw response to JSON
	rawResponseJSON, _ := json.Marshal(result.RawResponse)

	// Create the moderation result
	moderationResult := &store.ModerationResult{
		ItemID:          itemID,
		Status:          result.Status,
		ConfidenceScore: &result.ConfidenceScore,
		AIExplanation:   &result.Explanation,
		AICategoryMatch: &result.CategoryMatch,
		AIRawResponse:   rawResponseJSON,
	}

	// Set suggested condition if available
	if result.SuggestedCondition != "" {
		moderationResult.AISuggestedCondition = &result.SuggestedCondition
	}

	// Set flags based on scan result
	for _, flag := range result.Flags {
		switch flag.Type {
		case "inappropriate":
			moderationResult.FlaggedInappropriate = true
		case "scam":
			moderationResult.FlaggedScam = true
		case "prohibited":
			moderationResult.FlaggedProhibited = true
		case "price_anomaly":
			moderationResult.FlaggedPriceAnomaly = true
		case "contact_leak":
			moderationResult.FlaggedContactLeak = true
		case "category_mismatch":
			moderationResult.FlaggedConditionMismatch = true
		}
	}

	// Save to database
	if err := s.store.Moderation.CreateModerationResult(ctx, moderationResult); err != nil {
		return nil, fmt.Errorf("failed to create moderation result: %w", err)
	}

	// Save image moderation results
	for _, imgResult := range result.ImageResults {
		imgMod := &store.ImageModeration{
			PhotoID:            imgResult.PhotoID,
			ModerationResultID: moderationResult.ID,
			IsAppropriate:      &imgResult.IsAppropriate,
			IsStockPhoto:       &imgResult.IsStockPhoto,
			IsDuplicate:        &imgResult.IsDuplicate,
			MatchesDescription: &imgResult.MatchesDescription,
			DetectedObjects:    imgResult.DetectedObjects,
			ConfidenceScore:    &imgResult.ConfidenceScore,
			AINotes:            &imgResult.Notes,
		}
		if err := s.store.Moderation.CreateImageModeration(ctx, imgMod); err != nil {
			s.logger.Warnw("failed to create image moderation result", "photo_id", imgResult.PhotoID, "error", err)
		}
	}

	// Update analytics
	analytics := &store.ModerationAnalytics{
		Date:         time.Now().Truncate(24 * time.Hour),
		SchoolID:     &schoolID,
		TotalScanned: 1,
	}

	switch result.Status {
	case store.ModerationStatusPassed:
		analytics.AutoApproved = 1
	case store.ModerationStatusFlagged:
		analytics.FlaggedForReview = 1
	case store.ModerationStatusRejected:
		analytics.Rejected = 1
	}

	// Count flag types
	for _, flag := range result.Flags {
		switch flag.Type {
		case "inappropriate":
			analytics.FlaggedInappropriate = 1
		case "scam":
			analytics.FlaggedScam = 1
		case "prohibited":
			analytics.FlaggedProhibited = 1
		case "price_anomaly":
			analytics.FlaggedPrice = 1
		}
	}

	if err := s.store.Moderation.UpdateAnalytics(ctx, analytics); err != nil {
		s.logger.Warnw("failed to update moderation analytics", "error", err)
	}

	return moderationResult, nil
}

// calculateConfidence calculates an overall confidence score based on flags
func (s *Service) calculateConfidence(flags []Flag) float64 {
	if len(flags) == 0 {
		return 1.0
	}

	// Start with full confidence and reduce based on flags
	confidence := 1.0
	for _, flag := range flags {
		switch flag.Severity {
		case "high":
			confidence -= 0.3
		case "medium":
			confidence -= 0.15
		case "low":
			confidence -= 0.05
		}
	}

	// Clamp to [0, 1]
	if confidence < 0 {
		confidence = 0
	}

	return confidence
}

// determineStatus determines the moderation status based on confidence and flags
func (s *Service) determineStatus(confidence float64, flags []Flag) store.ModerationStatus {
	// Check for any high-severity flags - always flag for review
	for _, flag := range flags {
		if flag.Severity == "high" {
			if flag.Type == "prohibited" || flag.Type == "inappropriate" {
				return store.ModerationStatusFlagged // Let humans decide on serious issues
			}
		}
	}

	// Use thresholds
	if confidence >= s.config.AutoApproveThreshold {
		return store.ModerationStatusPassed
	}
	if confidence <= s.config.RejectThreshold {
		return store.ModerationStatusRejected
	}
	if confidence < s.config.FlagThreshold {
		return store.ModerationStatusFlagged
	}

	return store.ModerationStatusFlagged
}

// GetModerationStatus returns the current moderation status for an item
func (s *Service) GetModerationStatus(ctx context.Context, itemID int64) (*store.ModerationResult, error) {
	return s.store.Moderation.GetModerationResultByItemID(ctx, itemID)
}

// SubmitAppeal allows a user to appeal a moderation decision
func (s *Service) SubmitAppeal(ctx context.Context, moderationResultID, userID int64, reason string) (*store.ModerationAppeal, error) {
	appeal := &store.ModerationAppeal{
		ModerationResultID: moderationResultID,
		UserID:             userID,
		Reason:             reason,
		Status:             store.AppealStatusPending,
	}

	if err := s.store.Moderation.CreateAppeal(ctx, appeal); err != nil {
		return nil, fmt.Errorf("failed to create appeal: %w", err)
	}

	// Update analytics
	result, err := s.store.Moderation.GetModerationResultByID(ctx, moderationResultID)
	if err == nil {
		item, err := s.store.Items.GetByID(ctx, result.ItemID)
		if err == nil {
			analytics := &store.ModerationAnalytics{
				Date:             time.Now().Truncate(24 * time.Hour),
				SchoolID:         &item.SchoolID,
				AppealsSubmitted: 1,
			}
			s.store.Moderation.UpdateAnalytics(ctx, analytics)
		}
	}

	return appeal, nil
}

// joinUnique joins unique strings with semicolons
func joinUnique(strs []string) string {
	seen := make(map[string]bool)
	unique := []string{}
	for _, s := range strs {
		if !seen[s] {
			seen[s] = true
			unique = append(unique, s)
		}
	}
	return fmt.Sprintf("%v", unique)
}
