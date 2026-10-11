ALTER TABLE tasks
  ADD COLUMN start_at DATETIME NULL AFTER description,
  ADD COLUMN due_at DATETIME NULL AFTER start_at,
  ADD COLUMN reviewer VARCHAR(120) NULL AFTER due_at,
  ADD COLUMN review_status VARCHAR(40) NOT NULL DEFAULT 'none' AFTER reviewer,
  ADD COLUMN submitted_at DATETIME NULL AFTER review_status,
  ADD COLUMN reviewed_at DATETIME NULL AFTER submitted_at,
  ADD COLUMN review_note TEXT NULL AFTER reviewed_at,
  ADD COLUMN deliverable_url VARCHAR(500) NULL AFTER review_note,
  ADD INDEX idx_tasks_due_at (due_at),
  ADD INDEX idx_tasks_reviewer (reviewer),
  ADD INDEX idx_tasks_review_status (review_status);
