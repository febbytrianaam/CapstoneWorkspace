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

        <div class="profile-wrapper">
          <button id="profileMenuBtn" class="profile-menu-btn" type="button" aria-haspopup="true" aria-expanded="false" title="Profil akun">
            <span id="profileAvatar" class="profile-avatar">US</span>
            <span class="profile-menu-text">
              <span id="profileMenuName">Profil</span>
              <span id="profileMenuRole">Akun</span>
            </span>
            <span class="profile-menu-caret" aria-hidden="true">▾</span>
          </button>

          <div id="profileDropdown" class="profile-dropdown">
            <div class="profile-dropdown-header">
              <span id="profileDropdownAvatar" class="profile-avatar profile-avatar-lg">US</span>
              <div>
                <div id="profileDropdownName" class="profile-dropdown-name">Nama Pengguna</div>
                <div id="profileDropdownRole" class="profile-dropdown-role">Jabatan</div>
              </div>
            </div>
            <div class="profile-info-list">
              <div class="profile-info-row">
                <span>Nama</span>
                <strong id="profileFullName">-</strong>
              </div>
              <div class="profile-info-row">
                <span>NIM</span>
                <strong id="profileNim">-</strong>
              </div>
              <div class="profile-info-row">
                <span>Jabatan</span>
                <strong id="profileRoleLabel">-</strong>
              </div>
            </div>
            <div class="profile-dropdown-actions">
              <button id="changePasswordBtn" class="btn btn-secondary change-password-btn" type="button" title="Ganti password">
                <span aria-hidden="true">🔑</span><span class="change-password-label">Ganti Password</span>
              </button>
              <button id="logoutBtn" class="btn btn-secondary logout-profile-btn" type="button">Keluar</button>
            </div>
          </div>
        </div>
      </div>
    </header>
