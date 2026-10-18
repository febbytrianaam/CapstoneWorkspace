<?php

declare(strict_types=1);

require_once __DIR__ . '/BeritaAcaraNumbering.php';

final class DraftConflictException extends RuntimeException
{
    public function __construct(public readonly ?array $current)
    {
        parent::__construct('Draft sudah diperbarui dari perangkat lain. Muat versi terbaru sebelum menyimpan kembali.');
    }
}

final class BeritaAcaraStorage
{
    public const LEGACY_KEYS = [
        'capstone_workspace_v3', 'capstone_general_meetings_v1', 'capstone_progress_notes_v1',
        'capstone_notifications_v3', 'capstone_audit_logs_v3', 'capstone_user_activities_v1',
        'capstone_berita_acara_drafts_v1',
    ];

    public function __construct(private readonly PDO $db)
    {
    }

    public function draft(string $meetingId): ?array
    {
        $this->meeting($meetingId);
        $stmt = $this->db->prepare('SELECT * FROM berita_acara_drafts WHERE meeting_id = :id');
        $stmt->execute(['id' => $meetingId]);
        $row = $stmt->fetch();
        return $row ? $this->mapDraft($row) : null;
    }

    public function save(string $meetingId, array $payload, int $expectedRevision, string $userId): array
    {
        $payload = self::normalizePayload($payload);
        $ownsTransaction = !$this->db->inTransaction();
        $lock = $this->db->query("SELECT GET_LOCK(CONCAT(DATABASE(), ':ba_document_number'), 5)");
        if ((int) $lock->fetchColumn() !== 1) throw new RuntimeException('Nomor berita acara sedang disiapkan. Silakan coba lagi.');
        try {
            if ($ownsTransaction) $this->db->beginTransaction();
            $saved = $this->saveLocked($meetingId, $payload, $expectedRevision, $userId);
            if ($ownsTransaction) $this->db->commit();
            return $saved;
        } catch (Throwable $error) {
            if ($ownsTransaction && $this->db->inTransaction()) $this->db->rollBack();
            throw $error;
        } finally {
            // External transactions retain this connection-scoped lock until the connection closes.
            if ($ownsTransaction || !$this->db->inTransaction()) $this->db->query("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':ba_document_number'))");
        }
    }

    private function saveLocked(string $meetingId, array $payload, int $expectedRevision, string $userId): array
    {
        if ($expectedRevision < 0) throw new InvalidArgumentException('Versi draft tidak valid.');
        $meeting = $this->meeting($meetingId);
        $payload['meetingId'] = $meetingId;
        $payload['taskId'] = $meeting['task_id'] ?? '';
        $current = $this->draft($meetingId);
        $number = (int) ($current['payload']['documentNumber'] ?? 0);
        if ($number < 1) {
            $archives = $this->db->query("SELECT id, meeting_id, original_name, title FROM document_archives WHERE category = 'berita_acara' ORDER BY created_at, id")->fetchAll();
            $drafts = $this->db->query("SELECT meeting_id, JSON_UNQUOTE(JSON_EXTRACT(payload, '$.documentNumber')) AS document_number, JSON_UNQUOTE(JSON_EXTRACT(payload, '$.hariTanggal')) AS meeting_date FROM berita_acara_drafts ORDER BY created_at, meeting_id")->fetchAll();
            $number = BeritaAcaraNumbering::forMeeting($meetingId, $archives, $drafts);
        }
        $payload['documentNumber'] = $number;
        $encoded = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $hash = hash('sha256', $encoded);
        if ($current && self::samePayload($current['payload'], $payload)) return $current;
        if (($current['revision'] ?? 0) !== $expectedRevision) throw new DraftConflictException($current);

        if ($expectedRevision === 0) {
            try {
                $stmt = $this->db->prepare('INSERT INTO berita_acara_drafts (meeting_id, payload, payload_hash, updated_by) VALUES (:id, :payload, :hash, :user)');
                $stmt->execute(['id' => $meetingId, 'payload' => $encoded, 'hash' => $hash, 'user' => $userId]);
            } catch (PDOException $error) {
                if ((string) $error->getCode() === '23000') throw new DraftConflictException($this->draft($meetingId));
                throw $error;
            }
        } else {
            $stmt = $this->db->prepare('UPDATE berita_acara_drafts SET payload = :payload, payload_hash = :hash, updated_by = :user, revision = revision + 1 WHERE meeting_id = :id AND revision = :revision');
            $stmt->execute(['id' => $meetingId, 'payload' => $encoded, 'hash' => $hash, 'user' => $userId, 'revision' => $expectedRevision]);
            if ($stmt->rowCount() !== 1) throw new DraftConflictException($this->draft($meetingId));
        }
        return $this->draft($meetingId) ?? throw new RuntimeException('Konfirmasi draft belum dapat dibaca.');
    }

