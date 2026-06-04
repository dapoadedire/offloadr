package mailer

import (
	"bytes"
	_ "embed"
	"fmt"
	"html/template"
	"time"

	"github.com/resend/resend-go/v2"
)

//go:embed templates/verification.html
var verificationTemplate string

//go:embed templates/welcome.html
var welcomeTemplate string

//go:embed templates/password_reset.html
var passwordResetTemplate string

//go:embed templates/password_changed.html
var passwordChangedTemplate string

type Client struct {
	fromEmail string
	client    *resend.Client
}

func NewClient(apiKey, fromEmail string) *Client {
	return &Client{
		fromEmail: fromEmail,
		client:    resend.NewClient(apiKey),
	}
}

func (c *Client) SendVerificationEmail(to, username, verificationURL string) error {
	data := EmailData{
		Username: username,
		Email:    to,
		URL:      verificationURL,
		Year:     time.Now().Year(),
	}

	htmlBody, err := renderTemplate(verificationTemplate, data)
	if err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	params := &resend.SendEmailRequest{
		From:    c.fromEmail,
		To:      []string{to},
		Subject: "Verify your Offloadr account",
		Html:    htmlBody,
	}

	_, err = c.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

func (c *Client) SendWelcomeEmail(to, username, loginURL string) error {
	data := EmailData{
		Username: username,
		Email:    to,
		URL:      loginURL,
		Year:     time.Now().Year(),
	}

	htmlBody, err := renderTemplate(welcomeTemplate, data)
	if err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	params := &resend.SendEmailRequest{
		From:    c.fromEmail,
		To:      []string{to},
		Subject: "Welcome to Offloadr!",
		Html:    htmlBody,
	}

	_, err = c.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

func (c *Client) SendPasswordResetEmail(to, username, resetURL string) error {
	data := EmailData{
		Username: username,
		Email:    to,
		URL:      resetURL,
		Year:     time.Now().Year(),
	}

	htmlBody, err := renderTemplate(passwordResetTemplate, data)
	if err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	params := &resend.SendEmailRequest{
		From:    c.fromEmail,
		To:      []string{to},
		Subject: "Reset your Offloadr password",
		Html:    htmlBody,
	}

	_, err = c.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

func (c *Client) SendPasswordChangedEmail(to, username string) error {
	data := EmailData{
		Username: username,
		Email:    to,
		Year:     time.Now().Year(),
	}

	htmlBody, err := renderTemplate(passwordChangedTemplate, data)
	if err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	params := &resend.SendEmailRequest{
		From:    c.fromEmail,
		To:      []string{to},
		Subject: "Your Offloadr password was changed",
		Html:    htmlBody,
	}

	_, err = c.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

func renderTemplate(tmplStr string, data EmailData) (string, error) {
	tmpl, err := template.New("email").Parse(tmplStr)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}
