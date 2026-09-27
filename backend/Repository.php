<?php

declare(strict_types=1);

require_once __DIR__ . '/Database.php';

final class Repository
{
    public function __construct(private readonly PDO $db)
    {
    }

    public static function create(): self
    {
        $repository = new self(Database::connection());
        $repository->ensureRbacTable();
        $repository->ensureGuidesTable();
        return $repository;
    }

    public function rbacPermissions(): array
    {
        return $this->db->query(
            'SELECT role, area, permission, allowed FROM role_permissions ORDER BY role, area, permission'
        )->fetchAll();
    }

    public function setRbacPermission(string $role, string $area, string $permission, bool $allowed): array
    {
        $stmt = $this->db->prepare(
            'INSERT INTO role_permissions (role, area, permission, allowed)
             VALUES (:role, :area, :permission, :allowed)
             ON DUPLICATE KEY UPDATE allowed = VALUES(allowed), updated_at = CURRENT_TIMESTAMP'
        );
        $stmt->execute([
            'role' => $role,
            'area' => $area,
            'permission' => $permission,
            'allowed' => $allowed ? 1 : 0,
        ]);

        return [
            'role' => $role,
            'area' => $area,
            'permission' => $permission,
            'allowed' => $allowed,
        ];
    }

    public function projectGuides(): array
    {
        $rows = $this->db->query(
            'SELECT id, title, original_name, mime_type, file_size, uploaded_by, created_at
             FROM project_guides ORDER BY created_at DESC, id DESC'
        )->fetchAll();

        return array_map(fn (array $row): array => [
            'id' => $row['id'],
            'title' => $row['title'],
            'originalName' => $row['original_name'],
            'mimeType' => $row['mime_type'],
            'fileSize' => (int) $row['file_size'],
            'uploadedBy' => $row['uploaded_by'],
            'createdAt' => strtotime($row['created_at']) * 1000,
        ], $rows);
    }

    public function createProjectGuide(array $data): array
    {
        $title = trim((string) ($data['title'] ?? ''));
        $originalName = trim((string) ($data['original_name'] ?? ''));
        $mimeType = trim((string) ($data['mime_type'] ?? 'application/octet-stream'));
        $fileData = $data['file_data'] ?? '';
        $fileSize = (int) ($data['file_size'] ?? strlen($fileData));

        if ($title === '' || $originalName === '' || $fileData === '' || $fileSize < 1) {
            throw new InvalidArgumentException('Data dokumen panduan tidak lengkap.');
        }

        $id = 'guide-' . time() . '-' . random_int(100, 999);
        $stmt = $this->db->prepare(
            'INSERT INTO project_guides (id, title, original_name, mime_type, file_size, file_data, uploaded_by)
             VALUES (:id, :title, :original_name, :mime_type, :file_size, :file_data, :uploaded_by)'
        );
        $stmt->bindValue(':id', $id);
        $stmt->bindValue(':title', $title);
        $stmt->bindValue(':original_name', $originalName);
        $stmt->bindValue(':mime_type', $mimeType);
        $stmt->bindValue(':file_size', $fileSize, PDO::PARAM_INT);
        $stmt->bindValue(':file_data', $fileData, PDO::PARAM_LOB);
        $stmt->bindValue(':uploaded_by', (string) ($data['uploaded_by'] ?? 'System'));
        $stmt->execute();

        return [
            'id' => $id,
            'title' => $title,
            'originalName' => $originalName,
            'mimeType' => $mimeType,
            'fileSize' => $fileSize,
            'uploadedBy' => (string) ($data['uploaded_by'] ?? 'System'),
            'createdAt' => time() * 1000,
        ];
    }

