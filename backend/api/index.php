<?php

declare(strict_types=1);

require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Repository.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Role');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $repo = Repository::create();
    $resource = $_GET['resource'] ?? 'snapshot';
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input') ?: '[]', true) ?: [];

    if ($resource !== 'auth') {
        $role = $_SERVER['HTTP_X_ROLE'] ?? 'member';
        $permissions = [
            'superadmin' => ['tasks' => ['GET', 'POST', 'PUT', 'DELETE'], 'meetings' => ['GET', 'POST', 'PUT', 'DELETE'], 'users' => ['GET', 'POST', 'PUT', 'DELETE'], 'audit-logs' => ['GET', 'POST', 'DELETE'], 'snapshot' => ['GET'], 'rbac' => ['GET', 'POST'], 'notifications' => ['GET', 'POST', 'PUT'], 'guides' => ['GET', 'POST', 'DELETE']],
            'koordinator' => ['tasks' => ['GET', 'POST', 'PUT', 'DELETE'], 'meetings' => ['GET', 'POST', 'PUT', 'DELETE'], 'users' => ['GET'], 'audit-logs' => ['GET', 'POST'], 'snapshot' => ['GET'], 'rbac' => ['GET'], 'notifications' => ['GET', 'POST', 'PUT'], 'guides' => ['GET', 'POST', 'DELETE']],
            'member' => ['tasks' => ['GET', 'PUT'], 'meetings' => ['GET'], 'users' => [], 'audit-logs' => ['GET', 'POST'], 'snapshot' => ['GET'], 'rbac' => ['GET'], 'notifications' => ['GET', 'POST', 'PUT'], 'guides' => ['GET']],
        ];
        if (!isset($permissions[$role]) || !in_array($method, $permissions[$role][$resource] ?? [], true)) {
            Response::error('Role tidak memiliki permission untuk endpoint ini.', 403);
        }
    }

    if ($resource === 'snapshot' && $method === 'GET') {
        Response::json(['ok' => true, 'data' => $repo->snapshot()]);
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
        Response::json(['ok' => true, 'data' => $repo->setRbacPermission($role, $area, $permission, !empty($input['allowed']))]);
    }

    if ($resource === 'guides' && $method === 'GET') {
        $id = (string) ($_GET['id'] ?? '');
        if ($id !== '' && isset($_GET['download'])) {
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
        $authRole = $_SERVER['HTTP_X_ROLE'] ?? 'member';
        $uploadUser = $authRole === 'superadmin' ? 'Superadmin' : 'Koordinator';
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

    if ($resource === 'auth' && $method === 'POST') {
        $username = (string) ($input['username'] ?? '');
        $password = (string) ($input['password'] ?? '');
        $user = $repo->authenticate($username, $password);
        if (!$user) {
            Response::error('Username atau password salah.', 401);
        }
        Response::json(['ok' => true, 'data' => $user]);
    }

    if ($resource === 'tasks') {
        if ($method === 'GET') {
            Response::json(['ok' => true, 'data' => $repo->tasks()]);
        }
        if ($method === 'POST') {
            Response::json(['ok' => true, 'data' => $repo->createTask($input)], 201);
        }
        if ($method === 'PUT') {
            $id = $_GET['id'] ?? '';
            if (!$id) {
                Response::error('Parameter id wajib diisi.', 422);
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
        Response::json(['ok' => true, 'data' => $repo->updateUser($id, $input)]);
    }

    if ($resource === 'users' && $method === 'DELETE') {
        $id = $_GET['id'] ?? '';
        if (!$id) {
            Response::error('Parameter id wajib diisi.', 422);
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
} catch (Throwable $e) {
    Response::error($e->getMessage(), 500);
}

