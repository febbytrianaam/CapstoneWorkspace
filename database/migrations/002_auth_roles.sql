ALTER TABLE users
  ADD COLUMN username VARCHAR(80) NULL AFTER id,
  ADD COLUMN password_hash VARCHAR(255) NULL AFTER username;

ALTER TABLE users
  MODIFY COLUMN role ENUM('superadmin', 'koordinator', 'member') NOT NULL DEFAULT 'member';

UPDATE users
SET username = LOWER(id),
    password_hash = '$2y$12$Y.uB3w5IILInXzJ4fFy5POwTA9l34wUIoMENYzU8W2giY6d.SOP8G'
WHERE username IS NULL OR password_hash IS NULL;

ALTER TABLE users
  MODIFY COLUMN username VARCHAR(80) NOT NULL,
  MODIFY COLUMN password_hash VARCHAR(255) NOT NULL,
  ADD UNIQUE KEY uq_users_username (username);
