<?php
declare(strict_types=1);
require_once __DIR__ . '/../backend/Repository.php';

final class ReportStatement extends PDOStatement
{
    public function __construct(public ReportPDO $db, public string $sql) {}
    public function execute(?array $params = null): bool { $this->db->parameters[] = $params; return true; }
    public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array {
        return str_contains($this->sql, 'task_checklist_items')
            ? [['text' => 'Synthetic checklist', 'is_done' => 1]]
            : [['id' => 'qa-task', 'phase' => 'tugas2', 'title' => 'Synthetic task', 'pic' => 'QA', 'status' => 'Sedang Dikerjakan', 'priority' => 'Tinggi']];
    }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed { return false; }
}
final class ReportPDO extends PDO
{
    public array $queries = [], $parameters = [];
    public function __construct() {}
    public function prepare(string $query, array $options = []): PDOStatement|false {
        if (!str_starts_with(trim($query), 'SELECT')) throw new RuntimeException('Writes are forbidden in report tests.');
        $this->queries[] = $query; return new ReportStatement($this, $query);
    }
}
function check(bool $valid, string $message): void { if (!$valid) throw new RuntimeException($message); }
$db = new ReportPDO(); $repo = new Repository($db);
foreach (['member', 'koordinator', ''] as $role) {
    try { $repo->taskReport('tugas2', ['role' => $role]); throw new LogicException('Unauthorized report accepted.'); }
    catch (RuntimeException $e) { check(count($db->queries) === 0, 'Unauthorized report queried data.'); }
}
try { $repo->taskReport('audit', ['role' => 'superadmin']); throw new LogicException('Bad phase accepted.'); }
catch (InvalidArgumentException) { check(count($db->queries) === 0, 'Bad phase queried data.'); }
$report = $repo->taskReport('tugas2', ['role' => 'superadmin', 'name' => 'QA']);
check($db->parameters === [['phase' => 'tugas2'], ['task_id' => 'qa-task'], ['phase' => 'tugas2']], 'Phase/checklist queries must bind parameters.');
check(count($db->queries) === 3, 'Only tasks, checklist and phase note should be read.');
check(!str_contains(implode(' ', $db->queries), 'meetings'), 'Reports must not query meeting/private audit data.');
check($report['tasks'][0]['checklistDone'] === [true], 'Checklist flags must be preserved.');
check($report['progressNote'] === null && $report['generatedBy'] === 'QA', 'Metadata must be correct.');
echo "Task report repository contract passed (PDO doubles, no database).\n";