    public static function normalizePayload(array $data): array
    {
        $text = static function (mixed $value, int $limit): string {
            if (!is_string($value) || strlen($value) > $limit) throw new InvalidArgumentException('Isi draft tidak valid atau terlalu panjang.');
            return $value;
        };
        $result = [];
        foreach (['judul' => 4000, 'hariTanggal' => 1000, 'waktu' => 1000, 'lokasi' => 12000] as $field => $limit) {
            $result[$field] = $text($data[$field] ?? '', $limit);
        }
        $attendees = $data['attendingNames'] ?? [];
        $activities = $data['activities'] ?? [];
        $images = $data['images'] ?? [];
        if (!is_array($attendees) || !array_is_list($attendees) || count($attendees) > 100
            || !is_array($activities) || !array_is_list($activities) || count($activities) > 500
            || !is_array($images) || !array_is_list($images) || count($images) > 30) {
            throw new InvalidArgumentException('Daftar kehadiran, aktivitas, atau foto tidak valid.');
        }
        $result['attendingNames'] = array_values(array_unique(array_map(static fn ($name) => $text($name, 500), $attendees)));
        $result['activities'] = array_map(static function ($row) use ($text): array {
            if (!is_array($row)) throw new InvalidArgumentException('Baris aktivitas tidak valid.');
            $activity = [];
            foreach (['aktivitas', 'luaran', 'pic', 'catatan'] as $field) $activity[$field] = $text($row[$field] ?? '', 24000);
            return $activity;
        }, $activities);
        $totalBytes = 0;
        $result['images'] = array_map(static function ($image) use (&$totalBytes): string {
            if (!is_string($image) || !preg_match('~^data:image/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/=\r\n]+)$~D', $image, $match)) {
                throw new InvalidArgumentException('Foto dokumentasi harus berupa PNG, JPG, GIF, atau WebP.');
            }
            $bytes = base64_decode($match[2], true);
            $totalBytes += strlen($image);
            $info = $bytes === false ? false : @getimagesizefromstring($bytes);
            if (!$info || ($info['mime'] ?? '') !== 'image/' . $match[1] || $totalBytes > 10 * 1024 * 1024) {
                throw new InvalidArgumentException('Foto tidak valid atau total ukurannya melebihi 10 MB.');
            }
            return $image;
        }, $images);
        if (strlen(json_encode($result, JSON_THROW_ON_ERROR)) > 12 * 1024 * 1024) throw new InvalidArgumentException('Draft melebihi batas 12 MB.');
        return $result;
    }

