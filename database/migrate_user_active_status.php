<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../backend/Database.php';
$db = Database::connection();
$columns = $db->query('SHOW COLUMNS FROM users')->fetchAll();
$column = array_values(array_filter($columns, static fn ($row) => $row['Field'] === 'is_active'));
if ($column && ($column[0]['Type'] !== 'tinyint(1)' || $column[0]['Null'] !== 'NO' || (string) $column[0]['Default'] !== '1')) throw new RuntimeException('Existing status column is incompatible; nothing changed.');
if ($column) { echo "Status column already exists; no changes.\n"; exit; }
echo "Will add only users.is_active, NOT NULL DEFAULT 1. Existing accounts stay active.\n";
if (!in_array('--apply', $argv, true)) { echo "Dry run only.\n"; exit; }
$before = (int) $db->query('SELECT COUNT(*) FROM users')->fetchColumn();
$db->exec('SET SESSION lock_wait_timeout = 5');
$db->exec(file_get_contents(__DIR__ . '/migrations/007_user_active_status.sql'));
$after = $db->query('SELECT COUNT(*) AS total, SUM(is_active = 1) AS active FROM users')->fetch();
if ((int) $after['total'] !== $before || (int) $after['active'] !== $before) throw new RuntimeException('Status migration verification failed.');
echo "Verified: added status column; all $before accounts remain active; no business records updated or removed.\n";
