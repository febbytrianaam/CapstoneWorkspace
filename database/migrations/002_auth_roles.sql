ALTER TABLE users
  ADD COLUMN username VARCHAR(80) NULL AFTER id,
  ADD COLUMN password_hash VARCHAR(255) NULL AFTER username;

ALTER TABLE users
  MODIFY COLUMN role ENUM('superadmin', 'koordinator', 'member') NOT NULL DEFAULT 'member';

UPDATE users
SET username = LOWER(id),
    password_hash = '$2y$12$q.D4JlD/QFd.t6xIU4xSEOdXtERvWJ2MuVh6TTKIAEOzDAcRubRAK'
WHERE username IS NULL OR password_hash IS NULL;

ALTER TABLE users
  MODIFY COLUMN username VARCHAR(80) NOT NULL,
  MODIFY COLUMN password_hash VARCHAR(255) NOT NULL,
  ADD UNIQUE KEY uq_users_username (username);
