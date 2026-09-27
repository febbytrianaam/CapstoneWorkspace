CREATE DATABASE IF NOT EXISTS capstone_workspace
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE capstone_workspace;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(80) PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(120) NOT NULL,
  full_name VARCHAR(180) NULL,
  nim VARCHAR(40) NULL,
  role ENUM('superadmin', 'koordinator', 'member') NOT NULL DEFAULT 'member',
  color VARCHAR(20) NOT NULL DEFAULT '#2563EB',
  initial VARCHAR(8) NOT NULL,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(80) PRIMARY KEY,
  phase ENUM('tugas1', 'tugas2', 'tugas3') NOT NULL DEFAULT 'tugas1',
  title VARCHAR(255) NOT NULL,
  pic VARCHAR(120) NOT NULL,
  status ENUM('Belum Dimulai', 'Sedang Dikerjakan', 'Ditunda', 'Selesai') NOT NULL DEFAULT 'Belum Dimulai',
  priority ENUM('Tinggi', 'Sedang', 'Rendah') NOT NULL DEFAULT 'Sedang',
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tasks_phase (phase),
  INDEX idx_tasks_pic (pic),
  INDEX idx_tasks_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS task_checklist_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id VARCHAR(80) NOT NULL,
  item_order INT UNSIGNED NOT NULL DEFAULT 1,
  text VARCHAR(255) NOT NULL,
  is_done TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_checklist_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE KEY uq_checklist_task_order (task_id, item_order),
  INDEX idx_checklist_task (task_id, item_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS meetings (
  id VARCHAR(80) PRIMARY KEY,
  task_id VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NULL,
  url VARCHAR(500) NULL,
  notes TEXT NULL,
  host VARCHAR(120) NULL,
  berita_acara_at DATETIME NULL,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_meeting_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  INDEX idx_meetings_task (task_id),
  INDEX idx_meetings_starts_at (starts_at),
  INDEX idx_meetings_deleted_at (deleted_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(80) PRIMARY KEY,
  user_name VARCHAR(120) NOT NULL,
  text VARCHAR(500) NOT NULL,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  INDEX idx_notifications_time (occurred_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(80) PRIMARY KEY,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_name VARCHAR(120) NOT NULL,
  role VARCHAR(40) NOT NULL,
  action VARCHAR(120) NOT NULL,
  action_tag VARCHAR(120) NOT NULL,
  object_type VARCHAR(80) NULL,
  object_id VARCHAR(80) NULL,
  object_name VARCHAR(255) NULL,
  details TEXT NOT NULL,
  changes_json JSON NULL,
  ip VARCHAR(80) NULL,
  device VARCHAR(255) NULL,
  INDEX idx_audit_time (occurred_at),
  INDEX idx_audit_action (action)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS role_permissions (
  role VARCHAR(40) NOT NULL,
  area VARCHAR(80) NOT NULL,
  permission VARCHAR(80) NOT NULL,
  allowed TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (role, area, permission),
  INDEX idx_role_permissions_role (role)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS project_guides (
  id VARCHAR(80) PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size INT UNSIGNED NOT NULL,
  file_data MEDIUMBLOB NOT NULL,
  uploaded_by VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_project_guides_created (created_at)
) ENGINE=InnoDB;

INSERT INTO users (id, username, password_hash, name, full_name, nim, role, color, initial, last_login_at) VALUES
('Febby', 'febby', '$2y$12$q.D4JlD/QFd.t6xIU4xSEOdXtERvWJ2MuVh6TTKIAEOzDAcRubRAK', 'Febby', 'Febby Triana Amalia', '050627749', 'superadmin', '#1E40AF', 'FB', NOW()),
('Cintia', 'cintia', '$2y$12$q.D4JlD/QFd.t6xIU4xSEOdXtERvWJ2MuVh6TTKIAEOzDAcRubRAK', 'Cintia', 'Rohatul Cintia Nurfajar', '050765966', 'member', '#7C3AED', 'CT', DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
('Rival', 'rival', '$2y$12$q.D4JlD/QFd.t6xIU4xSEOdXtERvWJ2MuVh6TTKIAEOzDAcRubRAK', 'Rival', 'Rival Fauzi', '051391346', 'member', '#059669', 'RV', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('Farah', 'farah', '$2y$12$q.D4JlD/QFd.t6xIU4xSEOdXtERvWJ2MuVh6TTKIAEOzDAcRubRAK', 'Farah', 'Farah Syahira', '051417488', 'member', '#DB2777', 'FR', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('Anggi', 'anggi', '$2y$12$q.D4JlD/QFd.t6xIU4xSEOdXtERvWJ2MuVh6TTKIAEOzDAcRubRAK', 'Anggi', 'Anggi Hermawan', '051316918', 'member', '#EA580C', 'AG', DATE_SUB(NOW(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE username = VALUES(username), password_hash = VALUES(password_hash), name = VALUES(name), full_name = VALUES(full_name), nim = VALUES(nim), role = VALUES(role), color = VALUES(color), initial = VALUES(initial);

INSERT INTO tasks (id, phase, title, pic, status, priority, description) VALUES
('t-101', 'tugas1', 'Konsultasikan judul project dan ketentuan penggunaan data kepada tutor', 'Febby', 'Sedang Dikerjakan', 'Tinggi', 'Tanyakan konfirmasi judul sementara serta aturan data yang boleh digunakan dalam Capstone.'),
('t-105', 'tugas1', 'Lengkapi analisis proses persediaan obat berdasarkan kondisi aktual Klinik Shifa Medika', 'Rival', 'Sedang Dikerjakan', 'Tinggi', 'Lengkapi kondisi nyata proses persediaan obat dari obat masuk hingga stock opname.'),
('t-109', 'tugas1', 'Susun struktur awal dokumen proposal Tugas 1 di Microsoft Word', 'Cintia', 'Sedang Dikerjakan', 'Tinggi', 'Siapkan dokumen utama proposal mulai dari cover dan struktur isi sesuai panduan UT.'),
('t-201', 'tugas2', 'Turunkan kebutuhan tervalidasi menjadi kebutuhan fungsional dan non-fungsional', 'Febby', 'Belum Dimulai', 'Tinggi', 'Gunakan hasil kebutuhan Tugas 1 sebagai dasar untuk menyusun kebutuhan sistem.'),
('t-301', 'tugas3', 'Finalisasi aplikasi dan pastikan seluruh fitur utama dapat digunakan', 'Febby', 'Belum Dimulai', 'Tinggi', 'Pastikan fungsi utama berjalan lancar dan sesuai kebutuhan.')
ON DUPLICATE KEY UPDATE title = VALUES(title), phase = VALUES(phase), pic = VALUES(pic), status = VALUES(status), priority = VALUES(priority), description = VALUES(description);

INSERT INTO task_checklist_items (task_id, item_order, text, is_done) VALUES
('t-101', 1, 'Konfirmasi judul sementara', 1),
('t-101', 2, 'Tanyakan aturan data', 1),
('t-101', 3, 'Catat jawaban tutor', 0),
('t-105', 1, 'Obat masuk', 1),
('t-105', 2, 'Penyimpanan', 1),
('t-105', 3, 'Stock opname', 0),
('t-109', 1, 'Cover', 1),
('t-109', 2, 'Pendahuluan', 1),
('t-201', 1, 'Kebutuhan fungsional', 0),
('t-301', 1, 'Fungsi utama', 0)
ON DUPLICATE KEY UPDATE text = VALUES(text), is_done = VALUES(is_done);

INSERT INTO meetings (id, task_id, title, starts_at, ends_at, url, notes, host) VALUES
('m-101-1', 't-101', 'Bimbingan Tutor #1 - Konsultasi Judul & Ketentuan Data', '2026-09-28 14:30:00', '2026-09-28 15:30:00', 'https://meet.google.com/abc-defg-hij', 'Diskusi persetujuan judul Klinik Shifa Medika & ketentuan anonimitas data UT.', 'Febby'),
('m-101-2', 't-101', 'Rapat Internal Tim - Persiapan Poin Bimbingan', '2026-09-27 19:00:00', '2026-09-27 20:00:00', 'https://zoom.us/j/987654321', 'Penyamaan persepsi tim sebelum bimbingan dengan tutor.', 'Febby'),
('m-105-1', 't-105', 'Wawancara Petugas Farmasi Klinik Shifa Medika', '2026-09-29 10:00:00', '2026-09-29 11:00:00', 'https://meet.google.com/xyz-uvwx-rst', 'Observasi alur penerimaan obat, gudang, dan stock opname.', 'Rival')
ON DUPLICATE KEY UPDATE title = VALUES(title), starts_at = VALUES(starts_at), ends_at = VALUES(ends_at), url = VALUES(url), notes = VALUES(notes), host = VALUES(host);

INSERT INTO notifications (id, user_name, text, occurred_at, is_read) VALUES
('n-1', 'Febby', 'memperbarui status tugas "Konsultasikan judul project" menjadi Sedang Dikerjakan', DATE_SUB(NOW(), INTERVAL 12 MINUTE), 0),
('n-2', 'Rival', 'menyelesaikan 3 sub-tugas pada "Lengkapi analisis proses persediaan obat"', DATE_SUB(NOW(), INTERVAL 65 MINUTE), 0),
('n-3', 'Cintia', 'menambahkan struktur awal dokumen proposal Tugas 1', DATE_SUB(NOW(), INTERVAL 180 MINUTE), 0)
ON DUPLICATE KEY UPDATE text = VALUES(text), occurred_at = VALUES(occurred_at), is_read = VALUES(is_read);

INSERT INTO audit_logs (id, occurred_at, user_name, role, action, action_tag, object_type, object_id, object_name, details, changes_json, ip, device) VALUES
('a-101', DATE_SUB(NOW(), INTERVAL 8 MINUTE), 'Febby', 'superadmin', 'Ubah Status', 'update_status', 'Tugas', 't-101', 'Konsultasikan judul project dan ketentuan penggunaan data', 'Mengubah status tugas dari Belum Dimulai menjadi Sedang Dikerjakan', JSON_ARRAY(JSON_OBJECT('field', 'Status', 'from', 'Belum Dimulai', 'to', 'Sedang Dikerjakan')), '192.168.1.45', 'Seed Data'),
('a-102', DATE_SUB(NOW(), INTERVAL 18 MINUTE), 'Febby', 'superadmin', 'Centang Checklist', 'checklist_toggle', 'Tugas', 't-101', 'Konsultasikan judul project dan ketentuan penggunaan data', 'Menyelesaikan checklist awal tugas proposal', JSON_ARRAY(), '192.168.1.45', 'Seed Data')
ON DUPLICATE KEY UPDATE details = VALUES(details), occurred_at = VALUES(occurred_at);

