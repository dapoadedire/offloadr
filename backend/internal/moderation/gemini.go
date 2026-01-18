package moderation

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"google.golang.org/genai"
)

// GeminiClient wraps the Google GenAI client for moderation tasks
type GeminiClient struct {
	client *genai.Client
	model  string
}

// NewGeminiClient creates a new Gemini client for moderation
func NewGeminiClient(apiKey, model string) (*GeminiClient, error) {
	client, err := genai.NewClient(context.Background(), &genai.ClientConfig{
		APIKey:  apiKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create Gemini client: %w", err)
	}

	return &GeminiClient{
		client: client,
		model:  model,
	}, nil
}

// ImageAnalysisResult represents the result of analyzing a single image
type ImageAnalysisResult struct {
	Appropriate        bool     `json:"appropriate"`
	StockPhoto         bool     `json:"stock_photo"`
	DetectedObjects    []string `json:"detected_objects"`
	SuggestedCondition string   `json:"suggested_condition"`
	RedFlags           []string `json:"red_flags"`
	Confidence         float64  `json:"confidence"`
	Notes              string   `json:"notes"`
}

// TextAnalysisResult represents the result of analyzing text content
type TextAnalysisResult struct {
	CleanLanguage   bool   `json:"clean_language"`
	ScamLikelihood  string `json:"scam_likelihood"` // low, medium, high
	ProhibitedItem  bool   `json:"prohibited_item"`
	ContactLeak     bool   `json:"contact_leak"`
	PriceReasonable bool   `json:"price_reasonable"`
	Flags           []Flag `json:"flags"`
	Explanation     string `json:"explanation"`
}

// Flag represents a moderation flag
type Flag struct {
	Type     string `json:"type"`
	Severity string `json:"severity"` // low, medium, high
	Evidence string `json:"evidence"`
}

// AnalyzeImage analyzes an image for inappropriate content
func (c *GeminiClient) AnalyzeImage(ctx context.Context, imageURL string, itemTitle, itemDescription, itemCategory string) (*ImageAnalysisResult, error) {
	// Download the image
	imageData, mimeType, err := downloadImage(ctx, imageURL)
	if err != nil {
		return nil, fmt.Errorf("failed to download image: %w", err)
	}

	prompt := fmt.Sprintf(`You are a content moderation assistant for a student marketplace called Offloadr.

Analyze this image and determine:
1. Is the content appropriate for a student marketplace? (no nudity, violence, drugs, weapons, explicit content)
2. Does this appear to be an original photo or a stock/professional image?
3. What objects can you identify in the image?
4. What condition does the item appear to be in? (new, like_new, good, fair, poor)
5. Any red flags suggesting this could be a scam?

Context about the listing:
- Title: %s
- Description: %s
- Category: %s

IMPORTANT: You MUST respond ONLY with valid JSON in this exact format, no other text:
{
  "appropriate": true,
  "stock_photo": false,
  "detected_objects": ["object1", "object2"],
  "suggested_condition": "good",
  "red_flags": [],
  "confidence": 0.95,
  "notes": "Brief analysis notes"
}`, itemTitle, itemDescription, itemCategory)

	parts := []*genai.Part{
		{Text: prompt},
		{InlineData: &genai.Blob{Data: imageData, MIMEType: mimeType}},
	}

	result, err := c.client.Models.GenerateContent(ctx, c.model, []*genai.Content{{Parts: parts}}, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to analyze image: %w", err)
	}

	// Extract the text response
	responseText := extractTextFromResponse(result)

	// Parse the JSON response
	var analysisResult ImageAnalysisResult
	if err := parseJSONResponse(responseText, &analysisResult); err != nil {
		return nil, fmt.Errorf("failed to parse image analysis response: %w (raw: %s)", err, responseText)
	}

	return &analysisResult, nil
}

// AnalyzeText analyzes text content for violations
func (c *GeminiClient) AnalyzeText(ctx context.Context, title, description, category string, price float64) (*TextAnalysisResult, error) {
	prompt := fmt.Sprintf(`You are a content moderation assistant for a student marketplace.

Analyze this listing title and description:
Title: %s
Description: %s
Category: %s
Price: $%.2f

Check for:
1. Inappropriate language or profanity
2. Scam indicators (urgency, unusual payment requests, too-good-to-be-true claims)
3. Prohibited items (alcohol, drugs, weapons, counterfeit goods, prescription medications, adult content)
4. Contact information that bypasses the platform (phone numbers, emails, social media handles, external links)
5. Price anomalies for this category (suspiciously low prices)

IMPORTANT: You MUST respond ONLY with valid JSON in this exact format, no other text:
{
  "clean_language": true,
  "scam_likelihood": "low",
  "prohibited_item": false,
  "contact_leak": false,
  "price_reasonable": true,
  "flags": [{"type": "scam", "severity": "medium", "evidence": "example evidence"}],
  "explanation": "Brief explanation of findings"
}

If there are no flags, use an empty array: "flags": []`, title, description, category, price)

	parts := []*genai.Part{
		{Text: prompt},
	}

	result, err := c.client.Models.GenerateContent(ctx, c.model, []*genai.Content{{Parts: parts}}, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to analyze text: %w", err)
	}

	// Extract the text response
	responseText := extractTextFromResponse(result)

	// Parse the JSON response
	var analysisResult TextAnalysisResult
	if err := parseJSONResponse(responseText, &analysisResult); err != nil {
		return nil, fmt.Errorf("failed to parse text analysis response: %w (raw: %s)", err, responseText)
	}

	return &analysisResult, nil
}

// AnalyzeCategory validates if the item matches its stated category
func (c *GeminiClient) AnalyzeCategory(ctx context.Context, title, description, category string, detectedObjects []string) (bool, float64, error) {
	prompt := fmt.Sprintf(`You are a category validation assistant for a student marketplace.

Determine if this listing matches its stated category:
Title: %s
Description: %s
Stated Category: %s
Objects detected in images: %s

IMPORTANT: You MUST respond ONLY with valid JSON in this exact format, no other text:
{
  "matches_category": true,
  "confidence": 0.95,
  "suggested_category": "Electronics",
  "explanation": "Brief explanation"
}`, title, description, category, strings.Join(detectedObjects, ", "))

	parts := []*genai.Part{
		{Text: prompt},
	}

	result, err := c.client.Models.GenerateContent(ctx, c.model, []*genai.Content{{Parts: parts}}, nil)
	if err != nil {
		return false, 0, fmt.Errorf("failed to analyze category: %w", err)
	}

	// Extract the text response
	responseText := extractTextFromResponse(result)

	// Parse the JSON response
	var categoryResult struct {
		MatchesCategory bool    `json:"matches_category"`
		Confidence      float64 `json:"confidence"`
	}
	if err := parseJSONResponse(responseText, &categoryResult); err != nil {
		return false, 0, fmt.Errorf("failed to parse category analysis: %w (raw: %s)", err, responseText)
	}

	return categoryResult.MatchesCategory, categoryResult.Confidence, nil
}

// downloadImage downloads an image from a URL and returns the bytes and MIME type
func downloadImage(ctx context.Context, imageURL string) ([]byte, string, error) {
	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, imageURL, nil)
	if err != nil {
		return nil, "", err
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, "", fmt.Errorf("failed to download image: status %d", resp.StatusCode)
	}

	// Read the image data
	imageData, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}

	// Determine MIME type from Content-Type header or default to jpeg
	mimeType := resp.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "image/jpeg"
	}

	return imageData, mimeType, nil
}

