# Offloadr User Journeys

This document outlines every possible user scenario and flow in the Offloadr platform.

---

## 1. Account Creation & Onboarding

### 1.1 New User Registration (Happy Path)

1. User visits signup page
2. Enters: username, firstname, lastname, email (student email), password, school (dropdown)
3. System validates:
   - Email format is valid and matches school domain
   - Username is unique
   - Password meets requirements (min 8 chars, etc.)
   - All required fields filled
4. System creates user with `email_verified = false`, `is_active = false`
5. System sends verification email with token
6. User clicks email link
7. System marks `email_verified = true`, `is_active = true`, sets `activated_at`
8. User redirected to complete profile (add phone/snapchat/whatsapp)
9. User can now browse and post items

### 1.2 Registration with Invalid Email Domain

1. User enters email not matching selected school domain
2. System shows error: "Email must match [school] domain (@harvard.edu)"
3. User corrects email or selects correct school
4. Registration continues

### 1.3 Registration with Duplicate Email

1. User enters email already in system
2. System shows error: "Email already registered. Try logging in?"
3. User redirected to login page

### 1.4 Registration with Duplicate Username

1. User enters username already taken
2. System shows error: "Username not available. Try another?"
3. Optionally suggest available alternatives: "john_doe2", "john.doe"
4. User chooses different username

### 1.5 Email Verification Not Completed

1. User registers but doesn't verify email
2. User tries to login
3. System allows login but shows banner: "Please verify your email to post items"
4. User can browse but cannot:
   - Post items
   - Favorite items
   - Leave reviews
   - Contact sellers (limited functionality)
5. System sends reminder emails (Day 1, Day 3, Day 7)
6. After 30 days, account marked for deletion

### 1.6 Verification Email Expired

1. User clicks old verification link (>24 hours)
2. System shows: "Verification link expired"
3. User can request new verification email
4. New token generated and sent

### 1.7 Verification Email Not Received

1. User doesn't receive email
2. User clicks "Resend verification email" on login page
3. System checks email wasn't verified
4. Sends new verification email
5. Rate limit: max 3 emails per hour

---

## 2. Login & Authentication

### 2.1 Successful Login (Happy Path)

1. User enters email/username and password
2. System validates credentials
3. System checks `is_active = true`
4. System updates `last_login_at`
5. System generates JWT token
6. User redirected to dashboard/home

### 2.2 Login with Wrong Password

1. User enters correct email, wrong password
2. System shows: "Invalid credentials"
3. After 5 failed attempts: account locked for 15 minutes
4. Show "Forgot password?" link

### 2.3 Login with Non-existent Email

1. User enters email not in system
2. System shows: "Invalid credentials" (same as wrong password for security)
3. Show "Need an account? Sign up" link

### 2.4 Login with Inactive Account

1. User's account set to `is_active = false` (banned/suspended)
2. System shows: "Account suspended. Contact support."
3. Cannot login until admin reactivates

### 2.5 Login with Unverified Email

1. User tries to login before email verification
2. System allows login (see 1.5 above)
3. Shows persistent banner with "Verify Email" CTA

### 2.6 Session Expiration

1. User logged in with JWT token
2. Token expires after 7 days (configurable)
3. User tries protected action
4. System returns 401 Unauthorized
5. User redirected to login with "Session expired" message
6. After login, redirect back to intended page

---

## 3. Password Reset

### 3.1 Password Reset (Happy Path)

1. User clicks "Forgot password?" on login
2. Enters email address
3. System validates email exists
4. System creates password reset token (expires in 1 hour)
5. System sends reset email
6. User clicks reset link
7. User enters new password (2x for confirmation)
8. System validates:
   - Token is valid and not expired
   - Token not already used
   - New password meets requirements
   - Passwords match
9. System updates password, marks token as `used = true`
10. System sends "Password changed" confirmation email
11. User redirected to login

### 3.2 Password Reset - Non-existent Email