    public function backup(array $entries, string $userId): array
    {
        $filtered = [];
        foreach (self::LEGACY_KEYS as $key) {
            if (array_key_exists($key, $entries)) {
                if (!is_string($entries[$key])) throw new InvalidArgumentException('Cadangan browser tidak valid.');
                $filtered[$key] = $entries[$key];
            }
        }
        if (!$filtered) throw new InvalidArgumentException('Tidak ada data kerja lokal untuk dicadangkan.');
        ksort($filtered);
        $contents = json_encode($filtered, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        if (strlen($contents) > 16 * 1024 * 1024) throw new InvalidArgumentException('Cadangan browser melebihi 16 MB.');
        $id = hash('sha256', $userId . "\n" . $contents);
        $stmt = $this->db->prepare('INSERT INTO browser_recovery_backups (id, owner_id, contents) VALUES (:id, :owner, :contents) ON DUPLICATE KEY UPDATE id = VALUES(id)');
        $stmt->execute(['id' => $id, 'owner' => $userId, 'contents' => $contents]);
        return ['id' => $id];
    }

    public function backups(): array
    {
        $rows = $this->db->query('SELECT id, owner_id, created_at, OCTET_LENGTH(contents) AS size_bytes FROM browser_recovery_backups ORDER BY created_at DESC LIMIT 100')->fetchAll();
        return array_map(static fn ($row) => ['id' => $row['id'], 'ownerId' => $row['owner_id'], 'createdAt' => self::timestamp($row['created_at']), 'sizeBytes' => (int) $row['size_bytes']], $rows);
    }

    public function backupById(string $id): array
    {
        if (!preg_match('/^[a-f0-9]{64}$/D', $id)) throw new InvalidArgumentException('ID cadangan tidak valid.');
        $stmt = $this->db->prepare('SELECT * FROM browser_recovery_backups WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if (!$row) throw new RuntimeException('Cadangan tidak ditemukan.');
        return ['id' => $id, 'ownerId' => $row['owner_id'], 'entries' => json_decode($row['contents'], true, 512, JSON_THROW_ON_ERROR), 'createdAt' => self::timestamp($row['created_at'])];
    }

    public function importDrafts(string $backupId, string $userId): array
    {
        $backup = $this->backupById($backupId);
        if ($backup['ownerId'] !== $userId) throw new InvalidArgumentException('Cadangan bukan milik akun ini.');
        $raw = $backup['entries']['capstone_berita_acara_drafts_v1'] ?? '{}';
        try {
            $drafts = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return ['saved' => 0, 'conflicts' => [], 'unresolved' => ['Data draft lama tidak dapat dibaca; salinan asli tetap tersimpan di cadangan.']];
        }
        $result = ['saved' => 0, 'conflicts' => [], 'unresolved' => []];
        if (!is_array($drafts) || count($drafts) > 300) {
            $result['unresolved'][] = 'Daftar draft lama perlu diperiksa melalui cadangan.';
            return $result;
        }
        foreach ($drafts as $key => $payload) {
            try {
                if (!is_array($payload)) throw new InvalidArgumentException('Draft tidak valid.');
                $id = (string) ($payload['meetingId'] ?? '');
                $this->save($id, $payload, 0, $userId);
                $result['saved']++;
            } catch (DraftConflictException) {
                $result['conflicts'][] = (string) $key;
            } catch (InvalidArgumentException | RuntimeException $error) {
                if ($error instanceof PDOException) throw $error;
                $result['unresolved'][] = (string) $key;
            }
        }
        return $result + ['backupId' => $backupId];
    }

    private function meeting(string $id): array
    {
        if ($id === '' || strlen($id) > 80) throw new InvalidArgumentException('Pilih pertemuan yang sudah tersimpan.');
        $stmt = $this->db->prepare('SELECT id, task_id FROM meetings WHERE id = :id AND deleted_at IS NULL');
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: throw new RuntimeException('Pertemuan tidak ditemukan.');
    }

    private function mapDraft(array $row): array
    {
        $payload = json_decode($row['payload'], true, 512, JSON_THROW_ON_ERROR);
        return ['meetingId' => $row['meeting_id'], 'payload' => $payload, 'documentNumber' => $payload['documentNumber'] ?? null, 'revision' => (int) $row['revision'], 'updatedBy' => $row['updated_by'], 'updatedAt' => self::timestamp($row['updated_at'])];
    }

    private static function samePayload(array $a, array $b): bool
    {
        return $a == $b;
    }

    private static function timestamp(string $value): int
    {
        return (new DateTimeImmutable($value, new DateTimeZone('UTC')))->getTimestamp() * 1000;
    }
}