// extractTextFromResponse extracts text content from a Gemini response
func extractTextFromResponse(result *genai.GenerateContentResponse) string {
	if result == nil || len(result.Candidates) == 0 {
		return ""
	}

	var text strings.Builder
	for _, candidate := range result.Candidates {
		if candidate.Content != nil {
			for _, part := range candidate.Content.Parts {
				if part.Text != "" {
					text.WriteString(part.Text)
				}
			}
		}
	}

	return text.String()
}

// parseJSONResponse parses a JSON response, handling potential markdown code blocks
func parseJSONResponse(responseText string, v any) error {
	// Clean up the response - remove markdown code blocks if present
	responseText = strings.TrimSpace(responseText)

	// Remove markdown code block markers
	if after, ok :=strings.CutPrefix(responseText, "```json"); ok  {
		responseText = after
	}
	if after, ok :=strings.CutPrefix(responseText, "```"); ok  {
		responseText = after
	}
	responseText = strings.TrimSuffix(responseText, "```")

	responseText = strings.TrimSpace(responseText)

	// Try to find JSON object in the response
	start := strings.Index(responseText, "{")
	end := strings.LastIndex(responseText, "}")
	if start != -1 && end != -1 && end > start {
		responseText = responseText[start : end+1]
	}

	return json.Unmarshal([]byte(responseText), v)
}

// EncodeImageToBase64 encodes image bytes to base64 string
func EncodeImageToBase64(data []byte) string {
	return base64.StdEncoding.EncodeToString(data)
}

// ProhibitedPatterns contains regex patterns for quick detection of prohibited content
var ProhibitedPatterns = []*regexp.Regexp{
	// Phone numbers
	regexp.MustCompile(`(?i)\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b`),
	regexp.MustCompile(`(?i)\+1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}`),

	// Email patterns
	regexp.MustCompile(`(?i)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`),

	// Social media handles
	regexp.MustCompile(`(?i)@[a-zA-Z0-9_]{3,}`),
	regexp.MustCompile(`(?i)(instagram|ig|insta|snap|snapchat|whatsapp|telegram|discord|twitter|x\.com)[\s:]*[@#]?[a-zA-Z0-9_.-]+`),

	// URLs/External links
	regexp.MustCompile(`(?i)https?://[^\s]+`),
	regexp.MustCompile(`(?i)www\.[^\s]+`),

	// Payment bypass attempts
	regexp.MustCompile(`(?i)(venmo|paypal|cash\s*app|zelle|wire\s*transfer|bitcoin|crypto|btc|eth)`),
}

