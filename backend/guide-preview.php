<?php

declare(strict_types=1);

require_once __DIR__ . '/Repository.php';

$id = trim((string) ($_GET['id'] ?? ''));
if ($id === '') {
    http_response_code(400);
    exit('Parameter dokumen tidak ditemukan.');
}

try {
    $file = Repository::create()->projectGuideFile($id);
    $title = trim((string) ($file['original_name'] ?? 'Preview Dokumen')) ?: 'Preview Dokumen';
    $safeTitle = htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $source = 'api/index.php?resource=guides&id=' . rawurlencode($id) . '&view=1';
    $safeSource = htmlspecialchars($source, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
} catch (Throwable $error) {
    http_response_code(404);
    exit(htmlspecialchars($error->getMessage(), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
}
?>
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= $safeTitle ?> · Preview PDF</title>
  <style>
    html, body { height: 100%; margin: 0; background: #1f2937; }
    iframe { display: block; width: 100%; height: 100%; border: 0; background: #fff; }
  </style>
</head>
<body>
  <iframe src="<?= $safeSource ?>" title="Preview <?= $safeTitle ?>"></iframe>
</body>
</html>
