<?php

declare(strict_types=1);

require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Repository.php';

function requestIsHttps(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
}

session_name('capstone_session');
$sessionPath = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'capstone_sessions';
if (!is_dir($sessionPath)) {
    @mkdir($sessionPath, 0700, true);
}
if (is_dir($sessionPath) && is_writable($sessionPath)) {
    session_save_path($sessionPath);
}
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => requestIsHttps(),
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function authenticatedUser(Repository $repo): ?array
{
    $userId = (string) ($_SESSION['capstone_user_id'] ?? '');
    if ($userId === '') {
        return null;
    }

    try {
        $user = $repo->userById($userId);
    } catch (Throwable) {
        unset($_SESSION['capstone_user_id'], $_SESSION['capstone_user_name'], $_SESSION['capstone_user_role']);
        return null;
    }

    $_SESSION['capstone_user_name'] = $user['name'];
    $_SESSION['capstone_user_role'] = $user['role'];
    return $user;
}

function requireAuthenticatedUser(Repository $repo): array
{
    $user = authenticatedUser($repo);
    if (!$user) {
        Response::error('Sesi login tidak valid atau sudah berakhir.', 401);
    }
    return $user;
}

try {
    $repo = Repository::create();
    $resource = $_GET['resource'] ?? 'snapshot';
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input') ?: '[]', true) ?: [];
    $currentUser = null;

    if ($resource === 'auth' && $method === 'GET') {
        $user = authenticatedUser($repo);
        if (!$user) {
            Response::error('Belum login.', 401);
        }
        Response::json(['ok' => true, 'data' => $user]);
    }

    if ($resource === 'auth' && $method === 'POST') {
        $username = (string) ($input['username'] ?? '');
        $password = (string) ($input['password'] ?? '');
        $user = $repo->authenticate($username, $password);
        if (!$user) {
            Response::error('Username atau password salah.', 401);
        }

        session_regenerate_id(true);
        $_SESSION['capstone_user_id'] = $user['id'];
        $_SESSION['capstone_user_name'] = $user['name'];
        $_SESSION['capstone_user_role'] = $user['role'];
        Response::json(['ok' => true, 'data' => $user]);
    }

    if ($resource === 'auth' && $method === 'DELETE') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $params['path'],
                'domain' => $params['domain'],
                'secure' => (bool) $params['secure'],
                'httponly' => (bool) $params['httponly'],
                'samesite' => $params['samesite'] ?? 'Lax',
            ]);
        }
        session_destroy();
        Response::json(['ok' => true]);
    }

    $currentUser = requireAuthenticatedUser($repo);

    if ($resource !== 'auth') {
        $role = $currentUser['role'];
        $permissions = [
            'superadmin' => ['tasks' => ['GET', 'POST', 'PUT', 'DELETE'], 'meetings' => ['GET', 'POST', 'PUT', 'DELETE'], 'users' => ['GET', 'POST', 'PUT', 'DELETE'], 'audit-logs' => ['GET', 'POST', 'DELETE'], 'snapshot' => ['GET'], 'rbac' => ['GET', 'POST'], 'notifications' => ['GET', 'POST', 'PUT'], 'guides' => ['GET', 'POST', 'DELETE'], 'document-archives' => ['GET', 'POST', 'DELETE'], 'progress-notes' => ['GET', 'PUT']],
            'koordinator' => ['tasks' => ['GET', 'POST', 'PUT', 'DELETE'], 'meetings' => ['GET', 'POST', 'PUT', 'DELETE'], 'users' => ['GET'], 'audit-logs' => ['GET', 'POST'], 'snapshot' => ['GET'], 'rbac' => ['GET'], 'notifications' => ['GET', 'POST', 'PUT'], 'guides' => ['GET', 'POST', 'DELETE'], 'document-archives' => ['GET'], 'progress-notes' => ['GET']],
            'member' => ['tasks' => ['GET', 'PUT'], 'meetings' => [], 'users' => [], 'audit-logs' => ['POST'], 'snapshot' => ['GET'], 'rbac' => ['GET'], 'notifications' => ['GET', 'POST', 'PUT'], 'guides' => ['GET'], 'document-archives' => ['GET'], 'progress-notes' => ['GET']],
        ];
        if (!isset($permissions[$role]) || !in_array($method, $permissions[$role][$resource] ?? [], true)) {
            Response::error('Role tidak memiliki permission untuk endpoint ini.', 403);
        }
    }

    if ($resource === 'snapshot' && $method === 'GET') {
        $repo->touchUserPresence($currentUser['id']);
        Response::json(['ok' => true, 'data' => $repo->snapshot($currentUser)]);
    }

    if ($resource === 'rbac' && $method === 'GET') {
        Response::json(['ok' => true, 'data' => $repo->rbacPermissions()]);
    }

    if ($resource === 'rbac' && $method === 'POST') {
        $role = (string) ($input['role'] ?? '');
        $area = (string) ($input['area'] ?? '');
        $permission = (string) ($input['permission'] ?? '');
        if (!in_array($role, ['superadmin', 'koordinator', 'member'], true) || !$area || !$permission) {
            Response::error('Data permission RBAC tidak valid.', 422);
        }
        if ($role === 'superadmin' && $area === 'pages' && $permission === 'rbac' && empty($input['allowed'])) {
            Response::error('Akses RBAC superadmin tidak boleh dinonaktifkan.', 422);
        }
        Response::json(['ok' => true, 'data' => $repo->setRbacPermission($role, $area, $permission, !empty($input['allowed']))]);
    }

    if ($resource === 'guides' && $method === 'GET') {
        $id = (string) ($_GET['id'] ?? '');
        if ($id !== '' && (isset($_GET['download']) || isset($_GET['view']))) {
            $file = $repo->projectGuideFile($id);
            $downloadName = str_replace(['"', "\r", "\n"], '', basename($file['original_name']));
            header('Content-Type: ' . $file['mime_type']);
            header('Content-Length: ' . (int) $file['file_size']);
            $disposition = isset($_GET['view']) ? 'inline' : 'attachment';
            header('Content-Disposition: ' . $disposition . '; filename="' . $downloadName . '"');
            header('X-Content-Type-Options: nosniff');
            echo $file['file_data'];
            exit;
        }
        Response::json(['ok' => true, 'data' => $repo->projectGuides()]);
    }

    if ($resource === 'guides' && $method === 'POST') {
        $title = trim((string) ($_POST['title'] ?? ''));
        $file = $_FILES['file'] ?? null;
        $maxBytes = 5 * 1024 * 1024;
        $allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];
        $extension = strtolower(pathinfo((string) ($file['name'] ?? ''), PATHINFO_EXTENSION));
        if ($title === '' || !$file || (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Response::error('Judul dan file panduan wajib diisi.', 422);
        }
        if ((int) $file['size'] < 1 || (int) $file['size'] > $maxBytes) {
            Response::error('Ukuran file harus lebih dari 0 dan maksimal 5 MB.', 422);
        }
        if (!in_array($extension, $allowedExtensions, true)) {
            Response::error('Format file belum didukung. Gunakan PDF, Word, PowerPoint, atau Excel.', 422);
        }
        $fileData = file_get_contents($file['tmp_name']);
        if ($fileData === false) {
            Response::error('File panduan tidak dapat dibaca.', 422);
        }
        $mimeType = function_exists('finfo_open')
            ? (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name'])
            : ((string) ($file['type'] ?? 'application/octet-stream'));
        $uploadUser = $currentUser['name'];
        Response::json(['ok' => true, 'data' => $repo->createProjectGuide([
            'title' => $title,
            'original_name' => basename((string) $file['name']),
            'mime_type' => $mimeType ?: 'application/octet-stream',
            'file_size' => (int) $file['size'],
            'file_data' => $fileData,
            'uploaded_by' => $uploadUser,
        ])], 201);
    }

    if ($resource === 'guides' && $method === 'DELETE') {
        $id = (string) ($_GET['id'] ?? '');
        if ($id === '') {
            Response::error('Parameter id wajib diisi.', 422);
        }
        $repo->deleteProjectGuide($id);
        Response::json(['ok' => true]);
    }

    if ($resource === 'document-archives' && $method === 'GET') {
        $id = (string) ($_GET['id'] ?? '');
        if ($id !== '' && (isset($_GET['download']) || isset($_GET['view']))) {
            $file = $repo->documentArchiveFile($id);
            $downloadName = str_replace(['"', "\r", "\n"], '', basename($file['original_name']));
            header('Content-Type: ' . $file['mime_type']);
            header('Content-Length: ' . (int) $file['file_size']);
            $disposition = isset($_GET['view']) ? 'inline' : 'attachment';
            header('Content-Disposition: ' . $disposition . '; filename="' . $downloadName . '"');
            header('X-Content-Type-Options: nosniff');
            echo $file['file_data'];
            exit;
        }
        Response::json(['ok' => true, 'data' => $repo->documentArchives()]);
    }

    if ($resource === 'document-archives' && $method === 'POST') {
        $title = trim((string) ($_POST['title'] ?? ''));
        $category = trim((string) ($_POST['category'] ?? 'lainnya'));
        $description = trim((string) ($_POST['description'] ?? ''));
        $file = $_FILES['file'] ?? null;
        $maxBytes = 10 * 1024 * 1024;
        $allowedCategories = ['berita_acara', 'surat_izin', 'surat_pernyataan', 'proposal_laporan', 'diagram_alur', 'lampiran', 'lainnya'];
        $allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'];
        $extension = strtolower(pathinfo((string) ($file['name'] ?? ''), PATHINFO_EXTENSION));
        if ($title === '' || !$file || (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Response::error('Judul dan file dokumen wajib diisi.', 422);
        }
        if (!in_array($category, $allowedCategories, true)) {
            $category = 'lainnya';
        }
        if ((int) $file['size'] < 1 || (int) $file['size'] > $maxBytes) {
            Response::error('Ukuran file harus lebih dari 0 dan maksimal 10 MB.', 422);
        }
        if (!in_array($extension, $allowedExtensions, true)) {
            Response::error('Format file belum didukung. Gunakan PDF, Word, PowerPoint, Excel, PNG, atau JPG.', 422);
        }
        $fileData = file_get_contents($file['tmp_name']);
        if ($fileData === false) {
            Response::error('File dokumen tidak dapat dibaca.', 422);
        }
        $mimeType = function_exists('finfo_open')
            ? (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name'])
            : ((string) ($file['type'] ?? 'application/octet-stream'));
        Response::json(['ok' => true, 'data' => $repo->createDocumentArchive([
            'title' => $title,
            'category' => $category,
            'description' => $description,
            'original_name' => basename((string) $file['name']),
            'mime_type' => $mimeType ?: 'application/octet-stream',
            'file_size' => (int) $file['size'],
            'file_data' => $fileData,
            'uploaded_by' => $currentUser['name'],
        ])], 201);
    }

    if ($resource === 'document-archives' && $method === 'DELETE') {
        $id = (string) ($_GET['id'] ?? '');
        if ($id === '') {
            Response::error('Parameter id wajib diisi.', 422);
        }
        $repo->deleteDocumentArchive($id);
        Response::json(['ok' => true]);
    }

    if ($resource === 'progress-notes') {
        if ($method === 'GET') {
            Response::json(['ok' => true, 'data' => $repo->phaseProgressNotes()]);
        }
        if ($method === 'PUT') {
            $phase = (string) ($_GET['phase'] ?? ($input['phase'] ?? ''));
            $content = (string) ($input['content'] ?? '');
            Response::json(['ok' => true, 'data' => $repo->savePhaseProgressNote($phase, $content, $currentUser['name'])]);
        }
    }

    if ($resource === 'auth' && $method === 'PUT' && ($input['action'] ?? '') === 'change_password') {
        $userId = $currentUser['id'];
        $currentPassword = (string) ($input['currentPassword'] ?? '');
        $newPassword = (string) ($input['newPassword'] ?? '');
        if ($userId === '' || $currentPassword === '' || strlen($newPassword) < 3) {
            Response::error('Password saat ini dan password baru minimal 3 karakter wajib diisi.', 422);
        }
        Response::json(['ok' => true, 'data' => $repo->changePassword($userId, $currentPassword, $newPassword)]);
    }

    if ($resource === 'tasks') {
        if ($method === 'GET') {
            $includeMeetings = in_array($currentUser['role'] ?? 'member', ['superadmin', 'koordinator'], true);
            Response::json(['ok' => true, 'data' => $repo->tasks($includeMeetings)]);
        }
        if ($method === 'POST') {
            Response::json(['ok' => true, 'data' => $repo->createTask($input)], 201);
        }
        if ($method === 'PUT') {
            $id = $_GET['id'] ?? '';
            if (!$id) {
                Response::error('Parameter id wajib diisi.', 422);
            }
            $task = $repo->taskById((string) $id);
            if ($currentUser['role'] === 'member') {
                if (($task['pic'] ?? '') !== $currentUser['name']) {
                    Response::error('Member hanya dapat mengubah progres tugas miliknya sendiri.', 403);
                }
                $input = array_intersect_key($input, array_flip(['status', 'checklist', 'checklistDone']));
            }
            if (array_key_exists('archivedAt', $input)) {
                if ($currentUser['role'] !== 'superadmin') {
                    unset($input['archivedAt']);
                } elseif (!empty($input['archivedAt']) && ($task['status'] ?? '') !== 'Selesai') {
                    Response::error('Hanya tugas berstatus Selesai yang dapat diarsipkan.', 422);
                }
            }
            Response::json(['ok' => true, 'data' => $repo->updateTask($id, $input)]);
        }
        if ($method === 'DELETE') {
            $id = $_GET['id'] ?? '';
            if (!$id) {
                Response::error('Parameter id wajib diisi.', 422);
            }
            $repo->deleteTask($id);
            Response::json(['ok' => true]);
        }
    }

    if ($resource === 'meetings') {
        $id = $_GET['id'] ?? '';
        if ($method === 'GET') {
            Response::json(['ok' => true, 'data' => $repo->generalMeetings()]);
        }
        if ($method === 'POST') {
            Response::json(['ok' => true, 'data' => $repo->createMeeting($input)], 201);
        }
        if ($method === 'DELETE') {
            if (!$id) {
                Response::error('Parameter id wajib diisi.', 422);
            }
            $repo->deleteMeeting($id);
            Response::json(['ok' => true]);
        }
        if ($method === 'PUT' && ($input['action'] ?? '') === 'mark_berita_acara') {
            if (!$id) {
                Response::error('Parameter id wajib diisi.', 422);
            }
            Response::json(['ok' => true, 'data' => $repo->markMeetingBeritaAcara($id)]);
        }
        if ($method === 'PUT') {
            if (!$id) {
                Response::error('Parameter id wajib diisi.', 422);
            }
            Response::json(['ok' => true, 'data' => $repo->updateMeeting($id, $input)]);
        }
    }

    if ($resource === 'users' && $method === 'GET') {
        Response::json(['ok' => true, 'data' => $repo->usersById()]);
    }

    if ($resource === 'users' && $method === 'POST') {
        Response::json(['ok' => true, 'data' => $repo->createUser($input)], 201);
    }

    if ($resource === 'users' && $method === 'PUT') {
        $id = $_GET['id'] ?? '';
        if (!$id) {
            Response::error('Parameter id wajib diisi.', 422);
        }
        $target = $repo->userById((string) $id);
        $newRole = (string) ($input['role'] ?? $target['role']);
        if ($target['role'] === 'superadmin' && $newRole !== 'superadmin' && $repo->countUsersByRole('superadmin') <= 1) {
            Response::error('Tidak boleh mengubah role superadmin terakhir.', 422);
        }
        if ($currentUser['id'] === $id && $newRole !== $currentUser['role']) {
            Response::error('Tidak boleh mengubah role akun yang sedang digunakan.', 422);
        }
        Response::json(['ok' => true, 'data' => $repo->updateUser($id, $input)]);
    }

    if ($resource === 'users' && $method === 'DELETE') {
        $id = $_GET['id'] ?? '';
        if (!$id) {
            Response::error('Parameter id wajib diisi.', 422);
        }
        if ($currentUser['id'] === $id) {
            Response::error('Tidak boleh menghapus akun yang sedang digunakan.', 422);
        }
        $target = $repo->userById((string) $id);
        if ($target['role'] === 'superadmin' && $repo->countUsersByRole('superadmin') <= 1) {
            Response::error('Tidak boleh menghapus superadmin terakhir.', 422);
        }
        $repo->deleteUser($id);
        Response::json(['ok' => true]);
    }

    if ($resource === 'notifications' && $method === 'POST') {
        Response::json(['ok' => true, 'data' => $repo->createNotification($input)], 201);
    }

    if ($resource === 'notifications' && $method === 'PUT' && ($input['action'] ?? '') === 'mark_all_read') {
        $repo->markNotificationsRead();
        Response::json(['ok' => true]);
    }

    if ($resource === 'audit-logs' && $method === 'GET') {
        Response::json(['ok' => true, 'data' => $repo->auditLogs()]);
    }

    if ($resource === 'audit-logs' && $method === 'POST') {
        Response::json(['ok' => true, 'data' => $repo->createAuditLog($input)], 201);
    }

    if ($resource === 'audit-logs' && $method === 'DELETE') {
        $repo->clearAuditLogs();
        Response::json(['ok' => true]);
    }

    Response::error('Endpoint tidak ditemukan.', 404);
} catch (InvalidArgumentException $e) {
    Response::error($e->getMessage(), 422);
} catch (RuntimeException $e) {
    Response::error($e->getMessage(), 404);
} catch (Throwable $e) {
    Response::error('Terjadi kesalahan server. Periksa data input atau log server.', 500);
}
