ALTER TABLE meetings
  ADD COLUMN berita_acara_at DATETIME NULL AFTER host,
  ADD COLUMN deleted_at DATETIME NULL AFTER berita_acara_at,
  ADD INDEX idx_meetings_deleted_at (deleted_at);
