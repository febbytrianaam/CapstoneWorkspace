<?php

declare(strict_types=1);

require_once __DIR__ . '/../backend/BeritaAcaraStorage.php';

// In-memory PDO doubles: no connection or SQL execution against a database.
final class BaMemoryPDO extends PDO
{
    public array $meetings = ['qa-meeting' => ['id' => 'qa-meeting', 'task_id' => 'qa-task'], 'qa-second' => ['id' => 'qa-second', 'task_id' => null]];
    public array $drafts = [];
    public array $backups = [];
    public array $writes = [];
    public array $archives = [];
    private bool $transaction = false;
    private array $before = [];

    public function __construct() {}
    public function prepare(string $query, array $options = []): PDOStatement|false { return new BaMemoryStatement($this, $query); }
    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): PDOStatement|false { $stmt = new BaMemoryStatement($this, $query); $stmt->execute(); return $stmt; }
    public function inTransaction(): bool { return $this->transaction; }
    public function beginTransaction(): bool { $this->before = [$this->drafts, $this->backups]; return $this->transaction = true; }
    public function commit(): bool { $this->transaction = false; return true; }
    public function rollBack(): bool { [$this->drafts, $this->backups] = $this->before; $this->transaction = false; return true; }
}

final class BaMemoryStatement extends PDOStatement
{
    private mixed $row = false;
    private int $affected = 0;
    private array $rows = [];
    private mixed $column = false;
    public function __construct(private BaMemoryPDO $db, private string $sql) {}
    public function execute(?array $params = null): bool
    {
        $p = $params ?? [];
        $this->affected = 0;
        if (str_starts_with($this->sql, 'SELECT GET_LOCK') || str_starts_with($this->sql, 'SELECT RELEASE_LOCK')) $this->column = 1;
        elseif (str_starts_with($this->sql, 'SELECT id, meeting_id, original_name')) $this->rows = $this->db->archives;
        elseif (str_starts_with($this->sql, 'SELECT meeting_id, JSON_UNQUOTE')) $this->rows = array_map(static fn ($row) => ['meeting_id' => $row['meeting_id'], 'document_number' => json_decode($row['payload'], true)['documentNumber'] ?? null, 'meeting_date' => json_decode($row['payload'], true)['hariTanggal'] ?? null], array_values($this->db->drafts));
        elseif (str_starts_with($this->sql, 'SELECT id, task_id FROM meetings')) $this->row = $this->db->meetings[$p['id']] ?? false;
        elseif (str_starts_with($this->sql, 'SELECT * FROM berita_acara_drafts')) $this->row = $this->db->drafts[$p['id']] ?? false;
        elseif (str_starts_with($this->sql, 'SELECT * FROM browser_recovery_backups')) $this->row = $this->db->backups[$p['id']] ?? false;
        elseif (str_starts_with($this->sql, 'INSERT INTO berita_acara_drafts')) {
            if (isset($this->db->drafts[$p['id']])) throw new PDOException('duplicate', 23000);
            $this->db->drafts[$p['id']] = ['meeting_id' => $p['id'], 'payload' => $p['payload'], 'revision' => 1, 'updated_by' => $p['user'], 'updated_at' => '2026-10-18 09:00:00'];
            $this->db->writes[] = 'draft';
        } elseif (str_starts_with($this->sql, 'UPDATE berita_acara_drafts')) {
            if (($this->db->drafts[$p['id']]['revision'] ?? 0) === $p['revision']) {
                $row = &$this->db->drafts[$p['id']];
                $row['payload'] = $p['payload'];
                $row['revision']++;
                $row['updated_by'] = $p['user'];
                $this->affected = 1;
                $this->db->writes[] = 'draft';
            }
        } elseif (str_starts_with($this->sql, 'INSERT INTO browser_recovery_backups')) {
            $this->db->backups[$p['id']] ??= ['owner_id' => $p['owner'], 'contents' => $p['contents'], 'created_at' => '2026-10-18 09:00:00'];
            $this->db->writes[] = 'backup';
        } else throw new RuntimeException('Unexpected SQL in isolated test: ' . $this->sql);
        return true;
    }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed { return $this->row; }
    public function rowCount(): int { return $this->affected; }
    public function fetchColumn(int $column = 0): mixed { return $this->column; }
    public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array { return $this->rows; }
}

