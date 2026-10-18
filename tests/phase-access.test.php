<?php

declare(strict_types=1);

require_once __DIR__ . '/../backend/Repository.php';

// PDO doubles only: no connection, Repository::create(), or SQL execution.
final class PhaseAccessStatement extends PDOStatement
{
    public array $parameters = [];

    public function execute(?array $params = null): bool
    {
        $this->parameters = $params ?? [];
        return true;
    }

    public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array
    {
        return [
            ['id' => 'qa-a', 'name' => 'QA A', 'initial' => 'QA', 'last_access_at' => '2026-10-18 09:08:35', 'last_seen_at' => '2026-10-18 09:08:40', 'ip' => 'private'],
            ['id' => 'qa-b', 'name' => 'QA B', 'initial' => 'QB', 'last_access_at' => null, 'last_seen_at' => null],
            ['id' => 'qa-inactive', 'name' => 'Inactive', 'initial' => 'IN', 'last_access_at' => null, 'last_seen_at' => null, 'is_active' => 0],
        ];
    }
}

final class PhaseAccessPDO extends PDO
{
    public array $queries = [];
    public PhaseAccessStatement $statement;

    public function __construct()
    {
        $this->statement = new PhaseAccessStatement();
    }

    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        $this->queries[] = $query;
        return $this->statement;
    }
}

function verify(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

$db = new PhaseAccessPDO();
$repository = new Repository($db);
$rows = $repository->phaseAccessSummary('tugas2');
verify($db->statement->parameters === ['phase' => 'tugas2'], 'Phase must be bound, not interpolated.');
verify(count($db->queries) === 1 && str_starts_with(trim($db->queries[0]), 'SELECT'), 'Summary must only read.');
verify(str_contains($db->queries[0], 'MAX(occurred_at)') && str_contains($db->queries[0], 'WHERE page_name = :phase'), 'Summary must aggregate the selected phase before joining users.');
verify(str_contains($db->queries[0], 'GROUP BY user_name COLLATE utf8mb4_unicode_ci')
    && str_contains($db->queries[0], 'a.user_name COLLATE utf8mb4_unicode_ci = u.name COLLATE utf8mb4_unicode_ci'), 'Group and join names with a consistent explicit collation, without schema changes.');
verify(array_keys($rows[0]) === ['id', 'name', 'initial', 'lastSeenAt', 'lastAccessAt'], 'Private metadata must not be returned.');
verify($rows[0]['lastAccessAt'] === 1792314515000, 'Access timestamp must be UTC milliseconds.');
verify($rows[1]['lastAccessAt'] === null && $rows[1]['lastSeenAt'] === null, 'Unknown access must remain unknown.');
verify(count($rows) === 2, 'Inactive members must not appear in current team presence.');
try {
    $repository->phaseAccessSummary('users');
    throw new RuntimeException('Invalid phase accepted.');
} catch (InvalidArgumentException) {
    verify(count($db->queries) === 1, 'Invalid phase must not query.');
}
echo "Phase access summary contract passed (PDO doubles, no database).\n";
