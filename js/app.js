/**
 * Capstone Workspace — Logika Aplikasi, Peran, Notifikasi & Audit Log (Bahasa Indonesia)
 * UT STSI4440 Capstone Project
 */

document.addEventListener('DOMContentLoaded', () => {
  // Status & Priority Map (Pure Indonesian)
  const STATUSES = ['Belum Dimulai', 'Sedang Dikerjakan', 'Ditunda', 'Selesai'];
  const STATUS_COLORS = {
    'Belum Dimulai': 'var(--status-notstarted)',
    'Sedang Dikerjakan': 'var(--status-inprogress)',
    'Ditunda': 'var(--status-onhold)',
    'Selesai': 'var(--status-done)'
  };
  const PAGE_STORAGE_KEY = 'capstone_current_page_v3';
  const PROGRESS_NOTE_COLLAPSE_KEY = 'capstone_progress_note_collapsed_v1';
  const VALID_PAGE_IDS = ['dashboard', 'tugas1', 'tugas2', 'tugas3', 'flow', 'documents', 'users', 'audit', 'rbac'];
  const DOCUMENT_ARCHIVE_CATEGORIES = {
    berita_acara: 'Berita Acara',
    surat_izin: 'Surat Izin',
    surat_pernyataan: 'Surat Pernyataan',
    proposal_laporan: 'Proposal / Laporan',
    diagram_alur: 'Diagram / Alur / Gambar',
    lampiran: 'Lampiran',
    lainnya: 'Lainnya'
  };

  // State Global
  let currentPage = getSavedPage();
  let activeSearchQuery = '';
  let activePicFilter = 'SEMUA';

  let activePriorityFilter = 'SEMUA';
  let showArchivedTasks = false;

  let auditSearchQuery = '';
  let auditUserFilter = 'SEMUA';
  let auditActionFilter = 'SEMUA';
  let auditDateRange = 'SEMUA';
  let auditStartDate = '';
  let auditEndDate = '';
  let auditCurrentPage = 1;
  let auditPageSize = 10;

  let modalChecklistState = [];
  let modalTaskCanUpdateProgress = false;
  let modalTaskCanManageStructure = false;
  let baActivitiesState = [];
  let baUploadedImages = [];
  let flowDocuments = [];
  let flowDocumentsLoaded = false;
  let flowDocumentsLoading = false;
  let documentArchives = [];
  let documentArchivesLoaded = false;
  let documentArchivesLoading = false;
  let documentArchiveCategoryFilter = 'SEMUA';

  // Inisialisasi UI & Pengendali Komponen
  initTheme();
  initAuthentication();
  initChangePassword();
  initSidebarToggle();
  initUserSwitcher();
  initNotificationSystem();
  initProfileMenu();
  initNavigation();
  initTaskModalListeners();
  initUserModalListeners();
  initSnapshotModalListeners();
  initBeritaAcaraSystem();
  initGlobalButtons();
  initFlowDocuments();
  initDocumentArchive();
  window.addEventListener('capstone:data-synced', () => {
    syncSidebarNavigation();
    renderCurrentView();
  });
  window.addEventListener('capstone:rbac-synced', () => {
    const user = window.capstoneStore.getCurrentUser();
    syncSidebarNavigation();
    if (!window.RBAC.canPage(user, currentPage)) {
      setPage(getFallbackPage(user), { restoreScroll: false });
    } else {
      renderCurrentView();
    }
  });
  // Mulai setelah listener terpasang agar hasil permission backend tidak terlewat saat refresh biasa.
  window.RBAC.loadFromBackend();

  // Render pertama menunggu snapshot database agar tidak menampilkan seed lokal lebih dulu.
  const initialDataReady = window.capstoneStore.ready || Promise.resolve();
  initialDataReady.then(() => {
    if (window.capstoneStore.getCurrentUser()) {
      document.body.classList.add('is-authenticated');
      setPage(currentPage, { restoreScroll: false });
    }
    document.documentElement.classList.add('data-ready');
    document.documentElement.classList.add('app-ready');
    document.documentElement.classList.remove('auth-pending');
  });

  /* ==========================================
     Pengendali Mode Akun (Role Switcher)
     ========================================== */
  function initUserSwitcher() {
    const select = document.getElementById('userRoleSelect');
    if (!select) return;

    renderUserSwitcherDropdown();

    const currentUser = window.capstoneStore.getCurrentUser();
    if (!currentUser) return;
    select.value = currentUser.id;

    activePicFilter = 'SEMUA';

    select.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      const updatedUser = window.capstoneStore.setCurrentUser(selectedId);
      
      activePicFilter = 'SEMUA';

      syncSidebarNavigation();
      renderCurrentView();
    });
  }

  function getRoleLabel(user, withIcon = false) {
    const roles = user?.roles || [];
    const role = user?.role || 'member';
    const combined = roles.includes('superadmin') && roles.includes('koordinator');
    const label = combined
      ? 'Superadmin + Koordinator'
      : role === 'superadmin'
        ? 'Superadmin'
        : role === 'koordinator'
          ? 'Koordinator'
          : 'Member';

    if (!withIcon) return label;
    return `${combined || role === 'superadmin' ? '👑' : role === 'koordinator' ? '🧭' : '👤'} ${label}`;
  }

  function getUsersVisibleToViewer(users, viewer = window.capstoneStore.getCurrentUser()) {
    const list = Object.values(users || {});
    if (viewer?.role === 'member') {
      return list.filter(user => user.role !== 'superadmin');
    }
    return list;
  }

  function renderUserSwitcherDropdown() {
    const select = document.getElementById('userRoleSelect');
    if (!select) {
      renderProfileMenu();
      return;
    }

    const currentUser = window.capstoneStore.getCurrentUser();
    const users = window.capstoneStore.getUsers();
    const visibleUsers = currentUser ? [currentUser] : Object.values(users);

    select.innerHTML = visibleUsers.map(u => `
      <option value="${u.id}" ${currentUser && currentUser.id === u.id ? 'selected' : ''}>
        ${getRoleLabel(u, true)} ${u.name}
      </option>
    `).join('');

    if (currentUser && select.value !== currentUser.id) {
      select.value = currentUser.id;
    }
    select.disabled = true;
    renderProfileMenu();
  }

  function renderProfileMenu() {
    const currentUser = window.capstoneStore.getCurrentUser();
    if (!currentUser) return;

    const displayName = currentUser.fullName || currentUser.name || 'Pengguna';
    const shortName = currentUser.name || displayName;
    const nim = currentUser.nim || '-';
    const roleLabel = getRoleLabel(currentUser, false);
    const initial = (currentUser.initial || shortName.slice(0, 2) || 'US').toUpperCase();
    const color = currentUser.color || '#2563EB';

    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    };
    const setAvatar = (id) => {
      const element = document.getElementById(id);
      if (!element) return;
      element.textContent = initial;
      element.style.backgroundColor = color;
    };

    setAvatar('profileAvatar');
    setAvatar('profileDropdownAvatar');
    setText('profileMenuName', shortName);
    setText('profileMenuRole', roleLabel);
    setText('profileDropdownName', displayName);
    setText('profileDropdownRole', roleLabel);
    setText('profileFullName', displayName);
    setText('profileNim', nim);
    setText('profileRoleLabel', roleLabel);
  }

  function initProfileMenu() {
    const btn = document.getElementById('profileMenuBtn');
    const dropdown = document.getElementById('profileDropdown');
    if (!btn || !dropdown) return;

    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const isActive = dropdown.classList.toggle('active');
      btn.setAttribute('aria-expanded', String(isActive));
    });

    document.addEventListener('click', (event) => {
      if (!dropdown.contains(event.target) && !btn.contains(event.target)) {
        dropdown.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    renderProfileMenu();
  }

  /* ==========================================
     Sistem Notifikasi Pemberitahuan
     ========================================== */
  function initNotificationSystem() {
    const btn = document.getElementById('notificationBtn');
    const dropdown = document.getElementById('notificationDropdown');
    const markReadBtn = document.getElementById('markAllReadBtn');

    if (!btn || !dropdown) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });

    if (markReadBtn) {
      markReadBtn.addEventListener('click', () => {
        window.capstoneStore.markAllNotificationsRead();
        renderNotifications();
      });
    }

    renderNotifications();
  }

  function renderNotifications() {
    const listContainer = document.getElementById('notificationList');
    const badge = document.getElementById('notifBadge');
    if (!listContainer) return;

    const notifs = window.capstoneStore.getNotifications();
    const unreadCount = notifs.filter(n => !n.read).length;

    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }

    if (notifs.length === 0) {
      listContainer.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.8rem;">Belum ada pemberitahuan.</div>`;
      return;
    }

    const users = window.capstoneStore.getUsers();

    listContainer.innerHTML = notifs.map(n => {
      const u = users[n.user] || { color: '#2563EB', initial: n.user ? n.user.slice(0, 2).toUpperCase() : 'SYS' };
      const timeAgo = formatTimeAgo(n.time);

      return `
        <div class="notification-item ${n.read ? '' : 'unread'}">
          <div class="pic-mini-avatar" style="background: ${u.color}; flex-shrink: 0; width: 24px; height: 24px;">${u.initial}</div>
          <div>
            <div style="font-size: 0.825rem; line-height: 1.35; color: var(--text-main);">
              <strong>${n.user}</strong> ${n.text}
            </div>
            <div class="notification-time">${timeAgo}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Baru saja';
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return `${Math.floor(diffHours / 24)} hari lalu`;
  }

  /* ==========================================
     Pengendali Tema (Gelap / Terang)
     ========================================== */
  function initTheme() {
    const savedTheme = localStorage.getItem('capstone_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleLabel(savedTheme);

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('capstone_theme', nextTheme);
        updateThemeToggleLabel(nextTheme);
      });
    }
  }

  function updateThemeToggleLabel(theme) {
    const label = document.getElementById('themeToggleLabel');
    const icon = document.getElementById('themeToggleIcon');
    if (label && icon) {
      label.textContent = theme === 'dark' ? 'Mode Terang' : 'Mode Gelap';
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  function initAuthentication() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const submitBtn = document.getElementById('loginSubmitBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    if (!loginForm) return;

    const activateAuthenticatedUi = (user) => {
      if (!user?.id) return;
      document.body.classList.add('is-authenticated');
      syncSidebarNavigation();
      renderUserSwitcherDropdown();
      if (!window.RBAC.canPage(user, currentPage)) {
        setPage(getFallbackPage(user), { restoreScroll: false });
      } else {
        renderCurrentView();
      }
    };

    (window.capstoneStore.ready || Promise.resolve()).then(() => {
      activateAuthenticatedUi(window.capstoneStore.getCurrentUser());
    });

    window.addEventListener('capstone:auth-required', () => {
      document.body.classList.remove('is-authenticated');
    });

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (loginError) loginError.textContent = '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memeriksa...';
      }

      const payload = await window.capstoneStore.sendToBackend('auth', 'POST', {
        username: document.getElementById('loginUsername').value.trim(),
        password: document.getElementById('loginPassword').value
      });

      if (payload?.ok && payload.data) {
        window.capstoneStore.setAuthenticatedUser(payload.data);
        if (submitBtn) submitBtn.textContent = 'Memuat data...';
        await window.capstoneStore.syncFromBackend();
        await window.RBAC.loadFromBackend();
        activateAuthenticatedUi(window.capstoneStore.getCurrentUser() || payload.data);
        loginForm.reset();
      } else if (loginError) {
        loginError.textContent = 'Username atau password salah.';
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Masuk';
      }
    });

    logoutBtn?.addEventListener('click', async () => {
      document.getElementById('profileDropdown')?.classList.remove('active');
      document.getElementById('profileMenuBtn')?.setAttribute('aria-expanded', 'false');
      await window.capstoneStore.logout();
      window.location.reload();
    });
  }

  function initChangePassword() {
    const btn = document.getElementById('changePasswordBtn');
    const backdrop = document.getElementById('changePasswordModalBackdrop');
    const form = document.getElementById('changePasswordForm');
    const errorBox = document.getElementById('changePasswordError');
    const submitBtn = document.getElementById('changePasswordSubmitBtn');
    if (!btn || !backdrop || !form) return;

    const close = () => {
      form.reset();
      if (errorBox) errorBox.textContent = '';
      backdrop.classList.remove('active');
    };

    btn.addEventListener('click', () => {
      document.getElementById('profileDropdown')?.classList.remove('active');
      document.getElementById('profileMenuBtn')?.setAttribute('aria-expanded', 'false');
      form.reset();
      if (errorBox) errorBox.textContent = '';
      backdrop.classList.add('active');
      document.getElementById('currentPasswordInput')?.focus();
    });
    document.getElementById('changePasswordModalCloseBtn')?.addEventListener('click', close);
    document.getElementById('changePasswordCancelBtn')?.addEventListener('click', close);
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) close();
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (errorBox) errorBox.textContent = '';

      const currentPassword = document.getElementById('currentPasswordInput')?.value || '';
      const newPassword = document.getElementById('newPasswordInput')?.value || '';
      const confirmation = document.getElementById('confirmPasswordInput')?.value || '';
      const showError = (message) => {
        if (errorBox) errorBox.textContent = message;
      };

      if (newPassword.length < 3) {
        showError('Password baru minimal 3 karakter.');
        return;
      }
      if (newPassword !== confirmation) {
        showError('Konfirmasi password baru belum sama.');
        return;
      }

      const originalLabel = submitBtn?.textContent || 'Simpan Password';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';
      }

      const result = await window.capstoneStore.changePassword(currentPassword, newPassword);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }

      if (!result?.ok) {
        showError(result?.message || 'Password gagal diubah.');
        return;
      }

      close();
      renderUserSwitcherDropdown();
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'success',
          title: 'Password berhasil diubah',
          text: 'Gunakan password baru saat login berikutnya.',
          confirmButtonText: 'Tutup'
        });
      }
    });
  }

  function initSidebarToggle() {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    if (!sidebar || !toggleBtn) return;

    const mobileQuery = window.matchMedia('(max-width: 1024px)');
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('button');
      overlay.type = 'button';
      overlay.className = 'sidebar-overlay';
      overlay.title = 'Tutup sidebar';
      overlay.setAttribute('aria-label', 'Tutup sidebar');
      document.body.appendChild(overlay);
    }

    const updateSidebarToggleState = () => {
      const isMobileOpen = mobileQuery.matches && sidebar.classList.contains('open');
      const isDesktopOpen = !mobileQuery.matches && !document.body.classList.contains('sidebar-collapsed');
      toggleBtn.setAttribute('aria-expanded', String(isMobileOpen || isDesktopOpen));
      overlay.classList.toggle('visible', isMobileOpen);
    };

    const syncSidebarState = () => {
      if (mobileQuery.matches) {
        document.body.classList.remove('sidebar-collapsed');
        sidebar.classList.remove('open');
      } else {
        sidebar.classList.remove('open');
        document.body.classList.toggle('sidebar-collapsed', localStorage.getItem('capstone_sidebar_collapsed') === 'true');
      }
      updateSidebarToggleState();
    };

    toggleBtn.addEventListener('click', () => {
      if (mobileQuery.matches) {
        sidebar.classList.toggle('open');
      } else {
        const collapsed = !document.body.classList.contains('sidebar-collapsed');
        document.body.classList.toggle('sidebar-collapsed', collapsed);
        localStorage.setItem('capstone_sidebar_collapsed', String(collapsed));
      }
      updateSidebarToggleState();
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      updateSidebarToggleState();
    });

    mobileQuery.addEventListener?.('change', syncSidebarState);
    syncSidebarState();
  }

  /* ==========================================
     Pengendali Navigasi Halaman
     ========================================== */
  function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-item');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        if (target && !window.RBAC.canPage(window.capstoneStore.getCurrentUser(), target)) return;
        if (target) setPage(target);
        if (window.matchMedia('(max-width: 1024px)').matches) {
          document.querySelector('.sidebar')?.classList.remove('open');
          document.querySelector('.sidebar-overlay')?.classList.remove('visible');
        }
      });
    });

    document.addEventListener('click', (e) => {
      const editMeetingBtn = e.target.closest('.edit-meeting-btn');
      if (!editMeetingBtn) return;

      e.preventDefault();
      e.stopPropagation();
      openEditMeetingModal(editMeetingBtn.dataset.meetingId, editMeetingBtn.dataset.taskId);
    }, true);
  }

  function getSavedPage() {
    const savedPage = localStorage.getItem(PAGE_STORAGE_KEY);
    return VALID_PAGE_IDS.includes(savedPage) ? savedPage : 'dashboard';
  }

  function syncSidebarNavigation() {
    const user = window.capstoneStore.getCurrentUser();
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(button => {
      const allowed = Boolean(user && window.RBAC.canPage(user, button.dataset.target));
      button.style.display = allowed ? '' : 'none';
      button.setAttribute('aria-hidden', String(!allowed));
      button.tabIndex = allowed ? 0 : -1;
    });
  }

  function getFallbackPage(user) {
    return VALID_PAGE_IDS.find(pageId => window.RBAC.canPage(user, pageId)) || null;
  }

  function setPage(pageId, options = {}) {
    const requestedPage = VALID_PAGE_IDS.includes(pageId) ? pageId : 'dashboard';
    const currentUser = window.capstoneStore.getCurrentUser();
    const safePageId = window.RBAC.canPage(currentUser, requestedPage) ? requestedPage : getFallbackPage(currentUser);

    if (!safePageId) {
      currentPage = null;
      localStorage.removeItem(PAGE_STORAGE_KEY);
      document.querySelectorAll('.page-view').forEach(view => view.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(btn => { btn.classList.remove('active'); btn.style.display = 'none'; });
      const headerTitle = document.getElementById('pageTitle');
      const breadcrumbLabel = document.getElementById('breadcrumbLabel');
      if (headerTitle) headerTitle.textContent = 'Akses Terbatas';
      if (breadcrumbLabel) breadcrumbLabel.textContent = 'Tidak ada permission aktif';
      return;
    }

    currentPage = safePageId;
    localStorage.setItem(PAGE_STORAGE_KEY, safePageId);

    document.querySelectorAll('.page-view').forEach(view => {
      view.classList.toggle('active', view.id === safePageId);
    });

    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.target === safePageId);
    });
    syncSidebarNavigation();

    const headerTitle = document.getElementById('pageTitle');
    const breadcrumbLabel = document.getElementById('breadcrumbLabel');

    if (safePageId === 'dashboard') {
      headerTitle.textContent = 'Dasbor Utama';
      breadcrumbLabel.textContent = 'Koordinasi Proyek';
    } else if (safePageId === 'users') {
      headerTitle.textContent = 'Manajemen Pengguna';
      breadcrumbLabel.textContent = 'Hak Akses & Pengguna';
    } else if (safePageId === 'audit') {
      headerTitle.textContent = 'Rekam Jejak Audit';
      breadcrumbLabel.textContent = 'Audit Trail Log';
    } else if (safePageId === 'rbac') {
      headerTitle.textContent = 'RBAC & Permission';
      breadcrumbLabel.textContent = 'Role Based Access Control';
    } else if (safePageId === 'flow') {
      headerTitle.textContent = 'Alur Kerja Proyek';
      breadcrumbLabel.textContent = 'Standar Prosedur';
    } else if (safePageId === 'documents') {
      headerTitle.textContent = 'Arsip Dokumen';
      breadcrumbLabel.textContent = 'Dokumen Final & Lampiran';
    } else if (PHASE_META[safePageId]) {
      headerTitle.textContent = PHASE_META[safePageId].label;
      breadcrumbLabel.textContent = PHASE_META[safePageId].short;
    }

    renderCurrentView();
    applyRbacUi();
    if (options.restoreScroll !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function renderCurrentView() {
    syncSidebarNavigation();
    renderUserSwitcherDropdown();
    renderNotifications();

    const currentUser = window.capstoneStore.getCurrentUser();
    if (!window.RBAC.canPage(currentUser, currentPage)) {
      const fallbackPage = getFallbackPage(currentUser);
      if (fallbackPage && fallbackPage !== currentPage) {
        setPage(fallbackPage, { restoreScroll: false });
        return;
      }
      if (!fallbackPage) {
        setPage(null, { restoreScroll: false });
        return;
      }
    }

    if (currentPage === 'dashboard') {
      renderDashboard();
    } else if (currentPage === 'users') {
      renderUserManagementView();
    } else if (currentPage === 'audit') {
      renderAuditLogView();
    } else if (currentPage === 'rbac') {
      renderRbacView();
    } else if (currentPage === 'flow') {
      renderFlowView();
    } else if (currentPage === 'documents') {
      renderDocumentArchiveView();
    } else if (currentPage.startsWith('tugas')) {
      renderPhaseView(currentPage);
    }
    applyRbacUi();
  }

  function applyRbacUi() {
    const user = window.capstoneStore.getCurrentUser();
    if (!user || !window.RBAC) return;
    const setDisplay = (selector, visible, display = 'inline-flex') => document.querySelectorAll(selector).forEach(el => { el.style.display = visible ? display : 'none'; });
    const canTaskCreate = window.RBAC.can(user, 'tasks', 'create');
    const canTaskUpdate = window.RBAC.can(user, 'tasks', 'update');
    const canMeetingCreate = window.RBAC.can(user, 'meetings', 'create');
    const canMeetingRead = canShowMeetings(user);
    const canBeritaCreate = window.RBAC.can(user, 'beritaAcara', 'create');
    const canAuditRead = window.RBAC.can(user, 'audit', 'read');
    setDisplay('.add-task-btn', canTaskCreate);
    setDisplay('#dashAddMeetingBtn, .add-meeting-page-btn, #addMeetingBtn', canMeetingCreate);
    setDisplay('#addUserBtn', window.RBAC.can(user, 'users', 'create'));
    setDisplay('#resetAuditBtn, #clearAuditBtn', window.RBAC.can(user, 'audit', 'manage'));
    setDisplay('#inlineResetAuditBtn', window.RBAC.can(user, 'audit', 'manage'));
    setDisplay('#viewSnapshotBtn, #exportCsvBtn, #exportJsonBtn, #printAuditBtn, #copyJsonBtn, #downloadJsonBtn', canAuditRead);
    setDisplay('.generate-ba-btn', canBeritaCreate);
    setDisplay('.edit-user-btn', window.RBAC.can(user, 'users', 'update'));
    setDisplay('.delete-user-direct-btn', window.RBAC.can(user, 'users', 'delete'));
    setDisplay('#deleteUserBtn', window.RBAC.can(user, 'users', 'delete'));
    setDisplay('#deleteTaskBtn', window.RBAC.can(user, 'tasks', 'delete'));
    setDisplay('#archiveTaskBtn', false);
    setDisplay('#addChecklistItemBtn', canTaskUpdate);
    setDisplay('#taskForm button[type="submit"]', canTaskCreate || canTaskUpdate);
    setDisplay('#meetingForm button[type="submit"]', canMeetingCreate || window.RBAC.can(user, 'meetings', 'update'));
    setDisplay('#addBaActivityBtn', canBeritaCreate);
    setDisplay('#baDocImageInput', canBeritaCreate, 'block');
    setDisplay('#baPreviewBtn', canBeritaCreate);
    setDisplay('#baPrintBtn, #baPreviewPrintBtn', window.RBAC.can(user, 'beritaAcara', 'read'));
    setDisplay('#flowDocumentsSection', window.RBAC.can(user, 'guides', 'read'), 'block');
    setDisplay('#flowDocumentForm', window.RBAC.can(user, 'guides', 'create'), 'grid');
    setDisplay('.delete-guide-btn', window.RBAC.can(user, 'guides', 'delete'));
    setDisplay('#documentArchiveSection', window.RBAC.can(user, 'documents', 'read'), 'block');
    setDisplay('#documentArchiveForm', window.RBAC.can(user, 'documents', 'create'), 'grid');
    setDisplay('.delete-archive-doc-btn', window.RBAC.can(user, 'documents', 'delete'));
    setDisplay('#statsGrid', window.RBAC.canWidget(user, 'stats'), 'grid');
    setDisplay('#dashboardChartsSection', window.RBAC.canWidget(user, 'charts'), 'grid');
    setDisplay('#phaseProgressSection', window.RBAC.canWidget(user, 'charts'), 'block');
    setDisplay('#attentionSection', window.RBAC.canWidget(user, 'attention'), 'block');
    setDisplay('#meetingsSection', canMeetingRead && window.RBAC.canWidget(user, 'meetings'), 'block');
    setDisplay('#workloadSection', window.RBAC.canWidget(user, 'workload'), 'block');
    ['#statusChartContainer', '#phaseChartContainer'].forEach(selector => {
      const element = document.querySelector(selector);
      if (element?.closest('.card-box')) element.closest('.card-box').style.display = window.RBAC.canWidget(user, 'charts') ? '' : 'none';
    });
    const workload = document.getElementById('teamWorkloadGrid');
    if (workload?.closest('.card-box')) workload.closest('.card-box').style.display = window.RBAC.canWidget(user, 'workload') ? '' : 'none';
    document.querySelectorAll('.edit-meeting-btn').forEach(btn => { btn.style.display = window.RBAC.can(user, 'meetings', 'update') ? 'inline-flex' : 'none'; });
    document.querySelectorAll('.delete-meeting-btn').forEach(btn => { btn.style.display = window.RBAC.can(user, 'meetings', 'delete') ? 'inline-flex' : 'none'; });
  }

  function renderRbacView() {
    const container = document.getElementById('rbacMatrixContainer');
    if (!container || !window.RBAC) return;

    const roles = ['superadmin', 'koordinator', 'member'];
    const roleLabels = { superadmin: 'Superadmin', koordinator: 'Koordinator', member: 'Member' };
    const modules = [
      {
        label: 'Dashboard',
        hint: 'Ringkasan utama dan widget dashboard',
        rows: [
          ['Akses Dashboard', 'Membuka halaman ringkasan utama', 'pages', 'dashboard'],
          ['Widget · Tugas Personal', 'Tugas yang ditugaskan ke akun aktif', 'widgets', 'personal'],
          ['Widget · Statistik Tim', 'Kartu statistik ringkasan proyek', 'widgets', 'stats'],
          ['Widget · Grafik Progres', 'Visualisasi status dan tahapan', 'widgets', 'charts'],
          ['Widget · Perlu Perhatian', 'Tugas prioritas tinggi', 'widgets', 'attention'],
          ['Widget · Pertemuan', 'Agenda rapat dan bimbingan', 'widgets', 'meetings'],
          ['Widget · Beban Kerja', 'Distribusi tugas anggota', 'widgets', 'workload']
        ]
      },
      {
        label: 'Tugas',
        hint: 'Menu tugas dan operasi CRUD tugas',
        rows: [
          ['Menu Tugas 1', 'Akses halaman Tugas 1', 'pages', 'tugas1'],
          ['Menu Tugas 2', 'Akses halaman Tugas 2', 'pages', 'tugas2'],
          ['Menu Tugas 3', 'Akses halaman Tugas 3', 'pages', 'tugas3'],
          ['Create', 'Membuat tugas baru', 'tasks', 'create'],
          ['Read', 'Melihat tugas', 'tasks', 'read'],
          ['Update', 'Mengubah tugas dan progres', 'tasks', 'update'],
          ['Delete', 'Menghapus tugas', 'tasks', 'delete']
        ]
      },
      {
        label: 'Pertemuan',
        hint: 'Agenda pertemuan dan berita acara',
        rows: [
          ['Create', 'Membuat agenda pertemuan', 'meetings', 'create'],
          ['Read', 'Melihat agenda pertemuan', 'meetings', 'read'],
          ['Update', 'Mengubah agenda pertemuan', 'meetings', 'update'],
          ['Delete', 'Menghapus pertemuan', 'meetings', 'delete'],
          ['Berita Acara · Create', 'Membuat berita acara', 'beritaAcara', 'create'],
          ['Berita Acara · Read', 'Melihat berita acara', 'beritaAcara', 'read'],
          ['Berita Acara · Update', 'Mengubah berita acara', 'beritaAcara', 'update'],
          ['Berita Acara · Delete', 'Menghapus berita acara', 'beritaAcara', 'delete']
        ]
      },
      {
        label: 'Manajemen Pengguna',
        hint: 'Akun pengguna dan pengaturan role',
        rows: [
          ['Akses Menu', 'Membuka halaman manajemen pengguna', 'pages', 'users'],
          ['Create', 'Membuat akun pengguna', 'users', 'create'],
          ['Read', 'Melihat daftar pengguna', 'users', 'read'],
          ['Update', 'Mengubah data dan role pengguna', 'users', 'update'],
          ['Delete', 'Menghapus pengguna', 'users', 'delete']
        ]
      },
      {
        label: 'Audit Log',
        hint: 'Rekam jejak aktivitas sistem',
        rows: [
          ['Akses Menu', 'Membuka halaman audit log', 'pages', 'audit'],
          ['Read', 'Melihat rekam jejak audit', 'audit', 'read'],
          ['Manage', 'Reset dan bersihkan audit log', 'audit', 'manage']
        ]
      },
      {
        label: 'Modul Sistem',
        hint: 'Menu pendukung aplikasi',
        rows: [
          ['Alur Kerja', 'Akses alur kerja proyek', 'pages', 'flow'],
          ['Panduan · Create', 'Upload dokumen panduan proyek', 'guides', 'create'],
          ['Panduan · Read', 'Melihat dan mengunduh panduan', 'guides', 'read'],
          ['Panduan · Delete', 'Menghapus dokumen panduan', 'guides', 'delete'],
          ['Arsip Dokumen', 'Akses dokumen final dan lampiran', 'pages', 'documents'],
          ['Arsip · Create', 'Menyimpan dokumen ke arsip', 'documents', 'create'],
          ['Arsip · Read', 'Melihat dan mengunduh arsip', 'documents', 'read'],
          ['Arsip · Delete', 'Menghapus dokumen dari arsip', 'documents', 'delete'],
          ['RBAC', 'Akses matriks otorisasi', 'pages', 'rbac']
        ]
      }
    ];

    const switchHtml = (role, area, permission) => {
      const enabled = Boolean(window.RBAC.matrix[role]?.[area]?.[permission]);
      const locked = role === 'superadmin' && area === 'pages' && permission === 'rbac';
      return `<label class="rbac-switch" title="${locked ? 'Akses RBAC superadmin wajib aktif' : 'Aktifkan atau nonaktifkan permission'}"><input type="checkbox" class="rbac-permission-toggle" data-role="${role}" data-area="${area}" data-permission="${permission}" ${enabled ? 'checked' : ''} ${locked ? 'disabled' : ''}><span class="rbac-switch-track"><span class="rbac-switch-thumb"></span></span></label>`;
    };

    container.innerHTML = `
      <div style="overflow-x: auto;">
        <table class="rbac-matrix-table">
          <thead><tr><th>Menu & Fitur</th>${roles.map(role => `<th>${roleLabels[role]}</th>`).join('')}</tr></thead>
          <tbody>
            ${modules.map(module => `
              <tr class="rbac-module-row"><td colspan="${roles.length + 1}"><strong>${module.label}</strong><small>${module.hint}</small></td></tr>
              ${module.rows.map(([label, hint, area, permission]) => `<tr class="rbac-permission-row"><td><span class="rbac-child-label">${label}</span><small>${hint}</small></td>${roles.map(role => `<td>${switchHtml(role, area, permission)}</td>`).join('')}</tr>`).join('')}
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('.rbac-permission-toggle').forEach(toggle => {
      toggle.addEventListener('change', () => {
          const role = toggle.dataset.role;
          const area = toggle.dataset.area;
          const permission = toggle.dataset.permission;
          const previousValue = toggle.checked ? 'Nonaktif' : 'Aktif';
          const nextValue = toggle.checked ? 'Aktif' : 'Nonaktif';
          const roleLabel = roleLabels[role] || role;
          const permissionName = `${area}.${permission}`;

        window.RBAC.set(toggle.dataset.role, toggle.dataset.area, toggle.dataset.permission, toggle.checked);
          window.capstoneStore.logAudit(
            'Ubah Permission RBAC',
            `Mengubah permission ${permissionName} untuk role ${roleLabel} dari ${previousValue} menjadi ${nextValue}`,
            {
              actionTag: 'rbac_permission_update',
              object: {
                type: 'RBAC',
                id: permissionName,
                name: `${roleLabel} · ${permissionName}`
              },
              changes: [{ field: 'Permission', from: previousValue, to: nextValue }]
            }
          );
        renderRbacView();
        applyRbacUi();
        const user = window.capstoneStore.getCurrentUser();
        if (!window.RBAC.canPage(user, currentPage)) setPage(getFallbackPage(user));
      });
    });
  }

  function requirePermission(area, action) {
    const user = window.capstoneStore.getCurrentUser();
    if (window.RBAC.can(user, area, action)) return true;
    Swal.fire({ icon: 'info', title: 'Akses terbatas', text: 'Role Anda tidak memiliki permission untuk aksi ini.', confirmButtonColor: '#1E40AF' });
    return false;
  }

  function isTaskPic(task, user = window.capstoneStore.getCurrentUser()) {
    return Boolean(task && user?.name && task.pic === user.name);
  }

  function canReadTaskDetails(task, user = window.capstoneStore.getCurrentUser()) {
    return Boolean(task && window.RBAC.can(user, 'tasks', 'read'));
  }

  function canUpdateTaskProgress(task, user = window.capstoneStore.getCurrentUser()) {
    if (!task || !window.RBAC.can(user, 'tasks', 'update')) return false;
    if (user?.role === 'member') return isTaskPic(task, user);
    return true;
  }

  function canManageTaskStructure(task, user = window.capstoneStore.getCurrentUser()) {
    return Boolean(task && window.RBAC.can(user, 'tasks', 'update') && user?.role !== 'member');
  }

  function canShowMeetings(user = window.capstoneStore.getCurrentUser()) {
    return Boolean(user && ['superadmin', 'koordinator'].includes(user.role) && window.RBAC.can(user, 'meetings', 'read'));
  }

  function canArchiveTask(task, user = window.capstoneStore.getCurrentUser()) {
    return Boolean(task && user?.role === 'superadmin' && window.RBAC.can(user, 'tasks', 'update') && task.status === 'Selesai');
  }

  function canEditProgressNote(user = window.capstoneStore.getCurrentUser()) {
    return Boolean(user?.role === 'superadmin');
  }

  function loadProgressNoteCollapseState() {
    try {
      const saved = JSON.parse(localStorage.getItem(PROGRESS_NOTE_COLLAPSE_KEY) || '{}');
      return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    } catch (e) {
      localStorage.removeItem(PROGRESS_NOTE_COLLAPSE_KEY);
      return {};
    }
  }

  function isProgressNoteCollapsed(phaseKey, hasContent) {
    const saved = loadProgressNoteCollapseState();
    if (Object.prototype.hasOwnProperty.call(saved, phaseKey)) return Boolean(saved[phaseKey]);
    return Boolean(hasContent);
  }

  function setProgressNoteCollapsed(phaseKey, collapsed) {
    const saved = loadProgressNoteCollapseState();
    saved[phaseKey] = Boolean(collapsed);
    localStorage.setItem(PROGRESS_NOTE_COLLAPSE_KEY, JSON.stringify(saved));
  }

  function initFlowDocuments() {
    const form = document.getElementById('flowDocumentForm');
    if (!form) return;

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!requirePermission('guides', 'create')) return;

      const titleInput = document.getElementById('flowDocumentTitle');
      const fileInput = document.getElementById('flowDocumentFile');
      const button = document.getElementById('flowDocumentUploadBtn');
      const title = titleInput?.value.trim() || '';
      const file = fileInput?.files?.[0];
      if (!title || !file) {
        Swal.fire({ icon: 'info', title: 'Data belum lengkap', text: 'Judul dan file panduan wajib diisi.', confirmButtonColor: '#1E40AF' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: 'warning', title: 'File terlalu besar', text: 'Ukuran file maksimal 5 MB.', confirmButtonColor: '#1E40AF' });
        return;
      }

      button.disabled = true;
      button.textContent = 'Mengupload...';
      const result = await window.capstoneStore.uploadProjectGuide(title, file);
      button.disabled = false;
      button.textContent = '📤 Upload Panduan';

      if (!result?.ok) {
        Swal.fire({ icon: 'error', title: 'Upload gagal', text: 'Dokumen panduan belum dapat disimpan.', confirmButtonColor: '#1E40AF' });
        return;
      }

      window.capstoneStore.logAudit('Upload Panduan', `Mengunggah dokumen panduan "${title}"`, {
        actionTag: 'upload_guide',
        object: { type: 'Panduan', id: result.data?.id || '', name: title }
      });
      form.reset();
      await loadFlowDocuments(true);
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Dokumen panduan sudah tersedia untuk anggota.', timer: 1600, showConfirmButton: false });
    });
  }

  function renderFlowView() {
    renderFlowDocuments();
    loadFlowDocuments();
  }

  async function loadFlowDocuments(force = false) {
    if (flowDocumentsLoading || (!force && flowDocumentsLoaded)) {
      renderFlowDocuments();
      return;
    }
    flowDocumentsLoading = true;
    renderFlowDocuments();
    flowDocuments = await window.capstoneStore.getProjectGuides();
    flowDocumentsLoaded = true;
    flowDocumentsLoading = false;
    renderFlowDocuments();
    applyRbacUi();
  }

  function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function renderFlowDocuments() {
    const list = document.getElementById('flowDocumentList');
    const count = document.getElementById('flowDocumentCount');
    if (!list || !count) return;

    count.textContent = `${flowDocuments.length} dokumen`;
    if (flowDocumentsLoading) {
      list.innerHTML = '<div class="flow-document-empty">Memuat dokumen panduan...</div>';
      return;
    }
    if (!flowDocuments.length) {
      list.innerHTML = '<div class="flow-document-empty">Belum ada dokumen panduan yang diunggah.</div>';
      return;
    }

    list.innerHTML = flowDocuments.map(document => {
      const icon = document.mimeType?.includes('pdf') ? '📕' : '📄';
      const date = document.createdAt ? formatWibDateOnly(document.createdAt) : '-';
      const id = encodeURIComponent(document.id);
      return `<article class="flow-document-card">
        <div class="flow-document-icon" aria-hidden="true">${icon}</div>
        <div class="flow-document-content">
          <h3>${escapeHtml(document.title)}</h3>
          <div class="flow-document-meta">${escapeHtml(document.originalName)} · ${formatFileSize(document.fileSize)}</div>
          <div class="flow-document-meta">Diunggah oleh ${escapeHtml(document.uploadedBy || 'System')} · ${date}</div>
        </div>
        <div class="flow-document-actions">
          <a class="btn btn-secondary" href="backend/guide-preview.php?id=${id}" target="_blank" rel="noopener">📖 Preview PDF</a>
          <button type="button" class="btn btn-danger delete-guide-btn" data-guide-id="${id}" data-guide-title="${escapeHtml(document.title)}">🗑 Hapus</button>
        </div>
      </article>`;
    }).join('');

    list.querySelectorAll('.delete-guide-btn').forEach(button => {
      button.addEventListener('click', async () => {
        if (!requirePermission('guides', 'delete')) return;
        const confirmed = await Swal.fire({
          icon: 'warning',
          title: 'Hapus dokumen panduan?',
          text: button.dataset.guideTitle || 'Dokumen ini akan dihapus dari daftar.',
          showCancelButton: true,
          confirmButtonText: 'Hapus',
          cancelButtonText: 'Batal',
          confirmButtonColor: '#DC2626'
        });
        if (!confirmed.isConfirmed) return;
        const result = await window.capstoneStore.deleteProjectGuide(decodeURIComponent(button.dataset.guideId));
        if (!result?.ok) {
          Swal.fire({ icon: 'error', title: 'Gagal menghapus', text: 'Dokumen panduan belum dapat dihapus.', confirmButtonColor: '#1E40AF' });
          return;
        }
        window.capstoneStore.logAudit('Hapus Panduan', `Menghapus dokumen panduan "${button.dataset.guideTitle}"`, {
          actionTag: 'delete_guide',
          object: { type: 'Panduan', id: decodeURIComponent(button.dataset.guideId), name: button.dataset.guideTitle }
        });
        await loadFlowDocuments(true);
      });
    });
    applyRbacUi();
  }

  function initDocumentArchive() {
    const form = document.getElementById('documentArchiveForm');
    const filter = document.getElementById('documentArchiveCategoryFilter');

    if (filter) {
      filter.addEventListener('change', event => {
        documentArchiveCategoryFilter = event.target.value || 'SEMUA';
        renderDocumentArchives();
      });
    }

    if (!form) return;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!requirePermission('documents', 'create')) return;

      const titleInput = document.getElementById('documentArchiveTitle');
      const categoryInput = document.getElementById('documentArchiveCategory');
      const descriptionInput = document.getElementById('documentArchiveDescription');
      const fileInput = document.getElementById('documentArchiveFile');
      const button = document.getElementById('documentArchiveUploadBtn');
      const title = titleInput?.value.trim() || '';
      const category = categoryInput?.value || 'lainnya';
      const description = descriptionInput?.value.trim() || '';
      const file = fileInput?.files?.[0];

      if (!title || !file) {
        Swal.fire({ icon: 'info', title: 'Data belum lengkap', text: 'Judul dan file dokumen wajib diisi.', confirmButtonColor: '#1E40AF' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({ icon: 'warning', title: 'File terlalu besar', text: 'Ukuran file maksimal 10 MB.', confirmButtonColor: '#1E40AF' });
        return;
      }

      const originalLabel = button?.textContent || 'Simpan Dokumen';
      if (button) {
        button.disabled = true;
        button.textContent = 'Menyimpan...';
      }

      const result = await window.capstoneStore.uploadDocumentArchive({ title, category, description, file });

      if (button) {
        button.disabled = false;
        button.textContent = originalLabel;
      }

      if (!result?.ok) {
        Swal.fire({ icon: 'error', title: 'Upload gagal', text: 'Dokumen belum dapat disimpan.', confirmButtonColor: '#1E40AF' });
        return;
      }

      window.capstoneStore.logAudit('Upload Arsip Dokumen', `Menyimpan dokumen "${title}" ke arsip`, {
        actionTag: 'upload_document_archive',
        object: { type: 'Arsip Dokumen', id: result.data?.id || '', name: title }
      });
      form.reset();
      await loadDocumentArchives(true);
      Swal.fire({ icon: 'success', title: 'Dokumen tersimpan', text: 'Dokumen sudah tersedia di arsip tim.', timer: 1600, showConfirmButton: false });
    });
  }

  function renderDocumentArchiveView() {
    renderDocumentArchives();
    loadDocumentArchives();
  }

  async function loadDocumentArchives(force = false) {
    if (documentArchivesLoading || (!force && documentArchivesLoaded)) {
      renderDocumentArchives();
      return;
    }
    documentArchivesLoading = true;
    renderDocumentArchives();
    documentArchives = await window.capstoneStore.getDocumentArchives();
    documentArchivesLoaded = true;
    documentArchivesLoading = false;
    renderDocumentArchives();
    applyRbacUi();
  }

  function documentArchiveCategoryLabel(category) {
    return DOCUMENT_ARCHIVE_CATEGORIES[category] || DOCUMENT_ARCHIVE_CATEGORIES.lainnya;
  }

  function documentArchiveIcon(document) {
    const mime = document.mimeType || '';
    const category = document.category || '';
    if (mime.includes('pdf')) return '📕';
    if (mime.startsWith('image/') || category === 'diagram_alur') return '🖼️';
    if (mime.includes('spreadsheet') || mime.includes('excel')) return '📊';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return '📽️';
    if (category.includes('surat')) return '✉️';
    return '📄';
  }

  function renderDocumentArchives() {
    const list = document.getElementById('documentArchiveList');
    const count = document.getElementById('documentArchiveCount');
    const filter = document.getElementById('documentArchiveCategoryFilter');
    if (!list || !count) return;

    if (filter && filter.value !== documentArchiveCategoryFilter) {
      filter.value = documentArchiveCategoryFilter;
    }

    const visibleDocuments = documentArchiveCategoryFilter === 'SEMUA'
      ? documentArchives
      : documentArchives.filter(document => document.category === documentArchiveCategoryFilter);

    count.textContent = `${visibleDocuments.length} dokumen`;
    if (documentArchivesLoading) {
      list.innerHTML = '<div class="flow-document-empty">Memuat arsip dokumen...</div>';
      return;
    }
    if (!documentArchives.length) {
      list.innerHTML = '<div class="flow-document-empty">Belum ada dokumen yang tersimpan di arsip.</div>';
      return;
    }
    if (!visibleDocuments.length) {
      list.innerHTML = '<div class="flow-document-empty">Belum ada dokumen untuk jenis ini.</div>';
      return;
    }

    list.innerHTML = visibleDocuments.map(document => {
      const date = document.createdAt ? formatWibDateOnly(document.createdAt) : '-';
      const id = encodeURIComponent(document.id);
      const title = escapeHtml(document.title);
      const description = (document.description || '').trim();
      return `<article class="flow-document-card document-archive-card">
        <div class="flow-document-icon document-archive-icon" aria-hidden="true">${documentArchiveIcon(document)}</div>
        <div class="flow-document-content">
          <div class="document-archive-category">${escapeHtml(documentArchiveCategoryLabel(document.category))}</div>
          <h3>${title}</h3>
          <div class="flow-document-meta">${escapeHtml(document.originalName)} · ${formatFileSize(document.fileSize)}</div>
          <div class="flow-document-meta">Disimpan oleh ${escapeHtml(document.uploadedBy || 'System')} · ${date}</div>
          ${description ? `<p class="document-archive-description">${escapeHtml(description)}</p>` : ''}
        </div>
        <div class="flow-document-actions">
          <a class="btn btn-secondary" href="backend/api/index.php?resource=document-archives&id=${id}&view=1" target="_blank" rel="noopener">👁️ Lihat</a>
          <a class="btn btn-primary" href="backend/api/index.php?resource=document-archives&id=${id}&download=1">⬇️ Download</a>
          <button type="button" class="btn btn-danger delete-archive-doc-btn" data-document-id="${id}" data-document-title="${title}">🗑 Hapus</button>
        </div>
      </article>`;
    }).join('');

    list.querySelectorAll('.delete-archive-doc-btn').forEach(button => {
      button.addEventListener('click', async () => {
        if (!requirePermission('documents', 'delete')) return;
        const confirmed = await Swal.fire({
          icon: 'warning',
          title: 'Hapus dokumen?',
          text: button.dataset.documentTitle || 'Dokumen ini akan dihapus dari arsip.',
          showCancelButton: true,
          confirmButtonText: 'Hapus',
          cancelButtonText: 'Batal',
          confirmButtonColor: '#DC2626'
        });
        if (!confirmed.isConfirmed) return;
        const documentId = decodeURIComponent(button.dataset.documentId);
        const result = await window.capstoneStore.deleteDocumentArchive(documentId);
        if (!result?.ok) {
          Swal.fire({ icon: 'error', title: 'Gagal menghapus', text: 'Dokumen belum dapat dihapus.', confirmButtonColor: '#1E40AF' });
          return;
        }
        window.capstoneStore.logAudit('Hapus Arsip Dokumen', `Menghapus dokumen "${button.dataset.documentTitle}" dari arsip`, {
          actionTag: 'delete_document_archive',
          object: { type: 'Arsip Dokumen', id: documentId, name: button.dataset.documentTitle }
        });
        await loadDocumentArchives(true);
      });
    });
    applyRbacUi();
  }

  /* ==========================================
     Render Dasbor Utama
     ========================================== */
  function renderDashboard() {
    const tasks = window.capstoneStore.getAll();
    const currentUser = window.capstoneStore.getCurrentUser();
    const users = window.capstoneStore.getUsers();

    if (!window.RBAC.canPage(currentUser, 'dashboard')) {
      const fallbackPage = getFallbackPage(currentUser);
      if (fallbackPage && fallbackPage !== currentPage) {
        setPage(fallbackPage, { restoreScroll: false });
      } else if (!fallbackPage) {
        setPage(null, { restoreScroll: false });
      }
      return;
    }

    // Terapkan visibility widget sebelum data Dashboard dirender.
    applyRbacUi();
    const isMember = currentUser.role === 'member';

    const greetingEl = document.getElementById('bannerGreeting');
    const subtextEl = document.getElementById('bannerSubtext');
    const roleBadgeEl = document.getElementById('bannerRoleBadge');

    if (isMember) {
        if (roleBadgeEl) roleBadgeEl.textContent = `AKUN MEMBER · ${currentUser.name.toUpperCase()}`;
      if (greetingEl) greetingEl.textContent = `Halo, ${currentUser.name} 👋 Selamat Datang!`;
        if (subtextEl) subtextEl.textContent = `Berikut adalah tugas-tugas kamu sebagai anggota tim serta ringkasan perkembangan seluruh proyek Capstone.`;
    } else {
      if (roleBadgeEl) roleBadgeEl.textContent = `AKUN SUPERADMIN · HAK AKSES PENUH`;
      if (greetingEl) greetingEl.textContent = `Dasbor Manajemen Capstone (Febby)`;
      if (subtextEl) subtextEl.textContent = `Platform pusat koordinasi pengerjaan Tugas 1 hingga Tugas 3 seluruh anggota tim.`;
    }

    const personalSection = document.getElementById('personalTaskSection');
    const personalList = document.getElementById('personalTaskList');
    const personalCountBadge = document.getElementById('personalTaskBadgeCount');

    if (window.RBAC.canWidget(currentUser, 'personal') && personalSection && personalList) {
      personalSection.style.display = 'block';
      const myTasks = tasks.filter(t => t.pic === currentUser.name);

      if (personalCountBadge) personalCountBadge.textContent = `${myTasks.length} tugas`;

      if (myTasks.length === 0) {
        personalList.innerHTML = `<div class="card-box-subtitle" style="padding: 1rem 0;">Belum ada tugas yang ditugaskan untuk ${currentUser.name}.</div>`;
      } else {
        personalList.innerHTML = myTasks.map(t => {
          const totalChecklist = t.checklist ? t.checklist.length : 0;
          const doneChecklist = t.checklistDone ? t.checklistDone.filter(Boolean).length : 0;
          return `
            <div class="attention-item" data-task-id="${t.id}">
              <div class="card-header-row" style="margin-bottom: 0.35rem;">
                <div class="attention-item-title">${escapeHtml(t.title)}</div>
                <span class="priority-badge ${t.priority}">${t.priority}</span>
              </div>
              <div class="attention-meta">
                <span class="column-count" style="font-size: 0.7rem;">${t.status}</span>
                <span style="color: var(--text-muted);">${PHASE_META[t.phase]?.short || ''}</span>
                ${totalChecklist > 0 ? `<span style="margin-left: auto; color: var(--text-muted);">☑️ ${doneChecklist}/${totalChecklist}</span>` : ''}
              </div>
            </div>
          `;
        }).join('');

        personalList.querySelectorAll('.attention-item').forEach(btn => {
          btn.addEventListener('click', () => {
            const task = window.capstoneStore.getById(btn.dataset.taskId);
            if (canReadTaskDetails(task, currentUser)) openEditTaskModal(btn.dataset.taskId);
          });
        });
      }
    } else if (personalSection) {
      personalSection.style.display = 'none';
    }

    const statsContainer = document.getElementById('statsGrid');
    if (statsContainer) {
      if (isMember) {
        const myTasks = tasks.filter(t => t.pic === currentUser.name);
        const myDone = myTasks.filter(t => t.status === 'Selesai').length;
        const myProgress = myTasks.filter(t => t.status === 'Sedang Dikerjakan').length;
        const myHold = myTasks.filter(t => t.status === 'Ditunda').length;

        statsContainer.innerHTML = `
          <div class="stat-card">
            <div class="stat-accent-bar" style="background: var(--ut-blue-primary)"></div>
            <div class="stat-label">Tugasku (Total)</div>
            <div class="stat-value" style="color: var(--ut-blue-primary)">${myTasks.length}</div>
            <div class="stat-desc">Tugas untuk ${currentUser.name}</div>
          </div>
          <div class="stat-card">
            <div class="stat-accent-bar" style="background: var(--status-inprogress)"></div>
            <div class="stat-label">Sedang Dikerjakan</div>
            <div class="stat-value" style="color: var(--status-inprogress)">${myProgress}</div>
            <div class="stat-desc">Progres aktif</div>
          </div>
          <div class="stat-card">
            <div class="stat-accent-bar" style="background: var(--status-onhold)"></div>
            <div class="stat-label">Ditunda</div>
            <div class="stat-value" style="color: var(--status-onhold)">${myHold}</div>
            <div class="stat-desc">Menunggu dependensi</div>
          </div>
          <div class="stat-card">
            <div class="stat-accent-bar" style="background: var(--status-done)"></div>
            <div class="stat-label">Tugasku Selesai</div>
            <div class="stat-value" style="color: var(--status-done)">${myDone}</div>
            <div class="stat-desc">Selesai diverifikasi</div>
          </div>
        `;
      } else {
        const total = tasks.length;
        const done = tasks.filter(t => t.status === 'Selesai').length;
        const inProgress = tasks.filter(t => t.status === 'Sedang Dikerjakan').length;
        const onHold = tasks.filter(t => t.status === 'Ditunda').length;

        statsContainer.innerHTML = `
          <div class="stat-card">
            <div class="stat-accent-bar" style="background: var(--ut-blue-primary)"></div>
            <div class="stat-label">Total Tugas Tim</div>
            <div class="stat-value" style="color: var(--ut-blue-primary)">${total}</div>
            <div class="stat-desc">Terkelola di seluruh tahap</div>
          </div>
          <div class="stat-card">
            <div class="stat-accent-bar" style="background: var(--status-inprogress)"></div>
            <div class="stat-label">Sedang Dikerjakan</div>
            <div class="stat-value" style="color: var(--status-inprogress)">${inProgress}</div>
            <div class="stat-desc">Progres aktif tim</div>
          </div>
          <div class="stat-card">
            <div class="stat-accent-bar" style="background: var(--status-onhold)"></div>
            <div class="stat-label">Ditunda</div>
            <div class="stat-value" style="color: var(--status-onhold)">${onHold}</div>
            <div class="stat-desc">Menunggu dependensi</div>
          </div>
          <div class="stat-card">
            <div class="stat-accent-bar" style="background: var(--status-done)"></div>
            <div class="stat-label">Selesai</div>
            <div class="stat-value" style="color: var(--status-done)">${done}</div>
            <div class="stat-desc">Telah selesai diverifikasi</div>
          </div>
        `;
      }
    }

    const phaseProgressContainer = document.getElementById('phaseProgressList');
    if (phaseProgressContainer) {
      phaseProgressContainer.innerHTML = Object.keys(PHASE_META).map(phaseKey => {
        const phaseTasks = tasks.filter(t => t.phase === phaseKey);
        const phaseDone = phaseTasks.filter(t => t.status === 'Selesai').length;
        const pct = phaseTasks.length ? Math.round((phaseDone / phaseTasks.length) * 100) : 0;
        return `
          <div class="phase-progress-item" data-phase="${phaseKey}" style="cursor: pointer;" title="Klik untuk membuka ${PHASE_META[phaseKey].short}">
            <div class="progress-header">
              <span style="font-weight: 600; color: var(--text-main);">${PHASE_META[phaseKey].label}</span>
              <span style="color: var(--ut-blue-primary); font-size: 0.8rem; font-weight: 600;">${phaseDone}/${phaseTasks.length} Tugas (${pct}%)</span>
            </div>
            <div class="progress-track-bg">
              <div class="progress-fill-bar" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }).join('');

      phaseProgressContainer.querySelectorAll('.phase-progress-item').forEach(item => {
        item.addEventListener('click', () => setPage(item.dataset.phase));
      });
    }

    const attentionContainer = document.getElementById('attentionList');
    if (attentionContainer) {
      const attentionTasks = tasks.filter(t => t.priority === 'Tinggi' && t.status !== 'Selesai').slice(0, 6);
      if (attentionTasks.length === 0) {
        attentionContainer.innerHTML = `<div class="card-box-subtitle" style="padding: 1rem 0;">Tidak ada tugas prioritas tinggi yang membutuhkan penanganan mendesak.</div>`;
      } else {
        attentionContainer.innerHTML = attentionTasks.map(t => {
          const u = users[t.pic] || { color: '#64748B', initial: t.pic ? t.pic.slice(0, 2) : '??' };
          return `
            <button class="attention-item" data-task-id="${t.id}" title="Klik untuk melihat detail ${escapeHtml(t.title)}">
              <div class="attention-item-title">${escapeHtml(t.title)}</div>
              <div class="attention-meta">
                <span class="priority-badge ${t.priority}">${t.priority}</span>
                <span style="display: inline-flex; align-items: center; gap: 0.35rem; color: var(--text-secondary); font-weight: 500;">
                  <span class="pic-mini-avatar" style="background: ${u.color}">${u.initial}</span> ${t.pic}
                </span>
                <span style="color: var(--text-muted); font-size: 0.725rem;">• ${PHASE_META[t.phase]?.short || ''}</span>
              </div>
            </button>
          `;
        }).join('');

        attentionContainer.querySelectorAll('.attention-item').forEach(btn => {
          btn.addEventListener('click', () => {
            const taskId = btn.dataset.taskId;
            const task = window.capstoneStore.getById(taskId);
            if (task) setPage(task.phase);
            if (canReadTaskDetails(task, currentUser)) openEditTaskModal(taskId);
          });
        });
      }
    }

    const workloadContainer = document.getElementById('teamWorkloadGrid');
    if (workloadContainer) {
      const workloadUsers = getUsersVisibleToViewer(users, currentUser);
      workloadContainer.innerHTML = workloadUsers.map(u => {
        const memTasks = tasks.filter(t => t.pic === u.name);
        const activeCount = memTasks.filter(t => t.status !== 'Selesai').length;
        const doneCount = memTasks.filter(t => t.status === 'Selesai').length;

        const isCurrentActive = currentUser.name === u.name;
        const workloadRoleLabel = getRoleLabel(u);

        return `
          <div class="workload-card" data-pic="${u.name}" style="cursor: pointer; ${isCurrentActive ? 'border: 2px solid var(--ut-blue-primary); background: var(--ut-blue-soft);' : ''}" title="Klik untuk memfilter tugas ${u.name}">
            <div class="workload-avatar" style="background: ${u.color}">${u.initial}</div>
            <div class="workload-name">${u.name} <span style="font-size:0.65rem; color:${u.role === 'superadmin' ? 'var(--ut-blue-primary)' : 'var(--text-muted)'}; font-weight:600;">(${workloadRoleLabel})</span></div>
            <div class="workload-count" style="color: ${u.color}">${activeCount}</div>
            <div class="workload-subtext">${activeCount} aktif • ${doneCount} selesai</div>
          </div>
        `;
      }).join('');

      workloadContainer.querySelectorAll('.workload-card').forEach(card => {
        card.addEventListener('click', () => {
          activePicFilter = card.dataset.pic;
          setPage('tugas1');
        });
      });
    }

    renderDashboardCharts(tasks);
    renderDashboardMeetings(tasks, users);
    applyRbacUi();
  }

  function renderDashboardCharts(tasks) {
    // 1. Doughnut / Pie Chart (SVG Render - Works 100% offline & fast)
    const statusContainer = document.getElementById('statusChartContainer');
    if (statusContainer) {
      const counts = {
        'Selesai': tasks.filter(t => t.status === 'Selesai').length,
        'Sedang Dikerjakan': tasks.filter(t => t.status === 'Sedang Dikerjakan').length,
        'Belum Dimulai': tasks.filter(t => t.status === 'Belum Dimulai').length,
        'Ditunda': tasks.filter(t => t.status === 'Ditunda').length
      };
      const total = tasks.length || 1;

      const colors = {
        'Selesai': '#10B981',
        'Sedang Dikerjakan': '#3B82F6',
        'Belum Dimulai': '#64748B',
        'Ditunda': '#F59E0B'
      };

      let cumulativePercent = 0;
      const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
      };

      const slices = Object.entries(counts).map(([status, count]) => {
        const percent = count / total;
        const startPercent = cumulativePercent;
        cumulativePercent += percent;
        const endPercent = cumulativePercent;

        if (percent === 0) return '';

        if (percent >= 0.999) {
          return `<circle cx="0" cy="0" r="1" fill="${colors[status]}" />`;
        }

        const [startX, startY] = getCoordinatesForPercent(startPercent);
        const [endX, endY] = getCoordinatesForPercent(endPercent);
        const largeArcFlag = percent > 0.5 ? 1 : 0;

        const pathData = [
          `M ${startX} ${startY}`,
          `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
          `L 0 0`
        ].join(' ');

        return `<path d="${pathData}" fill="${colors[status]}" />`;
      }).join('');

      const doneCount = counts['Selesai'];
      const overallPct = Math.round((doneCount / total) * 100);

      statusContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-around; width: 100%; gap: 1.5rem; flex-wrap: wrap;">
          <div style="position: relative; width: 160px; height: 160px;">
            <svg viewBox="-1 -1 2 2" style="transform: rotate(-90deg); width: 100%; height: 100%; border-radius: 50%;">
              ${slices || `<circle cx="0" cy="0" r="1" fill="#E2E8F0" />`}
              <circle cx="0" cy="0" r="0.65" fill="var(--bg-card)" />
            </svg>
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
              <span style="font-size: 1.5rem; font-weight: 700; color: var(--text-main); font-family: Outfit, sans-serif;">${overallPct}%</span>
              <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">Selesai (${doneCount}/${total})</span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 150px;">
            ${Object.entries(counts).map(([status, count]) => {
              const pct = Math.round((count / total) * 100);
              return `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; font-size: 0.8rem;">
                  <span style="display: flex; align-items: center; gap: 0.4rem; color: var(--text-main);">
                    <span style="width: 10px; height: 10px; border-radius: 3px; background: ${colors[status]}; display: inline-block;"></span>
                    ${status}
                  </span>
                  <span style="font-weight: 600; color: var(--text-secondary);">${count} (${pct}%)</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // 2. Bar Chart (SVG / HTML Bar Chart - Works 100% offline & fast)
    const phaseContainer = document.getElementById('phaseChartContainer');
    if (phaseContainer) {
      const phaseKeys = ['tugas1', 'tugas2', 'tugas3'];
      const phaseData = phaseKeys.map(pk => {
        const meta = PHASE_META[pk];
        const pTasks = tasks.filter(t => t.phase === pk);
        const done = pTasks.filter(t => t.status === 'Selesai').length;
        const total = pTasks.length;
        const pct = total ? Math.round((done / total) * 100) : 0;
        return { short: meta.short, label: meta.label, done, total, pct };
      });

      phaseContainer.innerHTML = `
        <div style="width: 100%; display: flex; flex-direction: column; gap: 1.25rem; padding: 0.5rem 0;">
          ${phaseData.map(item => `
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; font-size: 0.85rem;">
                <span style="font-weight: 600; color: var(--text-main);">${item.short}</span>
                <span style="font-size: 0.775rem; color: var(--text-secondary); font-weight: 600;">
                  ${item.done} / ${item.total} Selesai <span style="color: var(--ut-blue-primary);">(${item.pct}%)</span>
                </span>
              </div>
              <div style="height: 18px; background: var(--bg-hover); border-radius: 999px; overflow: hidden; display: flex; padding: 2px;">
                <div style="height: 100%; width: ${item.pct}%; background: linear-gradient(90deg, #3B82F6, #10B981); border-radius: 999px; transition: width 0.5s ease;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  function renderDashboardMeetings(tasks, users) {
    const meetingsContainer = document.getElementById('dashboardMeetingsGrid');
    const meetingCountBadge = document.getElementById('meetingCountBadge');
    const currentUser = window.capstoneStore.getCurrentUser();

    if (!meetingsContainer) return;
    if (!canShowMeetings(currentUser)) {
      meetingsContainer.innerHTML = '';
      if (meetingCountBadge) meetingCountBadge.textContent = '0 pertemuan';
      return;
    }

    const allMeetings = [];
    tasks.forEach(t => {
      if (t.meetings && Array.isArray(t.meetings)) {
        t.meetings.forEach(m => {
          allMeetings.push({ ...m, task: t });
        });
      }
    });
    (window.capstoneStore.getMeetings?.() || []).forEach(m => {
      allMeetings.push({ ...m, task: null });
    });

    if (meetingCountBadge) {
      meetingCountBadge.textContent = `${allMeetings.length} pertemuan`;
    }

    if (allMeetings.length === 0) {
      meetingsContainer.innerHTML = `<div class="card-box-subtitle" style="padding: 1.5rem 0; text-align: center; grid-column: 1 / -1;">Belum ada jadwal pertemuan atau bimbingan.</div>`;
      return;
    }

    allMeetings.sort((a, b) => (parseWibDate(a.date)?.getTime() || 0) - (parseWibDate(b.date)?.getTime() || 0));

    meetingsContainer.innerHTML = allMeetings.map(m => {
      const taskId = m.task?.id || '';
      const responsibleName = m.task?.pic || m.host || 'System';
      const phaseLabel = m.phase ? m.phase.replace('tugas', 'Tugas ') : '';
      const timing = getMeetingTiming(m);
      const u = users[responsibleName] || { color: '#64748B', initial: responsibleName.slice(0, 2).toUpperCase() };
      const dateFormatted = formatMeetingDateRange(m.date, m.endDate);

      return `
        <div class="meeting-card">
          <div class="meeting-card-header">
            <div class="meeting-date-badge">🗓️ ${dateFormatted}</div>
            <span class="meeting-status-badge ${timing.className}">${timing.label}</span>
            ${m.task ? `<span class="priority-badge ${m.task.priority}">${m.task.priority}</span>` : `<span class="priority-badge Sedang">${phaseLabel || 'Umum'}</span>`}
          </div>
          <div class="meeting-card-title">${escapeHtml(m.title)}</div>
          ${m.notes ? `<div style="font-size: 0.775rem; color: var(--text-muted);">${escapeHtml(m.notes)}</div>` : ''}
          ${m.task
            ? `<button class="meeting-task-link" data-task-id="${taskId}">📌 <strong>Tugas:</strong> ${escapeHtml(m.task.title)}</button>`
            : `<div style="font-size: 0.775rem; color: var(--text-muted);">📌 ${phaseLabel ? `Agenda ${phaseLabel}, belum terkait task tertentu` : 'Pertemuan umum, tidak terkait tahap tertentu'}</div>`}
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.25rem;">
            <span style="display: inline-flex; align-items: center; gap: 0.35rem; color: var(--text-secondary); font-size: 0.75rem; font-weight: 500;">
              <span class="pic-mini-avatar" style="background: ${u.color}">${u.initial}</span> ${escapeHtml(responsibleName)}
            </span>
            ${m.url ? `
              <a href="${escapeHtml(m.url)}" target="_blank" rel="noopener noreferrer" class="meeting-url-btn">
                🔗 Buka Link Online
              </a>
            ` : '<span style="font-size: 0.725rem; color: var(--text-muted); italic;">(Tidak ada URL)</span>'}
          </div>
          <button class="btn btn-secondary generate-ba-btn" data-meeting-id="${m.id}" data-task-id="${taskId}" style="margin-top: 0.5rem; width: 100%; font-size: 0.775rem; padding: 0.35rem 0.6rem; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
            📄 Generate Berita Acara
          </button>
          <button type="button" class="btn btn-secondary edit-meeting-btn" data-meeting-id="${m.id}" data-task-id="${taskId}" onclick="event.preventDefault(); event.stopPropagation(); window.capstoneEditMeeting(this.getAttribute('data-meeting-id'), this.getAttribute('data-task-id'));" style="margin-top: 0.4rem; width: 100%; font-size: 0.775rem; padding: 0.35rem 0.6rem;">
            Edit Pertemuan
          </button>
          <button type="button" class="btn btn-secondary delete-meeting-btn" data-meeting-id="${m.id}" data-task-id="${taskId}" ${m.hasBeritaAcara ? 'disabled title="Pertemuan yang sudah memiliki berita acara tidak boleh dihapus."' : 'title="Hapus pertemuan (soft delete)"'} style="margin-top: 0.4rem; width: 100%; font-size: 0.775rem; padding: 0.35rem 0.6rem; color: ${m.hasBeritaAcara ? 'var(--text-muted)' : '#B91C1C'};">
            Hapus Pertemuan${m.hasBeritaAcara ? ' (Ada Berita Acara)' : ''}
          </button>
        </div>
      `;
    }).join('');

    meetingsContainer.querySelectorAll('.generate-ba-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openBeritaAcaraModal(btn.dataset.meetingId, btn.dataset.taskId);
      });
    });

    meetingsContainer.querySelectorAll('.edit-meeting-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditMeetingModal(btn.dataset.meetingId, btn.dataset.taskId);
      });
    });

    meetingsContainer.querySelectorAll('.delete-meeting-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteMeeting(btn.dataset.meetingId, btn.dataset.taskId);
      });
    });

    meetingsContainer.querySelectorAll('.meeting-task-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        const task = window.capstoneStore.getById(taskId);
        if (task) {
          setPage(task.phase);
          if (canReadTaskDetails(task, window.capstoneStore.getCurrentUser())) openEditTaskModal(taskId);
        }
      });
    });
  }

  const WIB_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

  function parseWibDate(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') {
      const numericDate = new Date(value);
      return isNaN(numericDate.getTime()) ? null : numericDate;
    }

    const raw = String(value);
    const localDateTime = raw.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?)$/);
    const normalized = localDateTime ? `${localDateTime[1]}+07:00` : raw;
    const parsed = new Date(normalized);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  function getWibDateParts(value) {
    const date = parseWibDate(value);
    if (!date) return null;

    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(date).reduce((result, part) => {
      if (part.type !== 'literal') result[part.type] = part.value;
      return result;
    }, {});

    return {
      year: parts.year,
      month: parts.month,
      monthName: WIB_MONTHS[Number(parts.month) - 1],
      day: parts.day,
      hours: parts.hour,
      minutes: parts.minute,
      seconds: parts.second
    };
  }

  function formatWibDateTime(value, includeSeconds = false) {
    const parts = getWibDateParts(value);
    if (!parts) return '-';
    const seconds = includeSeconds ? `:${parts.seconds}` : '';
    return `${parts.day} ${parts.monthName} ${parts.year}, ${parts.hours}:${parts.minutes}${seconds} WIB`;
  }

  function formatTaskUpdatedAt(task) {
    const value = task?.updatedAt || task?.createdAt;
    return value ? formatWibDateTime(value) : '-';
  }

  function formatWibDateOnly(value) {
    const parts = getWibDateParts(value);
    return parts ? `${parts.day} ${parts.monthName} ${parts.year}` : '-';
  }

  function formatWibClock(value, includeSeconds = false) {
    const parts = getWibDateParts(value);
    if (!parts) return '-';
    const seconds = includeSeconds ? `:${parts.seconds}` : '';
    return `${parts.hours}:${parts.minutes}${seconds} WIB`;
  }

  function formatMeetingDate(dateStr) {
    if (!dateStr) return 'Jadwal belum ditentukan';
    try {
      const parts = getWibDateParts(dateStr);
      return parts ? formatWibDateTime(dateStr) : dateStr;
    } catch (e) {
      return dateStr;
    }
  }

  function formatMeetingDateRange(startStr, endStr) {
    if (!startStr) return 'Jadwal belum ditentukan';
    try {
      const start = parseWibDate(startStr);
      const end = endStr ? parseWibDate(endStr) : null;
      const startParts = getWibDateParts(startStr);
      const endParts = endStr ? getWibDateParts(endStr) : null;
      if (!start || !startParts) return startStr;
      if (!end || !endParts) return formatMeetingDate(startStr);
      const sameDate = startParts.day === endParts.day
        && startParts.month === endParts.month
        && startParts.year === endParts.year;

      if (sameDate) {
        return `${startParts.day} ${startParts.monthName} ${startParts.year}, ${startParts.hours}:${startParts.minutes}-${endParts.hours}:${endParts.minutes} WIB`;
      }

      return `${formatMeetingDate(startStr)} - ${formatMeetingDate(endStr)}`;
    } catch (e) {
      return formatMeetingDate(startStr);
    }
  }

  function getMeetingTiming(meeting) {
    const start = parseWibDate(meeting?.date);
    const end = parseWibDate(meeting?.endDate) || start;
    const now = Date.now();

    if (!start || !end) return { label: 'Waktu belum lengkap', className: 'is-unknown' };
    if (now > end.getTime()) return { label: 'Sudah Lewat', className: 'is-past' };
    if (now >= start.getTime()) return { label: 'Sedang Berlangsung', className: 'is-live' };
    return { label: 'Akan Datang', className: 'is-upcoming' };
  }

  function formatMeetingTimeRangeForBa(startStr, endStr) {
    const fallback = '21.00 WIB - 22.00 WIB';
    if (!startStr) return fallback;
    try {
      const startParts = getWibDateParts(startStr);
      const endParts = endStr ? getWibDateParts(endStr) : null;
      if (!startParts || !endParts) return fallback;
      return `${startParts.hours}.${startParts.minutes} WIB - ${endParts.hours}.${endParts.minutes} WIB`;
    } catch (e) {
      return fallback;
    }
  }

  function findMeetingForBeritaAcara(meetingId, taskId = '') {
    const task = taskId ? window.capstoneStore.getById(taskId) : null;
    if (task?.meetings) {
      const meeting = task.meetings.find(m => m.id === meetingId);
      if (meeting) return { meeting, task };
    }

    const generalMeeting = (window.capstoneStore.getMeetings?.() || []).find(m => m.id === meetingId);
    return { meeting: generalMeeting || null, task: generalMeeting?.taskId ? window.capstoneStore.getById(generalMeeting.taskId) : null };
  }

  /* ==========================================
     Render Halaman Kanban Tahapan
     ========================================== */
  function renderPhaseView(phaseKey) {
    const pageView = document.getElementById(phaseKey);
    if (!pageView) return;

    const meta = PHASE_META[phaseKey];
    const allPhaseTasks = window.capstoneStore.getByPhase(phaseKey);
    const phaseDone = allPhaseTasks.filter(t => t.status === 'Selesai').length;
    const pct = allPhaseTasks.length ? Math.round((phaseDone / allPhaseTasks.length) * 100) : 0;
    const currentUser = window.capstoneStore.getCurrentUser();
    const users = window.capstoneStore.getUsers();
    const canShowPhaseMeetings = canShowMeetings(currentUser);
    const canViewArchive = currentUser?.role === 'superadmin';
    const archivedCount = allPhaseTasks.filter(t => t.archivedAt).length;
    const visiblePhaseTasks = showArchivedTasks && canViewArchive
      ? allPhaseTasks
      : allPhaseTasks.filter(t => !t.archivedAt);

    let filteredTasks = visiblePhaseTasks;
    if (activeSearchQuery.trim()) {
      const q = activeSearchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    if (activePicFilter !== 'SEMUA') {
      filteredTasks = filteredTasks.filter(t => t.pic === activePicFilter);
    }
    if (activePriorityFilter !== 'SEMUA') {
      filteredTasks = filteredTasks.filter(t => t.priority === activePriorityFilter);
    }

    const phaseMeetings = [];
    allPhaseTasks.forEach(t => {
      if (t.meetings && Array.isArray(t.meetings)) {
        t.meetings.forEach(m => {
          phaseMeetings.push({ ...m, task: t });
        });
      }
    });
    (window.capstoneStore.getMeetings?.() || [])
      .filter(m => m.phase === phaseKey)
      .forEach(m => phaseMeetings.push({ ...m, task: null }));
    phaseMeetings.sort((a, b) => (parseWibDate(a.date)?.getTime() || 0) - (parseWibDate(b.date)?.getTime() || 0));

    pageView.innerHTML = `
      <div class="phase-banner">
        <div>
          <h2>${meta.label}</h2>
          <div class="phase-banner-desc">${meta.desc}</div>
        </div>
        <div style="min-width: 200px;">
          <div class="progress-header">
            <span>Progress ${meta.short}</span>
            <span>${pct}%</span>
          </div>
          <div class="progress-track-bg">
            <div class="progress-fill-bar" style="width: ${pct}%"></div>
          </div>
        </div>
      </div>

      ${renderProgressNoteSection(phaseKey, currentUser)}

      <div class="toolbar">
        <div class="search-filter-group">
          <input type="text" id="taskSearchInput-${phaseKey}" class="input-search" placeholder="🔍 Cari tugas..." value="${escapeHtml(activeSearchQuery)}" />
          
          <select id="taskPicSelect-${phaseKey}" class="select-filter">
            <option value="SEMUA" ${activePicFilter === 'SEMUA' ? 'selected' : ''}>Semua PIC (${visiblePhaseTasks.length} tugas)</option>
            ${getUsersVisibleToViewer(users, currentUser).map(u => {
              const count = visiblePhaseTasks.filter(t => t.pic === u.name).length;
              return `<option value="${u.name}" ${activePicFilter === u.name ? 'selected' : ''}>${u.name} (${count} tugas)</option>`;
            }).join('')}
          </select>

          <select id="taskPrioritySelect-${phaseKey}" class="select-filter">
            <option value="SEMUA" ${activePriorityFilter === 'SEMUA' ? 'selected' : ''}>Semua Prioritas</option>
            <option value="Tinggi" ${activePriorityFilter === 'Tinggi' ? 'selected' : ''}>🔴 Prioritas Tinggi</option>
            <option value="Sedang" ${activePriorityFilter === 'Sedang' ? 'selected' : ''}>🟡 Prioritas Sedang</option>
            <option value="Rendah" ${activePriorityFilter === 'Rendah' ? 'selected' : ''}>🟢 Prioritas Rendah</option>
          </select>
          ${canViewArchive ? `
            <label class="archive-toggle-filter" title="Tampilkan tugas yang sudah diarsipkan">
              <input type="checkbox" id="taskArchiveToggle-${phaseKey}" ${showArchivedTasks ? 'checked' : ''} />
              <span>Tampilkan arsip (${archivedCount})</span>
            </label>
          ` : ''}
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button class="btn btn-secondary add-meeting-page-btn" data-phase="${phaseKey}">🗓️ + Buat Pertemuan</button>
          <button class="btn btn-primary add-task-btn" data-phase="${phaseKey}">+ Tambah Tugas</button>
        </div>
      </div>

      <div class="kanban-board-wrapper">
        <div class="kanban-grid">
          ${STATUSES.map(status => {
            const colTasks = filteredTasks.filter(t => t.status === status);
            return `
              <div class="kanban-column" data-status="${status}" data-phase="${phaseKey}">
                <div class="column-header">
                  <div class="column-title-area">
                    <span class="status-dot" style="background: ${STATUS_COLORS[status]}"></span>
                    ${status}
                  </div>
                  <span class="column-count">${colTasks.length}</span>
                </div>
                <div class="column-cards-container">
                  ${colTasks.map(t => renderTaskCard(t, currentUser, users)).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Seksi Daftar Agenda Pertemuan Khusus Tahap Ini -->
      <div class="card-box phase-meetings-section" style="margin-top: 2rem; ${canShowPhaseMeetings ? '' : 'display:none;'}">
        <div class="card-box-header">
          <div>
            <h2>🗓️ Jadwal Pertemuan & Bimbingan — ${meta.short}</h2>
            <div class="card-box-subtitle">Agenda rapat tim dan bimbingan tutor khusus untuk ${meta.label}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="column-count">${phaseMeetings.length} pertemuan</span>
            <button class="btn btn-secondary add-meeting-page-btn" data-phase="${phaseKey}" style="padding: 0.25rem 0.65rem; font-size: 0.75rem;">+ Buat Pertemuan</button>
          </div>
        </div>
        ${phaseMeetings.length === 0 ? `
          <div class="card-box-subtitle" style="padding: 1.5rem 0; text-align: center;">Belum ada jadwal pertemuan atau bimbingan yang dibuat untuk ${meta.short}.</div>
        ` : `
          <div class="meetings-grid">
            ${phaseMeetings.map(m => {
              const taskId = m.task?.id || '';
              const responsibleName = m.task?.pic || m.host || 'System';
              const u = users[responsibleName] || { color: '#64748B', initial: responsibleName.slice(0, 2).toUpperCase() };
              const dateFormatted = formatMeetingDateRange(m.date, m.endDate);
              const timing = getMeetingTiming(m);
              return `
                <div class="meeting-card">
                  <div class="meeting-card-header">
                    <div class="meeting-date-badge">🗓️ ${dateFormatted}</div>
                    <span class="meeting-status-badge ${timing.className}">${timing.label}</span>
                    ${m.task ? `<span class="priority-badge ${m.task.priority}">${m.task.priority}</span>` : '<span class="priority-badge Sedang">Tahap</span>'}
                  </div>
                  <div class="meeting-card-title">${escapeHtml(m.title)}</div>
                  ${m.notes ? `<div style="font-size: 0.775rem; color: var(--text-muted);">${escapeHtml(m.notes)}</div>` : ''}
                  ${m.task
                    ? `<button class="meeting-task-link" data-task-id="${taskId}">📌 <strong>Tugas:</strong> ${escapeHtml(m.task.title)}</button>`
                    : '<div style="font-size: 0.775rem; color: var(--text-muted);">📌 Agenda tahap ini, belum terkait task tertentu</div>'}
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.25rem;">
                    <span style="display: inline-flex; align-items: center; gap: 0.35rem; color: var(--text-secondary); font-size: 0.75rem; font-weight: 500;">
                      <span class="pic-mini-avatar" style="background: ${u.color}">${u.initial}</span> ${escapeHtml(responsibleName)}
                    </span>
                    ${m.url ? `
                      <a href="${escapeHtml(m.url)}" target="_blank" rel="noopener noreferrer" class="meeting-url-btn">
                        🔗 Buka Link Online
                      </a>
                    ` : '<span style="font-size: 0.725rem; color: var(--text-muted); italic;">(Tidak ada URL)</span>'}
                  </div>
                  <button class="btn btn-secondary generate-ba-btn" data-meeting-id="${m.id}" data-task-id="${taskId}" style="margin-top: 0.5rem; width: 100%; font-size: 0.775rem; padding: 0.35rem 0.6rem; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
                    📄 Generate Berita Acara
                  </button>
                  <button type="button" class="btn btn-secondary edit-meeting-btn" data-meeting-id="${m.id}" data-task-id="${taskId}" onclick="event.preventDefault(); event.stopPropagation(); window.capstoneEditMeeting(this.getAttribute('data-meeting-id'), this.getAttribute('data-task-id'));" style="margin-top: 0.4rem; width: 100%; font-size: 0.775rem; padding: 0.35rem 0.6rem;">
                    Edit Pertemuan
                  </button>
                  <button type="button" class="btn btn-secondary delete-meeting-btn" data-meeting-id="${m.id}" data-task-id="${taskId}" ${m.hasBeritaAcara ? 'disabled title="Pertemuan yang sudah memiliki berita acara tidak boleh dihapus."' : 'title="Hapus pertemuan (soft delete)"'} style="margin-top: 0.4rem; width: 100%; font-size: 0.775rem; padding: 0.35rem 0.6rem; color: ${m.hasBeritaAcara ? 'var(--text-muted)' : '#B91C1C'};">
                    Hapus Pertemuan${m.hasBeritaAcara ? ' (Ada Berita Acara)' : ''}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    pageView.querySelectorAll('.generate-ba-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openBeritaAcaraModal(btn.dataset.meetingId, btn.dataset.taskId);
      });
    });

    pageView.querySelectorAll('.edit-meeting-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditMeetingModal(btn.dataset.meetingId, btn.dataset.taskId);
      });
    });

    pageView.querySelectorAll('.delete-meeting-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteMeeting(btn.dataset.meetingId, btn.dataset.taskId);
      });
    });

    bindProgressNoteEvents(pageView, phaseKey);

    const searchInput = document.getElementById(`taskSearchInput-${phaseKey}`);
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        activeSearchQuery = e.target.value;
        renderPhaseView(phaseKey);
      });
    }

    const picSelect = document.getElementById(`taskPicSelect-${phaseKey}`);
    if (picSelect) {
      picSelect.addEventListener('change', (e) => {
        activePicFilter = e.target.value;
        renderPhaseView(phaseKey);
      });
    }

    const prioritySelect = document.getElementById(`taskPrioritySelect-${phaseKey}`);
    if (prioritySelect) {
      prioritySelect.addEventListener('change', (e) => {
        activePriorityFilter = e.target.value;
        renderPhaseView(phaseKey);
      });
    }

    const archiveToggle = document.getElementById(`taskArchiveToggle-${phaseKey}`);
    if (archiveToggle) {
      archiveToggle.addEventListener('change', (e) => {
        showArchivedTasks = e.target.checked;
        renderPhaseView(phaseKey);
      });
    }

    pageView.querySelectorAll('.add-task-btn').forEach(btn => {
      btn.addEventListener('click', () => openNewTaskModal(btn.dataset.phase));
    });

    pageView.querySelectorAll('.add-meeting-page-btn').forEach(btn => {
      btn.addEventListener('click', () => openNewMeetingModal(btn.dataset.phase));
    });

    pageView.querySelectorAll('.meeting-task-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const task = window.capstoneStore.getById(btn.dataset.taskId);
        if (canReadTaskDetails(task, window.capstoneStore.getCurrentUser())) openEditTaskModal(btn.dataset.taskId);
      });
    });

    bindKanbanEvents(pageView);
    applyRbacUi();
  }

  function renderProgressNoteSection(phaseKey, currentUser) {
    const note = window.capstoneStore.getProgressNote?.(phaseKey) || { content: '' };
    const canEdit = canEditProgressNote(currentUser);
    const content = note.content || '';
    const collapsed = isProgressNoteCollapsed(phaseKey, Boolean(content));
    const updatedLabel = note.updatedAt ? formatWibDateTime(note.updatedAt) : 'Belum pernah disimpan';
    const updatedBy = note.updatedBy || '-';
    const placeholder = `Update Progress Capstone Project — ${formatWibDateOnly(Date.now())}\n\nContoh:\nHari ini tim menyelesaikan pembahasan data klinik dan menunggu validasi dari pihak apoteker.\n\nRencana berikutnya:\nMelengkapi bagian analisis proses dan menyesuaikan draft proposal.`;
    const noteText = content || 'Belum ada update progress untuk tahap ini.';
    const bodyHtml = canEdit ? `
          <div class="progress-note-editor">
            <textarea id="progressNoteInput-${phaseKey}" class="progress-note-textarea" placeholder="${escapeHtml(placeholder)}">${escapeHtml(content)}</textarea>
            <div class="progress-note-actions">
              <button type="button" class="btn btn-primary save-progress-note-btn" data-phase="${phaseKey}">Simpan Update</button>
              <button type="button" class="btn btn-secondary copy-progress-note-btn" data-phase="${phaseKey}">Salin Update</button>
            </div>
          </div>
          <div class="progress-note-preview">
            <div class="progress-note-preview-label">Tampilan untuk tim</div>
            <pre id="progressNotePreview-${phaseKey}">${escapeHtml(noteText)}</pre>
          </div>
    ` : `
          <div class="progress-note-preview progress-note-reader">
            <div class="progress-note-preview-label">Update progress tim</div>
            <pre id="progressNotePreview-${phaseKey}">${escapeHtml(noteText)}</pre>
            ${content ? `
              <div class="progress-note-actions">
                <button type="button" class="btn btn-secondary copy-progress-note-btn" data-phase="${phaseKey}">Salin Update</button>
              </div>
            ` : ''}
          </div>
    `;

    return `
      <section class="progress-note-panel ${collapsed ? 'is-collapsed' : ''}" data-phase="${phaseKey}">
        <div class="progress-note-header">
          <div>
            <div class="progress-note-kicker">Catatan Progress</div>
            <h3>Rangkuman ${PHASE_META[phaseKey]?.short || ''}</h3>
            <p>Catatan singkat agar seluruh anggota tim tahu perkembangan terbaru dan langkah berikutnya.</p>
          </div>
          <div class="progress-note-side">
            <div class="progress-note-meta">
              <span>Update: ${escapeHtml(updatedLabel)}</span>
              <span>Oleh: ${escapeHtml(updatedBy)}</span>
            </div>
            <button type="button" class="btn btn-secondary progress-note-toggle-btn" data-phase="${phaseKey}" aria-expanded="${collapsed ? 'false' : 'true'}">
              <span class="progress-note-toggle-icon" aria-hidden="true">${collapsed ? '▾' : '▴'}</span>
              <span>${collapsed ? 'Tampilkan' : 'Sembunyikan'}</span>
            </button>
          </div>
        </div>
        <div class="progress-note-grid ${canEdit ? '' : 'is-view-only'} ${collapsed ? 'is-hidden' : ''}">
          ${bodyHtml}
        </div>
      </section>
    `;
  }

  function bindProgressNoteEvents(pageView, phaseKey) {
    const input = pageView.querySelector(`#progressNoteInput-${phaseKey}`);
    const preview = pageView.querySelector(`#progressNotePreview-${phaseKey}`);
    const saveBtn = pageView.querySelector(`.save-progress-note-btn[data-phase="${phaseKey}"]`);
    const copyBtn = pageView.querySelector(`.copy-progress-note-btn[data-phase="${phaseKey}"]`);
    const toggleBtn = pageView.querySelector(`.progress-note-toggle-btn[data-phase="${phaseKey}"]`);

    const updateToggleButton = (button, collapsed) => {
      button.setAttribute('aria-expanded', String(!collapsed));
      button.innerHTML = `
        <span class="progress-note-toggle-icon" aria-hidden="true">${collapsed ? '▾' : '▴'}</span>
        <span>${collapsed ? 'Tampilkan' : 'Sembunyikan'}</span>
      `;
    };

    toggleBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const panel = toggleBtn.closest('.progress-note-panel');
      const body = panel?.querySelector('.progress-note-grid');
      const nextCollapsed = !panel?.classList.contains('is-collapsed');
      setProgressNoteCollapsed(phaseKey, nextCollapsed);
      panel?.classList.toggle('is-collapsed', nextCollapsed);
      body?.classList.toggle('is-hidden', nextCollapsed);
      updateToggleButton(toggleBtn, nextCollapsed);
    });

    input?.addEventListener('input', () => {
      if (preview) preview.textContent = input.value || 'Belum ada update progress untuk tahap ini.';
    });

    saveBtn?.addEventListener('click', () => {
      const saved = window.capstoneStore.saveProgressNote(phaseKey, input?.value || '');
      if (preview) preview.textContent = saved.content || 'Belum ada update progress untuk tahap ini.';
      renderPhaseView(phaseKey);
      Swal.fire({
        icon: 'success',
        title: 'Update progress tersimpan',
        text: 'Anggota tim dapat melihat rangkuman terbaru.',
        timer: 1300,
        showConfirmButton: false
      });
    });

    copyBtn?.addEventListener('click', () => {
      const text = input?.value || window.capstoneStore.getProgressNote?.(phaseKey)?.content || '';
      if (!text) {
        Swal.fire({ icon: 'info', title: 'Belum ada update', text: 'Rangkuman progress masih kosong.', confirmButtonColor: '#1E40AF' });
        return;
      }
      navigator.clipboard.writeText(text).then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Update disalin',
          text: 'Rangkuman progress siap dibagikan.',
          timer: 1200,
          showConfirmButton: false
        });
      }).catch(() => {
        Swal.fire({ icon: 'info', title: 'Tidak bisa menyalin otomatis', text: 'Silakan salin rangkuman progress secara manual.', confirmButtonColor: '#1E40AF' });
      });
    });
  }

  function renderTaskCard(t, currentUser, users) {
    const totalChecklist = t.checklist ? t.checklist.length : 0;
    const doneChecklist = t.checklistDone ? t.checklistDone.filter(Boolean).length : 0;
    const u = users[t.pic] || { color: '#64748B', initial: t.pic ? t.pic.slice(0, 2) : '??' };
    
    const priorityColors = {
      Tinggi: 'var(--priority-high-border)',
      Sedang: 'var(--priority-med-border)',
      Rendah: 'var(--priority-low-border)'
    };

    const isMine = currentUser && currentUser.role === 'member' && currentUser.name === t.pic;
    const canUpdate = canUpdateTaskProgress(t, currentUser);
    const isReadonlyProgress = currentUser?.role === 'member' && canReadTaskDetails(t, currentUser) && !canUpdate;
    const updatedAtLabel = formatTaskUpdatedAt(t);
    const showMeetingTag = canShowMeetings(currentUser);
    const isArchived = Boolean(t.archivedAt);

    return `
      <div class="task-card ${isReadonlyProgress ? 'is-readonly-progress' : ''} ${isArchived ? 'is-archived' : ''}" draggable="${canUpdate && !isArchived ? 'true' : 'false'}" data-task-id="${t.id}" style="${isMine ? 'border-color: var(--ut-blue-primary);' : ''}">
        <div class="task-priority-indicator" style="background: ${priorityColors[t.priority] || 'transparent'}"></div>
        <div class="card-header-row">
          <div class="card-title">${escapeHtml(t.title)}</div>
          <div style="display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end;">
            ${isArchived ? '<span class="task-archive-badge">Arsip</span>' : ''}
            ${isReadonlyProgress ? '<span class="task-readonly-badge">Hanya lihat</span>' : ''}
            <span class="priority-badge ${t.priority}">${t.priority}</span>
          </div>
        </div>
        <div class="card-description">${escapeHtml(t.description || '')}</div>
        <div class="task-card-meta">
          <span>Update</span>
          <strong>${escapeHtml(updatedAtLabel)}</strong>
        </div>
        <div class="card-footer">
          <div class="card-pic-tag">
            <span class="pic-mini-avatar" style="background: ${u.color}">${u.initial}</span>
            <span>${t.pic} ${isMine ? '<span style="font-size:0.65rem; color:var(--ut-blue-primary); font-weight:600;">(Saya)</span>' : ''}</span>
          </div>
          ${totalChecklist > 0 ? `
            <div class="checklist-counter">
              <span>☑️ ${doneChecklist}/${totalChecklist}</span>
            </div>
          ` : ''}
        </div>
        ${showMeetingTag && t.meetings && t.meetings.length > 0 ? `
          <div class="task-card-meetings-tag">
            🗓️ ${t.meetings.length} Pertemuan ${t.meetings.some(m => m.url) ? '• 🔗 Link' : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  /* ==========================================
     Render Halaman Manajemen Pengguna (CRUD)
     ========================================== */
  function renderUserManagementView() {
    const container = document.getElementById('userTableContainer');
    if (!container) return;

    const users = window.capstoneStore.getUsers();
    const tasks = window.capstoneStore.getAll();
    const currentUser = window.capstoneStore.getCurrentUser();
    const canManageUsers = window.RBAC.can(currentUser, 'users', 'update');
    const canDeleteUsers = window.RBAC.can(currentUser, 'users', 'delete');

    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
      addUserBtn.style.display = window.RBAC.can(currentUser, 'users', 'create') ? 'inline-flex' : 'none';
      addUserBtn.onclick = () => openNewUserModal();
    }

    container.innerHTML = `
      <div style="overflow-x: auto;">
        <table class="user-management-table">
          <thead>
            <tr>
              <th>Pengguna</th>
              <th>Peran (Role)</th>
              <th>Tugas Ditugaskan</th>
              <th>Terakhir Dilihat</th>
              <th>Perangkat Login</th>
              <th>Password Diubah</th>
              <th style="text-align: right;">Aksi CRUD</th>
            </tr>
          </thead>
          <tbody>
            ${Object.values(users).map(u => {
              const assignedTasks = tasks.filter(t => t.pic === u.name).length;
              const formattedLastSeen = formatLastSeen(u.lastSeen || u.lastLogin);
              const formattedLoginDevice = formatLoginDevice(u.lastLoginDevice);
              const formattedPasswordChanged = formatPasswordChanged(u.passwordChangedAt);
              const isCurrentlyActive = currentUser.name === u.name;
              const roleLabel = getRoleLabel(u, true);
              const roleClass = u.role === 'superadmin' ? 'Tinggi' : u.role === 'koordinator' ? 'Sedang' : 'Rendah';

              return `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <span class="workload-avatar" style="background: ${u.color}; margin-bottom:0;">${u.initial}</span>
                      <div>
                        <div style="font-weight: 600;">${u.name} ${isCurrentlyActive ? '<span style="font-size:0.7rem; color:var(--ut-blue-primary);">(Aktif Saat Ini)</span>' : ''}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(u.fullName || u.name)}${u.nim ? ` · ${escapeHtml(u.nim)}` : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="priority-badge ${roleClass}" style="font-size: 0.7rem;">
                      ${roleLabel}
                    </span>
                  </td>
                  <td>
                    <span style="font-weight: 600;">${assignedTasks} tugas</span>
                  </td>
                  <td>
                    <div style="font-size: 0.825rem; color: var(--text-main);">
                      ${formattedLastSeen}
                    </div>
                  </td>
                  <td>
                    <div class="user-device-cell" title="${escapeHtml(u.lastLoginDevice || 'Belum ada data perangkat')}">
                      ${formattedLoginDevice}
                    </div>
                  </td>
                  <td>
                    <div style="font-size: 0.825rem; color: var(--text-main);">
                      ${formattedPasswordChanged}
                    </div>
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 0.4rem; justify-content: flex-end;">
                      <button class="btn btn-secondary edit-user-btn" data-user-id="${u.id}" style="padding: 0.35rem 0.65rem; font-size: 0.775rem;">✏️ Edit</button>
                      ${canDeleteUsers ? `<button class="btn btn-danger delete-user-direct-btn" data-user-id="${u.id}" style="padding: 0.35rem 0.65rem; font-size: 0.775rem;">🗑️ Hapus</button>` : ''}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Bind Edit User Buttons
    container.querySelectorAll('.edit-user-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditUserModal(btn.dataset.userId);
      });
    });

    // Bind Delete User Buttons
    container.querySelectorAll('.delete-user-direct-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const uId = btn.dataset.userId;
        if (uId) {
          Swal.fire({
            title: 'Hapus Pengguna?',
            text: `Apakah Anda yakin ingin menghapus akun "${uId}" dari sistem?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#64748B',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
          }).then((result) => {
            if (result.isConfirmed) {
              if (!requirePermission('users', 'delete')) return;
              if (!canDeleteUserId(uId)) return;
              window.capstoneStore.deleteUser(uId);
              renderCurrentView();
              Swal.fire('Terhapus!', 'Pengguna berhasil dihapus.', 'success');
            }
          });
        }
      });
    });
  }

  function formatLastLogin(timestamp) {
    if (!timestamp) return 'Belum pernah masuk';
    
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 2) return '🟢 Aktif saat ini';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;

    return formatAbsoluteDateTime(timestamp);
  }

  function formatLastSeen(timestamp) {
    return timestamp ? formatLastLogin(timestamp) : 'Belum terlihat';
  }

  function formatPasswordChanged(timestamp) {
    return timestamp ? formatAbsoluteDateTime(timestamp) : 'Belum pernah diubah';
  }

  function formatAbsoluteDateTime(timestamp) {
    return formatWibDateTime(timestamp);
  }

  function formatLoginDevice(userAgent) {
    if (!userAgent) return 'Belum ada data';
    const browser = /Edg\//i.test(userAgent) ? 'Edge'
      : /Chrome\//i.test(userAgent) ? 'Chrome'
        : /Firefox\//i.test(userAgent) ? 'Firefox'
          : /Safari\//i.test(userAgent) ? 'Safari'
            : /OPR\//i.test(userAgent) ? 'Opera'
              : 'Browser';
    const os = /Android/i.test(userAgent) ? 'Android'
      : /iPhone|iPad|iPod/i.test(userAgent) ? 'iOS'
        : /Windows/i.test(userAgent) ? 'Windows'
          : /Mac OS X|Macintosh/i.test(userAgent) ? 'macOS'
            : /Linux/i.test(userAgent) ? 'Linux'
              : 'Perangkat';
    return `${os} · ${browser}`;
  }

  /* ==========================================
     Render Halaman Rekam Jejak Audit (Audit Trail Log)
     ========================================== */
  function renderAuditLogView() {
    const container = document.getElementById('auditTableContainer');
    const countBadge = document.getElementById('auditCountBadge');
    const userSelect = document.getElementById('auditUserSelect');
    const actionSelect = document.getElementById('auditActionSelect');
    const searchInput = document.getElementById('auditSearchInput');
    const dateRangeSelect = document.getElementById('auditDateRangeSelect');
    const customDateBox = document.getElementById('auditCustomDateBox');
    const startDateInput = document.getElementById('auditStartDate');
    const endDateInput = document.getElementById('auditEndDate');
    const clearBtn = document.getElementById('clearAuditBtn');

    if (!container) return;

    const users = window.capstoneStore.getUsers();
    let logs = window.capstoneStore.getAuditLogs();

    // Populate user filter dropdown
    if (userSelect) {
      userSelect.innerHTML = `
        <option value="SEMUA" ${auditUserFilter === 'SEMUA' ? 'selected' : ''}>Semua Pengguna</option>
        ${Object.values(users).map(u => `<option value="${u.name}" ${auditUserFilter === u.name ? 'selected' : ''}>${u.name}</option>`).join('')}
      `;
      userSelect.onchange = (e) => {
        auditUserFilter = e.target.value;
        auditCurrentPage = 1;
        renderAuditLogView();
      };
    }

    if (actionSelect) {
      actionSelect.value = auditActionFilter;
      actionSelect.onchange = (e) => {
        auditActionFilter = e.target.value;
        auditCurrentPage = 1;
        renderAuditLogView();
      };
    }

    if (searchInput) {
      searchInput.value = auditSearchQuery;
      searchInput.oninput = (e) => {
        auditSearchQuery = e.target.value;
        auditCurrentPage = 1;
        renderAuditLogView();
      };
    }

    if (dateRangeSelect) {
      dateRangeSelect.value = auditDateRange;
      if (customDateBox) customDateBox.style.display = (auditDateRange === 'CUSTOM') ? 'inline-flex' : 'none';
      dateRangeSelect.onchange = (e) => {
        auditDateRange = e.target.value;
        if (customDateBox) customDateBox.style.display = (auditDateRange === 'CUSTOM') ? 'inline-flex' : 'none';
        auditCurrentPage = 1;
        renderAuditLogView();
      };
    }

    if (startDateInput) {
      startDateInput.value = auditStartDate;
      startDateInput.onchange = (e) => {
        auditStartDate = e.target.value;
        auditCurrentPage = 1;
        renderAuditLogView();
      };
    }

    if (endDateInput) {
      endDateInput.value = auditEndDate;
      endDateInput.onchange = (e) => {
        auditEndDate = e.target.value;
        auditCurrentPage = 1;
        renderAuditLogView();
      };
    }

    const viewSnapshotBtn = document.getElementById('viewSnapshotBtn');
    if (viewSnapshotBtn) {
      viewSnapshotBtn.onclick = () => openJsonSnapshotModal();
    }

    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
      exportCsvBtn.onclick = () => exportAuditLogsToCsv(logs);
    }

    const exportJsonBtn = document.getElementById('exportJsonBtn');
    if (exportJsonBtn) {
      exportJsonBtn.onclick = () => exportAuditLogsToJson(logs);
    }

    const printAuditBtn = document.getElementById('printAuditBtn');
    if (printAuditBtn) {
      printAuditBtn.onclick = () => printAuditLogs(logs);
    }

    const resetBtn = document.getElementById('resetAuditBtn');

    if (resetBtn) {
      const currentUser = window.capstoneStore.getCurrentUser();
      resetBtn.style.display = currentUser.role === 'superadmin' ? 'inline-flex' : 'none';
      resetBtn.onclick = () => {
        window.capstoneStore.resetAuditLogs();
        auditCurrentPage = 1;
        renderAuditLogView();
      };
    }

    if (clearBtn) {
      const currentUser = window.capstoneStore.getCurrentUser();
      clearBtn.style.display = currentUser.role === 'superadmin' ? 'inline-flex' : 'none';
      clearBtn.onclick = () => {
        Swal.fire({
          title: 'Bersihkan Log Audit?',
          text: 'Seluruh catatan riwayat log audit sistem akan dihapus permanen.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#EF4444',
          cancelButtonColor: '#64748B',
          confirmButtonText: 'Ya, Bersihkan!',
          cancelButtonText: 'Batal'
        }).then((result) => {
          if (result.isConfirmed) {
            window.capstoneStore.clearAuditLogs();
            auditCurrentPage = 1;
            renderAuditLogView();
            Swal.fire('Dibersihkan!', 'Log audit berhasil dibersihkan.', 'success');
          }
        });
      };
    }

    // Apply filters
    if (auditUserFilter !== 'SEMUA') {
      logs = logs.filter(l => l.user === auditUserFilter);
    }

    if (auditActionFilter !== 'SEMUA') {
      logs = logs.filter(l => l.action === auditActionFilter);
    }

    if (auditSearchQuery.trim()) {
      const q = auditSearchQuery.toLowerCase();
      logs = logs.filter(l => l.details.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.user.toLowerCase().includes(q));
    }

    // Date Range Filter Calculation
    if (auditDateRange !== 'SEMUA') {
      const now = new Date();
      if (auditDateRange === 'HARI_INI') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        logs = logs.filter(l => l.timestamp >= startOfToday);
      } else if (auditDateRange === '7_HARI') {
        const sevenDaysAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
        logs = logs.filter(l => l.timestamp >= sevenDaysAgo);
      } else if (auditDateRange === 'BULAN_INI') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        logs = logs.filter(l => l.timestamp >= startOfMonth);
      } else if (auditDateRange === 'CUSTOM') {
        if (auditStartDate) {
          const startMs = new Date(auditStartDate).getTime();
          logs = logs.filter(l => l.timestamp >= startMs);
        }
        if (auditEndDate) {
          const endMs = new Date(auditEndDate).getTime() + (24 * 60 * 60 * 1000) - 1;
          logs = logs.filter(l => l.timestamp <= endMs);
        }
      }
    }

    // Render Mini KPI Grid
    const kpiGrid = document.getElementById('auditKpiGrid');
    if (kpiGrid) {
      const userCounts = {};
      const actionCounts = {};
      logs.forEach(l => {
        userCounts[l.user] = (userCounts[l.user] || 0) + 1;
        actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
      });
      let topUser = Object.keys(userCounts).reduce((a, b) => userCounts[a] > userCounts[b] ? a : b, '-');
      let topUserCount = topUser !== '-' ? userCounts[topUser] : 0;
      let topAction = Object.keys(actionCounts).reduce((a, b) => actionCounts[a] > actionCounts[b] ? a : b, '-');
      let topActionCount = topAction !== '-' ? actionCounts[topAction] : 0;

      kpiGrid.innerHTML = `
        <div class="stat-card">
          <div class="stat-card-title">📊 Total Aktivitas</div>
          <div class="stat-card-value">${logs.length}</div>
          <div class="stat-card-desc">Rekam jejak audit yang cocok</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">👤 Aktor Teraktif</div>
          <div class="stat-card-value" style="font-size: 1.1rem; color: var(--ut-blue-primary);">${escapeHtml(topUser)}</div>
          <div class="stat-card-desc">${topUserCount} aktivitas tercatat</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">⚡ Aksi Terbanyak</div>
          <div class="stat-card-value" style="font-size: 1.1rem; color: var(--status-inprogress);">${escapeHtml(topAction)}</div>
          <div class="stat-card-desc">${topActionCount} kali dieksekusi</div>
        </div>
      `;
    }

    const totalItems = logs.length;
    if (countBadge) countBadge.textContent = `${totalItems} aktivitas`;

    if (totalItems === 0) {
      container.innerHTML = `
        <div class="card-box-subtitle" style="padding: 2rem 0; text-align: center;">
          <p style="margin-bottom: 0.75rem;">Tidak ada rekam jejak audit yang sesuai dengan filter.</p>
          <button id="inlineResetAuditBtn" class="btn btn-secondary">Isi Ulang Data Dummy Audit</button>
        </div>
      `;
      const inlineResetBtn = document.getElementById('inlineResetAuditBtn');
      if (inlineResetBtn) {
        inlineResetBtn.onclick = () => {
          window.capstoneStore.resetAuditLogs();
          auditCurrentPage = 1;
          renderAuditLogView();
        };
      }
      return;
    }

    // Pagination calculations
    const totalPages = Math.ceil(totalItems / auditPageSize) || 1;
    if (auditCurrentPage > totalPages) auditCurrentPage = totalPages;
    if (auditCurrentPage < 1) auditCurrentPage = 1;

    const startIndex = (auditCurrentPage - 1) * auditPageSize;
    const endIndex = Math.min(startIndex + auditPageSize, totalItems);
    const paginatedLogs = logs.slice(startIndex, endIndex);

    const rowsHtml = paginatedLogs.map(l => {
      const u = users[l.user] || { color: '#64748B', initial: l.user ? l.user.slice(0, 2).toUpperCase() : 'SYS' };
      const wibParts = getWibDateParts(l.timestamp);
      const dateStr = wibParts ? `${wibParts.day} ${wibParts.monthName} ${wibParts.year}` : '-';
      const timeStr = wibParts ? `${wibParts.hours}:${wibParts.minutes}:${wibParts.seconds} WIB` : '-';

      const actionIcons = {
        'Tambah Tugas': '📝',
        'Ubah Status': '🔄',
        'Ubah Tugas': '✏️',
        'Hapus Tugas': '🗑️',
        'Centang Checklist': '☑️',
        'Tambah Pengguna': '👤',
        'Ubah Pengguna': '✏️',
        'Hapus Pengguna': '🗑️',
        'Tambah Pertemuan': '🗓️',
        'Hapus Pertemuan': '🗑️',
        'Ubah Permission RBAC': '🔐'
      };

      const action = String(l.action || 'Aktivitas');
      const actionTagLabel = l.actionTag || action.toLowerCase().replace(/\s/g, '_');
      const objType = l.object?.type || '-';
      const objId = l.object?.id || '-';
      const objName = String(l.object?.name || l.details || '-');

      let changesHtml = '';
      if (l.changes && l.changes.length > 0) {
        changesHtml = l.changes.map(c => {
          const valHtml = (c.from === null) 
            ? `<span class="audit-val-new">→ ${escapeHtml(String(c.to))}</span>` 
            : `<span class="audit-val-old">${escapeHtml(String(c.from))}</span> → <span class="audit-val-new">${escapeHtml(String(c.to))}</span>`;
          return `<div class="audit-change-row"><span class="audit-change-field">${escapeHtml(c.field)}</span><span class="audit-change-value">${valHtml}</span></div>`;
        }).join('');
      } else {
        changesHtml = `<div style="font-size: 0.775rem; color: var(--text-muted);">${escapeHtml(l.details)}</div>`;
      }

      const rawJson = JSON.stringify({
        id: l.id,
        timestamp: l.timestamp,
        user: l.user,
        role: l.role,
        action: l.action,
        actionTag: actionTagLabel,
        object: l.object || null,
        changes: l.changes || [],
        details: l.details,
        ip: l.ip || null,
        device: l.device || null
      }, null, 2);

      const deviceShort = l.device ? (l.device.length > 42 ? l.device.slice(0, 42) + '...' : l.device) : '-';
      const ipAddr = l.ip || '-';
      const roleLabel = getRoleLabel({ role: l.role });

      return `
        <tr class="audit-detail-row">
          <td class="audit-td-time">
            <div class="audit-date-primary">${dateStr}</div>
            <div class="audit-date-secondary">${timeStr}</div>
          </td>
          <td class="audit-td-id">
            <span class="audit-id-badge">#${String(l.id || '-').replace('a-', '')}</span>
          </td>
          <td class="audit-td-action">
            <div class="audit-action-name">${actionIcons[l.action] || '📋'} ${escapeHtml(l.action)}</div>
            <div class="audit-action-tag">${escapeHtml(actionTagLabel)}</div>
          </td>
          <td class="audit-td-actor">
            <div class="audit-actor-name">${escapeHtml(l.user)}</div>
            <div class="audit-actor-role">${roleLabel} / ${escapeHtml(l.user.toLowerCase())}@capstone.ut</div>
          </td>
          <td class="audit-td-object">
            <div class="audit-object-name">${escapeHtml(objName.length > 50 ? objName.slice(0, 50) + '...' : objName)}</div>
            <div class="audit-object-meta">ID ${escapeHtml(objId)} / ${escapeHtml(objType)}</div>
          </td>
          <td class="audit-td-changes">
            <div class="audit-changes-list">${changesHtml}</div>
            <details class="audit-json-details">
              <summary class="audit-json-toggle">▸ Detail Raw JSON</summary>
              <pre class="audit-json-block">${escapeHtml(rawJson)}</pre>
            </details>
          </td>
          <td class="audit-td-trail">
            <div class="audit-trail-info">
              <div class="audit-trail-label">IP</div>
              <div class="audit-trail-value">${ipAddr}</div>
            </div>
            <div class="audit-trail-info">
              <div class="audit-trail-label">PERANGKAT</div>
              <div class="audit-trail-value audit-device-val">${escapeHtml(deviceShort)}</div>
            </div>
            <button class="audit-copy-btn" data-log-id="${l.id}" title="Salin baris audit">📋 Salin Baris</button>
          </td>
        </tr>
      `;
    }).join('');

    // Pagination numbers generator
    let pageNumbers = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      if (auditCurrentPage <= 4) {
        pageNumbers = [1, 2, 3, 4, 5, '...', totalPages];
      } else if (auditCurrentPage >= totalPages - 3) {
        pageNumbers = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        pageNumbers = [1, '...', auditCurrentPage - 1, auditCurrentPage, auditCurrentPage + 1, '...', totalPages];
      }
    }

    const pageNumbersHtml = pageNumbers.map(p => {
      if (p === '...') return `<span class="audit-page-ellipsis">...</span>`;
      return `<button class="audit-page-btn ${p === auditCurrentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }).join('');

    container.innerHTML = `
      <div style="overflow-x: auto;">
        <table class="audit-detail-table">
          <thead>
            <tr>
              <th class="audit-th-time">WAKTU WIB</th>
              <th class="audit-th-id">ID LOG</th>
              <th class="audit-th-action">AKSI</th>
              <th class="audit-th-actor">AKTOR</th>
              <th class="audit-th-object">OBJEK</th>
              <th class="audit-th-changes">PERUBAHAN</th>
              <th class="audit-th-trail">JEJAK</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <div class="audit-pagination-footer">
        <div class="audit-pagination-info">
          Menampilkan <strong>${totalItems === 0 ? 0 : startIndex + 1}-${endIndex}</strong> dari <strong>${totalItems}</strong> aktivitas
        </div>
        <div class="audit-pagination-controls">
          <div class="audit-page-size">
            <label for="auditPageSizeSelect">Tampilkan:</label>
            <select id="auditPageSizeSelect" class="form-select form-select-sm">
              <option value="5" ${auditPageSize === 5 ? 'selected' : ''}>5</option>
              <option value="10" ${auditPageSize === 10 ? 'selected' : ''}>10</option>
              <option value="25" ${auditPageSize === 25 ? 'selected' : ''}>25</option>
              <option value="50" ${auditPageSize === 50 ? 'selected' : ''}>50</option>
            </select>
            <span>per halaman</span>
          </div>
          <div class="audit-pagination-buttons">
            <button class="audit-page-btn" data-page="1" ${auditCurrentPage === 1 ? 'disabled' : ''} title="Halaman Pertama">«</button>
            <button class="audit-page-btn" data-page="${auditCurrentPage - 1}" ${auditCurrentPage === 1 ? 'disabled' : ''} title="Halaman Sebelumnya">‹</button>
            ${pageNumbersHtml}
            <button class="audit-page-btn" data-page="${auditCurrentPage + 1}" ${auditCurrentPage === totalPages ? 'disabled' : ''} title="Halaman Berikutnya">›</button>
            <button class="audit-page-btn" data-page="${totalPages}" ${auditCurrentPage === totalPages ? 'disabled' : ''} title="Halaman Terakhir">»</button>
          </div>
        </div>
      </div>
    `;

    // Bind Page Size Dropdown
    const pageSizeSelect = container.querySelector('#auditPageSizeSelect');
    if (pageSizeSelect) {
      pageSizeSelect.onchange = (e) => {
        auditPageSize = parseInt(e.target.value, 10);
        auditCurrentPage = 1;
        renderAuditLogView();
      };
    }

    // Bind Pagination Buttons
    container.querySelectorAll('.audit-page-btn').forEach(btn => {
      btn.onclick = () => {
        const p = parseInt(btn.dataset.page, 10);
        if (p && p >= 1 && p <= totalPages && p !== auditCurrentPage) {
          auditCurrentPage = p;
          renderAuditLogView();
        }
      };
    });

    // Bind "Salin Baris" buttons
    container.querySelectorAll('.audit-copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const logId = btn.dataset.logId;
        const logEntry = logs.find(l => l.id === logId);
        if (logEntry) {
          const jsonStr = JSON.stringify(logEntry, null, 2);
          navigator.clipboard.writeText(jsonStr).then(() => {
            Swal.fire({
              icon: 'success',
              title: 'Tersalin!',
              text: 'Data baris audit telah disalin ke clipboard.',
              timer: 1500,
              showConfirmButton: false
            });
          }).catch(() => {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = jsonStr;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            Swal.fire({
              icon: 'success',
              title: 'Tersalin!',
              text: 'Data baris audit telah disalin.',
              timer: 1500,
              showConfirmButton: false
            });
          });
        }
      });
    });
  }

  /* ==========================================
     Helper Export Audit Log (CSV & JSON)
     ========================================== */
  function exportAuditLogsToCsv(logsToExport) {
    if (!logsToExport || logsToExport.length === 0) {
      Swal.fire('Informasi', 'Tidak ada log audit yang dapat diexport.', 'info');
      return;
    }
    const headers = ['ID Log', 'Waktu WIB', 'Aktor', 'Peran', 'Aksi', 'Tag Aksi', 'Objek', 'Detail', 'IP', 'Perangkat'];
    const csvRows = [headers.join(',')];

    logsToExport.forEach(l => {
      const dateStr = formatWibDateTime(l.timestamp, true);
      const row = [
        `"${(l.id || '').replace(/"/g, '""')}"`,
        `"${dateStr}"`,
        `"${(l.user || '').replace(/"/g, '""')}"`,
        `"${(l.role || '').replace(/"/g, '""')}"`,
        `"${(l.action || '').replace(/"/g, '""')}"`,
        `"${(l.actionTag || '').replace(/"/g, '""')}"`,
        `"${(l.object ? l.object.name : '').replace(/"/g, '""')}"`,
        `"${(l.details || '').replace(/"/g, '""')}"`,
        `"${(l.ip || '').replace(/"/g, '""')}"`,
        `"${(l.device || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Trail_Capstone_UT_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Swal.fire({
      icon: 'success',
      title: 'Export CSV Berhasil!',
      text: `${logsToExport.length} data log audit berhasil diunduh.`,
      timer: 2000,
      showConfirmButton: false
    });
  }

  function exportAuditLogsToJson(logsToExport) {
    if (!logsToExport || logsToExport.length === 0) {
      Swal.fire('Informasi', 'Tidak ada log audit yang dapat diexport.', 'info');
      return;
    }
    const jsonStr = JSON.stringify(logsToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Trail_Capstone_UT_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Swal.fire({
      icon: 'success',
      title: 'Export JSON Berhasil!',
      text: `${logsToExport.length} data log audit berhasil diunduh.`,
      timer: 2000,
      showConfirmButton: false
    });
  }

  function printAuditLogs(logsToPrint) {
    const printContainer = document.getElementById('auditPrintContainer');
    if (!printContainer) {
      window.print();
      return;
    }

    if (!logsToPrint || logsToPrint.length === 0) {
      Swal.fire('Informasi', 'Tidak ada log audit yang dapat dicetak.', 'info');
      return;
    }

    const rowsHtml = logsToPrint.map((l, idx) => {
      const timeStr = formatWibDateTime(l.timestamp, true);
      const roleLabel = getRoleLabel({ role: l.role });
      const objName = l.object?.name
        ? `${l.object.name} (${l.object.type || '-'})`
        : (l.details || '-');

      let changesText = l.details || '-';
      if (l.changes && l.changes.length > 0) {
        changesText = l.changes.map(c => `${c.field}: ${c.from === null ? 'BARU' : c.from} → ${c.to}`).join('; ');
      }

      return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="white-space: nowrap;">${timeStr}</td>
          <td>#${String(l.id || '-').replace('a-', '')}</td>
          <td><strong>${escapeHtml(l.user)}</strong><br/><span style="font-size: 8pt; color: #64748B;">${roleLabel}</span></td>
          <td><strong>${escapeHtml(l.action)}</strong></td>
          <td>${escapeHtml(objName)}</td>
          <td style="font-size: 8.5pt;">${escapeHtml(changesText)}</td>
          <td style="font-size: 8pt;">${escapeHtml(l.ip || '-')}<br/>${escapeHtml(l.device ? (l.device.length > 30 ? l.device.slice(0, 30) + '...' : l.device) : '-')}</td>
        </tr>
      `;
    }).join('');

    printContainer.innerHTML = `
      <div class="official-print-header">
        <div style="text-align: center; margin-bottom: 1rem; border-bottom: 2px solid #1E3A8A; padding-bottom: 0.6rem;">
          <h2 style="margin: 0; color: #1E3A8A; font-size: 16pt; font-weight: 800; font-family: sans-serif;">UNIVERSITAS TERBUKA</h2>
          <h3 style="margin: 4px 0 0 0; font-size: 11pt; color: #334155; font-family: sans-serif;">LAPORAN REKAM JEJAK AUDIT SISTEM (CAPSTONE PROJECT WORKSPACE)</h3>
          <p style="margin: 4px 0 0 0; font-size: 8.5pt; color: #64748B; font-family: sans-serif;">Dicetak: ${formatWibDateTime(Date.now(), true)} | Total Data Filtered: ${logsToPrint.length} Aktivitas</p>
        </div>
      </div>

      <table class="audit-print-table">
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">NO</th>
            <th style="width: 140px;">WAKTU (WIB)</th>
            <th style="width: 75px;">ID LOG</th>
            <th style="width: 120px;">AKTOR</th>
            <th style="width: 120px;">AKSI</th>
            <th style="width: 170px;">OBJEK TARGET</th>
            <th>PERUBAHAN / DETAIL</th>
            <th style="width: 120px;">JEJAK PERANGKAT</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;

    window.print();
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return '-';
    return formatWibDateTime(timestamp);
  }

  /* ==========================================
     Drag and Drop Kanban
     ========================================== */
  function bindKanbanEvents(container) {
    const cards = container.querySelectorAll('.task-card');
    const columns = container.querySelectorAll('.kanban-column');
    const currentUser = window.capstoneStore.getCurrentUser();

    cards.forEach(card => {
      const task = window.capstoneStore.getById(card.dataset.taskId);
      const canDragCard = canUpdateTaskProgress(task, currentUser) && !task?.archivedAt;
      card.draggable = canDragCard;
      if (canDragCard) {
        card.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', card.dataset.taskId);
          card.style.opacity = '0.5';
        });

        card.addEventListener('dragend', () => {
          card.style.opacity = '1';
        });
      }
      card.addEventListener('click', () => {
        if (canReadTaskDetails(task, currentUser)) openEditTaskModal(card.dataset.taskId);
      });
    });

    columns.forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('drop-hover');
      });

      col.addEventListener('dragleave', () => {
        col.classList.remove('drop-hover');
      });

      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('drop-hover');
        const taskId = e.dataTransfer.getData('text/plain');
        const targetStatus = col.dataset.status;
        const task = window.capstoneStore.getById(taskId);
        if (!canUpdateTaskProgress(task, currentUser) || task?.archivedAt) return;

        if (taskId && targetStatus) {
          window.capstoneStore.update(taskId, { status: targetStatus });
          renderCurrentView();
        }
      });
    });
  }

  /* ==========================================
     Modal Controller (Tugas)
     ========================================== */
  function initTaskModalListeners() {
    const taskModalBackdrop = document.getElementById('taskModalBackdrop');
    const taskForm = document.getElementById('taskForm');
    const modalTitle = document.getElementById('modalTitle');
    const deleteTaskBtn = document.getElementById('deleteTaskBtn');
    const archiveTaskBtn = document.getElementById('archiveTaskBtn');

    if (!taskModalBackdrop) return;

    document.getElementById('modalCloseBtn')?.addEventListener('click', closeTaskModal);
    document.getElementById('modalCancelBtn')?.addEventListener('click', closeTaskModal);
    document.getElementById('addMeetingBtn')?.addEventListener('click', () => {
      addMeetingToModal();
    });

    document.getElementById('dashAddMeetingBtn')?.addEventListener('click', () => {
      openNewMeetingModal('');
    });

    taskModalBackdrop.addEventListener('click', (e) => {
      if (e.target === taskModalBackdrop) closeTaskModal();
    });

    const addChecklistItemBtn = document.getElementById('addChecklistItemBtn');
    if (addChecklistItemBtn) {
      addChecklistItemBtn.addEventListener('click', () => {
        if (!modalTaskCanManageStructure) return;
        modalChecklistState.push({ text: '', done: false });
        renderModalChecklistBuilder();
        const textInputs = document.querySelectorAll('.modal-checklist-text');
        if (textInputs.length > 0) {
          textInputs[textInputs.length - 1].focus();
        }
      });
    }

    if (taskForm) {
      taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveTaskFromModal();
      });
    }

    if (deleteTaskBtn) {
      deleteTaskBtn.addEventListener('click', () => {
        const taskId = document.getElementById('taskIdInput').value;
        if (taskId) {
          Swal.fire({
            title: 'Hapus Tugas?',
            text: 'Apakah Anda yakin ingin menghapus tugas ini?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#64748B',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
          }).then((result) => {
            if (result.isConfirmed) {
              if (!requirePermission('tasks', 'delete')) return;
              window.capstoneStore.delete(taskId);
              closeTaskModal();
              renderCurrentView();
              Swal.fire('Terhapus!', 'Tugas berhasil dihapus.', 'success');
            }
          });
        }
      });
    }

    if (archiveTaskBtn) {
      archiveTaskBtn.addEventListener('click', () => {
        const taskId = document.getElementById('taskIdInput').value;
        const task = window.capstoneStore.getById(taskId);
        if (!task || !canArchiveTask(task)) return;
        const isArchived = Boolean(task.archivedAt);
        Swal.fire({
          title: isArchived ? 'Pulihkan Tugas?' : 'Arsipkan Tugas?',
          text: isArchived
            ? 'Tugas akan kembali tampil di board utama.'
            : 'Tugas selesai ini akan disembunyikan dari board utama, tetapi datanya tetap tersimpan.',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#1E40AF',
          cancelButtonColor: '#64748B',
          confirmButtonText: isArchived ? 'Ya, Pulihkan' : 'Ya, Arsipkan',
          cancelButtonText: 'Batal'
        }).then((result) => {
          if (!result.isConfirmed) return;
          window.capstoneStore.update(taskId, { archivedAt: isArchived ? null : Date.now() });
          renderCurrentView();
          if (isArchived) {
            openEditTaskModal(taskId);
            Swal.fire({
              icon: 'success',
              title: 'Dipulihkan!',
              text: 'Tugas kembali ke mode edit superadmin.',
              timer: 1200,
              showConfirmButton: false
            });
          } else {
            closeTaskModal();
            Swal.fire('Diarsipkan!', 'Tugas selesai masuk arsip.', 'success');
          }
        });
      });
    }

    // Modal Pertemuan Standalone Listeners
    bindMeetingModalListeners(document.getElementById('meetingModalBackdrop'));
  }

  function setTaskModalAccess({ canUpdateProgress, canManageStructure, canDelete, canSubmit, canArchive = false, archiveLabel = 'Arsipkan Tugas', readonlyMessage = 'Status dan checklist hanya bisa diubah oleh PIC tugas ini.' }) {
    modalTaskCanUpdateProgress = Boolean(canUpdateProgress);
    modalTaskCanManageStructure = Boolean(canManageStructure);
    const isReadonlyMode = !modalTaskCanUpdateProgress && !modalTaskCanManageStructure;

    const taskForm = document.getElementById('taskForm');
    taskForm?.classList.toggle('task-readonly-mode', isReadonlyMode);

    const readonlyNotice = document.getElementById('taskReadonlyNotice');
    if (readonlyNotice) {
      readonlyNotice.hidden = !isReadonlyMode;
      readonlyNotice.innerHTML = `
        <strong>${archiveLabel === 'Pulihkan dari Arsip' ? 'Mode arsip' : 'Mode lihat saja'}</strong>
        <span>${escapeHtml(readonlyMessage)}</span>
      `;
    }

    ['taskTitleInput', 'taskDescInput', 'taskPhaseSelect', 'taskPicSelect', 'taskPrioritySelect'].forEach(id => {
      const field = document.getElementById(id);
      if (field) field.disabled = !modalTaskCanManageStructure;
    });

    const statusSelect = document.getElementById('taskStatusSelect');
    if (statusSelect) statusSelect.disabled = !modalTaskCanUpdateProgress;

    const addChecklistItemBtn = document.getElementById('addChecklistItemBtn');
    if (addChecklistItemBtn) {
      addChecklistItemBtn.disabled = !modalTaskCanManageStructure;
      addChecklistItemBtn.style.display = modalTaskCanManageStructure ? 'inline-flex' : 'none';
    }

    document.querySelectorAll('.modal-checklist-text').forEach(input => {
      input.readOnly = !modalTaskCanManageStructure;
    });
    document.querySelectorAll('.modal-checklist-check').forEach(input => {
      input.disabled = !modalTaskCanUpdateProgress;
    });
    document.querySelectorAll('.modal-checklist-remove-btn').forEach(btn => {
      btn.style.display = modalTaskCanManageStructure ? 'inline-flex' : 'none';
    });

    const deleteTaskBtn = document.getElementById('deleteTaskBtn');
    if (deleteTaskBtn) deleteTaskBtn.style.display = canDelete ? 'inline-flex' : 'none';

    const archiveTaskBtn = document.getElementById('archiveTaskBtn');
    if (archiveTaskBtn) {
      archiveTaskBtn.style.display = canArchive ? 'inline-flex' : 'none';
      archiveTaskBtn.textContent = archiveLabel;
    }

    const submitBtn = document.querySelector('#taskForm button[type="submit"]');
    if (submitBtn) {
      submitBtn.style.display = canSubmit ? 'inline-flex' : 'none';
      submitBtn.textContent = modalTaskCanManageStructure ? 'Simpan Tugas' : 'Simpan Progress';
    }
  }

  function ensureMeetingModal() {
    let backdrop = document.getElementById('meetingModalBackdrop');
    if (backdrop && document.getElementById('meetingForm')) return backdrop;

    document.body.insertAdjacentHTML('beforeend', `
      <div id="meetingModalBackdrop" class="modal-backdrop">
        <div class="modal-dialog" style="max-width: 540px;">
          <div class="modal-header">
            <h3 id="meetingModalTitle">🗓️ Buat Agenda Pertemuan / Bimbingan</h3>
            <button id="meetingModalCloseBtn" class="modal-close-btn">&times;</button>
          </div>
          <form id="meetingForm" novalidate>
            <input type="hidden" id="meetingIdInput" />
            <input type="hidden" id="meetingPhaseInput" />
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Topik / Agenda Pertemuan</label>
                <input type="text" id="meetingTitleInput" class="form-input" required placeholder="Contoh: Bimbingan Tutor #1 - Review Proposal" />
              </div>
              <div class="form-group">
                <label class="form-label">Tugas Terkait (Tugas Capstone)</label>
                <select id="meetingTaskSelect" class="form-select">
                  <option value="">-- Pilih Tugas Terkait --</option>
                </select>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Tanggal & Waktu Mulai</label>
                  <input type="datetime-local" id="meetingDateInput" class="form-input" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Tanggal & Waktu Selesai</label>
                  <input type="datetime-local" id="meetingEndDateInput" class="form-input" required />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Penanggung Jawab / Host</label>
                <select id="meetingHostSelect" class="form-select"></select>
              </div>
              <div class="form-group">
                <label class="form-label">URL Link Pertemuan Online (Zoom / Google Meet)</label>
                <input type="url" id="meetingUrlInput" class="form-input" placeholder="https://meet.google.com/abc-defg-hij" />
              </div>
              <div class="form-group">
                <label class="form-label">Catatan Agenda & Hasil Bimbingan (Opsional)</label>
                <textarea id="meetingNotesInput" class="form-textarea" rows="3" placeholder="Contoh: Pembahasan revisi proposal dan konfirmasi penggunaan data Klinik Shifa Medika..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <div style="margin-left: auto; display: flex; gap: 0.75rem;">
                <button type="button" id="meetingModalCancelBtn" class="btn btn-secondary">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan Pertemuan</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `);

    backdrop = document.getElementById('meetingModalBackdrop');
    bindMeetingModalListeners(backdrop);
    return backdrop;
  }

  function bindMeetingModalListeners(backdrop) {
    if (!backdrop || backdrop.dataset.bound === 'true') return;
    backdrop.dataset.bound = 'true';

    document.getElementById('meetingModalCloseBtn')?.addEventListener('click', closeMeetingModal);
    document.getElementById('meetingModalCancelBtn')?.addEventListener('click', closeMeetingModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeMeetingModal();
    });

    document.getElementById('meetingForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      saveMeetingFromModal();
    });
  }

  function saveMeetingFromModal() {
    const meetingId = document.getElementById('meetingIdInput').value;
    const meetingPermission = meetingId ? 'update' : 'create';
    if (!window.RBAC.can(window.capstoneStore.getCurrentUser(), 'meetings', meetingPermission)) {
      closeMeetingModal();
      return;
    }
    const taskId = document.getElementById('meetingTaskSelect').value;
    const phaseKey = document.getElementById('meetingPhaseInput').value || '';
    const title = document.getElementById('meetingTitleInput').value.trim();
    const date = document.getElementById('meetingDateInput').value;
    const endDate = document.getElementById('meetingEndDateInput').value;
    const host = document.getElementById('meetingHostSelect').value;
    const url = document.getElementById('meetingUrlInput').value.trim();
    const notes = document.getElementById('meetingNotesInput').value.trim();

    if (!title || !date || !endDate || !host) {
      Swal.fire({
        icon: 'warning',
        title: 'Data belum lengkap',
        text: 'Isi topik, waktu mulai, waktu selesai, dan host pertemuan terlebih dahulu.',
        confirmButtonColor: '#1E40AF'
      });
      return;
    }

    if (date && endDate && new Date(endDate) < new Date(date)) {
      Swal.fire({
        icon: 'warning',
        title: 'Waktu Selesai Tidak Valid',
        text: 'Waktu selesai pertemuan harus sama atau setelah waktu mulai.',
        confirmButtonColor: '#1E40AF'
      });
      return;
    }

    const isGeneralMeeting = !taskId || taskId === '__GENERAL__';
    const isPhaseMeeting = taskId === '__PHASE__';
    const selectedTask = !isGeneralMeeting && !isPhaseMeeting ? window.capstoneStore.getById(taskId) : null;
    const meetingData = {
      id: meetingId || 'm-' + Date.now(),
      taskId: isGeneralMeeting || isPhaseMeeting ? null : taskId,
      phase: isGeneralMeeting ? null : (phaseKey || selectedTask?.phase || null),
      title: title || 'Agenda Pertemuan Baru',
      date,
      endDate,
      host,
      url,
      notes
    };

    const result = meetingId
      ? window.capstoneStore.updateMeeting(meetingId, meetingData)
      : window.capstoneStore.createMeeting(meetingData);
    if (!result?.ok) {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan pertemuan', text: result?.message || 'Data pertemuan belum dapat disimpan.', confirmButtonColor: '#1E40AF' });
      return;
    }

    closeMeetingModal();
    if (isGeneralMeeting) {
      setPage('dashboard', { restoreScroll: false });
    } else {
      renderCurrentView();
    }
    Swal.fire({
      icon: 'success',
      title: meetingId ? 'Pertemuan diperbarui' : 'Pertemuan tersimpan',
      text: isGeneralMeeting ? 'Meeting umum sudah tersimpan dan tampil di dashboard.' : 'Agenda pertemuan berhasil disimpan.',
      timer: 1800,
      showConfirmButton: false
    });
  }

  function openNewMeetingModal(phaseKey = '') {
    if (!window.RBAC.can(window.capstoneStore.getCurrentUser(), 'meetings', 'create')) return;
    const backdrop = ensureMeetingModal();
    const form = document.getElementById('meetingForm');
    if (!backdrop || !form) return;

    const currentUser = window.capstoneStore.getCurrentUser();

    form.reset();
    document.getElementById('meetingIdInput').value = '';
    document.getElementById('meetingPhaseInput').value = phaseKey;
    document.getElementById('meetingEndDateInput').value = '';
    const titleEl = document.getElementById('meetingModalTitle');
    if (titleEl) titleEl.textContent = '🗓️ Buat Agenda Pertemuan / Bimbingan';

    const taskSelect = document.getElementById('meetingTaskSelect');
    const tasks = phaseKey ? window.capstoneStore.getByPhase(phaseKey) : window.capstoneStore.getAll();
    if (taskSelect) {
      const contextOption = phaseKey
        ? `<option value="__PHASE__">Pertemuan ${phaseKey.replace('tugas', 'Tugas ')} (tanpa task spesifik)</option>`
        : `<option value="__GENERAL__">Pertemuan Umum (tanpa tahap)</option>`;
      taskSelect.innerHTML = contextOption + tasks.map(t => `
        <option value="${t.id}">${escapeHtml(t.title)}</option>
      `).join('');
      taskSelect.value = phaseKey ? '__PHASE__' : '__GENERAL__';
    }

    const hostSelect = document.getElementById('meetingHostSelect');
    const users = window.capstoneStore.getUsers();
    const visibleUsers = getUsersVisibleToViewer(users, currentUser);
    if (hostSelect) {
      hostSelect.innerHTML = visibleUsers.map(u => `
        <option value="${u.name}" ${u.name === currentUser.name ? 'selected' : ''}>${u.name}</option>
      `).join('');
    }

    backdrop.classList.add('active');
  }

  function openEditMeetingModal(meetingId, taskId) {
    if (!window.RBAC.can(window.capstoneStore.getCurrentUser(), 'meetings', 'update')) return;
    console.log('Edit meeting clicked:', { meetingId, taskId });
    const backdrop = ensureMeetingModal();
    const form = document.getElementById('meetingForm');
    if (!backdrop || !form) {
      alert('Modal pertemuan tidak ditemukan di halaman.');
      return;
    }

    const currentUser = window.capstoneStore.getCurrentUser();
    const context = findMeetingContext(meetingId, taskId) || findMeetingContext(meetingId);
    if (!context) {
      alert('Agenda pertemuan yang dipilih tidak ditemukan di data saat ini.');
      return;
    }

    form.reset();
    const editPhase = context.meeting.phase || context.task?.phase || '';
    document.getElementById('meetingPhaseInput').value = editPhase;
    populateMeetingTaskOptions(taskId || context.task?.id || (editPhase ? '__PHASE__' : '__GENERAL__'), editPhase);
    populateMeetingHostOptions(context.meeting.host || currentUser.name);

    document.getElementById('meetingIdInput').value = context.meeting.id;
    document.getElementById('meetingTitleInput').value = context.meeting.title || '';
    document.getElementById('meetingDateInput').value = context.meeting.date || '';
    document.getElementById('meetingEndDateInput').value = context.meeting.endDate || '';
    document.getElementById('meetingUrlInput').value = context.meeting.url || '';
    document.getElementById('meetingNotesInput').value = context.meeting.notes || '';

    const titleEl = document.getElementById('meetingModalTitle');
    if (titleEl) titleEl.textContent = 'Edit Agenda Pertemuan / Bimbingan';

    backdrop.classList.add('active');
  }

  window.capstoneEditMeeting = openEditMeetingModal;

  async function deleteMeeting(meetingId, taskId) {
    if (!requirePermission('meetings', 'delete')) return;
    const context = findMeetingContext(meetingId, taskId) || findMeetingContext(meetingId);
    if (!context) return;
    if (context.meeting.hasBeritaAcara) {
      Swal.fire({
        icon: 'info',
        title: 'Pertemuan Tidak Dapat Dihapus',
        text: 'Pertemuan yang sudah memiliki berita acara tidak boleh dihapus.',
        confirmButtonColor: '#1E40AF'
      });
      return;
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Hapus pertemuan?',
      text: 'Pertemuan akan disembunyikan dari daftar, tetapi record tetap disimpan sebagai soft delete.',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#B91C1C'
    });
    if (!result.isConfirmed) return;

    const deleted = window.capstoneStore.deleteMeeting(context.task?.id || null, context.meeting.id);
    if (!deleted.ok) {
      Swal.fire({ icon: 'error', title: 'Gagal menghapus', text: deleted.message, confirmButtonColor: '#1E40AF' });
      return;
    }
    renderCurrentView();
  }

  function findMeetingContext(meetingId, taskId = '') {
    const tasks = window.capstoneStore.getAll();
    const scopedTasks = taskId ? tasks.filter(t => t.id === taskId) : tasks;
    for (const task of scopedTasks) {
      const meeting = (task.meetings || []).find(m => m.id === meetingId);
      if (meeting) return { task, meeting };
    }
    const meeting = window.capstoneStore.getMeetings?.().find(m => m.id === meetingId);
    if (meeting) return { task: null, meeting };
    return null;
  }

  function populateMeetingTaskOptions(selectedTaskId = '', phaseKey = '') {
    const taskSelect = document.getElementById('meetingTaskSelect');
    if (!taskSelect) return;

    const tasks = phaseKey ? window.capstoneStore.getByPhase(phaseKey) : window.capstoneStore.getAll();
    const contextOption = phaseKey
      ? `<option value="__PHASE__">Pertemuan ${phaseKey.replace('tugas', 'Tugas ')} (tanpa task spesifik)</option>`
      : `<option value="__GENERAL__">Pertemuan Umum (tanpa tahap)</option>`;
    taskSelect.innerHTML = contextOption + tasks.map(t => `
      <option value="${t.id}" ${t.id === selectedTaskId ? 'selected' : ''}>${escapeHtml(t.title)}</option>
    `).join('');

    if (selectedTaskId === '__PHASE__' || selectedTaskId === '__GENERAL__' || !selectedTaskId) {
      taskSelect.value = selectedTaskId === '__PHASE__' && phaseKey ? '__PHASE__' : '__GENERAL__';
    }
  }

  function populateMeetingHostOptions(selectedHost = '') {
    const hostSelect = document.getElementById('meetingHostSelect');
    if (!hostSelect) return;

    const users = window.capstoneStore.getUsers();
    const visibleUsers = getUsersVisibleToViewer(users, window.capstoneStore.getCurrentUser());
    hostSelect.innerHTML = visibleUsers.map(u => `
      <option value="${u.name}" ${u.name === selectedHost ? 'selected' : ''}>${u.name}</option>
    `).join('');
  }

  function closeMeetingModal() {
    const backdrop = document.getElementById('meetingModalBackdrop');
    if (backdrop) backdrop.classList.remove('active');
    const titleEl = document.getElementById('meetingModalTitle');
    if (titleEl) titleEl.textContent = '🗓️ Buat Agenda Pertemuan / Bimbingan';
  }

  function openNewTaskModal(defaultPhase = 'tugas1') {
    if (!requirePermission('tasks', 'create')) return;
    const taskModalBackdrop = document.getElementById('taskModalBackdrop');
    const taskForm = document.getElementById('taskForm');
    const modalTitle = document.getElementById('modalTitle');
    const deleteTaskBtn = document.getElementById('deleteTaskBtn');

    if (!taskModalBackdrop || !taskForm) return;

    const currentUser = window.capstoneStore.getCurrentUser();

    taskForm.reset();
    document.getElementById('taskIdInput').value = '';
    document.getElementById('taskPhaseSelect').value = defaultPhase;
    document.getElementById('taskStatusSelect').value = 'Belum Dimulai';
    document.getElementById('taskPrioritySelect').value = 'Sedang';
    const timestampMeta = document.getElementById('taskTimestampMeta');
    if (timestampMeta) {
      timestampMeta.hidden = true;
      timestampMeta.innerHTML = '';
    }

    populatePicOptions(currentUser.role === 'member' ? currentUser.name : 'Febby');
    
    setTaskModalAccess({
      canUpdateProgress: true,
      canManageStructure: true,
      canDelete: false,
      canSubmit: true
    });
    modalChecklistState = [];
    renderModalChecklistBuilder();

    if (modalTitle) modalTitle.textContent = 'Tambah Tugas Baru';
    if (deleteTaskBtn) deleteTaskBtn.style.display = 'none';

    taskModalBackdrop.classList.add('active');
  }

  function openEditTaskModal(taskId) {
    const currentUser = window.capstoneStore.getCurrentUser();
    const taskModalBackdrop = document.getElementById('taskModalBackdrop');
    const modalTitle = document.getElementById('modalTitle');

    const task = window.capstoneStore.getById(taskId);
    if (!task || !taskModalBackdrop) return;
    if (!canReadTaskDetails(task, currentUser)) return;

    const isArchived = Boolean(task.archivedAt);
    const canUpdateProgress = canUpdateTaskProgress(task, currentUser) && !isArchived;
    const canManageStructure = canManageTaskStructure(task, currentUser) && !isArchived;
    const canArchive = canArchiveTask(task, currentUser);
    const archiveLabel = isArchived ? 'Pulihkan dari Arsip' : 'Arsipkan Tugas';

    document.getElementById('taskIdInput').value = task.id;
    document.getElementById('taskTitleInput').value = task.title;
    document.getElementById('taskDescInput').value = task.description || '';
    document.getElementById('taskPhaseSelect').value = task.phase;
    
    populatePicOptions(task.pic);

    document.getElementById('taskStatusSelect').value = task.status;
    document.getElementById('taskPrioritySelect').value = task.priority;
    const timestampMeta = document.getElementById('taskTimestampMeta');
    if (timestampMeta) {
      timestampMeta.hidden = false;
      timestampMeta.innerHTML = `
        <span><strong>Update terakhir</strong>: ${escapeHtml(formatTaskUpdatedAt(task))}</span>
        <span>Dibuat: ${escapeHtml(task.createdAt ? formatWibDateTime(task.createdAt) : '-')}</span>
        ${task.archivedAt ? `<span>Arsip: ${escapeHtml(formatWibDateTime(task.archivedAt))}</span>` : ''}
      `;
    }
    
    modalChecklistState = (task.checklist || []).map((item, idx) => ({
      text: item,
      done: (task.checklistDone || [])[idx] || false
    }));

    setTaskModalAccess({
      canUpdateProgress,
      canManageStructure,
      canDelete: canManageStructure && window.RBAC.can(currentUser, 'tasks', 'delete'),
      canSubmit: canUpdateProgress || canManageStructure,
      canArchive,
      archiveLabel,
      readonlyMessage: isArchived
        ? 'Tugas arsip sengaja dikunci. Klik Pulihkan dari Arsip agar superadmin bisa mengedit lagi.'
        : 'Status dan checklist hanya bisa diubah oleh PIC tugas ini.'
    });
    renderModalChecklistBuilder();

    if (modalTitle) {
      modalTitle.textContent = canManageStructure
        ? 'Edit Detail Tugas'
        : canUpdateProgress
          ? 'Update Progress Tugas'
          : isArchived
            ? 'Detail Tugas Arsip'
            : 'Detail Tugas';
    }

    taskModalBackdrop.classList.add('active');
    applyRbacUi();
    setTaskModalAccess({
      canUpdateProgress,
      canManageStructure,
      canDelete: canManageStructure && window.RBAC.can(currentUser, 'tasks', 'delete'),
      canSubmit: canUpdateProgress || canManageStructure,
      canArchive,
      archiveLabel,
      readonlyMessage: isArchived
        ? 'Tugas arsip sengaja dikunci. Klik Pulihkan dari Arsip agar superadmin bisa mengedit lagi.'
        : 'Status dan checklist hanya bisa diubah oleh PIC tugas ini.'
    });
  }

  function renderModalChecklistBuilder() {
    const container = document.getElementById('checklistInteractiveContainer');
    if (!container) return;

    if (modalChecklistState.length === 0) {
      container.innerHTML = `
        <div style="font-size: 0.775rem; color: var(--text-muted); font-style: italic; padding: 0.4rem 0;">
          ${modalTaskCanManageStructure ? 'Belum ada sub-tugas. Klik <strong>"+ Tambah Sub-tugas</strong>" di atas untuk menambahkan item.' : 'Belum ada sub-tugas pada tugas ini.'}
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="modal-checklist-builder">
        ${modalChecklistState.map((item, idx) => `
          <div class="modal-checklist-row ${(!modalTaskCanUpdateProgress && !modalTaskCanManageStructure) ? 'is-readonly' : ''}">
            <input type="checkbox" class="modal-checklist-check" ${item.done ? 'checked' : ''} ${modalTaskCanUpdateProgress ? '' : 'disabled'} data-index="${idx}" />
            <input type="text" class="modal-checklist-text ${item.done ? 'is-done' : ''}" value="${escapeHtml(item.text)}" placeholder="Ketik nama sub-tugas..." data-index="${idx}" ${modalTaskCanManageStructure ? '' : 'readonly'} />
            <button type="button" class="modal-checklist-remove-btn" data-index="${idx}" title="Hapus sub-tugas ini" style="${modalTaskCanManageStructure ? '' : 'display:none;'}">&times;</button>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.modal-checklist-text').forEach(input => {
      input.addEventListener('input', (e) => {
        if (!modalTaskCanManageStructure) return;
        const idx = parseInt(e.target.dataset.index, 10);
        if (modalChecklistState[idx]) {
          modalChecklistState[idx].text = e.target.value;
        }
      });
    });

    container.querySelectorAll('.modal-checklist-check').forEach(chk => {
      chk.addEventListener('change', (e) => {
        if (!modalTaskCanUpdateProgress) return;
        const idx = parseInt(e.target.dataset.index, 10);
        if (modalChecklistState[idx]) {
          modalChecklistState[idx].done = e.target.checked;
          const textInput = container.querySelector(`.modal-checklist-text[data-index="${idx}"]`);
          if (textInput) {
            if (e.target.checked) textInput.classList.add('is-done');
            else textInput.classList.remove('is-done');
          }
        }
      });
    });

    container.querySelectorAll('.modal-checklist-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!modalTaskCanManageStructure) return;
        const idx = parseInt(e.target.dataset.index, 10);
        modalChecklistState.splice(idx, 1);
        renderModalChecklistBuilder();
      });
    });
  }

  function saveTaskFromModal() {
    const editingTaskId = document.getElementById('taskIdInput')?.value;
    if (!requirePermission('tasks', editingTaskId ? 'update' : 'create')) return;
    const taskId = document.getElementById('taskIdInput').value;
    const existingTask = taskId ? window.capstoneStore.getById(taskId) : null;
    if (taskId && existingTask?.archivedAt) {
      Swal.fire({
        icon: 'info',
        title: 'Tugas sudah diarsipkan',
        text: 'Pulihkan tugas dari arsip terlebih dahulu jika perlu diedit lagi.',
        confirmButtonColor: '#1E40AF'
      });
      return;
    }
    if (taskId && !canUpdateTaskProgress(existingTask, window.capstoneStore.getCurrentUser())) {
      Swal.fire({
        icon: 'info',
        title: 'Status hanya bisa diubah PIC',
        text: 'Kamu tetap bisa melihat detail tugas ini, tetapi perubahan progress hanya dapat dilakukan oleh PIC tugas tersebut.',
        confirmButtonColor: '#1E40AF'
      });
      return;
    }

    const title = document.getElementById('taskTitleInput').value.trim();
    const description = document.getElementById('taskDescInput').value.trim();
    const phase = document.getElementById('taskPhaseSelect').value;
    const pic = document.getElementById('taskPicSelect').value;
    const status = document.getElementById('taskStatusSelect').value;
    const priority = document.getElementById('taskPrioritySelect').value;

    const validItems = modalChecklistState.filter(item => item.text.trim() !== '');
    const checklist = validItems.map(item => item.text.trim());
    const checklistDone = validItems.map(item => item.done);
    const currentUser = window.capstoneStore.getCurrentUser();

    if (taskId) {
      const updatePayload = currentUser?.role === 'member'
        ? { status, checklist, checklistDone }
        : {
        title,
        description,
        phase,
        pic,
        status,
        priority,
        checklist,
        checklistDone
      };
      window.capstoneStore.update(taskId, updatePayload);
    } else {
      window.capstoneStore.add({
        title: title || 'Tugas Baru Capstone',
        description,
        phase,
        pic,
        status,
        priority,
        checklist,
        checklistDone,
        meetings: []
      });
    }

    closeTaskModal();
    renderCurrentView();
  }

  function closeTaskModal() {
    const taskModalBackdrop = document.getElementById('taskModalBackdrop');
    if (taskModalBackdrop) taskModalBackdrop.classList.remove('active');
  }

  /* ==========================================
     Modal Controller (Manajemen Pengguna CRUD)
     ========================================== */
  function initUserModalListeners() {
    const userModalBackdrop = document.getElementById('userModalBackdrop');
    const userForm = document.getElementById('userForm');
    const deleteUserBtn = document.getElementById('deleteUserBtn');

    if (!userModalBackdrop) return;

    document.getElementById('userModalCloseBtn')?.addEventListener('click', closeUserModal);
    document.getElementById('userModalCancelBtn')?.addEventListener('click', closeUserModal);

    userModalBackdrop.addEventListener('click', (e) => {
      if (e.target === userModalBackdrop) closeUserModal();
    });

    if (userForm) {
      userForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveUserFromModal();
      });
    }

    if (deleteUserBtn) {
      deleteUserBtn.addEventListener('click', () => {
        if (!requirePermission('users', 'delete')) return;
        const userId = document.getElementById('userIdInput').value;
        if (userId && confirm(`Apakah Anda yakin ingin menghapus pengguna "${userId}" dari sistem?`)) {
          if (!canDeleteUserId(userId)) return;
          window.capstoneStore.deleteUser(userId);
          closeUserModal();
          renderCurrentView();
        }
      });
    }
  }

  function openNewUserModal() {
    if (!requirePermission('users', 'create')) return;
    const userModalBackdrop = document.getElementById('userModalBackdrop');
    const userForm = document.getElementById('userForm');
    const userModalTitle = document.getElementById('userModalTitle');
    const deleteUserBtn = document.getElementById('deleteUserBtn');

    if (!userModalBackdrop || !userForm) return;

    userForm.reset();
    document.getElementById('userIdInput').value = '';
    document.getElementById('userNameInput').disabled = false;
    document.getElementById('userUsernameInput').disabled = false;
    document.getElementById('userRoleFormSelect').value = 'member';
    document.getElementById('userColorSelect').value = '#1E40AF';
    document.getElementById('userFullNameInput').value = '';
    document.getElementById('userUsernameInput').value = '';
    document.getElementById('userNimInput').value = '';
    document.getElementById('userPasswordInput').value = '';
    document.getElementById('userPasswordInput').required = true;

    if (userModalTitle) userModalTitle.textContent = 'Tambah Pengguna Baru';
    if (deleteUserBtn) deleteUserBtn.style.display = 'none';

    userModalBackdrop.classList.add('active');
  }

  function openEditUserModal(userId) {
    if (!requirePermission('users', 'update')) return;
    const userModalBackdrop = document.getElementById('userModalBackdrop');
    const userModalTitle = document.getElementById('userModalTitle');
    const deleteUserBtn = document.getElementById('deleteUserBtn');

    const user = window.capstoneStore.getUserById(userId);
    if (!user || !userModalBackdrop) return;

    document.getElementById('userIdInput').value = user.id;
    document.getElementById('userNameInput').value = user.name;
    document.getElementById('userFullNameInput').value = user.fullName || user.name;
    document.getElementById('userUsernameInput').value = user.username || '';
    document.getElementById('userNimInput').value = user.nim || '';
    document.getElementById('userPasswordInput').value = '';
    document.getElementById('userPasswordInput').required = false;
    document.getElementById('userRoleFormSelect').value = user.role;
    document.getElementById('userColorSelect').value = user.color || '#1E40AF';

    if (userModalTitle) userModalTitle.textContent = 'Edit Pengguna';
    if (deleteUserBtn) deleteUserBtn.style.display = 'inline-flex';

    userModalBackdrop.classList.add('active');
    applyRbacUi();
    applyRbacUi();
  }

  function closeUserModal() {
    const userModalBackdrop = document.getElementById('userModalBackdrop');
    if (userModalBackdrop) userModalBackdrop.classList.remove('active');
  }

  function saveUserFromModal() {
    const userId = document.getElementById('userIdInput').value;
    if (!requirePermission('users', userId ? 'update' : 'create')) return;
    const name = document.getElementById('userNameInput').value.trim();
    const fullName = document.getElementById('userFullNameInput').value.trim();
    const username = document.getElementById('userUsernameInput').value.trim();
    const nim = document.getElementById('userNimInput').value.trim();
    const password = document.getElementById('userPasswordInput').value;
    const role = document.getElementById('userRoleFormSelect').value;
    const color = document.getElementById('userColorSelect').value;
    const currentUser = window.capstoneStore.getCurrentUser();
    const existingUser = userId ? window.capstoneStore.getUserById(userId) : null;

    if (!name || !fullName || !username) {
      Swal.fire({ icon: 'info', title: 'Data belum lengkap', text: 'Nama tampilan, nama lengkap, dan username wajib diisi.', confirmButtonColor: '#1E40AF' });
      return;
    }
    if (!userId && password.length < 8) {
      Swal.fire({ icon: 'info', title: 'Password wajib diisi', text: 'Password sementara pengguna baru minimal 8 karakter.', confirmButtonColor: '#1E40AF' });
      return;
    }
    if (userId && password && password.length < 8) {
      Swal.fire({ icon: 'info', title: 'Password terlalu pendek', text: 'Password baru minimal 8 karakter.', confirmButtonColor: '#1E40AF' });
      return;
    }
    if (existingUser?.role === 'superadmin' && role !== 'superadmin' && countLocalSuperadmins() <= 1) {
      Swal.fire({ icon: 'warning', title: 'Tidak bisa mengubah role', text: 'Minimal harus ada satu superadmin aktif.', confirmButtonColor: '#1E40AF' });
      return;
    }
    if (currentUser?.id === userId && role !== currentUser.role) {
      Swal.fire({ icon: 'warning', title: 'Tidak bisa mengubah role sendiri', text: 'Gunakan akun superadmin lain untuk mengubah role akun ini.', confirmButtonColor: '#1E40AF' });
      return;
    }

    const payload = { name, fullName, username, nim, role, color };
    if (password) payload.password = password;

    if (userId) {
      window.capstoneStore.updateUser(userId, payload);
    } else {
      window.capstoneStore.addUser(payload);
    }

    closeUserModal();
    renderCurrentView();
  }

  function countLocalSuperadmins() {
    return Object.values(window.capstoneStore.getUsers() || {}).filter(user => user.role === 'superadmin').length;
  }

  function canDeleteUserId(userId) {
    const currentUser = window.capstoneStore.getCurrentUser();
    const user = window.capstoneStore.getUserById(userId);
    if (currentUser?.id === userId) {
      Swal.fire({ icon: 'warning', title: 'Tidak bisa menghapus akun sendiri', text: 'Login dengan akun superadmin lain terlebih dahulu.', confirmButtonColor: '#1E40AF' });
      return false;
    }
    if (user?.role === 'superadmin' && countLocalSuperadmins() <= 1) {
      Swal.fire({ icon: 'warning', title: 'Tidak bisa menghapus superadmin terakhir', text: 'Minimal harus ada satu superadmin aktif.', confirmButtonColor: '#1E40AF' });
      return false;
    }
    return true;
  }

  /* ==========================================
     Tombol Global
     ========================================== */
  function initGlobalButtons() {
  }

  /* ==========================================
     Populasi Dropdown PIC (Penanggung Jawab)
     ========================================== */
  function populatePicOptions(selectedPic) {
    const picSelect = document.getElementById('taskPicSelect');
    if (!picSelect) return;

    const users = window.capstoneStore.getUsers();
    const visibleUsers = getUsersVisibleToViewer(users, window.capstoneStore.getCurrentUser());
    picSelect.innerHTML = visibleUsers.map(u => `
      <option value="${u.name}" ${u.name === selectedPic ? 'selected' : ''}>${u.name}</option>
    `).join('');
  }

  /* ==========================================
     Modal Snapshot JSON Prototipe
     ========================================== */
  function initSnapshotModalListeners() {
    const backdrop = document.getElementById('jsonSnapshotModalBackdrop');
    if (!backdrop) return;

    document.getElementById('jsonSnapshotCloseBtn')?.addEventListener('click', closeSnapshotModal);
    document.getElementById('jsonSnapshotCancelBtn')?.addEventListener('click', closeSnapshotModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeSnapshotModal();
    });

    document.getElementById('copyJsonBtn')?.addEventListener('click', () => {
      const textarea = document.getElementById('jsonSnapshotTextarea');
      if (textarea) {
        textarea.select();
        navigator.clipboard.writeText(textarea.value).then(() => {
          Swal.fire({
            icon: 'success',
            title: 'Tersalin!',
            text: 'Data JSON telah disalin ke clipboard.',
            timer: 1500,
            showConfirmButton: false
          });
        }).catch(() => {
          document.execCommand('copy');
          Swal.fire({
            icon: 'success',
            title: 'Tersalin!',
            text: 'Data JSON telah disalin.',
            timer: 1500,
            showConfirmButton: false
          });
        });
      }
    });

    document.getElementById('downloadJsonBtn')?.addEventListener('click', () => {
      const json = window.capstoneStore.getSnapshotJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `capstone_snapshot_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil Diunduh!',
        text: 'File JSON snapshot telah diunduh.',
        timer: 1500,
        showConfirmButton: false
      });
    });
  }

  function openJsonSnapshotModal() {
    if (!requirePermission('audit', 'read')) return;
    const backdrop = document.getElementById('jsonSnapshotModalBackdrop');
    const textarea = document.getElementById('jsonSnapshotTextarea');
    if (!backdrop) return;

    if (textarea) {
      textarea.value = window.capstoneStore.getSnapshotJSON();
    }
    backdrop.classList.add('active');
  }

  function closeSnapshotModal() {
    const backdrop = document.getElementById('jsonSnapshotModalBackdrop');
    if (backdrop) backdrop.classList.remove('active');
  }

  /* ==========================================
     Tambah Meeting di dalam Modal Tugas (Inline)
     ========================================== */
  function addMeetingToModal() {
    const taskId = document.getElementById('taskIdInput').value;
    if (!taskId) {
      Swal.fire({
        icon: 'info',
        title: 'Simpan Tugas Dulu',
        text: 'Silakan simpan tugas terlebih dahulu sebelum menambahkan agenda pertemuan.',
        confirmButtonColor: '#2563EB'
      });
      return;
    }

    const currentUser = window.capstoneStore.getCurrentUser();
    if (!window.RBAC.can(currentUser, 'meetings', 'create')) return;

    const task = window.capstoneStore.getById(taskId);
    if (!task) return;

    // Open the standalone meeting modal pre-filled with this task
    const backdrop = document.getElementById('meetingModalBackdrop');
    const form = document.getElementById('meetingForm');
    if (!backdrop || !form) return;

    form.reset();
    document.getElementById('meetingIdInput').value = '';
    document.getElementById('meetingEndDateInput').value = '';
    const titleEl = document.getElementById('meetingModalTitle');
    if (titleEl) titleEl.textContent = '🗓️ Buat Agenda Pertemuan / Bimbingan';

    const taskSelect = document.getElementById('meetingTaskSelect');
    const allTasks = window.capstoneStore.getAll();
    if (taskSelect) {
      taskSelect.innerHTML = `<option value="">-- Pilih Tugas Terkait --</option>` + allTasks.map(t => `
        <option value="${t.id}" ${t.id === taskId ? 'selected' : ''}>${escapeHtml(t.title)}</option>
      `).join('');
      taskSelect.value = taskId;
    }

    const hostSelect = document.getElementById('meetingHostSelect');
    const users = window.capstoneStore.getUsers();
    const visibleUsers = getUsersVisibleToViewer(users, currentUser);
    if (hostSelect) {
      hostSelect.innerHTML = visibleUsers.map(u => `
        <option value="${u.name}" ${u.name === currentUser.name ? 'selected' : ''}>${u.name}</option>
      `).join('');
    }

    backdrop.classList.add('active');
  }

  /* ==========================================
     Sistem Berita Acara Kerja Kelompok
     ========================================== */
  function initBeritaAcaraSystem() {
    const backdrop = document.getElementById('beritaAcaraModalBackdrop');
    if (!backdrop) return;

    document.getElementById('baModalCloseBtn')?.addEventListener('click', closeBeritaAcaraModal);
    document.getElementById('baModalCancelBtn')?.addEventListener('click', closeBeritaAcaraModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeBeritaAcaraModal();
    });

    document.getElementById('addBaActivityBtn')?.addEventListener('click', () => {
      baActivitiesState.push({ aktivitas: '', luaran: '', pic: 'Febby, Cintia, Rival', catatan: '' });
      renderBaActivitiesInModal();
    });

    document.getElementById('baDocImageInput')?.addEventListener('change', handleBaDocImageUpload);
    document.getElementById('baPreviewBtn')?.addEventListener('click', previewBeritaAcara);
    document.getElementById('baPrintBtn')?.addEventListener('click', printBeritaAcara);
    document.getElementById('baPreviewPrintBtn')?.addEventListener('click', printBeritaAcara);
    document.getElementById('baPreviewCloseBtn')?.addEventListener('click', closeBeritaAcaraPreview);
    document.getElementById('baPreviewBackBtn')?.addEventListener('click', closeBeritaAcaraPreview);

    const previewBackdrop = document.getElementById('beritaAcaraPreviewBackdrop');
    previewBackdrop?.addEventListener('click', (e) => {
      if (e.target === previewBackdrop) closeBeritaAcaraPreview();
    });
  }

  function closeBeritaAcaraModal() {
    const backdrop = document.getElementById('beritaAcaraModalBackdrop');
    if (backdrop) backdrop.classList.remove('active');
  }

  function openBeritaAcaraModal(meetingId, taskId) {
    if (!window.RBAC.can(window.capstoneStore.getCurrentUser(), 'beritaAcara', 'create')) return;
    const backdrop = document.getElementById('beritaAcaraModalBackdrop');
    if (!backdrop) return;

    document.getElementById('baMeetingIdInput').value = meetingId || '';
    document.getElementById('baTaskIdInput').value = taskId || '';

    const { meeting, task } = findMeetingForBeritaAcara(meetingId, taskId);

    // Default Judul Proyek
    document.getElementById('baJudulInput').value = "Pengembangan Sistem Informasi Manajemen Persediaan Obat pada Klinik Shifa Medika";
    
    // Hari dan Tanggal
    let formattedDate = "Jumat, 25 September 2026";
    if (meeting && meeting.date) {
      const d = parseWibDate(meeting.date);
      const wibParts = getWibDateParts(meeting.date);
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const weekday = d ? new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).format(d) : '';
      formattedDate = wibParts ? `${weekday}, ${Number(wibParts.day)} ${months[Number(wibParts.month) - 1]} ${wibParts.year}` : formattedDate;
    }
    document.getElementById('baHariTanggalInput').value = formattedDate;

    // Waktu
    document.getElementById('baWaktuInput').value = formatMeetingTimeRangeForBa(meeting?.date, meeting?.endDate);

    // Lokasi
    let lokasiStr = "Daring (Microsoft Teams)";
    if (meeting && meeting.url) {
      lokasiStr += ` ${meeting.url}`;
    } else {
      lokasiStr += " https://teams.microsoft.com/meet/490619894049348?p=1eLkHLYMShE1IkWCRs";
    }
    document.getElementById('baLokasiInput').value = lokasiStr;

    // Attendance checkboxes
    renderBaAttendanceCheckboxes();

    baActivitiesState = buildDefaultBeritaAcaraActivities(meeting, task);
    renderBaActivitiesInModal();
    renderBaImagePreviews();
    const printBtn = document.getElementById('baPrintBtn');
    if (printBtn) printBtn.style.display = 'none';
    const previewContainer = document.getElementById('beritaAcaraPreviewContainer');
    if (previewContainer) previewContainer.innerHTML = '';
    const printContainer = document.getElementById('beritaAcaraPrintContainer');
    if (printContainer) printContainer.innerHTML = '';

    backdrop.classList.add('active');
  }

  function renderBaAttendanceCheckboxes() {
    const container = document.getElementById('baAttendanceCheckboxes');
    if (!container) return;

    const allMembers = getBeritaAcaraMembers();

    container.innerHTML = allMembers.map(m => `
      <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; cursor: pointer; color: var(--text-main);">
        <input type="checkbox" class="ba-att-check" value="${m.name}" ${m.defaultHadir ? 'checked' : ''} style="accent-color: var(--ut-blue-primary);" />
        <span><strong>${escapeHtml(m.name)}</strong>${m.nim ? ` (${escapeHtml(m.nim)})` : ''}</span>
      </label>
    `).join('');
  }

  function getBeritaAcaraMembers() {
    const currentUser = window.capstoneStore.getCurrentUser();
    return Object.values(window.capstoneStore.getUsers() || {})
      .filter(user => user && user.name)
      .map(user => ({
        name: user.name,
        fullName: user.fullName || user.name,
        nim: user.nim || '',
        defaultHadir: currentUser ? user.id === currentUser.id || user.name === currentUser.name : true
      }));
  }

  function buildDefaultBeritaAcaraActivities(meeting, task) {
    const members = getBeritaAcaraMembers();
    const picList = members.map(member => member.name).join(', ') || 'Tim Capstone';
    const meetingTitle = meeting?.title || 'Pertemuan Capstone Project';
    const meetingNotes = (meeting?.notes || '').trim();
    const taskTitle = task?.title || '';

    return [
      {
        aktivitas: `1. ${meetingTitle}`,
        luaran: taskTitle
          ? `Tim membahas perkembangan dan tindak lanjut tugas "${taskTitle}".`
          : 'Tim membahas perkembangan dan tindak lanjut kegiatan Capstone Project.',
        pic: task?.pic || picList,
        catatan: meetingNotes || 'Catatan pembahasan dapat dilengkapi sesuai hasil pertemuan.'
      }
    ];
  }

  function renderBaActivitiesInModal() {
    const container = document.getElementById('baActivitiesContainer');
    if (!container) return;

    if (baActivitiesState.length === 0) {
      container.innerHTML = `<div style="font-size: 0.775rem; color: var(--text-muted); font-style: italic; padding: 0.4rem 0;">Belum ada baris aktivitas. Klik "+ Tambah Baris Aktivitas" untuk menambahkan.</div>`;
      return;
    }

    container.innerHTML = baActivitiesState.map((a, idx) => `
      <div class="ba-activity-row">
        <div class="ba-activity-head">
          <span>Aktivitas ${idx + 1}</span>
          <button type="button" class="ba-remove-act-btn" data-index="${idx}" title="Hapus aktivitas">&times;</button>
        </div>
        <label class="ba-activity-field ba-activity-field-wide">
          <span>Aktivitas</span>
          <textarea class="form-textarea ba-act-input" data-index="${idx}" data-field="aktivitas" rows="3" placeholder="Topik atau kegiatan yang dibahas">${escapeHtml(a.aktivitas)}</textarea>
        </label>
        <label class="ba-activity-field ba-activity-field-wide">
          <span>Hasil / Luaran</span>
          <textarea class="form-textarea ba-act-input" data-index="${idx}" data-field="luaran" rows="3" placeholder="Hasil pembahasan atau keputusan">${escapeHtml(a.luaran)}</textarea>
        </label>
        <label class="ba-activity-field">
          <span>Penanggung Jawab</span>
          <input type="text" class="form-input ba-act-input" data-index="${idx}" data-field="pic" value="${escapeHtml(a.pic)}" placeholder="Febby, Cintia..." />
        </label>
        <label class="ba-activity-field ba-activity-field-notes">
          <span>Catatan / Kendala</span>
          <textarea class="form-textarea ba-act-input" data-index="${idx}" data-field="catatan" rows="3" placeholder="Catatan tambahan atau kendala">${escapeHtml(a.catatan)}</textarea>
        </label>
      </div>
    `).join('');

    container.querySelectorAll('.ba-act-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        const field = e.target.dataset.field;
        if (baActivitiesState[idx]) {
          baActivitiesState[idx][field] = e.target.value;
        }
      });
    });

    container.querySelectorAll('.ba-remove-act-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        baActivitiesState.splice(idx, 1);
        renderBaActivitiesInModal();
      });
    });
  }

  function handleBaDocImageUpload(e) {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        baUploadedImages.push(evt.target.result);
        renderBaImagePreviews();
      };
      reader.readAsDataURL(file);
    });
  }

  function renderBaImagePreviews() {
    const container = document.getElementById('baDocImagePreviews');
    if (!container) return;

    if (baUploadedImages.length === 0) {
      container.innerHTML = `<span style="font-size: 0.775rem; color: var(--text-muted); font-style: italic;">Belum ada foto/screenshot yang diunggah.</span>`;
      return;
    }

    container.innerHTML = baUploadedImages.map((src, idx) => `
      <div style="position: relative; width: 130px; height: 85px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-medium);">
        <img src="${src}" style="width: 100%; height: 100%; object-fit: cover;" />
        <button type="button" class="ba-remove-img-btn" data-index="${idx}" style="position: absolute; top: 3px; right: 3px; background: rgba(239, 68, 68, 0.9); color: #FFF; border: none; border-radius: 50%; width: 22px; height: 22px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="Hapus foto">&times;</button>
      </div>
    `).join('');

    container.querySelectorAll('.ba-remove-img-btn').forEach(btn => {
      btn.onclick = (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        baUploadedImages.splice(idx, 1);
        renderBaImagePreviews();
      };
    });
  }

  function collectBeritaAcaraData() {
    const judul = document.getElementById('baJudulInput').value.trim();
    const hariTanggal = document.getElementById('baHariTanggalInput').value.trim();
    const waktu = document.getElementById('baWaktuInput').value.trim();
    const lokasi = document.getElementById('baLokasiInput').value.trim();

    const checkedNames = [];
    document.querySelectorAll('.ba-att-check:checked').forEach(chk => {
      checkedNames.push(chk.value);
    });

    const allMembers = getBeritaAcaraMembers();

    const attendingMembers = allMembers.filter(m => checkedNames.includes(m.name));
    const absentMembers = allMembers.filter(m => !checkedNames.includes(m.name));
    const validActivities = baActivitiesState.filter(a => a.aktivitas.trim() !== '');

    return { judul, hariTanggal, waktu, lokasi, allMembers, attendingMembers, absentMembers, validActivities };
  }

  function buildBeritaAcaraHtml() {
    const { judul, hariTanggal, waktu, lokasi, allMembers, attendingMembers, absentMembers, validActivities } = collectBeritaAcaraData();
    const memberLine = (member, index) => `${index + 1}. ${escapeHtml([member.nim, member.fullName].filter(Boolean).join(' '))}`;

    return `
      <div class="ba-document-wrapper">
        <div style="border: 2px solid #000; font-family: 'Times New Roman', Times, serif; color: #000;">
          
          <!-- Header Title -->
          <div style="text-align: center; font-weight: bold; font-size: 13pt; padding: 12px; border-bottom: 1px solid #000; background: #FFF;">
            Berita Acara Kerja Kelompok Capstone Project
          </div>

          <!-- Info Table -->
          <table class="ba-document-table">
            <tr>
              <td style="width: 140px; font-weight: bold;">Judul</td>
              <td style="width: 15px; text-align: center;">:</td>
              <td><strong>${escapeHtml(judul)}</strong></td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Hari dan Tanggal</td>
              <td style="text-align: center;">:</td>
              <td>${escapeHtml(hariTanggal)}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Waktu</td>
              <td style="text-align: center;">:</td>
              <td>${escapeHtml(waktu)}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Lokasi Luring/Daring</td>
              <td style="text-align: center;">:</td>
              <td>${escapeHtml(lokasi)}</td>
            </tr>
          </table>

          <!-- Attendance Table -->
          <table class="ba-document-table">
            <thead>
              <tr>
                <th style="width: 33%;">Nama Anggota</th>
                <th style="width: 33%;">Anggota yang Hadir</th>
                <th style="width: 34%;">Anggota yang Tidak Hadir</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  ${allMembers.map(memberLine).join('<br/>')}
                </td>
                <td>
                  ${attendingMembers.map(memberLine).join('<br/>')}
                </td>
                <td>
                  ${absentMembers.length === 0 ? '<em>Semua Anggota Hadir</em>' : absentMembers.map(memberLine).join('<br/>')}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Activities Table -->
          <table class="ba-document-table">
            <thead>
              <tr>
                <th style="width: 25%;">Aktivitas</th>
                <th style="width: 28%;">Luaran</th>
                <th style="width: 17%;">Nama Penanggung Jawab</th>
                <th style="width: 30%;">Catatan/Kendala yang Dihadapi</th>
              </tr>
            </thead>
            <tbody>
              ${validActivities.map(a => `
                <tr>
                  <td>${escapeHtml(a.aktivitas)}</td>
                  <td>${escapeHtml(a.luaran)}</td>
                  <td style="text-align: center;">${escapeHtml(a.pic)}</td>
                  <td>${escapeHtml(a.catatan)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Signatures Section -->
          <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; text-align: center; font-weight: bold; padding: 6px; background: #F8FAFC; font-size: 10.5pt;">
            Tanda Tangan Anggota yang Hadir
          </div>
          <div class="ba-signature-grid">
            ${attendingMembers.map(m => `
              <div class="ba-signature-col">
                <div class="ba-signature-space"></div>
                <div>
                  <div class="ba-signature-name">${m.fullName}</div>
                  <div class="ba-signature-nim">NIM.${m.nim}</div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Documentation Section -->
          <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; text-align: center; font-weight: bold; padding: 6px; background: #F8FAFC; font-size: 10.5pt;">
            Dokumentasi
          </div>
          <div class="ba-doc-grid">
            ${baUploadedImages.length === 0 ? `
              <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #64748B; font-style: italic;">
                (Lampiran Dokumentasi Foto / Screenshot Pertemuan)
              </div>
            ` : baUploadedImages.map(imgSrc => `
              <img src="${imgSrc}" class="ba-doc-img" />
            `).join('')}
          </div>

        </div>
      </div>
    `;
  }

  function previewBeritaAcara() {
    const previewBackdrop = document.getElementById('beritaAcaraPreviewBackdrop');
    const previewContainer = document.getElementById('beritaAcaraPreviewContainer');
    const printContainer = document.getElementById('beritaAcaraPrintContainer');
    if (!previewBackdrop || !previewContainer || !printContainer) return;

    const meetingId = document.getElementById('baMeetingIdInput')?.value;
    const taskId = document.getElementById('baTaskIdInput')?.value;
    if (meetingId) {
      window.capstoneStore.markMeetingBeritaAcara(taskId, meetingId);
      document.querySelectorAll(`.delete-meeting-btn[data-meeting-id="${meetingId}"]`).forEach(btn => {
        btn.disabled = true;
        btn.title = 'Pertemuan yang sudah memiliki berita acara tidak boleh dihapus.';
        btn.style.color = 'var(--text-muted)';
        btn.textContent = 'Hapus Pertemuan (Ada Berita Acara)';
      });
    }

    const documentHtml = buildBeritaAcaraHtml();
    previewContainer.innerHTML = documentHtml;
    printContainer.innerHTML = documentHtml;

    const printBtn = document.getElementById('baPrintBtn');
    if (printBtn) printBtn.style.display = 'inline-flex';

    previewBackdrop.classList.add('active');
  }

  function closeBeritaAcaraPreview() {
    const previewBackdrop = document.getElementById('beritaAcaraPreviewBackdrop');
    if (previewBackdrop) previewBackdrop.classList.remove('active');
  }

  function printBeritaAcara() {
    const printContainer = document.getElementById('beritaAcaraPrintContainer');
    if (!printContainer) return;

    if (!printContainer.innerHTML.trim()) {
      printContainer.innerHTML = buildBeritaAcaraHtml();
    }

    document.body.classList.add('printing-ba');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-ba');
    }, 1000);
  }

  /* Sanitasi HTML */
  function escapeHtml(str = '') {
    return String(str ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  }
});
