<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
?>
<!DOCTYPE html>
<html lang="id" class="auth-pending">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ruang Kerja Capstone — Universitas Terbuka</title>
  <link rel="stylesheet" href="css/style.css?v=20260930-login-sync-1" />
</head>
<body>

<?php require __DIR__ . '/partials/login.php'; ?>

<div class="app-container">
  <?php require __DIR__ . '/partials/sidebar.php'; ?>

  <div class="main-wrapper">
    <?php require __DIR__ . '/partials/top-header.php'; ?>

    <main class="content-body">
      <?php require __DIR__ . '/partials/pages/dashboard.php'; ?>
      <?php require __DIR__ . '/partials/pages/phase-placeholders.php'; ?>
      <?php require __DIR__ . '/partials/pages/users.php'; ?>
      <?php require __DIR__ . '/partials/pages/audit.php'; ?>
      <?php require __DIR__ . '/partials/pages/rbac.php'; ?>
      <?php require __DIR__ . '/partials/pages/documents.php'; ?>
      <?php require __DIR__ . '/partials/pages/flow.php'; ?>
    </main>
  </div>
</div>

<?php require __DIR__ . '/partials/modals/task.php'; ?>
<?php require __DIR__ . '/partials/modals/user.php'; ?>
<?php require __DIR__ . '/partials/modals/meeting.php'; ?>
<?php require __DIR__ . '/partials/modals/snapshot.php'; ?>
<?php require __DIR__ . '/partials/modals/berita-acara.php'; ?>
<?php require __DIR__ . '/partials/modals/change-password.php'; ?>

<script>
  window.CAPSTONE_API_BASE = 'backend/api/index.php';
  window.setTimeout(() => {
    document.documentElement.classList.remove('auth-pending');
  }, 3000);
</script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <script src="js/rbac.js?v=20260930-login-sync-1"></script>
  <script src="js/data.js?v=20260930-login-sync-1"></script>
  <script src="js/app.js?v=20260930-login-sync-1"></script>
</body>
</html>
