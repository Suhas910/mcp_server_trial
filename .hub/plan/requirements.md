# FoodGroups — Requirements

## Overview
FoodGroups is a social food discovery app for friend groups. Users can create or join groups, add food items to a group, and collaboratively rate, review, and discuss those items.

## Goals
- Let friend groups share and discover food together in a shared space
- Allow honest, personal ratings and reviews per food item
- Enable real-time (eventually) discussion threads on each item
- Keep the experience fun, social, and visually rich

## User Stories

### Groups
- As a user, I can **create a group** with a name, description, emoji icon, and accent colour
- As a user, I can **invite friends** to a group via a short invite code
- As a user, I can **join a group** by entering an invite code
- As a user, I can see **all groups I belong to** on my home screen

### Food Items
- As a group member, I can **add a food item** (name, category, description, image URL) to a group
- As a group member, I can **browse food items** in a group with search and category filters
- As a group member, I can **view the full detail** of a food item

### Ratings & Reviews
- As a group member, I can **rate a food item** on a 1–5 star scale
- As a group member, I can **write a text review** alongside my rating
- I can only have **one review per food item** — re-submitting updates my existing one
- I can see the **average rating** across all group members' reviews
- I can **like** a review to show appreciation

### Discussion
- As a group member, I can **post comments** on a food item's discussion thread
- I can **like comments** posted by others

### Profile
- As a user, I can **customise my display name**, avatar emoji, and accent colour
- I can see **my activity stats**: total groups, reviews, and comments

## Non-Goals (v1)
- Real-time push updates between users
- Image uploads (image URL only)
- Native mobile app
- Email / social authentication

## Future / Next Phase
- Backend API (REST or GraphQL) replacing localStorage
- Real authentication (email / OAuth)
- Image upload to cloud storage
- Push notifications for new comments and reviews
- Real-time updates via WebSockets or SSE
