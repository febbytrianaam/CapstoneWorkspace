<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require_once __DIR__ . '/../backend/Database.php';

$expected = [
    'berita_acara_drafts' => ['meeting_id', 'payload', 'payload_hash', 'revision', 'updated_by', 'created_at', 'updated_at'],
    'browser_recovery_backups' => ['id', 'owner_id', 'contents', 'created_at'],
];
$statements = array_values(array_filter(array_map('trim', explode(';', file_get_contents(__DIR__ . '/migrations/006_berita_acara_storage.sql')))));
if (count($statements) !== 2) throw new RuntimeException('Expected exactly two additive CREATE statements.');
foreach ($statements as $index => $sql) {
    if (!preg_match('/^CREATE TABLE IF NOT EXISTS ([a-z_]+)\s*\(/', $sql, $matches)
        || $matches[1] !== array_keys($expected)[$index]) throw new RuntimeException('Unexpected migration statement.');
}

$db = Database::connection();
$existing = [];
foreach ($expected as $table => $columns) {
    $stmt = $db->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = :name');
    $stmt->execute(['name' => $table]);
    $existing[$table] = (bool) $stmt->fetchColumn();
    if ($existing[$table]) {
        $actual = $db->query('SHOW COLUMNS FROM `' . $table . '`')->fetchAll(PDO::FETCH_COLUMN);
        if (array_diff($columns, $actual)) throw new RuntimeException('Existing table is incompatible: ' . $table . '. Nothing altered.');
    }
    echo $table . ': ' . ($existing[$table] ? 'already exists; no change' : 'will add new empty table') . PHP_EOL;
}
if (!in_array('--apply', $argv, true)) {
    echo "Dry run only. Use --apply after authorization.\n";
    exit;
}
foreach ($statements as $index => $sql) {
    $table = array_keys($expected)[$index];
    if (!$existing[$table]) $db->exec($sql);
}
foreach ($expected as $table => $columns) {
    $actual = $db->query('SHOW COLUMNS FROM `' . $table . '`')->fetchAll(PDO::FETCH_COLUMN);
    if (array_diff($columns, $actual)) throw new RuntimeException('Verification failed for ' . $table);
}
echo "Verified. No existing business tables, records, seeds, or migrations were modified.\n";