function checkBa(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }
function expectBaError(callable $action, string $class): void
{
    try { $action(); } catch (Throwable $error) { if ($error instanceof $class) return; throw $error; }
    throw new RuntimeException('Expected ' . $class);
}

$db = new BaMemoryPDO();
$storage = new BeritaAcaraStorage($db);
$originalMeetings = $db->meetings;
$payload = ['judul' => "Judul\nBaris kedua", 'hariTanggal' => 'Rabu, 14 Oktober 2026', 'waktu' => '21.00–22.34 WIB', 'lokasi' => "Microsoft Teams\nhttps://example.test", 'attendingNames' => ['QA A'], 'activities' => [['aktivitas' => "Review\nprogres", 'luaran' => 'Output', 'pic' => 'QA A', 'catatan' => 'Belum final']], 'images' => ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=']];
$first = $storage->save('qa-meeting', $payload, 0, 'QA');
checkBa($first['revision'] === 1 && $first['payload']['judul'] === $payload['judul'], 'First save must preserve text/newlines.');
checkBa($first['documentNumber'] === 1, 'First BA receives a persisted global number.');
checkBa($first['payload']['taskId'] === 'qa-task' && $first['payload']['images'] === $payload['images'], 'Meeting relation and images must persist.');
checkBa($storage->save('qa-meeting', $payload, 0, 'QA')['revision'] === 1, 'An identical retry must be idempotent.');
$changed = $payload;
$changed['judul'] = 'New revision';
expectBaError(fn () => $storage->save('qa-meeting', $changed, 0, 'QA'), DraftConflictException::class);
checkBa($storage->draft('qa-meeting')['payload']['judul'] === $payload['judul'], 'Conflict must not overwrite.');
checkBa($storage->save('qa-meeting', $changed, 1, 'QA')['revision'] === 2, 'Explicit expected revision must update once.');
checkBa($storage->draft('qa-second') === null, 'No draft must remain null.');
expectBaError(fn () => $storage->save('missing', $payload, 0, 'QA'), RuntimeException::class);
expectBaError(fn () => BeritaAcaraStorage::normalizePayload(['images' => ['data:image/svg+xml;base64,PHN2Zz4=']]), InvalidArgumentException::class);
expectBaError(fn () => BeritaAcaraStorage::normalizePayload(['images' => ['data:image/png;base64,bm90LWFuLWltYWdl']]), InvalidArgumentException::class);
expectBaError(fn () => BeritaAcaraStorage::normalizePayload(['activities' => ['invalid']]), InvalidArgumentException::class);
$legacy = json_encode(['qa-meeting::qa-task' => $payload + ['meetingId' => 'qa-meeting'], 'qa-second::' => $payload + ['meetingId' => 'qa-second'], 'orphan::' => $payload + ['meetingId' => 'missing']], JSON_THROW_ON_ERROR);
$entries = ['capstone_berita_acara_drafts_v1' => $legacy, 'capstone_workspace_v3' => '{broken historical json', 'capstone_auth_v1' => 'must not back up credentials'];
$backup = $storage->backup($entries, 'QA');
checkBa($storage->backup($entries, 'QA')['id'] === $backup['id'] && count($db->backups) === 1, 'Backup retry must not duplicate.');
$stored = $storage->backupById($backup['id']);
checkBa(!isset($stored['entries']['capstone_auth_v1']) && $stored['entries']['capstone_workspace_v3'] === '{broken historical json', 'Preserve opaque work, not auth data.');
$import = $storage->importDrafts($backup['id'], 'QA');
checkBa($import['saved'] === 1 && count($import['conflicts']) === 1 && count($import['unresolved']) === 1, 'Import must distinguish conflict, saved, and orphan.');
checkBa($storage->draft('qa-meeting')['payload']['judul'] === 'New revision', 'Import must not overwrite the current server version.');
checkBa($storage->draft('qa-second')['documentNumber'] === 2, 'A new meeting receives the next BA number.');
checkBa($storage->backupById($backup['id'])['entries']['capstone_berita_acara_drafts_v1'] === $legacy, 'Original backup must remain intact.');
expectBaError(fn () => $storage->importDrafts($backup['id'], 'Other'), InvalidArgumentException::class);
checkBa($db->meetings === $originalMeetings, 'Saving/importing must never change meetings or tasks.');
$manuals = [
    ['id' => 'a1', 'meeting_id' => 'm1', 'original_name' => '01. BA001 - Berita Acara.pdf', 'title' => 'Pertemuan awal'],
    ['id' => 'a2', 'meeting_id' => 'm2', 'original_name' => '01. BA002 - Berita Acara.pdf', 'title' => 'Pertemuan kedua'],
];
checkBa(BeritaAcaraNumbering::forMeeting('m3', $manuals, [['meeting_id' => 'm3', 'document_number' => null]]) === 3, 'Legacy manual BAs reserve BA001/BA002.');
checkBa(BeritaAcaraNumbering::forMeeting('m2', $manuals, [['meeting_id' => 'm2', 'document_number' => null]]) === 2, 'Manual + draft must reuse one meeting number.');
checkBa(BeritaAcaraNumbering::forMeeting('m4', $manuals, [['meeting_id' => 'm3', 'document_number' => 5]]) === 6, 'Do not reuse deleted/gapped numbers.');
$unlinkedManuals = $manuals;
$unlinkedManuals[0]['meeting_id'] = null;
$unlinkedManuals[0]['original_name'] = '01. BA001 - Berita Acara Pertemuan 25 September 2026.pdf';
$datedDrafts = [['meeting_id' => 'm1', 'document_number' => null, 'meeting_date' => 'Jumat, 25 September 2026']];
checkBa(BeritaAcaraNumbering::forMeeting('m3', $unlinkedManuals, $datedDrafts) === 3, 'Unlinked dated manual + first draft must not consume BA003.');
checkBa(BeritaAcaraNumbering::forMeeting('m1', $unlinkedManuals, $datedDrafts) === 1, 'First draft reuses the uniquely dated BA001.');
$datedDrafts[] = ['meeting_id' => 'another-meeting', 'document_number' => null, 'meeting_date' => 'Jumat, 25 September 2026'];
checkBa(BeritaAcaraNumbering::forMeeting('m3', $unlinkedManuals, $datedDrafts) === 5, 'Ambiguous dates must not silently merge distinct meetings.');
checkBa($db->inTransaction() === false, 'Storage must commit/rollback its own transaction.');
$legacyDb = new BaMemoryPDO();
$legacyDb->archives = $unlinkedManuals;
$oldPayload = $payload;
$oldPayload['hariTanggal'] = 'Jumat, 25 September 2026';
$legacyDb->drafts['m1'] = ['meeting_id' => 'm1', 'payload' => json_encode($oldPayload), 'revision' => 1, 'updated_by' => 'QA', 'updated_at' => '2026-10-18 09:00:00'];
$legacyBefore = $legacyDb->drafts['m1'];
checkBa((new BeritaAcaraStorage($legacyDb))->save('qa-second', $payload, 0, 'QA')['documentNumber'] === 3, 'Storage query must include legacy draft dates so the third BA gets BA003.');
checkBa($legacyDb->drafts['m1'] === $legacyBefore, 'Number allocation must not rewrite other drafts.');
echo "BA storage tests passed: round-trip, images, revisions, conflicts, safe import, immutable backups, global numbering; no database.\n";
