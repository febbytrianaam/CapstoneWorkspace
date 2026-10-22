<?php
declare(strict_types=1);

// Execute the real router with a fake Repository and a synthetic session only.
final class Repository
{
    public static function create(): self { return new self(); }
    public function userById(string $id): array { return ['id' => 'qa', 'name' => 'QA', 'role' => $GLOBALS['argv'][1], 'isActive' => true]; }
    public function rbacPermissions(): array {
        $area = $GLOBALS['argv'][4];
        return $area === '' ? [] : [['role' => 'superadmin', 'area' => $area, 'permission' => $area === 'tasks' ? 'read' : 'tugas2', 'allowed' => 0]];
    }
    public function taskReport(string $phase, array $user): array { return ['phase' => $phase, 'tasks' => [], 'generatedAt' => 1]; }
}
$_SERVER['REQUEST_METHOD'] = $argv[2];
$_GET = ['resource' => 'task-reports', 'phase' => $argv[3]];
register_shutdown_function(static fn () => fwrite(STDERR, 'HTTP:' . http_response_code()));
$source = file_get_contents(__DIR__ . '/../backend/api/index.php');
$dependency = "require_once __DIR__ . '/../Repository.php';";
if (substr_count($source, $dependency) !== 1 || substr_count($source, 'session_start();') !== 1) throw new RuntimeException('Router fixture anchors changed.');
$source = str_replace($dependency, '', $source);
$source = str_replace("require_once __DIR__ . '/../Response.php';", 'require_once ' . var_export(__DIR__ . '/../backend/Response.php', true) . ';', $source);
$source = str_replace('session_start();', "session_start(); \$_SESSION = [];" . ($argv[1] === 'anonymous' ? '' : " \$_SESSION['capstone_user_id'] = 'qa';"), $source);
eval(substr($source, 5));
