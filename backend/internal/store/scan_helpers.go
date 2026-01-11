package store

import (
	"time"
)

// itemWithDetailsScanDest holds all destination pointers for scanning ItemWithDetails rows.
// This eliminates duplicate scan patterns across GetByIDWithDetails, GetAll, and GetRelated.
type itemWithDetailsScanDest struct {
	Item           *ItemWithDetails
	CategoryDesc   *string
	CategoryIcon   *string
	CategoryParent *int64
	CategoryTime   time.Time
}

// newItemWithDetailsScanDest creates a new ItemWithDetails and returns the scan destination.
func newItemWithDetailsScanDest() *itemWithDetailsScanDest {
	return &itemWithDetailsScanDest{
		Item: &ItemWithDetails{
			Category: &Category{},
			Seller:   &PublicUser{},
			School:   &School{},
		},
	}
}

// scanArgs returns the ordered slice of pointers for scanning a full ItemWithDetails row.
// This matches the standard SELECT order used in item queries with joins.
func (d *itemWithDetailsScanDest) scanArgs() []interface{} {
	return []interface{}{
		// Item fields (17)
		&d.Item.ID,
		&d.Item.Title,
		&d.Item.Description,
		&d.Item.Price,
		&d.Item.Condition,
		&d.Item.CategoryID,
		&d.Item.UserID,
		&d.Item.BuyerID,
		&d.Item.SchoolID,
		&d.Item.Negotiable,
		&d.Item.Status,
		&d.Item.Location,
		&d.Item.ViewsCount,
		&d.Item.ExpiresAt,
		&d.Item.CreatedAt,
		&d.Item.UpdatedAt,
		&d.Item.SoldAt,
		// Category fields (7)
		&d.Item.Category.ID,
		&d.Item.Category.Name,
		&d.Item.Category.Slug,
		&d.CategoryDesc,
		&d.CategoryIcon,
		&d.CategoryParent,
		&d.CategoryTime,
		// Seller/PublicUser fields (5)
		&d.Item.Seller.ID,
		&d.Item.Seller.Username,
		&d.Item.Seller.Firstname,
		&d.Item.Seller.Lastname,
		&d.Item.Seller.AvatarURL,
		// School fields (7)
		&d.Item.School.ID,
		&d.Item.School.Name,
		&d.Item.School.Domain,
		&d.Item.School.Location,
		&d.Item.School.IsActive,
		&d.Item.School.CreatedAt,
		&d.Item.School.UpdatedAt,
	}
}

// finalize sets the optional category fields after scanning.
func (d *itemWithDetailsScanDest) finalize() *ItemWithDetails {
	d.Item.Category.Description = d.CategoryDesc
	d.Item.Category.Icon = d.CategoryIcon
	d.Item.Category.ParentID = d.CategoryParent
	d.Item.Category.CreatedAt = d.CategoryTime
	return d.Item
}