    public function projectGuideFile(string $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM project_guides WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new RuntimeException('Dokumen panduan tidak ditemukan.');
        }
        return $row;
    }

    public function deleteProjectGuide(string $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM project_guides WHERE id = :id');
        $stmt->execute(['id' => $id]);
        if ($stmt->rowCount() === 0) {
            throw new RuntimeException('Dokumen panduan tidak ditemukan.');
        }
    }

    public function snapshot(): array
    {
        return [
            'timestamp' => time() * 1000,
            'dateFormatted' => date('d/m/Y H:i:s'),
            'system' => 'STSI4440 Capstone Workspace MySQL',
            'currentUser' => $this->firstSuperadmin(),
            'users' => $this->usersById(),
            'tasks' => $this->tasks(),
            'notifications' => $this->notifications(),
            'auditLogs' => $this->auditLogs(),
        ];
    }

    public function usersById(): array
    {
        $rows = $this->db->query('SELECT * FROM users ORDER BY FIELD(role, "superadmin", "koordinator", "member"), name')->fetchAll();
        $users = [];
        foreach ($rows as $row) {
            $users[$row['id']] = $this->mapUser($row);
        }
        return $users;
    }

    public function authenticate(string $username, string $password): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE username = :username LIMIT 1');
        $stmt->execute(['username' => trim($username)]);
        $row = $stmt->fetch();
        if (!$row || !password_verify($password, $row['password_hash'])) {
            return null;
        }

        $this->db->prepare('UPDATE users SET last_login_at = NOW() WHERE id = :id')->execute(['id' => $row['id']]);
        $row['last_login_at'] = date('Y-m-d H:i:s');
        return $this->mapUser($row);
    }

    public function createUser(array $data): array
    {
        $name = trim((string) ($data['name'] ?? 'Pengguna Baru'));
        $id = (string) ($data['id'] ?? $name);
        $username = strtolower((string) ($data['username'] ?? preg_replace('/[^a-z0-9]+/i', '.', $id)));
        $initial = strtoupper(substr(preg_replace('/[^a-z0-9]/i', '', $name), 0, 2)) ?: 'US';
        $stmt = $this->db->prepare(
            'INSERT INTO users (id, username, password_hash, name, full_name, nim, role, color, initial)
             VALUES (:id, :username, :password_hash, :name, :full_name, :nim, :role, :color, :initial)'
        );
        $stmt->execute([
            'id' => $id,
            'username' => $username,
            'password_hash' => password_hash('123', PASSWORD_DEFAULT),
            'name' => $name,
            'full_name' => $data['fullName'] ?? $name,
            'nim' => $data['nim'] ?? null,
            'role' => in_array($data['role'] ?? 'member', ['superadmin', 'koordinator', 'member'], true) ? $data['role'] : 'member',
            'color' => $data['color'] ?? '#2563EB',
            'initial' => $initial,
        ]);
        return $this->userById($id);
    }

    public function updateUser(string $id, array $data): array
    {
        $existing = $this->userById($id);
        $merged = array_merge($existing, $data);
        $stmt = $this->db->prepare(
            'UPDATE users SET name = :name, role = :role, color = :color, initial = :initial WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'name' => $merged['name'],
            'role' => in_array($merged['role'], ['superadmin', 'koordinator', 'member'], true) ? $merged['role'] : 'member',
            'color' => $merged['color'] ?? '#2563EB',
            'initial' => strtoupper(substr(preg_replace('/[^a-z0-9]/i', '', $merged['name']), 0, 2)) ?: 'US',
        ]);
        return $this->userById($id);
    }

    public function deleteUser(string $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM users WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    private function userById(string $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new RuntimeException('Pengguna tidak ditemukan.');
        }
        return $this->mapUser($row);
    }

    public function tasks(): array
    {
        $tasks = $this->db->query('SELECT * FROM tasks ORDER BY id')->fetchAll();
        $result = [];
        foreach ($tasks as $task) {
            $result[] = $this->mapTask($task);
        }
        return $result;
    }

    public function createTask(array $data): array
    {
        $id = $data['id'] ?? ('t-' . time());
        $stmt = $this->db->prepare(
            'INSERT INTO tasks (id, phase, title, pic, status, priority, description)
             VALUES (:id, :phase, :title, :pic, :status, :priority, :description)'
        );
        $stmt->execute([
            'id' => $id,
            'phase' => $data['phase'] ?? 'tugas1',
            'title' => $data['title'] ?? 'Tugas Baru',
            'pic' => $data['pic'] ?? 'Febby',
            'status' => $data['status'] ?? 'Belum Dimulai',
            'priority' => $data['priority'] ?? 'Sedang',
            'description' => $data['description'] ?? '',
        ]);

        $this->replaceChecklist($id, $data['checklist'] ?? [], $data['checklistDone'] ?? []);
        $this->logAudit('Tambah Tugas', 'Menambahkan tugas baru "' . ($data['title'] ?? 'Tugas Baru') . '"');

        return $this->taskById($id);
    }

    public function updateTask(string $id, array $data): array
    {
        $existing = $this->taskById($id);
        $merged = array_merge($existing, $data);

        $stmt = $this->db->prepare(
            'UPDATE tasks
             SET phase = :phase, title = :title, pic = :pic, status = :status, priority = :priority, description = :description
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'phase' => $merged['phase'],
            'title' => $merged['title'],
            'pic' => $merged['pic'],
            'status' => $merged['status'],
            'priority' => $merged['priority'],
            'description' => $merged['description'] ?? '',
        ]);

        if (array_key_exists('checklist', $data) || array_key_exists('checklistDone', $data)) {
            $this->replaceChecklist($id, $merged['checklist'] ?? [], $merged['checklistDone'] ?? []);
        }
        if (array_key_exists('meetings', $data) && is_array($data['meetings'])) {
            $this->replaceMeetings($id, $data['meetings']);
        }

        $this->logAudit('Ubah Tugas', 'Memperbarui tugas "' . $merged['title'] . '"');
        return $this->taskById($id);
    }

    public function deleteTask(string $id): void
    {
        $task = $this->taskById($id);
        $stmt = $this->db->prepare('DELETE FROM tasks WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $this->logAudit('Hapus Tugas', 'Menghapus tugas "' . $task['title'] . '"');
    }

    public function createMeeting(array $data): array
    {
        $id = $data['id'] ?? ('m-' . time());
        $stmt = $this->db->prepare(
            'INSERT INTO meetings (id, task_id, title, starts_at, ends_at, url, notes, host)
             VALUES (:id, :task_id, :title, :starts_at, :ends_at, :url, :notes, :host)'
        );
        $stmt->execute([
            'id' => $id,
            'task_id' => $data['taskId'] ?? $data['task_id'] ?? '',
            'title' => $data['title'] ?? 'Agenda Pertemuan Baru',
            'starts_at' => $this->normalizeDateTime($data['date'] ?? $data['starts_at'] ?? null),
            'ends_at' => $this->normalizeDateTime($data['endDate'] ?? $data['ends_at'] ?? null),
            'url' => $data['url'] ?? '',
            'notes' => $data['notes'] ?? '',
            'host' => $data['host'] ?? null,
        ]);
        $this->logAudit('Tambah Pertemuan', 'Menambahkan agenda pertemuan "' . ($data['title'] ?? 'Agenda Pertemuan Baru') . '"');
        return $this->meetingById($id);
    }

    public function deleteMeeting(string $id): void
    {
        $stmt = $this->db->prepare('SELECT id, title, berita_acara_at, deleted_at FROM meetings WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $meeting = $stmt->fetch();
        if (!$meeting || $meeting['deleted_at'] !== null) {
            throw new RuntimeException('Pertemuan tidak ditemukan.');
        }
        if ($meeting['berita_acara_at'] !== null) {
            throw new RuntimeException('Pertemuan yang sudah memiliki berita acara tidak boleh dihapus.');
        }

        $update = $this->db->prepare('UPDATE meetings SET deleted_at = NOW() WHERE id = :id AND berita_acara_at IS NULL AND deleted_at IS NULL');
        $update->execute(['id' => $id]);
        $this->logAudit('Hapus Pertemuan', 'Soft delete pertemuan "' . $meeting['title'] . '"');
    }

    public function markMeetingBeritaAcara(string $id): array
    {
        $stmt = $this->db->prepare('UPDATE meetings SET berita_acara_at = COALESCE(berita_acara_at, NOW()) WHERE id = :id AND deleted_at IS NULL');
        $stmt->execute(['id' => $id]);
        if ($stmt->rowCount() === 0) {
            throw new RuntimeException('Pertemuan tidak ditemukan.');
        }
        return $this->meetingById($id);
    }

    public function notifications(): array
    {
        $rows = $this->db->query('SELECT * FROM notifications ORDER BY occurred_at DESC')->fetchAll();
        return array_map(fn (array $row): array => [
            'id' => $row['id'],
            'user' => $row['user_name'],
            'text' => $row['text'],
            'time' => strtotime($row['occurred_at']) * 1000,
            'read' => (bool) $row['is_read'],
        ], $rows);
    }

    public function createNotification(array $data): array
    {
        $id = (string) ($data['id'] ?? ('n-' . time() . random_int(100, 999)));
        $stmt = $this->db->prepare(
            'INSERT INTO notifications (id, user_name, text, occurred_at, is_read)
             VALUES (:id, :user_name, :text, :occurred_at, :is_read)
             ON DUPLICATE KEY UPDATE text = VALUES(text), is_read = VALUES(is_read)'
        );
        $stmt->execute([
            'id' => $id,
            'user_name' => $data['user'] ?? 'System',
            'text' => $data['text'] ?? '',
            'occurred_at' => isset($data['time']) ? date('Y-m-d H:i:s', (int) ($data['time'] / 1000)) : date('Y-m-d H:i:s'),
            'is_read' => !empty($data['read']) ? 1 : 0,
        ]);
        return $data + ['id' => $id];
    }

    public function markNotificationsRead(): void
    {
        $this->db->exec('UPDATE notifications SET is_read = 1');
    }

    public function auditLogs(): array
    {
        $rows = $this->db->query('SELECT * FROM audit_logs ORDER BY occurred_at DESC')->fetchAll();
        return array_map(fn (array $row): array => [
            'id' => $row['id'],
            'timestamp' => strtotime($row['occurred_at']) * 1000,
            'user' => $row['user_name'],
            'role' => $row['role'],
            'action' => $row['action'],
            'actionTag' => $row['action_tag'],
            'object' => [
                'type' => $row['object_type'],
                'id' => $row['object_id'],
                'name' => $row['object_name'],
            ],
            'details' => $row['details'],
            'changes' => $row['changes_json'] ? json_decode($row['changes_json'], true) : [],
            'ip' => $row['ip'],
            'device' => $row['device'],
        ], $rows);
    }

    public function createAuditLog(array $data): array
    {
        $id = $data['id'] ?? ('a-' . time() . random_int(100, 999));
        $timestamp = isset($data['timestamp']) ? date('Y-m-d H:i:s', (int) ($data['timestamp'] / 1000)) : date('Y-m-d H:i:s');
        $object = $data['object'] ?? [];
        $changes = $data['changes'] ?? [];

        $stmt = $this->db->prepare(
            'INSERT INTO audit_logs
             (id, occurred_at, user_name, role, action, action_tag, object_type, object_id, object_name, details, changes_json, ip, device)
             VALUES (:id, :occurred_at, :user_name, :role, :action, :action_tag, :object_type, :object_id, :object_name, :details, :changes_json, :ip, :device)
             ON DUPLICATE KEY UPDATE id = VALUES(id)'
        );
        $stmt->execute([
            'id' => $id,
            'occurred_at' => $timestamp,
            'user_name' => $data['user'] ?? 'System',
            'role' => $data['role'] ?? 'member',
            'action' => $data['action'] ?? 'Aktivitas',
            'action_tag' => $data['actionTag'] ?? strtolower(str_replace(' ', '_', $data['action'] ?? 'aktivitas')),
            'object_type' => $object['type'] ?? null,
            'object_id' => $object['id'] ?? null,
            'object_name' => $object['name'] ?? null,
            'details' => $data['details'] ?? '',
            'changes_json' => json_encode($changes, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'ip' => $data['ip'] ?? ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'),
            'device' => $data['device'] ?? ($_SERVER['HTTP_USER_AGENT'] ?? 'Browser'),
        ]);

        return $data + ['id' => $id];
    }

    public function clearAuditLogs(): void
    {
        $this->db->exec('DELETE FROM audit_logs');
    }

    private function taskById(string $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM tasks WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new RuntimeException('Tugas tidak ditemukan.');
        }
        return $this->mapTask($row);
    }

    private function meetingById(string $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM meetings WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new RuntimeException('Pertemuan tidak ditemukan.');
        }
        return $this->mapMeeting($row);
    }

    private function mapTask(array $row): array
    {
        $checklistStmt = $this->db->prepare('SELECT * FROM task_checklist_items WHERE task_id = :task_id ORDER BY item_order, id');
        $checklistStmt->execute(['task_id' => $row['id']]);
        $items = $checklistStmt->fetchAll();

        $meetingStmt = $this->db->prepare('SELECT * FROM meetings WHERE task_id = :task_id AND deleted_at IS NULL ORDER BY starts_at, id');
        $meetingStmt->execute(['task_id' => $row['id']]);
        $meetings = array_map(fn (array $meeting): array => $this->mapMeeting($meeting), $meetingStmt->fetchAll());

        return [
            'id' => $row['id'],
            'phase' => $row['phase'],
            'title' => $row['title'],
            'pic' => $row['pic'],
            'status' => $row['status'],
            'priority' => $row['priority'],
            'description' => $row['description'] ?? '',
            'checklist' => array_column($items, 'text'),
            'checklistDone' => array_map(fn (array $item): bool => (bool) $item['is_done'], $items),
            'meetings' => $meetings,
        ];
    }

    private function mapMeeting(array $row): array
    {
        return [
            'id' => $row['id'],
            'title' => $row['title'],
            'date' => $this->formatLocalDateTime($row['starts_at']),
            'endDate' => $this->formatLocalDateTime($row['ends_at']),
            'url' => $row['url'] ?? '',
            'notes' => $row['notes'] ?? '',
            'host' => $row['host'] ?? '',
            'hasBeritaAcara' => $row['berita_acara_at'] !== null,
            'deletedAt' => $row['deleted_at'] ?? null,
        ];
    }

    private function mapUser(array $row): array
    {
        return [
            'id' => $row['id'],
            'username' => $row['username'],
            'name' => $row['name'],
            'fullName' => $row['full_name'],
            'nim' => $row['nim'],
            'role' => $row['role'],
            'roles' => $row['role'] === 'superadmin' ? ['superadmin', 'koordinator'] : [$row['role']],
            'color' => $row['color'],
            'initial' => $row['initial'],
            'lastLogin' => strtotime($row['last_login_at'] ?? 'now') * 1000,
        ];
    }

    private function firstSuperadmin(): ?array
    {
        $row = $this->db->query('SELECT * FROM users ORDER BY role = "superadmin" DESC, name LIMIT 1')->fetch();
        return $row ? $this->mapUser($row) : null;
    }

    private function replaceChecklist(string $taskId, array $items, array $doneFlags): void
    {
        $this->db->prepare('DELETE FROM task_checklist_items WHERE task_id = :task_id')->execute(['task_id' => $taskId]);
        $stmt = $this->db->prepare(
            'INSERT INTO task_checklist_items (task_id, item_order, text, is_done)
             VALUES (:task_id, :item_order, :text, :is_done)'
        );

        foreach ($items as $index => $text) {
            $stmt->execute([
                'task_id' => $taskId,
                'item_order' => $index + 1,
                'text' => (string) $text,
                'is_done' => !empty($doneFlags[$index]) ? 1 : 0,
            ]);
        }
    }

    private function replaceMeetings(string $taskId, array $meetings): void
    {
        $this->db->prepare('DELETE FROM meetings WHERE task_id = :task_id AND deleted_at IS NULL')->execute(['task_id' => $taskId]);
        $stmt = $this->db->prepare(
            'INSERT INTO meetings (id, task_id, title, starts_at, ends_at, url, notes, host, berita_acara_at, deleted_at)
             VALUES (:id, :task_id, :title, :starts_at, :ends_at, :url, :notes, :host, :berita_acara_at, NULL)'
        );

        foreach ($meetings as $meeting) {
            $stmt->execute([
                'id' => $meeting['id'] ?? ('m-' . time() . random_int(100, 999)),
                'task_id' => $taskId,
                'title' => $meeting['title'] ?? 'Agenda Pertemuan Baru',
                'starts_at' => $this->normalizeDateTime($meeting['date'] ?? null),
                'ends_at' => $this->normalizeDateTime($meeting['endDate'] ?? null),
                'url' => $meeting['url'] ?? '',
                'notes' => $meeting['notes'] ?? '',
                'host' => $meeting['host'] ?? null,
                'berita_acara_at' => !empty($meeting['hasBeritaAcara']) ? date('Y-m-d H:i:s') : null,
            ]);
        }
    }

    private function logAudit(string $action, string $details): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO audit_logs (id, occurred_at, user_name, role, action, action_tag, details, ip, device)
             VALUES (:id, NOW(), :user_name, :role, :action, :action_tag, :details, :ip, :device)'
        );
        $stmt->execute([
            'id' => 'a-' . time() . random_int(100, 999),
            'user_name' => 'System',
            'role' => 'system',
            'action' => $action,
            'action_tag' => strtolower(str_replace(' ', '_', $action)),
            'details' => $details,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
            'device' => $_SERVER['HTTP_USER_AGENT'] ?? 'CLI',
        ]);
    }

    private function normalizeDateTime(?string $value): ?string
    {
        if (!$value) {
            return null;
        }
        return str_replace('T', ' ', $value) . (strlen($value) === 16 ? ':00' : '');
    }

    private function formatLocalDateTime(?string $value): string
    {
        if (!$value) {
            return '';
        }
        return date('Y-m-d\TH:i', strtotime($value));
    }

    private function ensureRbacTable(): void
    {
        $this->db->exec(
            'CREATE TABLE IF NOT EXISTS role_permissions (
                role VARCHAR(40) NOT NULL,
                area VARCHAR(80) NOT NULL,
                permission VARCHAR(80) NOT NULL,
                allowed TINYINT(1) NOT NULL DEFAULT 0,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (role, area, permission),
                INDEX idx_role_permissions_role (role)
            ) ENGINE=InnoDB'
        );
    }

    private function ensureGuidesTable(): void
    {
        $this->db->exec(
            'CREATE TABLE IF NOT EXISTS project_guides (
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
            ) ENGINE=InnoDB'
        );
    }
}