1. User enters email not in system
2. System shows: "If email exists, reset link sent" (security: don't reveal if email exists)
3. No email sent

### 3.3 Password Reset - Expired Token

1. User clicks reset link after 1 hour
2. System shows: "Reset link expired. Request new one."
3. User can request new reset link

### 3.4 Password Reset - Used Token

1. User clicks same reset link twice
2. System shows: "Reset link already used. Request new one if needed."

### 3.5 Password Reset - Rate Limiting

1. User requests multiple resets rapidly
2. System rate limits: max 3 requests per hour per email
3. Shows: "Too many requests. Try again later."

---

## 4. Profile Management

### 4.1 View Own Profile

1. User clicks profile icon
2. System displays:
   - Username, name, school, email
   - Contact info (phone, snapchat, whatsapp)
   - Avatar
   - Join date, last login
   - Number of items posted
   - Average seller rating (from reviews)
3. "Edit Profile" button available

### 4.2 Edit Profile (Happy Path)

1. User clicks "Edit Profile"
2. Can update:
   - Firstname, lastname
   - Avatar (upload new photo)
   - Phone, snapchat, whatsapp
   - (Username and email cannot be changed for security)
3. System validates changes
4. System updates `updated_at`
5. Success message shown
6. Profile refreshed

### 4.3 Edit Profile - Invalid Data

1. User enters invalid phone format
2. System shows field-specific errors
3. User corrects and resubmits

### 4.4 Upload Avatar (Happy Path)

1. User clicks "Change avatar"
2. Selects image file (JPG/PNG, max 5MB)
3. Frontend uploads to image hosting service (Cloudinary/S3/etc.)
4. Frontend compresses/resizes (300x300)
5. Frontend sends image URL to backend
6. Backend updates `avatar_url` in database
7. New avatar displayed

### 4.5 Upload Avatar - Invalid File

1. User tries to upload PDF/video
2. Frontend validates and shows: "Only JPG/PNG images allowed"
3. User selects valid file

### 4.6 Upload Avatar - File Too Large

1. User uploads 10MB image
2. Frontend validates and shows: "Image must be under 5MB"
3. User compresses or selects smaller image

### 4.7 View Other User's Profile

1. User clicks on another user's listing
2. Clicks seller name
3. System displays public profile:
   - Username, school
   - Avatar
   - Join date
   - Number of items
   - Average rating and reviews
   - Active listings
4. Cannot see private info (email, phone until interested in item)

### 4.8 Deactivate Account

1. User goes to settings
2. Clicks "Deactivate Account"
3. System shows warning: "Your listings will be hidden"
4. User confirms
5. System sets `is_active = false`
6. User logged out
7. Can reactivate by logging in again

### 4.9 Delete Account

1. User requests account deletion
2. System shows warning: "All data will be deleted. This cannot be undone."
3. User enters password to confirm
4. System:
   - Soft deletes user (or hard delete based on policy)
   - Deletes all items and photos
   - Removes favorites
   - Anonymizes reviews (keeps rating but removes comment)
5. User logged out with confirmation message

---

## 5. Browsing & Searching Items

### 5.1 Browse All Items (Happy Path)

1. User visits homepage/marketplace
2. System displays:
   - Published items (`status = 'published'`)
   - Ordered by: newest first (or relevance)
   - Paginated (20 items per page)
3. Each item shows: title, price, photo, location, school
4. User can scroll and load more

### 5.2 Browse by School

1. User selects school from filter
2. System shows only items where `item.school_id = selected_school`
3. Useful for local pickup

### 5.3 Browse by Category

1. User clicks "Electronics" category
2. System shows items where `category_id = electronics.id`
3. Shows subcategories (Laptops, Phones, etc.)
4. User can drill down to subcategory

### 5.4 Search by Keyword

1. User enters "macbook pro" in search
2. System searches:
   - `items.title` ILIKE '%macbook pro%'
   - `items.description` ILIKE '%macbook pro%'
3. Returns matching items
4. Highlights search terms in results

### 5.5 Advanced Filters

1. User applies multiple filters:
   - Price range: $100-$500
   - Condition: Like New, Good
   - School: MIT
   - Category: Electronics > Laptops
   - Negotiable: Yes
2. System combines all filters with AND
3. Shows filtered results
4. Can clear individual filters or all

### 5.6 Sort Results

1. User selects sort option:
   - Newest First (default)
   - Oldest First
   - Price: Low to High
   - Price: High to Low
   - Most Viewed
2. System re-orders results
3. Maintains filters

### 5.7 No Results Found

1. User's search/filters return 0 items
2. System shows: "No items found"
3. Suggests:
   - Remove some filters
   - Try different keywords
   - Browse all items
   - Get notified when matching items posted (future feature)

### 5.8 View Item Details

1. User clicks on item card
2. System increments `views_count`
3. Displays full item page:
   - All photos (carousel)
   - Title, price, condition
   - Full description
   - Location, school
   - Seller info (name, rating, join date)
   - "Contact Seller" button
   - "Favorite" button
   - "Report" link
   - Related items (same category)

---

## 6. Posting Items (Selling)

### 6.1 Create Listing (Happy Path)

1. User clicks "Post Item" button
2. System checks user is verified (email_verified = true)
3. User fills form:
   - Title (required)
   - Description (required)
   - Price (required, > 0)
   - Category (dropdown, required)
   - Condition (dropdown, required)
   - Location (required, e.g., "Dorm 3, Room 201")
   - Negotiable (checkbox, default: true)
   - Photos (upload 1-8 images, at least 1 required)
4. User uploads photos one by one
5. Frontend uploads to image hosting service, shows progress
6. Frontend sends image URLs to backend
7. User marks one photo as primary
8. User clicks "Save as Draft" or "Publish"
9. If "Publish":
   - Backend sets `status = 'published'`
   - Item visible immediately
10. If "Save as Draft":

- Backend sets `status = 'draft'`
- User can edit and publish later

11. Success message: "Item posted!"
12. Redirect to item detail page

### 6.2 Create Listing - Unverified User

1. Unverified user clicks "Post Item"
2. System shows: "Please verify your email first"
3. Button to resend verification email
4. Cannot proceed

### 6.3 Create Listing - Missing Required Fields

1. User tries to submit without title/price
2. System shows inline errors:
   - "Title is required"
   - "Price must be greater than 0"
3. User fills missing fields
4. Resubmits successfully

### 6.4 Create Listing - Invalid Price

1. User enters negative price or "$abc"
2. System shows: "Enter valid price (numbers only)"
3. User corrects to "100.00"

### 6.5 Create Listing - No Photos

1. User tries to submit without photos
2. System shows: "Upload at least 1 photo"
3. User uploads photo(s)

### 6.6 Create Listing - Photo Upload Failure

1. User uploads photo
2. Network error or image hosting service failure
3. Frontend shows: "Photo upload failed. Try again."
4. User retries or uploads different photo
5. Backend never receives invalid/failed upload URLs

### 6.7 Edit Listing (Own Item)

1. User views their own item
2. Clicks "Edit" button
3. System loads item data into form
4. User changes price from $100 to $80
5. User updates description
6. User deletes old photo, uploads new one via frontend
7. Frontend uploads new photo and gets URL
8. Clicks "Update"
9. Backend updates item with new photo URL, sets `updated_at`
10. Success message: "Item updated"
11. Redirect to updated item page

### 6.8 Edit Listing - Change Status

1. User edits their draft item
2. Changes status from "draft" to "published"
3. Item now visible to others
4. Or changes "published" to "archived" (temporarily hide)

### 6.9 Mark Item as Sold

1. User sold item outside platform
2. Clicks "Mark as Sold"
3. System shows modal:
   - "Who bought this item?" (optional field)
   - Input: username or email
   - Helper text: "Buyer will be able to leave a review"
   - "Skip" or "Confirm Sale"
4. If buyer provided:
   - System looks up user by username/email
   - If found: Sets `items.buyer_id = buyer.id`
   - If not found: Shows "User not found, item will be marked sold without buyer"
5. System sets `status = 'sold'`, `sold_at = NOW()`
6. Item removed from active listings
7. Still visible in seller's "Sold Items" history
8. If buyer identified (`buyer_id` set):
   - Buyer can leave review
   - Buyer sees item in "My Purchases"
9. If buyer not identified:
   - No one can leave review (or trust-based reviews disabled)

### 6.9b Edit Sold Item to Add Buyer

1. Seller realizes they forgot to add buyer when marking sold
2. Goes to sold item
3. Clicks "Edit" → "Update Buyer"
4. Enters buyer username/email
5. System updates `items.buyer_id`
6. Buyer can now leave review

### 6.10 Delete Listing

1. User clicks "Delete" on their item
2. System shows warning: "Permanently delete this item?"
3. User confirms
4. System:
   - Deletes item from database
   - Deletes all associated photos from Cloudinary
   - Removes from favorites (cascade)
   - Removes reports (cascade)
5. Success message: "Item deleted"
6. Redirect to user's listings

### 6.11 Repost Sold Item

1. User sold item, marked as sold
2. Has duplicate item to sell
3. Clicks "Repost" on sold item
4. System creates new item with same details
5. Status set to 'draft'
6. User updates details as needed
7. Publishes new listing

### 6.12 Set Item Expiration

1. User posting item for limited time (e.g., graduating soon)
2. Sets `expires_at` to 30 days from now
3. After 30 days, system auto-archives item
4. Cron job runs daily to check expired items

---

## 7. Favorites (Saved Items)

### 7.1 Add to Favorites (Happy Path)

1. User viewing item detail page
2. Clicks heart/star icon
3. System creates favorite record
4. Icon changes to filled (visual feedback)
5. Item added to "My Favorites" list

### 7.2 Remove from Favorites

1. User clicks filled heart icon
2. System deletes favorite record
3. Icon changes to outline
4. Item removed from "My Favorites"

### 7.3 Add Favorite - Not Logged In

1. Guest user clicks favorite
2. System shows: "Login to save favorites"
3. Redirects to login
4. After login, auto-add to favorites

### 7.4 View All Favorites

1. User clicks "My Favorites"
2. System displays all favorited items
3. Shows current status (available/sold)
4. Can sort/filter favorites
5. Can remove favorites in bulk

### 7.5 Favorite Item Sold

1. User has favorited item
2. Seller marks item as sold
3. User sees "SOLD" badge on favorite
4. Can remove from favorites or keep for reference

### 7.6 Favorite Item Deleted

1. User favorited item
2. Seller deletes item
3. Favorite record auto-deleted (cascade)
4. Item no longer appears in favorites

---

## 8. Reviews & Ratings

### 8.1 Leave Review (Happy Path)

1. User viewing a sold item where they are the buyer
2. Clicks "Leave Review" on item page or seller profile
3. System checks:
   - User is logged in and email verified
   - User is the buyer (`item.buyer_id = user.id`)
   - User is not the seller (CHECK constraint)
   - User hasn't already reviewed this item (UNIQUE constraint)
   - Item status is 'sold'
4. User enters:
   - Rating (1-5 stars, required)
   - Comment (optional)
5. System saves review
6. Updates seller's average rating (calculated)
7. Success: "Review submitted. Thanks!"

### 8.2 Leave Review - Not the Buyer

1. User tries to review item they didn't buy
2. System checks `item.buyer_id != user.id` (or buyer_id is null)
3. Shows: "Only the buyer can review this item"
4. Review blocked

### 8.3 Leave Review - User Is Seller

1. User tries to review their own item
2. System blocks with CHECK constraint
3. Shows: "You cannot review your own item"

### 8.4 Leave Review - Already Reviewed

1. User tries to review same item twice
2. System shows: "You already reviewed this item"
3. Option to "Edit Your Review"

### 8.5 Leave Review - Buyer Not Identified

1. Seller marked item as sold without identifying buyer
2. Item has `buyer_id = NULL`
3. "Leave Review" button hidden or disabled
4. Shows: "Buyer not identified for this sale"
5. Note: Seller can edit sold item to add buyer retrospectively

### 8.6 Edit Review

1. User views their submitted review
2. Clicks "Edit Review"
3. Changes rating from 4★ to 5★
4. Updates comment
5. System updates review, sets `updated_at`
6. Seller's average rating recalculated

### 8.7 Delete Review

1. User clicks "Delete Review"
2. Confirms deletion
3. System deletes review
4. Seller's average rating recalculated

### 8.8 View Seller's Reviews

1. User on seller's profile
2. Sees average rating (e.g., 4.7★ from 23 reviews)
3. Clicks "See All Reviews"
4. Displays all reviews:
   - Most recent first
   - Shows rating, comment, reviewer name, date
   - Badge: "Verified Buyer" (only shown for buyer_id matches)
5. Can filter by rating (5★, 4★, etc.)

### 8.9 Report Fake Review

1. User sees suspicious review (spam/fake)
2. Clicks "Report Review"
3. Selects reason (spam/fake/inappropriate)
4. Admin reviews report
5. If confirmed, review deleted
6. Note: Reviews from verified buyers (`buyer_id` set) less likely to be fake

---

## 9. Reporting Listings

### 9.1 Report Item (Happy Path)

1. User viewing item
2. Clicks "Report" link
3. Selects report type:
   - Scam/Fraud
   - Inappropriate Content
   - Spam
   - Already Sold
   - Wrong Category
   - Duplicate Listing
   - Other
4. Adds optional comment
5. Submits report
6. System creates report with `status = 'pending'`
7. Success: "Report submitted. We'll review it."
8. Admin notified

### 9.2 Report - Multiple Reports on Same Item

1. Multiple users report same item
2. Each report tracked separately
3. After 3+ reports, item auto-flagged
4. System sets `item.status = 'flagged'`
5. Item hidden from public until reviewed
6. Seller notified

### 9.3 Admin Reviews Report

1. Admin views pending reports
2. Clicks on report to see details
3. Views reported item and reporter's comment
4. Admin decides:
   - **Approve (Valid)**: Delete item, warn/ban seller
   - **Dismiss (Invalid)**: Keep item, mark report resolved
5. System updates `report.status = 'resolved'`
6. Sets `resolved_by = admin.id`, `resolved_at = NOW()`
7. Notifies reporter of outcome

### 9.4 Report - False Report

1. User maliciously reports valid items
2. Admin notices pattern
3. Admin can:
   - Warn user
   - Suspend reporting privileges
   - Ban user for abuse

---

## 10. Contacting Sellers

### 10.1 View Seller Contact Info (Happy Path)

1. User interested in item
2. Clicks "Contact Seller"
3. System checks user is logged in and verified
4. Displays seller's contact info:
   - Phone (if provided)
   - WhatsApp (if provided)
   - Snapchat (if provided)
5. User contacts via preferred method (outside platform)

### 10.2 Contact - Not Logged In

1. Guest user clicks "Contact Seller"
2. System shows: "Login to contact seller"
3. Redirects to login/signup
4. After login, shows contact info

### 10.3 Contact - Own Item

1. Seller viewing their own item
2. "Contact Seller" hidden or shows: "This is your item"

---

## 11. Admin Functions

### 11.1 Admin Dashboard

1. Admin logs in with `is_admin = true`
2. Sees admin dashboard:
   - Total users, items, reports
   - Recent activity
   - Pending reports queue
   - Flagged items
3. Quick actions for common tasks

### 11.2 Manage Users

1. Admin views user list
2. Can search/filter users
3. Actions per user:
   - View profile
   - Suspend (set `is_active = false`)
   - Reactivate
   - Delete account
   - Make admin

### 11.3 Manage Items

1. Admin views all items (including drafts/flagged)
2. Can filter by status
3. Actions per item:
   - View/edit
   - Delete
   - Change status
   - Feature item (future)

### 11.4 Review Reports (see 9.3)

### 11.5 Manage Schools

1. Admin views schools list
2. Can add new school:
   - Name, domain, location
3. Can deactivate schools
4. Can edit school details

### 11.6 Manage Categories

1. Admin views categories
2. Can add/edit/delete categories
3. Can reorder categories
4. Can create subcategories

---

## 12. Edge Cases & Error Scenarios

### 12.1 Concurrent Actions - Duplicate Favorite

**Scenario**: User clicks favorite button twice rapidly (or network lag causes duplicate requests)

- Both requests processed simultaneously
- First request creates favorite record
- Second request hits unique constraint
- Backend detects duplicate (PostgreSQL error code 23505)
- Backend returns success for both requests (idempotent)
- User sees filled heart icon (favorited state)
- No error message shown
- Result: Item favorited successfully (desired outcome achieved)

### 12.2 Race Condition - Item Deletion

**Scenario**: User viewing item while seller deletes it

- User on item page
- Seller deletes item
- User tries to favorite/contact
- System returns 404: "Item no longer available"

### 12.3 Database Connection Lost

**Scenario**: Database goes down mid-request

- User submits form
- System can't connect to database
- Shows: "Service temporarily unavailable. Try again."
- User data not lost (form still filled)

### 12.4 Photo Storage Service Down

**Scenario**: Cloudinary unavailable

- User tries to upload photo
- Upload fails after timeout
- Shows: "Unable to upload photo. Try again later."
- Can save draft without photos, add later

### 12.5 Email Service Down

**Scenario**: Can't send verification email

- User registers successfully
- Email fails to send
- System queues email for retry
- User can manually request resend later

### 12.6 Token Collision (Rare)

**Scenario**: Two password reset tokens identical (extremely rare)

- Database unique constraint prevents duplicates
- System regenerates new unique token
- Retry until unique token created

### 12.7 School Domain Conflict

**Scenario**: User's email domain matches multiple schools

- Example: multiple campuses
- System shows: "Multiple schools found. Select yours."
- User manually selects correct school

### 12.8 Bulk Actions Failure

**Scenario**: Admin tries to delete 100 items at once

- Some deletions succeed, some fail
- System logs which failed
- Shows: "Deleted 95/100 items. 5 failed. See log."
- Admin can retry failed items

### 12.9 Pagination Edge Case

**Scenario**: User on page 5, items deleted, page 5 no longer exists

- User sees: "No items on this page"
- System suggests: "Go to latest page"
- Redirects to last valid page

### 12.10 Time Zone Issues

**Scenario**: User in different timezone

- All timestamps stored as UTC in database
- Displayed in user's local timezone
- Relative times: "2 hours ago", "yesterday"
- Full timestamps on hover

---

## 13. Future Features (Not Yet Implemented)

### 13.1 Messaging System

- In-app chat between buyer and seller
- No need to share personal contact info immediately
- Message history preserved

### 13.2 Notifications

- Email alerts for new items in favorited categories
- Push notifications for messages
- Price drop alerts on favorited items

### 13.3 Payment Integration

- Secure in-platform payments
- Escrow system
- Automatic sold status after payment

### 13.4 Shipping Options

- Not just local pickup
- Integrated with shipping carriers

### 13.5 Item Requests

- Users can post "wanted" items
- Sellers can respond with matching items

### 13.6 Social Features

- Follow favorite sellers
- Share items on social media
- User reputation badges

---

## Summary

This document covers:

- ✅ 13 major user journey categories
- ✅ 100+ specific scenarios
- ✅ Happy paths and error cases
- ✅ Edge cases and race conditions
- ✅ Admin workflows
- ✅ Security considerations
- ✅ Future feature planning

Use this as a reference for:

- Development priorities
- Test case creation
- API endpoint design
- Error handling implementation
- User experience optimization
