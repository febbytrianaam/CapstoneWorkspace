<?php

declare(strict_types=1);

require_once __DIR__ . '/../backend/Database.php';

$mode = $argv[1] ?? '--dry-run';
if (!in_array($mode, ['--dry-run', '--apply'], true)) {
    fwrite(STDERR, "Usage: php database/reconcile_tugas1_phase3b.php [--dry-run|--apply]\n");
    exit(2);
}

$updates = [
    't1-2026-12' => [
        'status' => 'Selesai',
        'completeChecklist' => true,
        'reason' => 'Draft Proposal Tugas 1 completed as part of final submitted proposal.',
    ],
    't1-2026-13' => [
        'status' => 'Selesai',
        'completeChecklist' => true,
        'reason' => 'Latar Belakang and Tujuan completed in final submitted proposal.',
    ],
    't1-2026-14' => [
        'status' => 'Selesai',
        'completeChecklist' => true,
        'reason' => 'Ruang Lingkup completed in final submitted proposal; Febby remains final PIC.',
    ],
    't1-2026-18' => [
        'status' => 'Selesai',
        'completeChecklist' => true,
        'reason' => 'Tinjauan Pustaka integrated in final submitted proposal; Farah remains reference support.',
    ],
    't1-2026-22' => [
        'status' => 'Selesai',
        'completeChecklist' => true,
        'reason' => 'Proposal Tugas 1 submitted on 11 Oct 2026 approximately 08.58 WIB per owner clarification.',
    ],
    't1-2026-24' => [
        'status' => 'Selesai',
        'completeChecklist' => false,
        'reason' => 'All progress synchronization checklist items were already complete; status reconciled.',
    ],
];

$db = Database::connection();
$ids = array_keys($updates);
$placeholders = implode(',', array_fill(0, count($ids), '?'));
$stmt = $db->prepare(
    "SELECT t.id, t.phase, t.title, t.pic, t.status,
            COUNT(i.id) AS checklist_total,
            SUM(COALESCE(i.is_done, 0)) AS checklist_done
     FROM tasks t
     LEFT JOIN task_checklist_items i ON i.task_id = t.id
     WHERE t.id IN ($placeholders)
     GROUP BY t.id, t.phase, t.title, t.pic, t.status
     ORDER BY t.id"
);
$stmt->execute($ids);
$existingRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$existing = [];
foreach ($existingRows as $row) {
    $existing[$row['id']] = $row;
}

$missing = array_values(array_diff($ids, array_keys($existing)));
if ($missing) {
    fwrite(STDERR, 'Missing expected Tugas 1 task IDs: ' . implode(', ', $missing) . PHP_EOL);
    exit(1);
}

$plannedChanges = [];
foreach ($updates as $id => $plan) {
    $row = $existing[$id];
    if ($row['phase'] !== 'tugas1') {
        fwrite(STDERR, "Task {$id} is not in phase tugas1; aborting.\n");
        exit(1);
    }

    $changes = [];
    if ($row['status'] !== $plan['status']) {
        $changes[] = 'status: ' . $row['status'] . ' -> ' . $plan['status'];
    }
    $total = (int) $row['checklist_total'];
    $done = (int) $row['checklist_done'];
    if ($plan['completeChecklist'] && $done < $total) {
        $changes[] = "checklist: {$done}/{$total} -> {$total}/{$total}";
    }

    $plannedChanges[] = [
        'id' => $id,
        'title' => $row['title'],
        'pic' => $row['pic'],
        'changes' => $changes,
        'reason' => $plan['reason'],
    ];
}

echo 'Mode: ' . $mode . PHP_EOL;
echo 'Planned task IDs: ' . count($plannedChanges) . PHP_EOL;
foreach ($plannedChanges as $change) {
    echo $change['id'] . ' | ' . $change['title'] . ' | PIC: ' . $change['pic'] . PHP_EOL;
    echo '  Changes: ' . ($change['changes'] ? implode('; ', $change['changes']) : 'none') . PHP_EOL;
    echo '  Reason: ' . $change['reason'] . PHP_EOL;
}

if ($mode === '--dry-run') {
    exit(0);
}

$db->beginTransaction();
try {
    $statusStmt = $db->prepare('UPDATE tasks SET status = :status WHERE id = :id AND phase = "tugas1"');
    $checklistStmt = $db->prepare('UPDATE task_checklist_items SET is_done = 1 WHERE task_id = :task_id');

    foreach ($updates as $id => $plan) {
        $statusStmt->execute([
            'status' => $plan['status'],
            'id' => $id,
        ]);
        if ($plan['completeChecklist']) {
            $checklistStmt->execute(['task_id' => $id]);
        }
    }

    $auditStmt = $db->prepare(
        'INSERT INTO audit_logs (id, occurred_at, user_name, role, action, action_tag, object_type, object_id, object_name, details, changes_json, ip, device)
         VALUES (:id, NOW(), "System", "system", "Rekonsiliasi Tugas 1 Phase 3B", "reconcile_tugas1_phase3b", "Task", "tugas1", "Tugas 1", :details, :changes_json, "127.0.0.1", "CLI Reconciliation")'
    );
    $auditStmt->execute([
        'id' => 'a-reconcile-t1-3b-' . time(),
        'details' => 'Menutup task proposal/submission Tugas 1 berdasarkan owner clarification Phase 3B. Tidak mengubah Tugas 2/Tugas 3.',
        'changes_json' => json_encode(array_map(static fn (array $change): array => [
            'field' => $change['id'],
            'from' => null,
            'to' => implode('; ', $change['changes']) ?: 'no-op',
        ], $plannedChanges), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]);

    $db->commit();
} catch (Throwable $e) {
    $db->rollBack();
    throw $e;
}

echo PHP_EOL . 'Applied Phase 3B conservative closure.' . PHP_EOL;
