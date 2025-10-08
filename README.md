# Offloadr 🎒

**Sell your stuff before you leave campus.**

## Overview

Offloadr is a student-to-student marketplace where people can list items they want to sell before graduating or moving out. It keeps buying and selling simple, local, and safe within campus networks.

## Features

### MVP

- **User signup/login (required)**

  - Collects: full name, email (verified), password, school

- **Post item:** photo, price, category, description
- **Browse/search** listings by school or category
- **Contact seller:** chat, phone, or WhatsApp
- **Image upload + compression**
- **Simple admin panel:** manage or delete bad listings

### Later

- **More user fields:** phone, profile photo, graduation year, username
- **User profiles + verification** (school ID or email)
- **Favorites / saved listings**
- **Seller ratings + reviews**
- **In-app chat**
- **Report listing / scam prevention**
- **Email or push alerts** (new items matching interests)
- **Analytics dashboard** (top items, categories, users)
- **Moderation queue** for flagged listings

## Tech Stack (suggested)

- **Backend:** Go (Gin) or Node.js (Express)
- **Frontend:** React + TailwindCSS
- **Database:** PostgreSQL
- **Storage:** Cloudinary for images
- **Auth:** JWT or Clerk/Auth0
- **Deployment:** Docker + Render / Fly.io / EC2

## Roadmap

1. Launch MVP for one university
2. Add profile fields + verification
3. Expand to more campuses
4. Add analytics + moderation tools

## Vision

Help students offload what they no longer need, make extra cash, and help others find affordable items — all before leaving campus.
