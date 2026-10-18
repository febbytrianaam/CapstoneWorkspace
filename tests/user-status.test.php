<?php
declare(strict_types=1);
require_once __DIR__ . '/../backend/Repository.php';

// Isolated PDO doubles only. No Repository::create(), connection, or live SQL.
final class StatusPDO extends PDO
{
    public array $users;
    public array $writes = [];
    public bool $failAudit = false;
    private bool $transaction = false;
    private array $before = [];
    public function __construct() {
        $base = ['username' => 'qa', 'password_hash' => password_hash('qa-password-only', PASSWORD_DEFAULT), 'full_name' => 'QA', 'nim' => null, 'color' => '#2563EB', 'initial' => 'QA', 'last_login_at' => null, 'last_seen_at' => null, 'password_changed_at' => null, 'is_active' => 1];
        $this->users = ['admin' => ['id' => 'admin', 'name' => 'Admin', 'role' => 'superadmin'] + $base, 'member' => ['id' => 'member', 'name' => 'Member', 'role' => 'member'] + $base];
    }
    public function prepare(string $query, array $options = []): PDOStatement|false { return new StatusStatement($this, $query); }
    public function inTransaction(): bool { return $this->transaction; }
    public function beginTransaction(): bool { $this->before = [$this->users, $this->writes]; return $this->transaction = true; }
    public function commit(): bool { $this->transaction = false; return true; }
    public function rollBack(): bool { [$this->users, $this->writes] = $this->before; $this->transaction = false; return true; }
}
final class StatusStatement extends PDOStatement
{
    private mixed $row = false;
    public function __construct(private StatusPDO $db, private string $sql) {}
    public function execute(?array $params = null): bool {
        $p = $params ?? [];
        if (str_starts_with($this->sql, 'SELECT * FROM users WHERE id')) $this->row = $this->db->users[$p['id']] ?? false;
        elseif (str_starts_with($this->sql, 'SELECT * FROM users WHERE username')) $this->row = $this->db->users['member'];
        elseif (str_starts_with($this->sql, 'SELECT * FROM users WHERE name')) {
            $this->row = false;
            foreach ($this->db->users as $row) if ($row['name'] === $p['name']) $this->row = $row;
        } elseif (str_starts_with($this->sql, 'UPDATE users SET is_active')) {
            $this->db->users[$p['id']]['is_active'] = $p['active']; $this->db->writes[] = 'status';
        } elseif (str_contains($this->sql, 'SET last_login_at')) $this->db->writes[] = 'login';
        elseif (str_starts_with($this->sql, 'INSERT INTO audit_logs')) {
            if ($this->db->failAudit) throw new RuntimeException('Synthetic audit failure');
            $this->db->writes[] = 'audit';
        }
        else throw new RuntimeException('Unexpected SQL: ' . $this->sql);
        return true;
    }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed { return $this->row; }
}
function statusCheck(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }
function statusReject(callable $fn): void {
    try { $fn(); } catch (InvalidArgumentException) { return; }
    throw new RuntimeException('Expected rejection');
}
$db = new StatusPDO(); $repo = new Repository($db);
$actor = ['id' => 'admin', 'name' => 'Admin', 'role' => 'superadmin'];
$_SESSION = ['capstone_user_name' => 'Admin', 'capstone_user_role' => 'superadmin'];
$original = $db->users['member'];
statusReject(fn () => $repo->setUserActive('member', false, ['id' => 'other', 'role' => 'member']));
statusReject(fn () => $repo->setUserActive('admin', false, $actor));
statusReject(fn () => $repo->setUserActive('admin', false, ['id' => 'other', 'role' => 'superadmin']));
statusReject(fn () => $repo->updateUser('member', ['isActive' => false]));
statusCheck($db->writes === [], 'Unauthorized changes must not write.');
$db->failAudit = true;
try { $repo->setUserActive('member', false, $actor); throw new LogicException('Audit failure was not raised'); }
catch (RuntimeException $error) { statusCheck($error->getMessage() === 'Synthetic audit failure', 'Unexpected failure'); }
statusCheck($db->users['member'] === $original && $db->writes === [] && !$db->inTransaction(), 'Failed audit must roll back status and preserve account.');
$db->failAudit = false;
statusCheck($repo->setUserActive('member', false, $actor)['isActive'] === false, 'Deactivate must return canonical status.');
$expected = $original; $expected['is_active'] = 0;
statusCheck($db->users['member'] === $expected, 'Deactivate must preserve profile/password and historical identity.');
statusCheck($db->writes === ['status', 'audit'] && !$db->inTransaction(), 'Status and audit must commit together.');
$repo->setUserActive('member', false, $actor);
statusCheck(count($db->writes) === 2, 'An identical retry must not duplicate audit writes.');
statusCheck($repo->authenticate('qa', 'qa-password-only') === null, 'Inactive account cannot authenticate with a valid password.');
statusReject(fn () => $repo->createTask(['pic' => 'Member']));
statusReject(fn () => $repo->createTask(['pic' => 'Admin', 'reviewer' => 'Member']));
statusReject(fn () => $repo->createMeeting(['host' => 'Member']));
statusCheck(count($db->writes) === 2, 'Inactive assignments must fail before business writes.');
$api = file_get_contents(__DIR__ . '/../backend/api/index.php');
$start = strpos($api, 'function authenticatedUser(');
$end = strpos($api, 'function requireAuthenticatedUser(', $start);
eval(substr($api, $start, $end - $start));
$_SESSION['capstone_user_id'] = 'member';
statusCheck(authenticatedUser($repo) === null && !isset($_SESSION['capstone_user_id']), 'Existing inactive session must be rejected and cleared.');
statusCheck($repo->setUserActive('member', true, $actor)['isActive'] === true, 'Reactivation must retain the original account.');
statusCheck($repo->authenticate('qa', 'qa-password-only')['isActive'] === true, 'Reactivated account can authenticate again.');
echo "User status contracts passed: permissions, session/login rejection, reactivation, assignment rejection, history preservation; no database.\n";
