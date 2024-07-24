-- database: db.sqlite
-- !IMPORTANT: DO NOT USE, THIS IS THE FIRST VERSION OF THE DB
-- Tabella degli utenti
CREATE TABLE IF NOT EXISTS "users" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "username" TEXT NOT NULL UNIQUE,
  -- "email" TEXT NOT NULL UNIQUE,
  -- "name" TEXT NOT NULL,
  -- "surname" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "salt" TEXT NOT NULL
);

-- Tabella delle didascalie
CREATE TABLE IF NOT EXISTS "captions" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "text" TEXT NOT NULL
);

-- Tabella dei meme
CREATE TABLE IF NOT EXISTS "memes" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "file_name" TEXT NOT NULL
);

-- Tabella delle associazioni tra meme e didascalie
CREATE TABLE IF NOT EXISTS "meme_captions" (
  "meme_id" INTEGER NOT NULL,
  "caption_id" INTEGER NOT NULL,
  "is_correct" BOOLEAN NOT NULL,
  FOREIGN KEY ("meme_id") REFERENCES "memes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("caption_id") REFERENCES "captions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabella della cronologia dei giochi
CREATE TABLE IF NOT EXISTS "game_history" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "user_id" INTEGER NOT NULL,
  "meme_id" INTEGER NOT NULL,
  "selected_caption_id" INTEGER NOT NULL,
  "points" INTEGER NOT NULL,
  "date" DATETIME NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("meme_id") REFERENCES "memes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("selected_caption_id") REFERENCES "captions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);