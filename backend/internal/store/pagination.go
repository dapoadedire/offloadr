package store

import (
	"fmt"
	"net/http"
	"strconv"
)

type PaginationQuery struct {
	Limit  int    `json:"limit" validate:"gte=1,lte=100"`
	Page   int    `json:"page" validate:"gte=1"`
	Offset int    `json:"offset"`
	Sort   string `json:"sort"`
	Order  string `json:"order" validate:"oneof=asc desc"`
}

type PaginationMeta struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

type PaginatedResponse struct {
	Data       interface{}    `json:"data"`
	Pagination PaginationMeta `json:"pagination"`
}

func (pq *PaginationQuery) Parse(r *http.Request) error {
	qp := r.URL.Query()

	// Set defaults
	if pq.Limit == 0 {
		pq.Limit = 20
	}
	if pq.Page == 0 {
		pq.Page = 1
	}
	if pq.Order == "" {
		pq.Order = "desc"
	}

	// Parse limit
	if limit := qp.Get("limit"); limit != "" {
		l, err := strconv.Atoi(limit)
		if err != nil {
			return fmt.Errorf("invalid limit parameter")
		}
		if l < 1 || l > 100 {
			return fmt.Errorf("limit must be between 1 and 100")
		}
		pq.Limit = l
	}

	// Parse page
	if page := qp.Get("page"); page != "" {
		p, err := strconv.Atoi(page)
		if err != nil {
			return fmt.Errorf("invalid page parameter")
		}
		if p < 1 {
			return fmt.Errorf("page must be at least 1")
		}
		pq.Page = p
	}

	// Calculate offset
	pq.Offset = (pq.Page - 1) * pq.Limit

	// Parse sort
	if sort := qp.Get("sort"); sort != "" {
		pq.Sort = sort
	}

	// Parse order
	if order := qp.Get("order"); order != "" {
		if order != "asc" && order != "desc" {
			return fmt.Errorf("order must be 'asc' or 'desc'")
		}
		pq.Order = order
	}

	return nil
}

func CalculatePaginationMeta(page, limit, total int) PaginationMeta {
	totalPages := total / limit
	if total%limit != 0 {
		totalPages++
	}

	return PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}
}
