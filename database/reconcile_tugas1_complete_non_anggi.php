<?php

declare(strict_types=1);

require_once __DIR__ . '/../backend/Database.php';

$mode = $argv[1] ?? '--dry-run';
if (!in_array($mode, ['--dry-run', '--apply'], true)) {
    fwrite(STDERR, "Usage: php database/reconcile_tugas1_complete_non_anggi.php [--dry-run|--apply]\n");
    exit(2);
}

$db = Database::connection();
$rows = $db->query(
    'SELECT t.id, t.title, t.pic, t.status,
            COUNT(i.id) AS checklist_total,
            SUM(COALESCE(i.is_done, 0)) AS checklist_done
     FROM tasks t
     LEFT JOIN task_checklist_items i ON i.task_id = t.id
     WHERE t.phase = "tugas1"
     GROUP BY t.id, t.title, t.pic, t.status
     ORDER BY t.id'
)->fetchAll(PDO::FETCH_ASSOC);

$toUpdate = [];
$preserved = [];
foreach ($rows as $row) {
    if ($row['pic'] === 'Anggi') {
        $preserved[] = $row;
        continue;
    }

    $changes = [];
    if ($row['status'] !== 'Selesai') {
        $changes[] = 'status: ' . $row['status'] . ' -> Selesai';
    }
    $total = (int) $row['checklist_total'];
    $done = (int) $row['checklist_done'];
    if ($done < $total) {
        $changes[] = "checklist: {$done}/{$total} -> {$total}/{$total}";
    }
    if ($changes) {
        $toUpdate[] = $row + ['changes' => $changes];
    }
}

echo 'Mode: ' . $mode . PHP_EOL;
echo 'Tugas 1 total: ' . count($rows) . PHP_EOL;
echo 'Non-Anggi to update: ' . count($toUpdate) . PHP_EOL;
echo 'Anggi preserved: ' . count($preserved) . PHP_EOL . PHP_EOL;

if ($toUpdate) {
    echo "TASKS TO UPDATE\n";
    foreach ($toUpdate as $row) {
        echo $row['id'] . ' | ' . $row['pic'] . ' | ' . $row['title'] . PHP_EOL;
        echo '  Changes: ' . implode('; ', $row['changes']) . PHP_EOL;
    }
    echo PHP_EOL;
}

if ($preserved) {
    echo "ANGGI TASKS PRESERVED\n";
    foreach ($preserved as $row) {
        echo $row['id'] . ' | ' . $row['status'] . ' | ' . (int) $row['checklist_done'] . '/' . (int) $row['checklist_total'] . ' | ' . $row['title'] . PHP_EOL;
    }
    echo PHP_EOL;
}

if ($mode === '--dry-run') {
    exit(0);
}

$db->beginTransaction();
try {
    $statusStmt = $db->prepare('UPDATE tasks SET status = "Selesai" WHERE id = :id AND phase = "tugas1" AND pic <> "Anggi"');
    $checklistStmt = $db->prepare('UPDATE task_checklist_items SET is_done = 1 WHERE task_id = :task_id');

    foreach ($toUpdate as $row) {
        $statusStmt->execute(['id' => $row['id']]);
        $checklistStmt->execute(['task_id' => $row['id']]);
    }

    if ($toUpdate) {
        $auditStmt = $db->prepare(
            'INSERT INTO audit_logs (id, occurred_at, user_name, role, action, action_tag, object_type, object_id, object_name, details, changes_json, ip, device)
             VALUES (:id, NOW(), "System", "system", "Rekonsiliasi Final Tugas 1", "reconcile_tugas1_non_anggi_complete", "Task", "tugas1", "Tugas 1", :details, :changes_json, "127.0.0.1", "CLI Reconciliation")'
        );
        $auditStmt->execute([
            'id' => 'a-reconcile-t1-non-anggi-' . time(),
            'details' => 'Menandai seluruh task Tugas 1 non-Anggi sebagai selesai berdasarkan klarifikasi owner bahwa evidence sudah didapat; task Anggi tetap tidak diselesaikan.',
            'changes_json' => json_encode(array_map(static fn (array $row): array => [
                'field' => $row['id'],
                'from' => null,
                'to' => implode('; ', $row['changes']),
            ], $toUpdate), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
    }

    $db->commit();
} catch (Throwable $e) {
    $db->rollBack();
    throw $e;
}

echo 'Applied final non-Anggi Tugas 1 closure.' . PHP_EOL;
