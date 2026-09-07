-- FoodGroups schema.
-- Mirrors the data models in part1/src/types/index.ts.
-- Safe to run repeatedly.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name          text NOT NULL,
  avatar        text NOT NULL DEFAULT '🙂',
  color         text NOT NULL DEFAULT '#f59e0b',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  emoji       text NOT NULL DEFAULT '🍽️',
  color       text NOT NULL DEFAULT '#f59e0b',
  invite_code text UNIQUE NOT NULL,
  created_by  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id  uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- Category values are kept in lockstep with the FoodCategory union type in
-- part1/src/types/index.ts. Adding a category means changing both.
CREATE TABLE IF NOT EXISTS food_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  category    text NOT NULL DEFAULT 'Other'
                CHECK (category IN ('Appetizer', 'Main Course', 'Dessert', 'Beverage',
                                    'Snack', 'Breakfast', 'Street Food', 'Bakery',
                                    'Seafood', 'Vegetarian', 'Other')),
  image_url   text NOT NULL DEFAULT '',
  added_by    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- One review per member per food item; re-posting updates the existing row.
CREATE TABLE IF NOT EXISTS reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_item_id uuid NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating       smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text         text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (food_item_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_item_id uuid NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review_likes (
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (review_id, user_id)
);

CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_user  ON group_members (user_id);
CREATE INDEX IF NOT EXISTS idx_food_items_group    ON food_items (group_id);
CREATE INDEX IF NOT EXISTS idx_reviews_food        ON reviews (food_item_id);
CREATE INDEX IF NOT EXISTS idx_comments_food       ON comments (food_item_id);
