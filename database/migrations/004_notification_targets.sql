ALTER TABLE notifications
  ADD COLUMN target_user_name VARCHAR(120) NULL AFTER user_name;

ALTER TABLE notifications
  ADD INDEX idx_notifications_target (target_user_name, is_read, occurred_at);
