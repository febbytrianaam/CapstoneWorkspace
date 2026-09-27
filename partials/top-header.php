<header class="top-header">
      <div class="header-title-area">
        <button id="sidebarToggleBtn" class="sidebar-toggle-btn" type="button" title="Buka atau tutup sidebar" aria-label="Buka atau tutup sidebar" aria-expanded="true">
          <span aria-hidden="true">☰</span>
        </button>
        <div class="header-breadcrumbs">
          <span class="dot"></span>
          <span id="breadcrumbLabel">Koordinasi Proyek</span>
        </div>
        <h1 id="pageTitle">Dasbor Utama</h1>
      </div>

      <div class="header-actions">
        <!-- Akun Aktif -->
        <div class="user-switcher-box">
          <span class="user-switcher-label">Akun:</span>
          <select id="userRoleSelect" class="user-switcher-select" aria-label="Akun aktif"></select>
        </div>

        <!-- Tombol Lonceng Notifikasi -->
        <div class="notification-wrapper">
          <button id="notificationBtn" class="notification-btn" title="Pemberitahuan">
            <span class="notification-icon">🔔</span>
            <span id="notifBadge" class="notification-badge">3</span>
          </button>
          
          <!-- Dropdown Notifikasi -->
          <div id="notificationDropdown" class="notification-dropdown">
            <div class="notification-header">
              <span>Pemberitahuan</span>
              <button id="markAllReadBtn" class="notification-read-all">Tandai Dibaca</button>
            </div>
            <div id="notificationList" class="notification-list"></div>
          </div>
        </div>

        <button id="changePasswordBtn" class="btn btn-secondary change-password-btn" type="button" title="Ganti password">
          <span aria-hidden="true">🔑</span><span class="change-password-label">Ganti Password</span>
        </button>
        <button id="headerAddTaskBtn" class="btn btn-primary">+ Tambah Tugas</button>
        <button id="logoutBtn" class="btn btn-secondary" type="button">Keluar</button>
      </div>
    </header>
