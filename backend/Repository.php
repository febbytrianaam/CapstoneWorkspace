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
        $repository->ensureUserActivityColumns();
        $repository->ensureTaskArchiveColumn();
        $repository->ensurePhaseProgressNotesTable();
        $repository->ensureUtcTimestampMigration();
        $repository->ensureRbacTable();
        $repository->ensureMeetingTaskOptional();
        $repository->ensureGuidesTable();
        $repository->ensureDocumentArchivesTable();
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

    public function documentArchives(): array
    {
        $rows = $this->db->query(
            'SELECT id, title, category, description, original_name, mime_type, file_size, uploaded_by, created_at
             FROM document_archives ORDER BY created_at DESC, id DESC'
        )->fetchAll();

        return array_map(fn (array $row): array => [
            'id' => $row['id'],
            'title' => $row['title'],
            'category' => $row['category'],
            'description' => $row['description'] ?? '',
            'originalName' => $row['original_name'],
            'mimeType' => $row['mime_type'],
            'fileSize' => (int) $row['file_size'],
            'uploadedBy' => $row['uploaded_by'],
            'createdAt' => strtotime($row['created_at']) * 1000,
        ], $rows);
    }

    public function createDocumentArchive(array $data): array
    {
        $title = trim((string) ($data['title'] ?? ''));
        $category = trim((string) ($data['category'] ?? 'lainnya'));
        $description = trim((string) ($data['description'] ?? ''));
        $originalName = trim((string) ($data['original_name'] ?? ''));
        $mimeType = trim((string) ($data['mime_type'] ?? 'application/octet-stream'));
        $fileData = $data['file_data'] ?? '';
        $fileSize = (int) ($data['file_size'] ?? strlen($fileData));

        if ($title === '' || $originalName === '' || $fileData === '' || $fileSize < 1) {
            throw new InvalidArgumentException('Data dokumen arsip tidak lengkap.');
        }

        $id = 'archive-' . time() . '-' . random_int(100, 999);
        $stmt = $this->db->prepare(
            'INSERT INTO document_archives (id, title, category, description, original_name, mime_type, file_size, file_data, uploaded_by)
             VALUES (:id, :title, :category, :description, :original_name, :mime_type, :file_size, :file_data, :uploaded_by)'
        );
        $stmt->bindValue(':id', $id);
        $stmt->bindValue(':title', $title);
        $stmt->bindValue(':category', $category);
        $stmt->bindValue(':description', $description);
        $stmt->bindValue(':original_name', $originalName);
        $stmt->bindValue(':mime_type', $mimeType);
        $stmt->bindValue(':file_size', $fileSize, PDO::PARAM_INT);
        $stmt->bindValue(':file_data', $fileData, PDO::PARAM_LOB);
        $stmt->bindValue(':uploaded_by', (string) ($data['uploaded_by'] ?? 'System'));
        $stmt->execute();

        return [
            'id' => $id,
            'title' => $title,
            'category' => $category,
            'description' => $description,
            'originalName' => $originalName,
            'mimeType' => $mimeType,
            'fileSize' => $fileSize,
            'uploadedBy' => (string) ($data['uploaded_by'] ?? 'System'),
            'createdAt' => time() * 1000,
        ];
    }

    public function documentArchiveFile(string $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM document_archives WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new RuntimeException('Dokumen arsip tidak ditemukan.');
        }
        return $row;
    }

    public function deleteDocumentArchive(string $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM document_archives WHERE id = :id');
        $stmt->execute(['id' => $id]);
        if ($stmt->rowCount() === 0) {
            throw new RuntimeException('Dokumen arsip tidak ditemukan.');
        }
    }

    public function snapshot(?array $currentUser = null): array
    {
        $canSeeMeetings = $this->canSeeMeetings($currentUser);
        $wibNow = (new DateTimeImmutable('now', new DateTimeZone('UTC')))
            ->setTimezone(new DateTimeZone('Asia/Jakarta'))
            ->format('d/m/Y H:i:s') . ' WIB';
        return [
            'timestamp' => time() * 1000,
            'dateFormatted' => $wibNow,
            'system' => 'STSI4440 Capstone Workspace MySQL',
            'currentUser' => $currentUser,
            'users' => $this->usersVisibleTo($currentUser),
            'tasks' => $this->tasks($canSeeMeetings),
            'meetings' => $canSeeMeetings ? $this->generalMeetings() : [],
            'progressNotes' => $this->phaseProgressNotes(),
            'notifications' => $this->notifications(),
            'auditLogs' => in_array($currentUser['role'] ?? 'member', ['superadmin', 'koordinator'], true) ? $this->auditLogs() : [],
        ];
    }

    public function touchUserPresence(string $userId): void
    {
        if ($userId === '') {
            return;
        }

        $stmt = $this->db->prepare('UPDATE users SET last_seen_at = NOW() WHERE id = :id');
        $stmt->execute(['id' => $userId]);
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

    private function usersVisibleTo(?array $viewer): array
    {
        $users = $this->usersById();
        if (($viewer['role'] ?? 'member') !== 'member') {
            return $users;
        }

        $visible = [];
        foreach ($users as $id => $user) {
            if (($user['role'] ?? 'member') === 'superadmin') {
                continue;
            }
            $visible[$id] = [
                'id' => $user['id'],
                'name' => $user['name'],
                'role' => $user['role'],
                'roles' => $user['roles'],
                'color' => $user['color'],
                'initial' => $user['initial'],
            ];
        }
        return $visible;
    }

    public function authenticate(string $username, string $password): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE username = :username LIMIT 1');
        $stmt->execute(['username' => trim($username)]);
        $row = $stmt->fetch();
        if (!$row || !password_verify($password, $row['password_hash'])) {
            return null;
        }

        $device = substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown device'), 0, 255);
        $this->db->prepare(
            'UPDATE users
             SET last_login_at = NOW(), last_seen_at = NOW(), last_login_device = :device
             WHERE id = :id'
        )->execute(['id' => $row['id'], 'device' => $device]);
        $row['last_login_at'] = date('Y-m-d H:i:s');
        $row['last_seen_at'] = $row['last_login_at'];
        $row['last_login_device'] = $device;
        return $this->mapUser($row);
    }

    public function changePassword(string $userId, string $currentPassword, string $newPassword): array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $userId]);
        $row = $stmt->fetch();
        if (!$row || !password_verify($currentPassword, $row['password_hash'])) {
            throw new InvalidArgumentException('Password saat ini tidak sesuai.');
        }

        $this->db->prepare(
            'UPDATE users SET password_hash = :password_hash, password_changed_at = NOW(), last_seen_at = NOW() WHERE id = :id'
        )->execute([
            'id' => $userId,
            'password_hash' => password_hash($newPassword, PASSWORD_DEFAULT),
        ]);

        $row['password_changed_at'] = date('Y-m-d H:i:s');
        $row['last_seen_at'] = date('Y-m-d H:i:s');
        $this->logAudit('Ubah Password', 'Mengubah password akun pengguna "' . $row['name'] . '"');
        return $this->mapUser($row);
    }

    public function createUser(array $data): array
    {
        $name = trim((string) ($data['name'] ?? 'Pengguna Baru'));
        $id = (string) ($data['id'] ?? $name);
        $username = strtolower(trim((string) ($data['username'] ?? preg_replace('/[^a-z0-9]+/i', '.', $id))));
        $fullName = trim((string) ($data['fullName'] ?? $name));
        $nim = trim((string) ($data['nim'] ?? ''));
        $plainPassword = (string) ($data['password'] ?? '');
        if (strlen($plainPassword) < 8) {
            throw new InvalidArgumentException('Password sementara minimal 8 karakter wajib diisi.');
        }
        if ($name === '' || $username === '') {
            throw new InvalidArgumentException('Nama dan username wajib diisi.');
        }
        $initial = strtoupper(substr(preg_replace('/[^a-z0-9]/i', '', $name), 0, 2)) ?: 'US';
        $stmt = $this->db->prepare(
            'INSERT INTO users (id, username, password_hash, name, full_name, nim, role, color, initial, password_changed_at)
             VALUES (:id, :username, :password_hash, :name, :full_name, :nim, :role, :color, :initial, NOW())'
        );
        $stmt->execute([
            'id' => $id,
            'username' => $username,
            'password_hash' => password_hash($plainPassword, PASSWORD_DEFAULT),
            'name' => $name,
            'full_name' => $fullName ?: $name,
            'nim' => $nim ?: null,
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
            'UPDATE users
             SET username = :username, name = :name, full_name = :full_name, nim = :nim,
                 role = :role, color = :color, initial = :initial
             WHERE id = :id'
        );
        $name = trim((string) $merged['name']);
        $username = strtolower(trim((string) ($merged['username'] ?? '')));
        if ($name === '' || $username === '') {
            throw new InvalidArgumentException('Nama dan username wajib diisi.');
        }
        $stmt->execute([
            'id' => $id,
            'username' => $username,
            'name' => $name,
            'full_name' => trim((string) ($merged['fullName'] ?? $merged['full_name'] ?? $name)) ?: $name,
            'nim' => trim((string) ($merged['nim'] ?? '')) ?: null,
            'role' => in_array($merged['role'], ['superadmin', 'koordinator', 'member'], true) ? $merged['role'] : 'member',
            'color' => $merged['color'] ?? '#2563EB',
            'initial' => strtoupper(substr(preg_replace('/[^a-z0-9]/i', '', $name), 0, 2)) ?: 'US',
        ]);
        if (isset($data['password']) && (string) $data['password'] !== '') {
            $plainPassword = (string) $data['password'];
            if (strlen($plainPassword) < 8) {
                throw new InvalidArgumentException('Password baru minimal 8 karakter.');
            }
            $this->db->prepare(
                'UPDATE users SET password_hash = :password_hash, password_changed_at = NOW() WHERE id = :id'
            )->execute([
                'id' => $id,
                'password_hash' => password_hash($plainPassword, PASSWORD_DEFAULT),
            ]);
        }
        return $this->userById($id);
    }

    public function deleteUser(string $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM users WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    public function countUsersByRole(string $role): int
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM users WHERE role = :role');
        $stmt->execute(['role' => $role]);
        return (int) $stmt->fetchColumn();
    }

    public function userById(string $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new RuntimeException('Pengguna tidak ditemukan.');
        }
        return $this->mapUser($row);
    }

    public function tasks(bool $includeMeetings = true): array
    {
        $tasks = $this->db->query('SELECT * FROM tasks ORDER BY id')->fetchAll();
        $result = [];
        foreach ($tasks as $task) {
            $result[] = $this->mapTask($task, $includeMeetings);
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
             SET phase = :phase, title = :title, pic = :pic, status = :status, priority = :priority, description = :description, archived_at = :archived_at
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
            'archived_at' => $this->normalizeNullableDateTime($merged['archivedAt'] ?? null),
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
        $taskIdValue = array_key_exists('taskId', $data) ? $data['taskId'] : ($data['task_id'] ?? null);
        $taskId = trim((string) $taskIdValue) !== '' ? trim((string) $taskIdValue) : null;
        $phase = trim((string) ($data['phase'] ?? '')) ?: null;
        $this->assertMeetingTask($taskId);
        $stmt = $this->db->prepare(
            'INSERT INTO meetings (id, task_id, phase, title, starts_at, ends_at, url, notes, host)
             VALUES (:id, :task_id, :phase, :title, :starts_at, :ends_at, :url, :notes, :host)'
        );
        $stmt->execute([
            'id' => $id,
            'task_id' => $taskId,
            'phase' => $phase,
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

    public function updateMeeting(string $id, array $data): array
    {
        $existing = $this->meetingRowById($id);
        $taskIdValue = array_key_exists('taskId', $data) ? $data['taskId'] : ($data['task_id'] ?? $existing['task_id']);
        $taskId = trim((string) $taskIdValue) !== '' ? trim((string) $taskIdValue) : null;
        $phase = array_key_exists('phase', $data) ? (trim((string) $data['phase']) ?: null) : ($existing['phase'] ?? null);
        $this->assertMeetingTask($taskId);

        $stmt = $this->db->prepare(
            'UPDATE meetings
             SET task_id = :task_id, phase = :phase, title = :title, starts_at = :starts_at, ends_at = :ends_at,
                 url = :url, notes = :notes, host = :host
             WHERE id = :id AND deleted_at IS NULL'
        );
        $stmt->execute([
            'id' => $id,
            'task_id' => $taskId,
            'phase' => $phase,
            'title' => $data['title'] ?? $existing['title'],
            'starts_at' => $this->normalizeDateTime($data['date'] ?? $data['starts_at'] ?? $existing['starts_at']),
            'ends_at' => $this->normalizeDateTime($data['endDate'] ?? $data['ends_at'] ?? $existing['ends_at']),
            'url' => $data['url'] ?? ($existing['url'] ?? ''),
            'notes' => $data['notes'] ?? ($existing['notes'] ?? ''),
            'host' => $data['host'] ?? ($existing['host'] ?? null),
        ]);
        $this->logAudit('Ubah Pertemuan', 'Memperbarui agenda pertemuan "' . ($data['title'] ?? $existing['title']) . '"');
        return $this->meetingById($id);
    }

    public function generalMeetings(): array
    {
        $rows = $this->db->query(
            'SELECT * FROM meetings WHERE task_id IS NULL AND deleted_at IS NULL ORDER BY starts_at, id'
        )->fetchAll();
        return array_map(fn (array $row): array => $this->mapMeeting($row), $rows);
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

    public function phaseProgressNotes(): array
    {
        $rows = $this->db->query('SELECT * FROM phase_progress_notes ORDER BY phase')->fetchAll();
        $notes = [];
        foreach ($rows as $row) {
            $notes[$row['phase']] = $this->mapPhaseProgressNote($row);
        }
        return $notes;
    }

    public function savePhaseProgressNote(string $phase, string $content, string $updatedBy): array
    {
        if (!in_array($phase, ['tugas1', 'tugas2', 'tugas3'], true)) {
            throw new InvalidArgumentException('Tahap catatan progress tidak valid.');
        }

        $stmt = $this->db->prepare(
            'INSERT INTO phase_progress_notes (phase, content, updated_by)
             VALUES (:phase, :content, :updated_by)
             ON DUPLICATE KEY UPDATE content = VALUES(content), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP'
        );
        $stmt->execute([
            'phase' => $phase,
            'content' => $content,
            'updated_by' => $updatedBy,
        ]);
        $this->logAudit('Ubah Catatan Progress', 'Memperbarui catatan progress ' . strtoupper($phase));

        $rowStmt = $this->db->prepare('SELECT * FROM phase_progress_notes WHERE phase = :phase LIMIT 1');
        $rowStmt->execute(['phase' => $phase]);
        $row = $rowStmt->fetch();
        if (!$row) {
            throw new RuntimeException('Catatan progress tidak ditemukan.');
        }
        return $this->mapPhaseProgressNote($row);
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
        $sessionName = (string) ($_SESSION['capstone_user_name'] ?? 'System');
        $sessionRole = (string) ($_SESSION['capstone_user_role'] ?? 'system');

        $stmt = $this->db->prepare(
            'INSERT INTO audit_logs
             (id, occurred_at, user_name, role, action, action_tag, object_type, object_id, object_name, details, changes_json, ip, device)
             VALUES (:id, :occurred_at, :user_name, :role, :action, :action_tag, :object_type, :object_id, :object_name, :details, :changes_json, :ip, :device)
             ON DUPLICATE KEY UPDATE id = VALUES(id)'
        );
        $stmt->execute([
            'id' => $id,
            'occurred_at' => $timestamp,
            'user_name' => $sessionName,
            'role' => $sessionRole,
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

        return $data + ['id' => $id, 'user' => $sessionName, 'role' => $sessionRole];
    }

    public function clearAuditLogs(): void
    {
        $this->db->exec('DELETE FROM audit_logs');
    }

    public function taskById(string $id): array
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
        return $this->mapMeeting($this->meetingRowById($id));
    }

    private function meetingRowById(string $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM meetings WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new RuntimeException('Pertemuan tidak ditemukan.');
        }
        return $row;
    }

    private function mapTask(array $row, bool $includeMeetings = true): array
    {
        $checklistStmt = $this->db->prepare('SELECT * FROM task_checklist_items WHERE task_id = :task_id ORDER BY item_order, id');
        $checklistStmt->execute(['task_id' => $row['id']]);
        $items = $checklistStmt->fetchAll();

        $meetings = [];
        if ($includeMeetings) {
            $meetingStmt = $this->db->prepare('SELECT * FROM meetings WHERE task_id = :task_id AND deleted_at IS NULL ORDER BY starts_at, id');
            $meetingStmt->execute(['task_id' => $row['id']]);
            $meetings = array_map(fn (array $meeting): array => $this->mapMeeting($meeting), $meetingStmt->fetchAll());
        }

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
            'createdAt' => $this->timestampToMilliseconds($row['created_at'] ?? null),
            'updatedAt' => $this->timestampToMilliseconds($row['updated_at'] ?? null),
            'archivedAt' => $this->timestampToMilliseconds($row['archived_at'] ?? null),
        ];
    }

    private function canSeeMeetings(?array $user): bool
    {
        return in_array($user['role'] ?? 'member', ['superadmin', 'koordinator'], true);
    }

    private function mapMeeting(array $row): array
    {
        return [
            'id' => $row['id'],
            'taskId' => $row['task_id'] ?? null,
            'phase' => $row['phase'] ?? null,
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

    private function mapPhaseProgressNote(array $row): array
    {
        return [
            'phase' => $row['phase'],
            'content' => $row['content'] ?? '',
            'updatedBy' => $row['updated_by'] ?? '',
            'createdAt' => $this->timestampToMilliseconds($row['created_at'] ?? null),
            'updatedAt' => $this->timestampToMilliseconds($row['updated_at'] ?? null),
        ];
    }

    private function assertMeetingTask(?string $taskId): void
    {
        if ($taskId === null) {
            return;
        }
        $stmt = $this->db->prepare('SELECT id FROM tasks WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $taskId]);
        if (!$stmt->fetchColumn()) {
            throw new RuntimeException('Tugas terkait tidak ditemukan.');
        }
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
            'lastLogin' => $row['last_login_at'] ? strtotime($row['last_login_at']) * 1000 : null,
            'lastSeen' => $row['last_seen_at'] ? strtotime($row['last_seen_at']) * 1000 : null,
            'lastLoginDevice' => $row['last_login_device'] ?? '',
            'passwordChangedAt' => $row['password_changed_at'] ? strtotime($row['password_changed_at']) * 1000 : null,
        ];
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
            'user_name' => $_SESSION['capstone_user_name'] ?? 'System',
            'role' => $_SESSION['capstone_user_role'] ?? 'system',
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

    private function normalizeNullableDateTime(mixed $value): ?string
    {
        if ($value === null || $value === '' || $value === false) {
            return null;
        }
        if (is_numeric($value)) {
            return gmdate('Y-m-d H:i:s', (int) (((float) $value) / 1000));
        }
        $timestamp = strtotime((string) $value);
        return $timestamp ? gmdate('Y-m-d H:i:s', $timestamp) : null;
    }

    private function formatLocalDateTime(?string $value): string
    {
        if (!$value) {
            return '';
        }
        return date('Y-m-d\TH:i', strtotime($value));
    }

    private function timestampToMilliseconds(?string $value): ?int
    {
        if (!$value) {
            return null;
        }
        $timestamp = strtotime($value . ' UTC');
        return $timestamp ? $timestamp * 1000 : null;
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

    private function ensureUserActivityColumns(): void
    {
        $columns = $this->db->query('SHOW COLUMNS FROM users')->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('last_seen_at', $columns, true)) {
            $this->db->exec('ALTER TABLE users ADD COLUMN last_seen_at DATETIME NULL AFTER last_login_at');
        }
        if (!in_array('last_login_device', $columns, true)) {
            $this->db->exec('ALTER TABLE users ADD COLUMN last_login_device VARCHAR(255) NULL AFTER last_seen_at');
        }
        if (!in_array('password_changed_at', $columns, true)) {
            $this->db->exec('ALTER TABLE users ADD COLUMN password_changed_at DATETIME NULL AFTER last_login_device');
        }
        $this->db->exec('UPDATE users SET password_changed_at = COALESCE(password_changed_at, created_at, NOW()) WHERE password_changed_at IS NULL');
    }

    private function ensureTaskArchiveColumn(): void
    {
        $columns = $this->db->query('SHOW COLUMNS FROM tasks')->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('archived_at', $columns, true)) {
            $this->db->exec('ALTER TABLE tasks ADD COLUMN archived_at DATETIME NULL AFTER description');
            $this->db->exec('ALTER TABLE tasks ADD INDEX idx_tasks_archived_at (archived_at)');
        }
    }

    private function ensurePhaseProgressNotesTable(): void
    {
        $this->db->exec(
            'CREATE TABLE IF NOT EXISTS phase_progress_notes (
                phase ENUM("tugas1", "tugas2", "tugas3") PRIMARY KEY,
                content MEDIUMTEXT NOT NULL,
                updated_by VARCHAR(120) NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_phase_progress_notes_updated_at (updated_at)
            ) ENGINE=InnoDB'
        );
    }

    private function ensureUtcTimestampMigration(): void
    {
        $this->db->exec(
            'CREATE TABLE IF NOT EXISTS app_migrations (
                migration_key VARCHAR(120) PRIMARY KEY,
                applied_at DATETIME NOT NULL
            ) ENGINE=InnoDB'
        );

        $migrationKey = '20260927_normalize_legacy_wib_timestamps';
        $stmt = $this->db->prepare(
            'INSERT IGNORE INTO app_migrations (migration_key, applied_at)
             VALUES (:migration_key, UTC_TIMESTAMP())'
        );
        $stmt->execute(['migration_key' => $migrationKey]);
        if ($stmt->rowCount() > 0) {
            // Sebelum aplikasi memaksa sesi MySQL ke UTC, beberapa NOW() tersimpan sebagai WIB.
            // Nilai aktivitas yang lebih besar dari waktu UTC saat ini pasti berasal dari campuran lama.
            $legacyColumns = [
                'users' => ['last_login_at', 'last_seen_at', 'password_changed_at'],
                'audit_logs' => ['occurred_at'],
                'notifications' => ['occurred_at'],
                'project_guides' => ['created_at'],
            ];
            foreach ($legacyColumns as $table => $columns) {
                foreach ($columns as $column) {
                    $this->db->exec(
                        "UPDATE {$table} SET {$column} = DATE_SUB({$column}, INTERVAL 7 HOUR)
                         WHERE {$column} IS NOT NULL AND {$column} > UTC_TIMESTAMP()"
                    );
                }
            }
        }

        $seedLoginMigrationKey = '20260927_normalize_legacy_seed_login_dates';
        $stmt = $this->db->prepare(
            'INSERT IGNORE INTO app_migrations (migration_key, applied_at)
             VALUES (:migration_key, UTC_TIMESTAMP())'
        );
        $stmt->execute(['migration_key' => $seedLoginMigrationKey]);
        if ($stmt->rowCount() > 0) {
            // Akun seed yang belum pernah terlihat sejak aplikasi memakai UTC masih membawa waktu WIB lama.
            $this->db->exec(
                'UPDATE users SET last_login_at = DATE_SUB(last_login_at, INTERVAL 7 HOUR)
                 WHERE last_login_at IS NOT NULL
                   AND last_seen_at IS NULL
                   AND last_login_at > UTC_TIMESTAMP()'
            );
        }
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
        $this->db->exec(
            "UPDATE project_guides SET uploaded_by = 'System'
             WHERE uploaded_by IN ('Superadmin', 'Koordinator')"
        );
    }

    private function ensureDocumentArchivesTable(): void
    {
        $this->db->exec(
            'CREATE TABLE IF NOT EXISTS document_archives (
                id VARCHAR(80) PRIMARY KEY,
                title VARCHAR(180) NOT NULL,
                category VARCHAR(60) NOT NULL DEFAULT "lainnya",
                description TEXT NULL,
                original_name VARCHAR(255) NOT NULL,
                mime_type VARCHAR(120) NOT NULL,
                file_size INT UNSIGNED NOT NULL,
                file_data MEDIUMBLOB NOT NULL,
                uploaded_by VARCHAR(120) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_document_archives_category (category),
                INDEX idx_document_archives_created (created_at)
            ) ENGINE=InnoDB'
        );
    }

    private function ensureMeetingTaskOptional(): void
    {
        $tables = $this->db->query("SHOW TABLES LIKE 'meetings'")->fetchAll(PDO::FETCH_COLUMN);
        if (!$tables) {
            return;
        }
        $columns = $this->db->query('SHOW COLUMNS FROM meetings')->fetchAll();
        foreach ($columns as $column) {
            if ($column['Field'] === 'task_id' && strtoupper((string) $column['Null']) === 'NO') {
                $this->db->exec('ALTER TABLE meetings MODIFY task_id VARCHAR(80) NULL');
            }
            if ($column['Field'] === 'task_id') {
                $hasPhase = false;
                foreach ($columns as $candidate) {
                    if ($candidate['Field'] === 'phase') {
                        $hasPhase = true;
                        break;
                    }
                }
                if (!$hasPhase) {
                    $this->db->exec('ALTER TABLE meetings ADD COLUMN phase VARCHAR(20) NULL AFTER task_id');
                }
                break;
            }
        }
    }
}
