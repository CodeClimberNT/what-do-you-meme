-- database: db.db
-- USERS TABLE
CREATE TABLE IF NOT EXISTS "users" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "username" TEXT NOT NULL UNIQUE,
  -- "email" TEXT NOT NULL UNIQUE,
  -- "name" TEXT NOT NULL,
  -- "surname" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "salt" TEXT NOT NULL
);

-- MEMES TABLE
CREATE TABLE IF NOT EXISTS "memes" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "file_name" TEXT NOT NULL
);

-- CAPTIONS TABLE
CREATE TABLE IF NOT EXISTS "captions" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "text" TEXT NOT NULL
);

-- MEME_CAPTIONS TABLE
CREATE TABLE IF NOT EXISTS "meme_captions" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "meme_id" INTEGER NOT NULL,
  "caption_id" INTEGER NOT NULL,
  "score" INTEGER CHECK (
    "score" = 0
    OR "score" = 5
  ),
  FOREIGN KEY ("meme_id") REFERENCES "memes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("caption_id") REFERENCES "captions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- MATCHES TABLE
CREATE TABLE IF NOT EXISTS "games" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "user_id" INTEGER NOT NULL,
  "date" DATETIME NOT NULL,
  "status" TEXT NOT NULL CHECK (
    "status" = "IN_PROGRESS"
    OR "status" = "COMPLETED"
  ),
  "score" INTEGER CHECK (
    "score" = 0
    OR "score" = 5
  ),
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ROUNDS TABLE
CREATE TABLE IF NOT EXISTS "rounds" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "game_id" INTEGER NOT NULL,
  "meme_caption_id" INTEGER NOT NULL,
  "timeout" BOOLEAN NOT NULL,
  FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("meme_caption_id") REFERENCES "meme_captions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_users_username ON "users" ("username");

CREATE INDEX idx_games_user_id ON "games" ("user_id");

CREATE INDEX idx_rounds_game_id ON "rounds" ("game_id");

CREATE INDEX idx_rounds_meme_caption_id ON "rounds" ("meme_caption_id");

CREATE INDEX idx_meme_captions_meme_id ON "meme_captions" ("meme_id");