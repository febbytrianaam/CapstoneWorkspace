CREATE TABLE IF NOT EXISTS user_activity_logs (
  id VARCHAR(100) PRIMARY KEY,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_name VARCHAR(120) NOT NULL,
  role VARCHAR(40) NOT NULL,
  activity VARCHAR(120) NOT NULL,
  activity_tag VARCHAR(120) NOT NULL,
  page_name VARCHAR(80) NULL,
  target_type VARCHAR(80) NULL,
  target_id VARCHAR(120) NULL,
  target_name VARCHAR(255) NULL,
  details TEXT NULL,
  ip VARCHAR(80) NULL,
  device VARCHAR(255) NULL,
  INDEX idx_user_activity_time (occurred_at),
  INDEX idx_user_activity_user (user_name, occurred_at),
  INDEX idx_user_activity_tag (activity_tag, occurred_at),
  INDEX idx_user_activity_page (page_name, occurred_at)
) ENGINE=InnoDB;