// ScamPatterns contains patterns that indicate potential scams
var ScamPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)act\s*(fast|now|quick)`),
	regexp.MustCompile(`(?i)limited\s*(time|offer|stock)`),
	regexp.MustCompile(`(?i)wire\s*transfer`),
	regexp.MustCompile(`(?i)ship\s*(overseas|international)`),
	regexp.MustCompile(`(?i)too\s*good\s*to\s*be\s*true`),
	regexp.MustCompile(`(?i)100%\s*(guaranteed|refund)`),
	regexp.MustCompile(`(?i)cash\s*only`),
	regexp.MustCompile(`(?i)no\s*(questions?\s*asked|returns?)`),
	regexp.MustCompile(`(?i)moving\s*(sale|out|away)`),
	regexp.MustCompile(`(?i)must\s*sell\s*(today|now|asap)`),
}

// ProhibitedItemPatterns contains patterns for prohibited items
var ProhibitedItemPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)\b(weed|marijuana|cannabis|thc|cbd|edibles?)\b`),
	regexp.MustCompile(`(?i)\b(cocaine|heroin|meth|mdma|ecstasy|molly|lsd|shrooms?|mushrooms?)\b`),
	regexp.MustCompile(`(?i)\b(alcohol|beer|wine|liquor|vodka|whiskey|rum)\b`),
	regexp.MustCompile(`(?i)\b(gun|firearm|weapon|pistol|rifle|ammunition|ammo)\b`),
	regexp.MustCompile(`(?i)\b(fake\s*id|counterfeit|replica\s*designer)\b`),
	regexp.MustCompile(`(?i)\b(prescription|rx|pills?|medications?)\b`),
	regexp.MustCompile(`(?i)\b(vape|juul|e-?cig)\b`),
}

// QuickScan performs quick pattern matching for obvious violations
func QuickScan(title, description string) (contactLeak, scamIndicators, prohibitedItems bool, evidence []string) {
	text := title + " " + description

	// Check for contact info leakage
	for _, pattern := range ProhibitedPatterns {
		if matches := pattern.FindAllString(text, -1); len(matches) > 0 {
			contactLeak = true
			evidence = append(evidence, fmt.Sprintf("Contact leak detected: %s", strings.Join(matches, ", ")))
		}
	}

	// Check for scam patterns
	for _, pattern := range ScamPatterns {
		if matches := pattern.FindAllString(text, -1); len(matches) > 0 {
			scamIndicators = true
			evidence = append(evidence, fmt.Sprintf("Scam indicator: %s", strings.Join(matches, ", ")))
		}
	}

	// Check for prohibited items
	for _, pattern := range ProhibitedItemPatterns {
		if matches := pattern.FindAllString(text, -1); len(matches) > 0 {
			prohibitedItems = true
			evidence = append(evidence, fmt.Sprintf("Prohibited item: %s", strings.Join(matches, ", ")))
		}
	}

	return
}

// CategoryPriceRanges defines expected price ranges for categories
var CategoryPriceRanges = map[string]struct {
	Min float64
	Max float64
}{
	"electronics":   {Min: 10, Max: 2000},
	"textbooks":     {Min: 5, Max: 300},
	"furniture":     {Min: 10, Max: 500},
	"clothing":      {Min: 5, Max: 200},
	"sports":        {Min: 5, Max: 500},
	"transportation": {Min: 50, Max: 5000},
	"other":         {Min: 1, Max: 1000},
}

// CheckPriceAnomaly checks if a price is suspicious for the category
func CheckPriceAnomaly(price float64, category string) (isAnomaly bool, reason string) {
	category = strings.ToLower(category)

	ranges, ok := CategoryPriceRanges[category]
	if !ok {
		ranges = CategoryPriceRanges["other"]
	}

	if price < ranges.Min*0.1 {
		return true, fmt.Sprintf("Price ($%.2f) is suspiciously low for %s (expected min $%.2f)", price, category, ranges.Min)
	}

	if price > ranges.Max*2 {
		return true, fmt.Sprintf("Price ($%.2f) is unusually high for %s (expected max $%.2f)", price, category, ranges.Max)
	}

	return false, ""
}

// ProfanityList contains common profanity to filter (basic list)
var ProfanityList = []string{
	"fuck", "shit", "ass", "bitch", "damn", "crap", "bastard",
	"dick", "cock", "pussy", "cunt", "nigger", "faggot", "retard",
}

// ContainsProfanity checks if text contains profanity
func ContainsProfanity(text string) bool {
	lowerText := strings.ToLower(text)
	for _, word := range ProfanityList {
		if strings.Contains(lowerText, word) {
			return true
		}
	}
	return false
}

// ExtractNumericPrice extracts a numeric price from text (for validation)
func ExtractNumericPrice(text string) (float64, bool) {
	pricePattern := regexp.MustCompile(`\$?(\d+(?:,\d{3})*(?:\.\d{2})?)`)
	matches := pricePattern.FindStringSubmatch(text)
	if len(matches) > 1 {
		priceStr := strings.ReplaceAll(matches[1], ",", "")
		price, err := strconv.ParseFloat(priceStr, 64)
		if err == nil {
			return price, true
		}
	}
	return 0, false
}
