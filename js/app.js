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
  const BERITA_ACARA_DRAFTS_KEY = 'capstone_berita_acara_drafts_v1';
  const MEMBER_TOUR_ENABLED = false;
  const MEMBER_TOUR_STORAGE_PREFIX = 'capstone_member_tour_done_v1:';
  const VALID_PAGE_IDS = ['dashboard', 'tugas1', 'tugas2', 'tugas3', 'flow', 'documents', 'users', 'audit', 'reports', 'rbac'];
  const WIB_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  const DOCUMENT_ARCHIVE_CATEGORIES = {
    berita_acara: 'Berita Acara',
    surat_izin: 'Surat Izin',
    surat_pernyataan: 'Surat Pernyataan',
    proposal_laporan: 'Proposal / Laporan',
    dokumen: 'Dokumen',
    diagram_alur: 'Diagram / Alur / Gambar',
    poster: 'Poster',
    lampiran: 'Lampiran',
    lainnya: 'Lainnya'
  };

  // State Global
  let currentPage = getSavedPage();
  let activeSearchQuery = '';
  let activePicFilter = 'SEMUA';

  let activePriorityFilter = 'SEMUA';
  let activeReviewFilter = 'SEMUA';
  let activeWorkFilter = 'all';
  const expandedActionQueues = new Set();
  let phaseViewMode = localStorage.getItem('capstone_task_view_v1') || (window.matchMedia('(max-width: 640px)').matches ? 'list' : 'kanban');
  let showArchivedTasks = false;

  let auditSearchQuery = '';
  let auditUserFilter = 'SEMUA';
  let auditActionFilter = 'SEMUA';
  let auditDateRange = 'SEMUA';
  let auditStartDate = '';
  let auditEndDate = '';
  let auditCurrentPage = 1;
  let auditPageSize = 10;
  let activityUserFilter = 'SEMUA';
  let activityTypeFilter = 'SEMUA';

  let modalChecklistState = [];
  let modalTaskCanUpdateProgress = false;
  let modalTaskCanManageStructure = false;
  let modalTaskCanSubmitReview = false;
  let modalTaskCanCancelReview = false;
  let modalTaskCanReview = false;
  let baActivitiesState = [];
  let baSheetSelection = null;
  let baUploadedImages = [];
  let baDraftContext = null;
  let flowDocuments = [];
  let flowDocumentsLoaded = false;
  let flowDocumentsLoading = false;
  let flowDocumentsError = '';
  let documentArchives = [];
  let documentArchivesLoaded = false;
  let documentArchivesLoading = false;
  let documentArchivesError = '';
  let documentArchiveCategoryFilter = 'SEMUA';
  let documentArchiveSearch = '';
  let documentArchiveSort = 'newest';
  let auditLoading = false;
  let auditLoadError = '';
  const formBaselines = new Map();
  const modalReturnFocus = new Map();
  const progressNoteDrafts = new Map();
  const phaseAccessState = new Map();
  let lastTrackedPage = null;
  let lastTrackedUserId = null;
  let presenceBusy = false;
  let lastPresenceAt = 0;
  let memberTourState = { active: false, index: 0, steps: [], scheduled: false };

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
  initFormProtection();
  initDataRefresh();
  initPresence();
  window.addEventListener('capstone:legacy-recovered', renderLegacyRecoveryNotice);
  if (MEMBER_TOUR_ENABLED) initMemberTour();
  window.addEventListener('capstone:data-synced', () => {
    syncSidebarNavigation();
    updateSyncStatus();
    if (window.capstoneStore.getCurrentUser() && !hasPendingEdits()) renderCurrentView();
  });
  window.addEventListener('capstone:rbac-synced', () => {
    const user = window.capstoneStore.getCurrentUser();
    syncSidebarNavigation();
    if (!user) return;
    if (!window.RBAC.canPage(user, currentPage)) {
      setPage(getFallbackPage(user), { restoreScroll: false });
    } else {
      if (!hasPendingEdits()) renderCurrentView();
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
    updateSyncStatus();
    refreshPresence();
    window.capstoneStore.legacyStorageReady?.then(renderLegacyRecoveryNotice);
  });

  function formFingerprint(form) {
    if (!form) return '';
    const fields = Array.from(form.querySelectorAll('input, select, textarea')).map(input => {
      if (input.type === 'file') return [input.id, Array.from(input.files || []).map(file => [file.name, file.size, file.lastModified])];
      return [input.id || input.name, input.type === 'checkbox' ? input.checked : input.value];
    });
    if (form.id === 'taskForm') fields.push(modalChecklistState);
    if (form.id === 'beritaAcaraForm') fields.push(baActivitiesState, baUploadedImages);
    return JSON.stringify(fields);
  }

  function markFormClean(form) {
    if (!form) return;
    formBaselines.set(form.id, formFingerprint(form));
    form.querySelector('.form-save-error')?.remove();
  }

  function isFormDirty(form) {
    return Boolean(form && formBaselines.has(form.id) && formBaselines.get(form.id) !== formFingerprint(form));
  }

  function hasPendingEdits() {
    return Array.from(document.querySelectorAll('.modal-backdrop.active form')).some(isFormDirty)
      || Array.from(document.querySelectorAll('#flowDocumentForm, #documentArchiveForm')).some(isFormDirty)
      || Array.from(progressNoteDrafts).some(([phase, content]) => content !== window.capstoneStore.getProgressNote(phase).content)
      || Boolean(document.getElementById(`progressNoteInput-${currentPage}`)
        && document.getElementById(`progressNoteInput-${currentPage}`).value !== window.capstoneStore.getProgressNote(currentPage).content);
  }

  function discardPageEdits() {
    const note = document.getElementById(`progressNoteInput-${currentPage}`);
    if (note) note.value = window.capstoneStore.getProgressNote(currentPage).content;
    progressNoteDrafts.clear();
    document.querySelectorAll('#flowDocumentForm, #documentArchiveForm').forEach(form => {
      if (isFormDirty(form)) form.reset();
      markFormClean(form);
    });
  }

  async function confirmDiscardChanges() {
    if (document.querySelector('[data-saving="true"]')) return false;
    if (!hasPendingEdits()) return true;
    const result = await Swal.fire({
      icon: 'warning', title: 'Perubahan belum disimpan',
      text: 'Tinggalkan perubahan dan lanjutkan?', showCancelButton: true,
      confirmButtonText: 'Tinggalkan Perubahan', cancelButtonText: 'Lanjutkan Mengisi'
    });
    return result.isConfirmed;
  }

  function showFormModal(backdrop) {
    if (!backdrop) return;
    const dialog = backdrop.querySelector('.modal-dialog');
    dialog?.setAttribute('role', 'dialog');
    dialog?.setAttribute('aria-modal', 'true');
    const heading = dialog?.querySelector('h3');
    if (heading) {
      if (!heading.id) heading.id = `${backdrop.id}-title`;
      dialog.setAttribute('aria-labelledby', heading.id);
    }
    dialog?.querySelectorAll('.form-group').forEach(group => {
      const label = group.querySelector('label');
      const input = group.querySelector('input[id], select[id], textarea[id]');
      if (label && input && !label.htmlFor) label.htmlFor = input.id;
    });
    modalReturnFocus.set(backdrop.id, document.activeElement);
    backdrop.querySelector('.form-save-error')?.remove();
    markFormClean(backdrop.querySelector('form'));
    backdrop.classList.add('active');
    const firstField = backdrop.querySelector('form input:not([type="hidden"]):not(:disabled), form textarea:not(:disabled)');
    (firstField || backdrop.querySelector('button'))?.focus({ preventScroll: true });
  }

  async function attemptCloseModal(backdrop, close) {
    if (backdrop?.dataset.saving === 'true' || backdrop?.querySelector('[data-saving="true"]')) return;
    if (isFormDirty(backdrop?.querySelector('form')) && !await confirmDiscardChanges()) return;
    markFormClean(backdrop?.querySelector('form'));
    close();
    modalReturnFocus.get(backdrop?.id)?.focus?.({ preventScroll: true });
  }

  function bindBackdropDismiss(backdrop, close) {
    let startedOutside = false;
    backdrop?.addEventListener('pointerdown', event => { startedOutside = event.target === backdrop; });
    backdrop?.addEventListener('pointercancel', () => { startedOutside = false; });
    backdrop?.addEventListener('click', event => {
      if (event.target === backdrop && startedOutside) attemptCloseModal(backdrop, close);
      startedOutside = false;
    });
  }

  async function runUiAction(scope, action) {
    if (!scope || scope.dataset.saving === 'true') return false;
    const buttons = scope.matches('button') ? [scope] : Array.from(scope.querySelectorAll('button'));
    const states = buttons.map(button => button.disabled);
    scope.dataset.saving = 'true';
    scope.setAttribute('aria-busy', 'true');
    buttons.forEach(button => { button.disabled = true; });
    const host = scope.closest('.modal-dialog')?.querySelector('.modal-body') || scope.querySelector('.modal-dialog .modal-body') || scope.closest('form, .card-box, .progress-note-panel') || document.getElementById('workspaceFeedback');
    host?.querySelector('.form-save-error')?.remove();
    try {
      await action();
      return true;
    } catch (error) {
      host?.querySelector('.form-save-error')?.remove();
      const notice = document.createElement('div');
      notice.className = 'form-save-error';
      notice.setAttribute('role', 'alert');
      notice.textContent = error.message || 'Perubahan belum tersimpan. Silakan coba lagi.';
      host?.prepend(notice);
      notice.scrollIntoView({ block: 'nearest' });
      return false;
    } finally {
      delete scope.dataset.saving;
      scope.removeAttribute('aria-busy');
      buttons.forEach((button, index) => { button.disabled = states[index]; });
    }
  }

  function initFormProtection() {
    window.addEventListener('beforeunload', event => {
      if (!hasPendingEdits() && !document.querySelector('[data-saving="true"]')) return;
      event.preventDefault();
      event.returnValue = '';
    });
    document.addEventListener('input', event => { event.target.setCustomValidity?.(''); });
    document.addEventListener('keydown', event => {
      if (document.querySelector('.swal2-container')) return;
      const modal = Array.from(document.querySelectorAll('.modal-backdrop.active')).at(-1);
      if (!modal) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        modal.querySelector('.modal-close-btn')?.click();
      } else if (event.key === 'Tab') {
        const focusable = Array.from(modal.querySelectorAll('button, input:not([type="hidden"]), select, textarea, a[href], [contenteditable="true"]'))
          .filter(element => !element.disabled && element.getClientRects().length);
        if (!focusable.length) return;
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
          event.preventDefault(); first.focus();
        }
      }
    });
  }

  function updateSyncStatus() {
    const label = document.getElementById('dataSyncStatus');
    const store = window.capstoneStore;
    if (label) {
      label.textContent = store.syncError ? 'Belum terhubung' : store.lastSyncedAt ? `Diperbarui ${formatWibClock(store.lastSyncedAt)}` : 'Belum diperbarui';
      label.title = store.syncError || (store.lastSyncedAt ? formatWibDateTime(store.lastSyncedAt) : '');
      label.classList.toggle('is-error', Boolean(store.syncError));
    }
    const feedback = document.getElementById('workspaceFeedback');
    if (store.syncError && feedback) feedback.innerHTML = `<div class="form-save-error" role="alert">${escapeHtml(store.syncError)}</div>`;
    else feedback?.querySelector('.form-save-error')?.remove();
  }

  function initDataRefresh() {
    document.getElementById('refreshDataBtn')?.addEventListener('click', async event => {
      const button = event.currentTarget;
      if (!await confirmDiscardChanges()) return;
      runUiAction(button, async () => {
        discardPageEdits();
        document.querySelectorAll('.modal-backdrop.active').forEach(modal => modal.classList.remove('active'));
        const result = await window.capstoneStore.syncFromBackend();
        updateSyncStatus();
        if (!result?.ok) throw new Error(result?.message || 'Data belum dapat diperbarui.');
        flowDocumentsLoaded = false;
        documentArchivesLoaded = false;
        flowDocumentsError = '';
        documentArchivesError = '';
        window.capstoneStore.auditLoaded = false;
        auditLoadError = '';
        phaseAccessState.clear();
        renderCurrentView();
      });
    });
  }

  /* ==========================================
     Pengendali Mode Akun (Role Switcher)
     ========================================== */
  function renderLegacyRecoveryNotice() {
    const user = window.capstoneStore.getCurrentUser();
    document.getElementById('legacyRecoveryNotice')?.remove();
    const recovery = window.capstoneStore.legacyRecovery;
    if (!user || !['superadmin', 'koordinator'].includes(user.role) || recovery?.userId !== user.id || recovery.loading) return;
    const host = document.getElementById('workspaceFeedback');
    if (!host) return;
    const notice = document.createElement('div');
    notice.id = 'legacyRecoveryNotice';
    notice.className = 'legacy-recovery-notice';
    const issueCount = (recovery.conflicts?.length || 0) + (recovery.unresolved?.length || 0);
    notice.textContent = recovery.error || `Data browser lama sudah dicadangkan ke server. ${recovery.saved || 0} draft BA dipulihkan.${issueCount ? ` ${issueCount} versi perlu diperiksa; versi lama tetap disimpan.` : ''}`;
    if (recovery.error) {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'btn btn-secondary';
      retry.textContent = 'Coba Lagi';
      retry.addEventListener('click', () => runUiAction(retry, async () => {
        window.capstoneStore.legacyStorageReady = window.capstoneStore.recoverLegacyStorage(true);
        await window.capstoneStore.legacyStorageReady;
        renderLegacyRecoveryNotice();
      }));
      notice.append(retry);
    }
    host.append(notice);
  }

  function initPresence() {
    window.setInterval(refreshPresence, 30000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refreshPresence(true);
    });
  }

  async function refreshPresence(force = false) {
    const user = window.capstoneStore.getCurrentUser();
    if (!user || document.hidden || !document.body.classList.contains('is-authenticated') || presenceBusy
        || (!force && Date.now() - lastPresenceAt < 25000)) return;
    presenceBusy = true;
    lastPresenceAt = Date.now();
    try {
      await window.capstoneStore.sendToBackend('presence', 'POST');
      if (window.capstoneStore.getCurrentUser()?.id === user.id && currentPage?.startsWith('tugas')) await loadPhaseAccess(currentPage, true);
    } catch {
      // Presence is best effort and must not interrupt task editing.
    } finally {
      presenceBusy = false;
    }
  }

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
              <strong>${escapeHtml(n.user)}</strong> ${escapeHtml(n.text)}
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

  function initMemberTour() {
    const existing = document.getElementById('memberTourLayer');
    if (existing) existing.remove();
    window.addEventListener('resize', () => {
      if (memberTourState.active) positionMemberTourPopover();
    });
    document.getElementById('memberTourReplayBtn')?.addEventListener('click', () => {
      const user = window.capstoneStore.getCurrentUser();
      if (!user) return;
      localStorage.removeItem(getMemberTourKey(user));
      closeMemberTour(false);
      startMemberTour(user, { force: true });
    });
  }

  function getMemberTourKey(user) {
    return `${MEMBER_TOUR_STORAGE_PREFIX}${user?.id || user?.username || user?.name || 'member'}`;
  }

  function shouldShowMemberTour(user) {
    return Boolean(user?.role === 'member' && localStorage.getItem(getMemberTourKey(user)) !== 'true');
  }

  function scheduleMemberTour(user) {
    if (!MEMBER_TOUR_ENABLED) return;
    if (!shouldShowMemberTour(user) || memberTourState.active || memberTourState.scheduled) return;
    memberTourState.scheduled = true;
    window.setTimeout(() => {
      memberTourState.scheduled = false;
      const latestUser = window.capstoneStore.getCurrentUser();
      if (shouldShowMemberTour(latestUser)) startMemberTour(latestUser);
    }, 650);
  }

  function getMemberTourSteps(user = window.capstoneStore.getCurrentUser()) {
    if (!user) return [];
    const steps = [];
    const allowedTaskPages = ['tugas1', 'tugas2', 'tugas3'].filter(page => window.RBAC.canPage(user, page));

    if (window.RBAC.canPage(user, 'dashboard') && window.RBAC.canWidget(user, 'personal')) {
      steps.push({
        page: 'dashboard',
        selector: '#personalTaskSection',
        requiredSelector: '#personalTaskSection',
        title: 'Mulai dari Tugasku',
        text: 'Bagian ini menampilkan tugas yang menjadi tanggung jawab kamu. Klik kartu tugas untuk melihat detail, checklist, catatan, dan status review.'
      });
    }

    allowedTaskPages.forEach((taskPage, index) => {
      const navSelector = `.nav-item[data-target="${taskPage}"]`;
      const phaseShort = PHASE_META[taskPage]?.short || 'Tahap Tugas';
      steps.push({
        page: index === 0 && window.RBAC.canPage(user, 'dashboard') ? 'dashboard' : taskPage,
        selector: navSelector,
        requiredSelector: navSelector,
        title: `Buka ${phaseShort}`,
        text: `${phaseShort} berisi pekerjaan pada tahap Capstone tersebut. Gunakan menu ini untuk berpindah antar tahap yang kamu punya aksesnya.`,
        prepare: () => openSidebarForTour()
      });
      steps.push({
        page: taskPage,
        selector: '.toolbar',
        requiredSelector: `#${taskPage} .toolbar`,
        title: `Cari Tugas di ${phaseShort}`,
        text: 'Gunakan pencarian, filter PIC, prioritas, dan arsip untuk menemukan tugas tanpa harus scroll terlalu jauh.'
      });
      if (index === 0) {
        steps.push({
          page: taskPage,
          selector: '.kanban-board-wrapper',
          requiredSelector: `#${taskPage} .kanban-board-wrapper`,
          title: 'Update dari Board',
          text: 'Kartu tugas di board bisa dibuka untuk melihat pekerjaan orang lain. Kalau kamu PIC-nya, kamu bisa update status, checklist, dan ajukan review dari detail tugas.'
        });
      }
    });

    if (window.RBAC.canPage(user, 'documents') && window.RBAC.can(user, 'documents', 'read')) {
      steps.push({
        page: 'documents',
        selector: '#documentArchiveSection',
        requiredSelector: '#documentArchiveSection',
        title: 'Arsip Dokumen',
        text: 'Dokumen final seperti berita acara, surat izin, diagram, dan lampiran bisa dilihat atau diunduh dari sini.'
      });
    }

    if (window.RBAC.canPage(user, 'dashboard')) {
      steps.push({
        page: 'dashboard',
        selector: '.notification-wrapper',
        requiredSelector: '.notification-wrapper',
        title: 'Cek Pemberitahuan',
        text: 'Pemberitahuan membantu kamu tahu assignment baru, perubahan status, dan aktivitas penting lain dari tim.'
      });
    }

    return steps;
  }

  function openSidebarForTour() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (window.matchMedia('(max-width: 1024px)').matches) {
      sidebar?.classList.add('open');
      overlay?.classList.add('visible');
    }
  }

  function closeSidebarAfterTourStep(target) {
    if (!window.matchMedia('(max-width: 1024px)').matches) return;
    if (target?.closest('.sidebar')) return;
    document.querySelector('.sidebar')?.classList.remove('open');
    document.querySelector('.sidebar-overlay')?.classList.remove('visible');
  }

  function startMemberTour(user, options = {}) {
    const force = Boolean(options.force);
    if (!force && !shouldShowMemberTour(user)) return;
    const steps = getMemberTourSteps(user);
    if (!steps.length) {
      if (force) {
        Swal.fire({
          icon: 'info',
          title: 'Panduan belum tersedia',
          text: 'Tidak ada bagian panduan yang bisa ditampilkan untuk akses akun ini.',
          confirmButtonColor: '#1E40AF'
        });
      } else {
        localStorage.setItem(getMemberTourKey(user), 'true');
      }
      return;
    }
    memberTourState = { active: true, index: 0, steps, scheduled: false };
    renderMemberTourStep();
  }

  function finishMemberTour(markDone = true) {
    const user = window.capstoneStore.getCurrentUser();
    if (markDone && user) localStorage.setItem(getMemberTourKey(user), 'true');
    closeMemberTour(false);
  }

  function closeMemberTour(markDone = false) {
    clearMemberTourFocus();
    document.getElementById('memberTourLayer')?.remove();
    document.body.classList.remove('member-tour-active');
    document.querySelector('.sidebar-overlay')?.classList.remove('visible');
    document.querySelector('.sidebar')?.classList.remove('open');
    memberTourState = { active: false, index: 0, steps: [], scheduled: false };
    if (markDone) {
      const user = window.capstoneStore.getCurrentUser();
      if (user) localStorage.setItem(getMemberTourKey(user), 'true');
    }
  }

  function clearMemberTourFocus() {
    document.querySelectorAll('.member-tour-focus').forEach(el => el.classList.remove('member-tour-focus'));
    document.querySelectorAll('.member-tour-surface').forEach(el => el.classList.remove('member-tour-surface'));
  }

  function renderMemberTourStep() {
    if (!memberTourState.active) return;
    const step = memberTourState.steps[memberTourState.index];
    if (!step) {
      finishMemberTour(true);
      return;
    }

    const user = window.capstoneStore.getCurrentUser();
    if (step.page && !window.RBAC.canPage(user, step.page)) {
      skipCurrentMemberTourStep();
      return;
    }

    if (step.page && currentPage !== step.page) {
      setPage(step.page, { restoreScroll: false });
      window.setTimeout(renderMemberTourStep, 220);
      return;
    }

    step.prepare?.();
    window.setTimeout(() => {
      clearMemberTourFocus();
      let target = document.querySelector(step.selector);
      if (!isTourTargetVisible(target) || (step.requiredSelector && !isTourTargetVisible(document.querySelector(step.requiredSelector)))) {
        skipCurrentMemberTourStep();
        return;
      }
      closeSidebarAfterTourStep(target);
      target.classList.add('member-tour-focus');
      target.closest('.sidebar, .top-header')?.classList.add('member-tour-surface');
      if (!target.closest('.sidebar, .top-header')) {
        target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      }
      ensureMemberTourLayer();
      updateMemberTourContent(step, target);
    }, 120);
  }

  function isTourTargetVisible(target) {
    if (!target) return false;
    const style = window.getComputedStyle(target);
    const rect = target.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }

  function skipCurrentMemberTourStep() {
    memberTourState.steps.splice(memberTourState.index, 1);
    if (memberTourState.index >= memberTourState.steps.length) memberTourState.index = 0;
    renderMemberTourStep();
  }
  function ensureMemberTourLayer() {
    if (document.getElementById('memberTourLayer')) return;
    const layer = document.createElement('div');
    layer.id = 'memberTourLayer';
    layer.className = 'member-tour-layer';
    layer.innerHTML = `
      <div class="member-tour-backdrop"></div>
      <section id="memberTourPopover" class="member-tour-popover" role="dialog" aria-live="polite" aria-label="Panduan penggunaan aplikasi">
        <div class="member-tour-step" id="memberTourStepLabel"></div>
        <h3 id="memberTourTitle"></h3>
        <p id="memberTourText"></p>
        <div class="member-tour-actions">
          <button type="button" class="btn btn-secondary" data-tour-action="skip">Lewati Tour</button>
          <div>
            <button type="button" class="btn btn-secondary" data-tour-action="prev">Sebelumnya</button>
            <button type="button" class="btn btn-primary" data-tour-action="next">Lanjut</button>
          </div>
        </div>
      </section>
    `;
    document.body.appendChild(layer);
    layer.addEventListener('click', (event) => {
      const action = event.target.closest('[data-tour-action]')?.dataset.tourAction;
      if (!action) return;
      event.preventDefault();
      handleMemberTourAction(action);
    });
  }

  function updateMemberTourContent(step, target) {
    document.body.classList.add('member-tour-active');
    document.getElementById('memberTourStepLabel').textContent = `Langkah ${memberTourState.index + 1} dari ${memberTourState.steps.length}`;
    document.getElementById('memberTourTitle').textContent = step.title;
    document.getElementById('memberTourText').textContent = step.text;

    const prevBtn = document.querySelector('[data-tour-action="prev"]');
    const nextBtn = document.querySelector('[data-tour-action="next"]');
    if (prevBtn) prevBtn.style.display = memberTourState.index === 0 ? 'none' : 'inline-flex';
    if (nextBtn) nextBtn.textContent = memberTourState.index === memberTourState.steps.length - 1 ? 'Selesai' : 'Lanjut';
    positionMemberTourPopover(target);
  }

  function positionMemberTourPopover(target = document.querySelector('.member-tour-focus')) {
    const popover = document.getElementById('memberTourPopover');
    if (!popover || !target) return;

    const rect = target.getBoundingClientRect();
    const isSmallScreen = window.matchMedia('(max-width: 640px)').matches;
    const margin = isSmallScreen ? 12 : 16;
    const isSidebarTarget = Boolean(target.closest('.sidebar'));
    const sidebarRect = document.querySelector('.sidebar')?.getBoundingClientRect();

    popover.classList.toggle('is-sidebar-mobile', Boolean(isSmallScreen && isSidebarTarget && sidebarRect));
    popover.style.right = 'auto';

    if (isSmallScreen && isSidebarTarget && sidebarRect) {
      const width = Math.max(260, window.innerWidth - margin * 2);
      popover.style.width = `${width}px`;
      popover.style.left = `${margin}px`;
      popover.style.top = 'auto';
      popover.style.bottom = `${margin}px`;
      return;
    }

    popover.style.bottom = 'auto';
    const availableWidth = isSidebarTarget && sidebarRect
      ? Math.max(220, sidebarRect.width - margin * 2)
      : window.innerWidth - margin * 2;
    const width = Math.min(360, availableWidth);

    popover.style.width = `${width}px`;
    const leftBase = isSidebarTarget && sidebarRect ? sidebarRect.left + margin : rect.left;
    const left = Math.max(margin, Math.min(leftBase, window.innerWidth - width - margin));
    popover.style.left = `${left}px`;

    const belowTop = rect.bottom + 12;
    const aboveTop = rect.top - popover.offsetHeight - 12;
    const preferredTop = belowTop + popover.offsetHeight <= window.innerHeight - margin ? belowTop : aboveTop;
    const top = Math.max(margin, Math.min(preferredTop, window.innerHeight - popover.offsetHeight - margin));
    popover.style.top = `${top}px`;
  }

  function handleMemberTourAction(action) {
    if (action === 'skip') {
      finishMemberTour(true);
      return;
    }
    if (action === 'prev') {
      memberTourState.index = Math.max(0, memberTourState.index - 1);
      renderMemberTourStep();
      return;
    }
    if (action === 'next') {
      if (memberTourState.index >= memberTourState.steps.length - 1) {
        finishMemberTour(true);
        return;
      }
      memberTourState.index += 1;
      renderMemberTourStep();
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
      setPage(currentPage, { restoreScroll: false });
      refreshPresence();
      if (MEMBER_TOUR_ENABLED) scheduleMemberTour(user);
    };

    (window.capstoneStore.ready || Promise.resolve()).then(() => {
      activateAuthenticatedUi(window.capstoneStore.getCurrentUser());
    });

    window.addEventListener('capstone:auth-required', () => {
      document.body.classList.remove('is-authenticated');
      document.querySelectorAll('.modal-backdrop.active, .profile-dropdown.active, .notification-dropdown.active').forEach(element => element.classList.remove('active'));
      formBaselines.clear();
      modalReturnFocus.clear();
      progressNoteDrafts.clear();
      baDraftContext = null;
      document.getElementById('legacyRecoveryNotice')?.remove();
      phaseAccessState.clear();
      lastTrackedPage = null;
      lastTrackedUserId = null;
      lastPresenceAt = 0;
      flowDocuments = [];
      documentArchives = [];
      flowDocumentsLoaded = false;
      documentArchivesLoaded = false;
      closeMemberTour(false);
      memberTourState.scheduled = false;
    });

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (loginError) loginError.textContent = '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memeriksa...';
      }

      try {
        // A late anonymous snapshot must not clear a newly authenticated session.
        await window.capstoneStore.ready;
        const payload = await window.capstoneStore.sendToBackend('auth', 'POST', {
          username: document.getElementById('loginUsername').value.trim(),
          password: document.getElementById('loginPassword').value
        });

        if (payload?.ok && payload.data) {
          window.capstoneStore.setAuthenticatedUser(payload.data);
          if (submitBtn) submitBtn.textContent = 'Memuat data...';
          const syncResult = await window.capstoneStore.syncFromBackend();
          if (!syncResult?.ok || !window.capstoneStore.getCurrentUser()) {
            throw new Error(syncResult?.message || 'Data belum dapat dimuat. Silakan coba masuk kembali.');
          }
          await window.RBAC.loadFromBackend();
          activateAuthenticatedUi(window.capstoneStore.getCurrentUser());
          trackUserActivity('Login', 'Masuk ke aplikasi.', {
            activityTag: 'login',
            page: 'auth',
            target: { type: 'Sesi', id: payload.data.id, name: payload.data.name }
          });
          loginForm.reset();
        } else if (loginError) {
          loginError.textContent = payload?.message || 'Username atau password salah.';
        }
      } catch (error) {
        document.body.classList.remove('is-authenticated');
        if (loginError) loginError.textContent = error.message || 'Data belum dapat dimuat. Silakan coba masuk kembali.';
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Masuk';
        }
      }
    });

    logoutBtn?.addEventListener('click', async () => {
      document.getElementById('profileDropdown')?.classList.remove('active');
      document.getElementById('profileMenuBtn')?.setAttribute('aria-expanded', 'false');
      const user = window.capstoneStore.getCurrentUser();
      trackUserActivity('Logout', 'Keluar dari aplikasi.', {
        activityTag: 'logout',
        page: currentPage || '',
        target: { type: 'Sesi', id: user?.id || '', name: user?.name || 'Pengguna' }
      });
      if (!await confirmDiscardChanges()) return;
      runUiAction(logoutBtn, async () => {
        await window.capstoneStore.logout();
        window.TaskReportUI?.clear();
        window.location.reload();
      });
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
      showFormModal(backdrop);
      document.getElementById('currentPasswordInput')?.focus();
    });
    document.getElementById('changePasswordModalCloseBtn')?.addEventListener('click', () => attemptCloseModal(backdrop, close));
    document.getElementById('changePasswordCancelBtn')?.addEventListener('click', () => attemptCloseModal(backdrop, close));
    bindBackdropDismiss(backdrop, close);

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
      btn.addEventListener('click', async () => {
        const target = btn.dataset.target;
        if (target && !window.RBAC.canPage(window.capstoneStore.getCurrentUser(), target)) return;
        if (!await confirmDiscardChanges()) return;
        discardPageEdits();
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

  function getPageLabel(pageId) {
    if (pageId === 'dashboard') return 'Dasbor';
    if (pageId === 'users') return 'Manajemen Pengguna';
    if (pageId === 'audit') return 'Audit Log';
    if (pageId === 'reports') return 'Laporan Tugas';
    if (pageId === 'rbac') return 'RBAC';
    if (pageId === 'flow') return 'Alur Kerja';
    if (pageId === 'documents') return 'Arsip Dokumen';
    return PHASE_META[pageId]?.short || pageId || '-';
  }

  function trackUserActivity(activity, details = '', extra = {}) {
    const user = window.capstoneStore.getCurrentUser();
    if (!user || !window.capstoneStore.logUserActivity) return;
    window.capstoneStore.logUserActivity(activity, details, {
      page: extra.page ?? currentPage ?? '',
      ...extra
    });
  }

  function setPage(pageId, options = {}) {
    const requestedPage = VALID_PAGE_IDS.includes(pageId) ? pageId : 'dashboard';
    const currentUser = window.capstoneStore.getCurrentUser();
    const safePageId = window.RBAC.canPage(currentUser, requestedPage) ? requestedPage : getFallbackPage(currentUser);
    const previousPage = currentPage;

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
    } else if (safePageId === 'reports') {
      headerTitle.textContent = 'Laporan Tugas';
      breadcrumbLabel.textContent = 'Rekap Pekerjaan Tim';
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

    if (previousPage !== safePageId || lastTrackedPage !== safePageId || lastTrackedUserId !== currentUser?.id) {
      lastTrackedPage = safePageId;
      lastTrackedUserId = currentUser?.id;
      trackUserActivity('Buka Menu', `Membuka menu ${getPageLabel(safePageId)}.`, {
        activityTag: 'open_menu',
        page: safePageId,
        target: { type: 'Menu', id: safePageId, name: getPageLabel(safePageId) }
      });
      if (safePageId.startsWith('tugas')) phaseAccessState.delete(safePageId);
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
    } else if (currentPage === 'reports') {
      window.TaskReportUI?.render();
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
    setDisplay('#memberTourReplayBtn', false);
    setDisplay('.add-task-btn', canTaskCreate);
    setDisplay('#dashAddMeetingBtn, .add-meeting-page-btn, #addMeetingBtn', canMeetingCreate);
    setDisplay('#addUserBtn', window.RBAC.can(user, 'users', 'create'));
    setDisplay('#clearAuditBtn', window.RBAC.can(user, 'audit', 'manage'));
    setDisplay('#inlineResetAuditBtn', window.RBAC.can(user, 'audit', 'manage'));
    setDisplay('#viewSnapshotBtn, #exportCsvBtn, #exportJsonBtn, #printAuditBtn, #copyJsonBtn, #downloadJsonBtn', canAuditRead);
    setDisplay('.generate-ba-btn', canBeritaCreate);
    setDisplay('.upload-ba-manual-btn', window.RBAC.can(user, 'documents', 'create'), 'flex');
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
    setDisplay('#baDraftSaveBtn, #baPreviewBtn', canBeritaCreate);
    setDisplay('#baPrintBtn, #baPreviewPrintBtn', window.RBAC.can(user, 'beritaAcara', 'read'));
    setDisplay('#flowDocumentsSection', window.RBAC.can(user, 'guides', 'read'), 'block');
    setDisplay('#flowDocumentForm', window.RBAC.can(user, 'guides', 'create'), 'grid');
    setDisplay('.delete-guide-btn', window.RBAC.can(user, 'guides', 'delete'));
    setDisplay('#documentArchiveSection', window.RBAC.can(user, 'documents', 'read'), 'block');
    setDisplay('#documentArchiveForm', window.RBAC.can(user, 'documents', 'create'), 'grid');
    setDisplay('.edit-archive-doc-btn', window.RBAC.can(user, 'documents', 'create'));
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
      toggle.addEventListener('change', async () => {
        const role = toggle.dataset.role;
        const area = toggle.dataset.area;
        const permission = toggle.dataset.permission;
        const previousValue = toggle.checked ? 'Nonaktif' : 'Aktif';
        const nextValue = toggle.checked ? 'Aktif' : 'Nonaktif';
        const roleLabel = roleLabels[role] || role;
        const permissionName = `${area}.${permission}`;
        const oldValue = Boolean(window.RBAC.matrix[role]?.[area]?.[permission]);
        toggle.disabled = true;
        try {
          await window.RBAC.set(role, area, permission, toggle.checked);
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
        } catch (error) {
          toggle.checked = oldValue;
          Swal.fire({ icon: 'error', title: 'Perubahan izin belum tersimpan', text: error.message });
        } finally {
          if (toggle.isConnected) toggle.disabled = false;
        }
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

  function canSubmitTaskReview(task, user = window.capstoneStore.getCurrentUser()) {
    if (!task || task.archivedAt || !window.RBAC.can(user, 'tasks', 'update')) return false;
    return user?.role !== 'member' || isTaskPic(task, user);
  }

  function canReviewTask(task, user = window.capstoneStore.getCurrentUser()) {
    if (!task || task.archivedAt || !window.RBAC.can(user, 'tasks', 'update')) return false;
    if (['superadmin', 'koordinator'].includes(user?.role)) return true;
    return Boolean(task.reviewer && task.reviewer === user?.name && task.pic !== user?.name);
  }

  function canCancelTaskReview(task, user = window.capstoneStore.getCurrentUser()) {
    if (!task || task.archivedAt || (task.reviewStatus || 'none') !== 'submitted') return false;
    return canSubmitTaskReview(task, user);
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

  function getTaskNextAction(task) {
    if (task.archivedAt) return { title: 'Tugas diarsipkan', detail: 'Hubungi superadmin jika tugas perlu dibuka kembali.' };
    if (isTaskCompletionVerified(task)) return { title: 'Tugas selesai', detail: task.reviewer ? `Pemeriksaan: ${task.reviewer}` : 'Pekerjaan sudah diselesaikan.' };
    const inactive = [task.pic, task.reviewer].filter(name => name && Object.values(window.capstoneStore.getUsers()).some(user => user.name === name && user.isActive === false));
    if (inactive.length) return { title: 'Penanggung jawab perlu diperbarui', detail: `Akun ${[...new Set(inactive)].join(', ')} nonaktif. Minta superadmin memperbarui PIC atau reviewer.` };
    if (task.reviewStatus === 'submitted') return canReviewTask(task)
      ? { title: 'Pekerjaan siap diperiksa', detail: 'Periksa luaran dan checklist, lalu setujui atau berikan catatan revisi.' }
      : { title: `Menunggu pemeriksaan ${task.reviewer || 'reviewer'}`, detail: 'Menunggu hasil pemeriksaan pekerjaan.' };
    if (task.reviewStatus === 'revision_requested') return { title: 'Perlu diperbaiki', detail: task.reviewNote || 'Periksa catatan reviewer sebelum mengajukan kembali.' };
    if (!task.reviewer) return { title: 'Reviewer belum ditentukan', detail: 'Superadmin menentukan reviewer setelah disepakati tim.' };
    return { title: 'Lanjutkan pekerjaan', detail: `Pemeriksaan berikutnya oleh ${task.reviewer}.` };
  }

  function getWorkTasks(type, tasks, user = window.capstoneStore.getCurrentUser()) {
    const manager = ['superadmin', 'koordinator'].includes(user?.role);
    return tasks.filter(task => !task.archivedAt).filter(task => {
      if (type === 'mine') return isTaskPic(task, user) && !isTaskCompletionVerified(task) && task.reviewStatus !== 'submitted';
      if (type === 'waiting') return isTaskPic(task, user) && task.reviewStatus === 'submitted' && !isTaskCompletionVerified(task);
      if (type === 'revision') return task.reviewStatus === 'revision_requested' && (manager || isTaskPic(task, user));
      if (type === 'review') return task.reviewStatus === 'submitted' && task.reviewer === user?.name && !isTaskPic(task, user) && canReviewTask(task, user);
      return true;
    }).sort((a, b) => (a.dueAt || Number.MAX_SAFE_INTEGER) - (b.dueAt || Number.MAX_SAFE_INTEGER));
  }

  function renderPhaseActionSection(phaseKey, tasks, user) {
    const modes = [
      { key: 'mine', label: 'Tugas saya', empty: 'Tidak ada tugas aktif untuk kamu.' },
      { key: 'revision', label: 'Perlu revisi', empty: 'Tidak ada tugas yang perlu direvisi.' },
      { key: 'review', label: 'Perlu saya review', empty: 'Tidak ada pekerjaan yang menunggu pemeriksaanmu.' },
      { key: 'waiting', label: 'Tugas saya menunggu review', empty: 'Belum ada tugasmu yang menunggu review.' }
    ].map(mode => ({ ...mode, tasks: getWorkTasks(mode.key, tasks, user) }));
    const selected = modes.find(mode => mode.key === activeWorkFilter) || modes.find(mode => mode.tasks.length) || modes[0];
    const selectedTasks = selected.tasks;
    const queueKey = `${phaseKey}:${selected.key}`;
    const expanded = expandedActionQueues.has(queueKey);
    return `<section class="phase-actions" aria-label="Tindak lanjut tugas" data-queue="${selected.key}">
      <div class="phase-actions-header"><h3>Tindak Lanjut</h3>
        <button type="button" class="work-filter-btn phase-actions-reset" data-work-filter="all">Lihat semua tugas <span aria-hidden="true">\u2192</span></button>
      </div>
      <div class="phase-action-tabs" role="group" aria-label="Pilih pekerjaan">
        ${modes.map(mode => `<button type="button" class="work-filter-btn phase-action-tab is-${mode.key} ${selected.key === mode.key ? 'is-active' : ''} ${mode.tasks.length && ['review', 'revision'].includes(mode.key) ? 'has-attention' : ''}" data-work-filter="${mode.key}" aria-pressed="${selected.key === mode.key}">
          <span class="phase-action-tab-label">${mode.label}</span><strong>${mode.tasks.length}</strong>
        </button>`).join('')}
      </div>
      <div class="phase-action-list-heading"><strong>${selected.label}</strong><span>${selectedTasks.length} tugas</span></div>
      <div class="phase-action-preview" id="actionQueue-${phaseKey}">
        ${(expanded ? selectedTasks : selectedTasks.slice(0, 3)).map(task => renderPhaseActionItem(task, selected.key)).join('') || `<p class="phase-action-empty">${selected.empty}</p>`}
      </div>
      ${selectedTasks.length > 3 ? `<button type="button" class="work-filter-btn phase-actions-more" data-expand-work="${selected.key}" aria-expanded="${expanded}" aria-controls="actionQueue-${phaseKey}">${expanded ? 'Tampilkan lebih sedikit' : `Lihat semua ${selectedTasks.length} tugas`} <span aria-hidden="true">${expanded ? '\u2191' : '\u2193'}</span></button>` : ''}
    </section>`;
  }

  function renderPhaseActionItem(task, mode) {
    const total = (task.checklist || []).length;
    const done = (task.checklistDone || []).slice(0, total).filter(Boolean).length;
    const next = getTaskNextAction(task);
    const needsAssignment = next.title === 'Penanggung jawab perlu diperbarui';
    const tone = needsAssignment || task.reviewStatus === 'revision_requested' ? 'revision' : mode;
    const state = needsAssignment ? next.title : mode === 'waiting' ? `Menunggu ${task.reviewer || 'reviewer'}` : mode === 'review' ? 'Siap diperiksa' : next.title;
    const hasReviewNote = Boolean(task.reviewNote?.trim()) || task.reviewStatus === 'revision_requested';
    const action = hasReviewNote ? 'Lihat catatan review' : mode === 'review' ? 'Periksa' : mode === 'waiting' ? 'Lihat pengajuan' : 'Buka tugas';
    const review = getReviewStatusMeta(task.reviewStatus || 'none');
    return `<button type="button" class="task-action-item is-${tone}" data-task-id="${escapeHtml(task.id)}" ${hasReviewNote ? 'data-open-review-notes="true"' : ''} aria-label="${escapeHtml(`${action}: ${task.title}`)}">
      <span class="task-action-main">
        <span class="task-action-meta"><span class="task-card-code">${escapeHtml(task.id)}</span><span class="task-review-badge is-${review.tone}">${escapeHtml(review.label)}</span>${mode === 'review' || mode === 'revision' ? `<span>PIC: ${escapeHtml(task.pic)}</span>` : ''}</span>
        <strong class="task-action-title">${escapeHtml(task.title)}</strong>
        <span class="task-action-state">${escapeHtml(state)}</span>
        <span class="task-action-reviewer">Reviewer: ${escapeHtml(task.reviewer || 'Belum ditentukan')}</span>
        ${renderTaskReviewNote(task)}
      </span>
      <span class="task-action-checklist">${total ? `<span>Checklist <strong>${done}/${total}</strong></span><progress max="${total}" value="${done}" aria-label="${escapeHtml(`Checklist ${task.id}: ${done} dari ${total}`)}"></progress>` : '<span>Tanpa checklist</span>'}</span>
      <span class="task-action-open"><span>${hasReviewNote ? '' : action}</span><span aria-hidden="true">\u203a</span></span>
    </button>`;
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
    return true;
  }

  function setProgressNoteCollapsed(phaseKey, collapsed) {
    const saved = loadProgressNoteCollapseState();
    saved[phaseKey] = Boolean(collapsed);
    localStorage.setItem(PROGRESS_NOTE_COLLAPSE_KEY, JSON.stringify(saved));
  }

  function initFlowDocuments() {
    const form = document.getElementById('flowDocumentForm');
    if (!form) return;
    markFormClean(form);

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
      markFormClean(form);
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
    flowDocumentsError = '';
    renderFlowDocuments();
    try {
      flowDocuments = await window.capstoneStore.getProjectGuides();
    } catch (error) {
      flowDocumentsError = error.message;
    }
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
    if (flowDocumentsError && !flowDocumentsLoading) {
      list.innerHTML = `<div class="form-save-error" role="alert">${escapeHtml(flowDocumentsError)} <button type="button" class="btn btn-secondary" id="retryGuidesBtn">Coba lagi</button></div>`;
      document.getElementById('retryGuidesBtn')?.addEventListener('click', () => loadFlowDocuments(true));
      return;
    }
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
          <a class="btn btn-secondary view-guide-link" href="backend/guide-preview.php?id=${id}" target="_blank" rel="noopener" data-guide-id="${id}" data-guide-title="${escapeHtml(document.title)}">📖 Preview PDF</a>
          <button type="button" class="btn btn-danger delete-guide-btn" data-guide-id="${id}" data-guide-title="${escapeHtml(document.title)}">🗑 Hapus</button>
        </div>
      </article>`;
    }).join('');

    list.querySelectorAll('.view-guide-link').forEach(link => {
      link.addEventListener('click', () => {
        trackUserActivity('Lihat Panduan', `Membuka panduan "${link.dataset.guideTitle || 'Dokumen panduan'}".`, {
          activityTag: 'view_guide',
          page: 'flow',
          target: { type: 'Panduan', id: decodeURIComponent(link.dataset.guideId || ''), name: link.dataset.guideTitle || '' }
        });
      });
    });

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
    const categoryInput = document.getElementById('documentArchiveCategory');
    document.getElementById('documentArchiveSearch')?.addEventListener('input', event => {
      documentArchiveSearch = event.target.value;
      renderDocumentArchives();
    });
    document.getElementById('documentArchiveSort')?.addEventListener('change', event => {
      documentArchiveSort = event.target.value;
      renderDocumentArchives();
    });
    document.getElementById('resetDocumentFiltersBtn')?.addEventListener('click', () => {
      documentArchiveSearch = '';
      documentArchiveSort = 'newest';
      documentArchiveCategoryFilter = 'SEMUA';
      document.getElementById('documentArchiveSearch').value = '';
      document.getElementById('documentArchiveSort').value = 'newest';
      renderDocumentArchives();
    });

    if (filter) {
      filter.addEventListener('change', event => {
        documentArchiveCategoryFilter = event.target.value || 'SEMUA';
        renderDocumentArchives();
      });
    }

    if (categoryInput) {
      categoryInput.addEventListener('change', refreshDocumentArchiveMeetingSelect);
      refreshDocumentArchiveMeetingSelect();
    }

    document.addEventListener('click', event => {
      if (event.target.closest('.document-archive-menu')) return;
      document.querySelectorAll('.archive-card-menu.is-open').forEach(menu => menu.classList.remove('is-open'));
    });

    if (!form) return;
    markFormClean(form);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      return runUiAction(form, async () => {
      if (!requirePermission('documents', 'create')) return;

      const titleInput = document.getElementById('documentArchiveTitle');
      const categoryInput = document.getElementById('documentArchiveCategory');
      const meetingInput = document.getElementById('documentArchiveMeeting');
      const descriptionInput = document.getElementById('documentArchiveDescription');
      const fileInput = document.getElementById('documentArchiveFile');
      const button = document.getElementById('documentArchiveUploadBtn');
      const title = titleInput?.value.trim() || '';
      const category = categoryInput?.value || 'lainnya';
      const meetingId = category === 'berita_acara' ? (meetingInput?.value || '') : '';
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

      const result = await window.capstoneStore.uploadDocumentArchive({ title, category, description, meetingId, file });

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
        object: { type: 'Arsip Dokumen', id: result.data?.id || '', name: title },
        changes: meetingId ? [{ field: 'Pertemuan Terkait', from: null, to: meetingId }] : []
      });
      let linkFailed = false;
      if (meetingId) {
        const linked = findMeetingForBeritaAcara(meetingId);
        try {
          await window.capstoneStore.markMeetingBeritaAcara(linked.task?.id || '', meetingId);
        } catch (error) {
          linkFailed = true;
        }
      }
      form.reset();
      markFormClean(form);
      refreshDocumentArchiveMeetingSelect();
      await loadDocumentArchives(true);
      Swal.fire(linkFailed
        ? { icon: 'warning', title: 'File sudah tersimpan', text: 'Penanda BA pertemuan belum diperbarui. Perbarui data dan periksa kembali pertemuannya.' }
        : { icon: 'success', title: 'Dokumen tersimpan', text: 'Dokumen sudah tersedia di arsip tim.', timer: 1600, showConfirmButton: false });
      });
    });
  }

  function renderDocumentArchiveView() {
    refreshDocumentArchiveMeetingSelect();
    renderDocumentArchives();
    loadDocumentArchives();
  }

  function getAllMeetingsForArchiveLinking() {
    const taskMeetings = window.capstoneStore.getAll().flatMap(task =>
      (task.meetings || []).map(meeting => ({ ...meeting, task }))
    );
    const generalMeetings = (window.capstoneStore.getMeetings?.() || []).map(meeting => ({ ...meeting, task: null }));
    const seen = new Set();
    return [...taskMeetings, ...generalMeetings]
      .filter(meeting => {
        if (!meeting?.id || seen.has(meeting.id)) return false;
        seen.add(meeting.id);
        return true;
      })
      .sort((a, b) => (parseWibDate(a.date)?.getTime() || 0) - (parseWibDate(b.date)?.getTime() || 0));
  }

  function buildDocumentArchiveMeetingOptions(selectedMeetingId = '') {
    const meetings = getAllMeetingsForArchiveLinking();
    return `
      <option value="">Tidak dikaitkan ke pertemuan</option>
      ${meetings.map(meeting => {
        const phaseLabel = meeting.phase ? meeting.phase.replace('tugas', 'Tugas ') : '';
        const date = meeting.date ? formatWibDateOnly(meeting.date) : '-';
        const taskLabel = meeting.task?.title ? ` - ${meeting.task.title}` : (phaseLabel ? ` - ${phaseLabel}` : '');
        return `<option value="${escapeHtml(meeting.id)}" ${meeting.id === selectedMeetingId ? 'selected' : ''}>${escapeHtml(`${date} - ${meeting.title}${taskLabel}`)}</option>`;
      }).join('')}
    `;
  }

  function refreshDocumentArchiveMeetingSelect() {
    const categoryInput = document.getElementById('documentArchiveCategory');
    const field = document.getElementById('documentArchiveMeetingField');
    const select = document.getElementById('documentArchiveMeeting');
    if (!categoryInput || !field || !select) return;

    const isBeritaAcara = categoryInput.value === 'berita_acara';
    field.style.display = isBeritaAcara ? 'grid' : 'none';
    if (!isBeritaAcara) {
      select.value = '';
      return;
    }

    select.innerHTML = buildDocumentArchiveMeetingOptions(select.value);
  }

  function ensureDocumentArchivesLoadedForMeetingCards() {
    const currentUser = window.capstoneStore.getCurrentUser();
    if (!window.RBAC.can(currentUser, 'documents', 'read')) return;
    if (documentArchivesLoaded || documentArchivesLoading) return;
    loadDocumentArchives().then(() => {
      if (currentPage === 'dashboard' || currentPage?.startsWith('tugas')) {
        renderCurrentView();
      }
    });
  }

  async function loadDocumentArchives(force = false) {
    if (documentArchivesLoading || (!force && documentArchivesLoaded)) {
      renderDocumentArchives();
      return;
    }
    documentArchivesLoading = true;
    documentArchivesError = '';
    renderDocumentArchives();
    try {
      documentArchives = await window.capstoneStore.getDocumentArchives();
    } catch (error) {
      documentArchivesError = error.message;
    }
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
    if (category === 'poster') return '🧾';
    if (mime.startsWith('image/') || category === 'diagram_alur') return '🖼️';
    if (mime.includes('spreadsheet') || mime.includes('excel')) return '📊';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return '📽️';
    if (category.includes('surat')) return '✉️';
    return '📄';
  }

  function getMeetingBeritaAcaraArchive(meetingId) {
    if (!meetingId || !Array.isArray(documentArchives)) return null;
    return documentArchives.find(document => {
      if (document.category !== 'berita_acara') return false;
      if (document.meetingId === meetingId) return true;
      return (document.description || '').includes(`ID pertemuan: ${meetingId}`);
    }) || null;
  }

  function getDocumentArchiveMeetingId(document) {
    if (document?.meetingId) return document.meetingId;
    const match = (document?.description || '').match(/ID pertemuan:\s*([A-Za-z0-9_.:-]+)/);
    return match?.[1] || '';
  }

  function getDocumentArchiveMeetingContext(document) {
    const meetingId = getDocumentArchiveMeetingId(document);
    if (!meetingId) return null;
    const linked = findMeetingForBeritaAcara(meetingId);
    return {
      meetingId,
      meeting: linked.meeting,
      task: linked.task
    };
  }

  function canEditDocumentArchive() {
    return window.RBAC.can(window.capstoneStore.getCurrentUser(), 'documents', 'create');
  }

  async function openEditDocumentArchiveModal(documentId) {
    if (!requirePermission('documents', 'create')) return;
    const document = documentArchives.find(item => item.id === documentId);
    if (!document) {
      Swal.fire({ icon: 'error', title: 'Dokumen tidak ditemukan', text: 'Data arsip belum dapat dibuka.', confirmButtonColor: '#1E40AF' });
      return;
    }

    const currentMeetingId = getDocumentArchiveMeetingId(document);
    const categoryOptions = Object.entries(DOCUMENT_ARCHIVE_CATEGORIES).map(([value, label]) =>
      `<option value="${escapeHtml(value)}" ${document.category === value ? 'selected' : ''}>${escapeHtml(label)}</option>`
    ).join('');

    const result = await Swal.fire({
      title: 'Edit Dokumen Arsip',
      width: 'min(680px, calc(100vw - 1.5rem))',
      html: `
        <div class="archive-edit-form">
          <label class="form-label" for="archiveEditTitle">Judul Dokumen</label>
          <input id="archiveEditTitle" class="form-input" value="${escapeHtml(document.title)}" maxlength="180" />

          <label class="form-label" for="archiveEditCategory">Jenis Dokumen</label>
          <select id="archiveEditCategory" class="form-input">${categoryOptions}</select>

          <div id="archiveEditMeetingWrap">
            <label class="form-label" for="archiveEditMeeting">Pertemuan Terkait</label>
            <select id="archiveEditMeeting" class="form-input">${buildDocumentArchiveMeetingOptions(currentMeetingId)}</select>
            <small class="form-help">Pilih pertemuan jika dokumen ini adalah berita acara.</small>
          </div>

          <label class="form-label" for="archiveEditDescription">Catatan Singkat</label>
          <textarea id="archiveEditDescription" class="form-input" rows="4" maxlength="500">${escapeHtml(document.description || '')}</textarea>

          <div class="form-help">File asli tetap sama. Untuk mengganti file, unggah dokumen baru ke arsip.</div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan Perubahan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#1E40AF',
      didOpen: () => {
        const categoryInput = document.getElementById('archiveEditCategory');
        const meetingWrap = document.getElementById('archiveEditMeetingWrap');
        const syncMeetingField = () => {
          if (meetingWrap) meetingWrap.style.display = categoryInput?.value === 'berita_acara' ? 'grid' : 'none';
        };
        categoryInput?.addEventListener('change', syncMeetingField);
        syncMeetingField();
      },
      preConfirm: () => {
        const title = document.getElementById('archiveEditTitle')?.value.trim() || '';
        const category = document.getElementById('archiveEditCategory')?.value || 'lainnya';
        const description = document.getElementById('archiveEditDescription')?.value.trim() || '';
        const meetingId = category === 'berita_acara' ? (document.getElementById('archiveEditMeeting')?.value || '') : '';
        if (!title) {
          Swal.showValidationMessage('Judul dokumen wajib diisi.');
          return false;
        }
        return { title, category, description, meetingId };
      }
    });

    if (!result.isConfirmed || !result.value) return;

    const payload = result.value;
    const updateResult = await window.capstoneStore.updateDocumentArchive(documentId, payload);
    if (!updateResult?.ok) {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan', text: 'Perubahan dokumen belum dapat disimpan.', confirmButtonColor: '#1E40AF' });
      return;
    }

    window.capstoneStore.logAudit('Edit Arsip Dokumen', `Mengubah data dokumen "${payload.title}"`, {
      actionTag: 'edit_document_archive',
      object: { type: 'Arsip Dokumen', id: documentId, name: payload.title },
      changes: [
        { field: 'Judul', from: document.title, to: payload.title },
        { field: 'Jenis', from: document.category, to: payload.category },
        { field: 'Pertemuan Terkait', from: currentMeetingId || null, to: payload.meetingId || null }
      ]
    });

    if (payload.meetingId) {
      const linked = findMeetingForBeritaAcara(payload.meetingId);
      const marked = await runUiAction(document.getElementById('documentArchiveSection'), () => window.capstoneStore.markMeetingBeritaAcara(linked.task?.id || '', payload.meetingId));
      if (!marked) {
        await loadDocumentArchives(true);
        return;
      }
    }

    await loadDocumentArchives(true);
    Swal.fire({ icon: 'success', title: 'Dokumen diperbarui', text: 'Data arsip dokumen sudah tersimpan.', timer: 1400, showConfirmButton: false });
  }

  function renderDocumentArchives() {
    const list = document.getElementById('documentArchiveList');
    const count = document.getElementById('documentArchiveCount');
    const filter = document.getElementById('documentArchiveCategoryFilter');
    if (!list || !count) return;

    if (filter && filter.value !== documentArchiveCategoryFilter) {
      filter.value = documentArchiveCategoryFilter;
    }

    let visibleDocuments = documentArchiveCategoryFilter === 'SEMUA'
      ? documentArchives
      : documentArchives.filter(document => document.category === documentArchiveCategoryFilter);
    const words = documentArchiveSearch.trim().toLocaleLowerCase('id-ID').split(/\s+/).filter(Boolean);
    visibleDocuments = visibleDocuments.filter(item => words.every(word => [item.title, item.originalName, item.description, item.uploadedBy].join(' ').toLocaleLowerCase('id-ID').includes(word)));
    visibleDocuments = [...visibleDocuments].sort((a, b) => {
      if (documentArchiveSort === 'name') return a.title.localeCompare(b.title, 'id');
      if (documentArchiveSort === 'category') return documentArchiveCategoryLabel(a.category).localeCompare(documentArchiveCategoryLabel(b.category), 'id') || a.title.localeCompare(b.title, 'id');
      return documentArchiveSort === 'oldest' ? (a.createdAt || 0) - (b.createdAt || 0) : (b.createdAt || 0) - (a.createdAt || 0);
    });

    count.textContent = `${visibleDocuments.length} dari ${documentArchives.length} dokumen`;
    if (documentArchivesError && !documentArchivesLoading) {
      list.innerHTML = `<div class="form-save-error" role="alert">${escapeHtml(documentArchivesError)} <button type="button" id="retryArchivesBtn" class="btn btn-secondary">Coba lagi</button></div>`;
      document.getElementById('retryArchivesBtn')?.addEventListener('click', () => loadDocumentArchives(true));
      return;
    }
    if (documentArchivesLoading) {
      list.innerHTML = '<div class="flow-document-empty">Memuat arsip dokumen...</div>';
      return;
    }
    if (!documentArchives.length) {
      list.innerHTML = '<div class="flow-document-empty">Belum ada dokumen yang tersimpan di arsip.</div>';
      return;
    }
    if (!visibleDocuments.length) {
      list.innerHTML = '<div class="flow-document-empty">Tidak ada dokumen yang sesuai pencarian atau filter.</div>';
      return;
    }

    const canEditArchive = canEditDocumentArchive();
    const canDeleteArchive = window.RBAC.can(window.capstoneStore.getCurrentUser(), 'documents', 'delete');
    list.innerHTML = visibleDocuments.map(document => {
      const date = document.createdAt ? formatWibDateOnly(document.createdAt) : '-';
      const id = encodeURIComponent(document.id);
      const title = escapeHtml(document.title);
      const description = (document.description || '').trim();
      const meetingContext = getDocumentArchiveMeetingContext(document);
      const latestMeetingArchive = meetingContext ? getMeetingBeritaAcaraArchive(meetingContext.meetingId) : null;
      const isLatestMeetingArchive = Boolean(latestMeetingArchive && latestMeetingArchive.id === document.id);
      const meetingLabel = meetingContext
        ? `${meetingContext.meeting ? meetingContext.meeting.title : `Pertemuan ${meetingContext.meetingId}`}${meetingContext.task?.title ? ` - ${meetingContext.task.title}` : ''}`
        : '';
      return `<article class="flow-document-card document-archive-card">
        <div class="flow-document-icon document-archive-icon" aria-hidden="true">${documentArchiveIcon(document)}</div>
        <div class="flow-document-content">
          <div class="document-archive-category">${escapeHtml(documentArchiveCategoryLabel(document.category))}</div>
          <h3>${title}</h3>
          <div class="flow-document-meta">${escapeHtml(document.originalName)} · ${formatFileSize(document.fileSize)}</div>
          <div class="flow-document-meta">Disimpan oleh ${escapeHtml(document.uploadedBy || 'System')} · ${date}</div>
          ${meetingContext ? `<div class="flow-document-meta document-archive-meeting-meta">Pertemuan: ${escapeHtml(meetingLabel)}${isLatestMeetingArchive ? ' · Dipakai di card pertemuan' : ''}</div>` : ''}
          ${description ? `<p class="document-archive-description">${escapeHtml(description)}</p>` : ''}
        </div>
        ${(canEditArchive || canDeleteArchive) ? `
          <div class="document-archive-menu">
            <button type="button" class="archive-card-menu-btn" data-menu-for="${id}" aria-label="Menu dokumen">⋯</button>
            <div class="archive-card-menu" data-menu-id="${id}">
              ${canEditArchive ? `<button type="button" class="edit-archive-doc-btn" data-document-id="${id}">Edit Dokumen</button>` : ''}
              ${canDeleteArchive ? `<button type="button" class="delete-archive-doc-btn is-danger" data-document-id="${id}" data-document-title="${title}">Hapus Dokumen</button>` : ''}
            </div>
          </div>
        ` : ''}
        <div class="flow-document-actions">
          <a class="btn btn-secondary view-archive-doc-link" href="backend/api/index.php?resource=document-archives&id=${id}&view=1" target="_blank" rel="noopener" data-document-id="${id}" data-document-title="${title}">👁️ Lihat</a>
          <a class="btn btn-primary download-archive-doc-link" href="backend/api/index.php?resource=document-archives&id=${id}&download=1" data-document-id="${id}" data-document-title="${title}">⬇️ Download</a>
        </div>
      </article>`;
    }).join('');

    list.querySelectorAll('.view-archive-doc-link').forEach(link => {
      link.addEventListener('click', () => {
        trackUserActivity('Lihat Dokumen', `Membuka dokumen "${link.dataset.documentTitle || 'Arsip dokumen'}".`, {
          activityTag: 'view_document',
          page: 'documents',
          target: { type: 'Arsip Dokumen', id: decodeURIComponent(link.dataset.documentId || ''), name: link.dataset.documentTitle || '' }
        });
      });
    });

    list.querySelectorAll('.download-archive-doc-link').forEach(link => {
      link.addEventListener('click', () => {
        trackUserActivity('Download Dokumen', `Mengunduh dokumen "${link.dataset.documentTitle || 'Arsip dokumen'}".`, {
          activityTag: 'download_document',
          page: 'documents',
          target: { type: 'Arsip Dokumen', id: decodeURIComponent(link.dataset.documentId || ''), name: link.dataset.documentTitle || '' }
        });
      });
    });

    list.querySelectorAll('.archive-card-menu-btn').forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation();
        const menu = button.closest('.document-archive-menu')?.querySelector('.archive-card-menu');
        document.querySelectorAll('.archive-card-menu.is-open').forEach(openMenu => {
          if (openMenu !== menu) openMenu.classList.remove('is-open');
        });
        menu?.classList.toggle('is-open');
      });
    });

    list.querySelectorAll('.edit-archive-doc-btn').forEach(button => {
      button.addEventListener('click', () => {
        button.closest('.archive-card-menu')?.classList.remove('is-open');
        openEditDocumentArchiveModal(decodeURIComponent(button.dataset.documentId));
      });
    });

    list.querySelectorAll('.delete-archive-doc-btn').forEach(button => {
      button.addEventListener('click', async () => {
        button.closest('.archive-card-menu')?.classList.remove('is-open');
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
      const myTasks = tasks.filter(t => t.pic === currentUser.name && t.status !== 'Selesai');

      if (personalCountBadge) personalCountBadge.textContent = `${myTasks.length} tugas`;

      if (myTasks.length === 0) {
        personalList.innerHTML = `<div class="card-box-subtitle" style="padding: 1rem 0;">Tidak ada tugas aktif untuk ${currentUser.name}. Tugas yang sudah selesai tidak ditampilkan di bagian ini.</div>`;
      } else {
        personalList.innerHTML = myTasks.map(t => {
          const totalChecklist = t.checklist ? t.checklist.length : 0;
          const doneChecklist = t.checklistDone ? t.checklistDone.filter(Boolean).length : 0;
          const reviewMeta = getReviewStatusMeta(t.reviewStatus);
          const deadlineMeta = getTaskDeadlineMeta(t);
          return `
            <button class="personal-task-card" data-task-id="${t.id}" title="Klik untuk melihat detail ${escapeHtml(t.title)}">
              <div class="personal-task-card-top">
                <div class="personal-task-title">${escapeHtml(t.title)}</div>
                <span class="priority-badge ${t.priority}">${t.priority}</span>
              </div>
              <div class="personal-task-meta">
                <span class="column-count">${t.status}</span>
                <span>${PHASE_META[t.phase]?.short || ''}</span>
                ${totalChecklist > 0 ? `<span>${doneChecklist}/${totalChecklist} sub</span>` : ''}
              </div>
              <div class="personal-task-footer">
                ${t.reviewer ? `<span class="task-review-badge is-${reviewMeta.tone}">${reviewMeta.label}</span>` : ''}
                ${deadlineMeta ? `<span class="personal-deadline is-${deadlineMeta.tone}">${escapeHtml(deadlineMeta.label)}</span>` : ''}
              </div>
            </button>
          `;
        }).join('');

        personalList.querySelectorAll('.personal-task-card').forEach(btn => {
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
        const myDone = myTasks.filter(isTaskCompletionVerified).length;
        const myProgress = myTasks.filter(t => t.status === 'Sedang Dikerjakan').length;
        const myHold = myTasks.filter(t => t.status === 'Ditunda').length;
        const myReview = myTasks.filter(t => t.reviewStatus === 'submitted').length;

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
            <div class="stat-label">${myReview ? 'Menunggu Review' : 'Tugasku Selesai'}</div>
            <div class="stat-value" style="color: var(--status-done)">${myReview || myDone}</div>
            <div class="stat-desc">${myReview ? `${myReview} tugas sedang diperiksa` : 'Selesai diverifikasi'}</div>
          </div>
        `;
      } else {
        const total = tasks.length;
        const done = tasks.filter(isTaskCompletionVerified).length;
        const inProgress = tasks.filter(t => t.status === 'Sedang Dikerjakan').length;
        const onHold = tasks.filter(t => t.status === 'Ditunda').length;
        const awaitingReview = tasks.filter(t => t.reviewStatus === 'submitted').length;

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
            <div class="stat-label">${awaitingReview ? 'Selesai Terverifikasi' : 'Selesai'}</div>
            <div class="stat-value" style="color: var(--status-done)">${done}</div>
            <div class="stat-desc">${awaitingReview ? `${awaitingReview} menunggu review` : 'Telah selesai diverifikasi'}</div>
          </div>
        `;
      }
    }

    renderReviewQueueSection(tasks, currentUser, users);

    const phaseProgressContainer = document.getElementById('phaseProgressList');
    if (phaseProgressContainer) {
      phaseProgressContainer.innerHTML = Object.keys(PHASE_META).map(phaseKey => {
        const phaseTasks = tasks.filter(t => t.phase === phaseKey);
        const phaseDone = phaseTasks.filter(isTaskCompletionVerified).length;
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
      const attentionTasks = tasks
        .filter(t => t.reviewStatus === 'submitted' || getTaskDeadlineMeta(t)?.tone === 'danger' || (t.priority === 'Tinggi' && !isTaskCompletionVerified(t)))
        .slice(0, 6);
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
                ${t.reviewStatus === 'submitted' ? '<span class="task-review-badge is-warning">Menunggu review</span>' : ''}
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
      const workloadUsers = getUsersVisibleToViewer(users, currentUser).filter(user => user.isActive !== false);
      workloadContainer.innerHTML = workloadUsers.map(u => {
        const memTasks = tasks.filter(t => t.pic === u.name);
        const activeCount = memTasks.filter(t => !isTaskCompletionVerified(t)).length;
        const doneCount = memTasks.filter(isTaskCompletionVerified).length;

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
          activeWorkFilter = 'all';
          const personalTasks = tasks.filter(task => task.pic === card.dataset.pic && !isTaskCompletionVerified(task));
          setPage(personalTasks[0]?.phase || tasks.find(task => task.pic === card.dataset.pic)?.phase || 'tugas1');
        });
      });
    }

    renderDashboardCharts(tasks);
    renderDashboardMeetings(tasks, users);
    applyRbacUi();
  }

  function renderReviewQueueSection(tasks, currentUser, users) {
    const section = document.getElementById('reviewQueueSection');
    const list = document.getElementById('reviewQueueList');
    const count = document.getElementById('reviewQueueCount');
    const title = document.getElementById('reviewQueueTitle');
    const subtitle = document.getElementById('reviewQueueSubtitle');

    if (!section || !list || !count || !currentUser) return;

    const isManager = ['superadmin', 'koordinator'].includes(currentUser.role);
    const reviewTasks = getVisibleReviewTasks(tasks, currentUser);

    if (title) title.textContent = isManager ? 'Menunggu Review' : 'Review Tugas';
    if (subtitle) {
      subtitle.textContent = isManager
        ? 'Tugas yang sudah diajukan anggota dan perlu diperiksa.'
        : 'Tugas kamu yang sedang diperiksa atau tugas yang perlu kamu review.';
    }
    count.textContent = `${reviewTasks.length} tugas`;

    if (reviewTasks.length === 0) {
      section.style.display = 'none';
      list.innerHTML = '';
      return;
    }

    section.style.display = 'block';
    list.innerHTML = renderReviewQueueItemsHtml(reviewTasks, users);
    bindReviewQueueItems(list, currentUser, { navigateToPhase: true });
  }

  function getVisibleReviewTasks(tasks, currentUser) {
    const isManager = ['superadmin', 'koordinator'].includes(currentUser?.role);
    return tasks
      .filter(task => task.reviewStatus === 'submitted' && !task.archivedAt)
      .filter(task => isManager || isTaskPic(task, currentUser) || canReviewTask(task, currentUser))
      .sort((a, b) => new Date(b.submittedAt || b.updatedAt || b.createdAt || 0) - new Date(a.submittedAt || a.updatedAt || a.createdAt || 0));
  }

  function renderReviewQueueItemsHtml(reviewTasks, users) {
    return reviewTasks.map(task => {
      const u = users[task.pic] || { color: '#64748B', initial: task.pic ? task.pic.slice(0, 2).toUpperCase() : '??' };
      const submittedAt = task.submittedAt || task.updatedAt || task.createdAt;
      const submittedLabel = submittedAt ? formatWibDateTime(submittedAt) : '-';
      return `
        <button class="review-queue-item" data-task-id="${task.id}" title="Buka detail ${escapeHtml(task.title)}">
          <div>
            <div class="review-queue-title">${escapeHtml(task.title)}</div>
            <div class="review-queue-meta" style="margin-top: 0.45rem;">
              <span class="task-review-badge is-warning">Menunggu review</span>
              <span>${PHASE_META[task.phase]?.short || ''}</span>
              <span class="priority-badge ${task.priority}">${task.priority}</span>
            </div>
          </div>
          <div class="review-queue-meta">
            <span style="display:inline-flex; align-items:center; gap:0.35rem;">
              <span class="pic-mini-avatar" style="background:${u.color}">${u.initial}</span>
              ${escapeHtml(task.pic || '-')}
            </span>
            <span>Reviewer: ${escapeHtml(task.reviewer || '-')}</span>
            <span>${escapeHtml(submittedLabel)}</span>
          </div>
        </button>
      `;
    }).join('');
  }

  function bindReviewQueueItems(root, currentUser, options = {}) {
    const { navigateToPhase = false } = options;
    root.querySelectorAll('.review-queue-item').forEach(button => {
      button.addEventListener('click', () => {
        const taskId = button.dataset.taskId;
        const task = window.capstoneStore.getById(taskId);
        if (!task) return;
        if (navigateToPhase && task.phase) setPage(task.phase);
        if (canReadTaskDetails(task, currentUser)) openEditTaskModal(taskId);
      });
    });
  }

  function renderPhaseReviewQueueSection(phaseKey, tasks, currentUser, users) {
    const reviewTasks = getVisibleReviewTasks(tasks, currentUser);
    if (reviewTasks.length === 0) return '';

    return `
      <div class="card-box phase-review-queue" style="margin-bottom: 1.5rem;">
        <div class="card-box-header">
          <div>
            <h2>Menunggu Review — ${PHASE_META[phaseKey]?.short || ''}</h2>
            <div class="card-box-subtitle">Tugas pada tahap ini yang sudah diajukan dan perlu diperiksa.</div>
          </div>
          <span class="column-count">${reviewTasks.length} tugas</span>
        </div>
        <div class="review-queue-list">
          ${renderReviewQueueItemsHtml(reviewTasks, users)}
        </div>
      </div>
    `;
  }

  function renderDashboardCharts(tasks) {
    // 1. Doughnut / Pie Chart (SVG Render - Works 100% offline & fast)
    const statusContainer = document.getElementById('statusChartContainer');
    if (statusContainer) {
      const counts = {
        'Selesai': tasks.filter(isTaskCompletionVerified).length,
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
        const done = pTasks.filter(isTaskCompletionVerified).length;
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
    ensureDocumentArchivesLoadedForMeetingCards();

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
      const baArchive = getMeetingBeritaAcaraArchive(m.id);
      const baArchiveId = baArchive ? encodeURIComponent(baArchive.id) : '';

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
          <button class="btn btn-secondary generate-ba-btn" data-meeting-id="${m.id}" data-task-id="${taskId}" title="${m.hasBeritaAcara ? 'Buka kembali form berita acara untuk revisi atau preview.' : 'Buat berita acara dari data pertemuan.'}" style="margin-top: 0.5rem; width: 100%; font-size: 0.775rem; padding: 0.35rem 0.6rem; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
            ${m.hasBeritaAcara ? '📝 Buka Form BA' : '📝 Buat BA dari Form'}
          </button>
          <button class="btn btn-secondary upload-ba-manual-btn" data-meeting-id="${m.id}" data-task-id="${taskId}" title="${m.hasBeritaAcara ? 'Upload BA manual versi baru ke arsip dokumen.' : 'Upload BA manual yang sudah dibuat di luar aplikasi.'}" style="margin-top: 0.4rem; width: 100%; font-size: 0.775rem; padding: 0.35rem 0.6rem; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
            ${m.hasBeritaAcara ? '📎 Upload File BA Baru' : '📎 Upload File BA'}
          </button>
          ${baArchive ? `
            <a class="btn btn-primary meeting-ba-view-btn" href="backend/api/index.php?resource=document-archives&id=${baArchiveId}&view=1" target="_blank" rel="noopener" style="margin-top: 0.4rem; width: 100%; font-size: 0.775rem; padding: 0.35rem 0.6rem; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
              👁️ Lihat File BA
            </a>
          ` : m.hasBeritaAcara ? `<div class="meeting-ba-note">BA sudah ditandai ada. File manual belum terhubung ke pertemuan ini.</div>` : ''}
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

    meetingsContainer.querySelectorAll('.upload-ba-manual-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        uploadManualBeritaAcara(btn.dataset.meetingId, btn.dataset.taskId);
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
        runUiAction(btn, () => deleteMeeting(btn.dataset.meetingId, btn.dataset.taskId));
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

  function toDateTimeLocalValue(value) {
    if (!value) return '';
    const parts = getWibDateParts(value);
    if (!parts) return '';
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hours}:${parts.minutes}`;
  }

  function getReviewStatusMeta(status = 'none') {
    const map = {
      none: { label: 'Belum diajukan', tone: 'neutral' },
      submitted: { label: 'Menunggu review', tone: 'warning' },
      revision_requested: { label: 'Perlu revisi', tone: 'danger' },
      approved: { label: 'Disetujui', tone: 'success' }
    };
    return map[status] || map.none;
  }

  function isTaskCompletionVerified(task) {
    if (!task || task.status !== 'Selesai') return false;
    return !task.reviewer || ['none', 'approved'].includes(task.reviewStatus || 'none');
  }

  function getTaskDeadlineMeta(task) {
    if (!task?.dueAt || task.archivedAt || isTaskCompletionVerified(task)) return null;
    const dueAt = parseWibDate(task.dueAt);
    if (!dueAt) return null;
    const diffMs = dueAt.getTime() - Date.now();
    const absDays = Math.max(0, Math.ceil(Math.abs(diffMs) / 86400000));
    if (diffMs < 0) {
      return { tone: 'danger', label: absDays <= 1 ? 'Lewat hari ini' : `Lewat ${absDays} hari`, date: formatWibDateTime(task.dueAt) };
    }
    if (diffMs <= 3 * 86400000) {
      const dayLabel = absDays <= 1 ? 'hari ini' : `${absDays} hari lagi`;
      return { tone: 'warning', label: `Jatuh tempo ${dayLabel}`, date: formatWibDateTime(task.dueAt) };
    }
    return { tone: 'neutral', label: formatWibDateOnly(task.dueAt), date: formatWibDateTime(task.dueAt) };
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

    if (!taskId) {
      for (const candidateTask of window.capstoneStore.getAll()) {
        const meeting = (candidateTask.meetings || []).find(m => m.id === meetingId);
        if (meeting) return { meeting, task: candidateTask };
      }
    }

    const generalMeeting = (window.capstoneStore.getMeetings?.() || []).find(m => m.id === meetingId);
    return { meeting: generalMeeting || null, task: generalMeeting?.taskId ? window.capstoneStore.getById(generalMeeting.taskId) : null };
  }

  /* ==========================================
     Render Halaman Kanban Tahapan
     ========================================== */
  function getFilteredPhaseTasks(phaseKey) {
    const currentUser = window.capstoneStore.getCurrentUser();
    const canViewArchive = currentUser?.role === 'superadmin';
    const allPhaseTasks = window.capstoneStore.getByPhase(phaseKey);
    let filteredTasks = showArchivedTasks && canViewArchive
      ? allPhaseTasks
      : allPhaseTasks.filter(t => !t.archivedAt);

    if (activeSearchQuery.trim()) {
      const q = activeSearchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(t => [t.id, t.title, t.description, t.pic].some(value => String(value || '').toLowerCase().includes(q)));
    }
    if (activePicFilter !== 'SEMUA') {
      filteredTasks = filteredTasks.filter(t => t.pic === activePicFilter);
    }
    if (activePriorityFilter !== 'SEMUA') {
      filteredTasks = filteredTasks.filter(t => t.priority === activePriorityFilter);
    }
    if (activeReviewFilter !== 'SEMUA') filteredTasks = filteredTasks.filter(task => (task.reviewStatus || 'none') === activeReviewFilter);
    if (activeWorkFilter !== 'all') filteredTasks = getWorkTasks(activeWorkFilter, filteredTasks, currentUser);
    return filteredTasks;
  }

  function getTaskReviewHighlight(task, user) {
    if (task.archivedAt) return null;
    if (task.reviewStatus === 'revision_requested') return { tone: 'revision', label: 'Perlu revisi', detail: `Reviewer: ${task.reviewer || 'Belum ditentukan'}` };
    if (task.reviewStatus !== 'submitted') return null;
    const assigned = task.reviewer === user?.name && !isTaskPic(task, user) && canReviewTask(task, user);
    return {
      tone: assigned ? 'assigned' : 'waiting',
      label: assigned ? 'Perlu kamu review' : 'Menunggu review',
      detail: assigned ? `Diajukan oleh ${task.pic || 'PIC'}` : `Reviewer: ${task.reviewer || 'Belum ditentukan'}`
    };
  }

  function renderTaskReviewHighlight(highlight) {
    if (!highlight) return '';
    return `<div class="task-review-highlight"><span class="task-review-highlight-dot" aria-hidden="true"></span><span><strong>${escapeHtml(highlight.label)}</strong><small>${escapeHtml(highlight.detail)}</small></span></div>`;
  }

  function renderTaskReviewNote(task, interactive = false) {
    const note = task.reviewNote?.trim() || '';
    if (!note && task.reviewStatus !== 'revision_requested') return '';
    const command = interactive
      ? '<button type="button" class="task-review-note-link">Lihat catatan review <span aria-hidden="true">\u2192</span></button>'
      : '<span class="task-review-note-link">Lihat catatan review <span aria-hidden="true">\u2192</span></span>';
    return `<span class="task-review-note-preview"><span class="task-review-note-excerpt">${escapeHtml(note || 'Belum ada catatan review.')}</span>${command}</span>`;
  }

  function renderTaskListHtml(phaseKey, tasks) {
    const user = window.capstoneStore.getCurrentUser();
    return `<div class="task-list" role="list" aria-label="Daftar ${escapeHtml(PHASE_META[phaseKey].short)}">
      ${tasks.map(task => {
        const review = getReviewStatusMeta(task.reviewStatus || 'none');
        const deadline = getTaskDeadlineMeta(task);
        const highlight = getTaskReviewHighlight(task, user);
        return `<article role="listitem" class="task-card task-list-row ${highlight ? `has-review-highlight is-review-${highlight.tone}` : ''} ${task.archivedAt ? 'is-archived' : ''}" data-task-id="${escapeHtml(task.id)}" tabindex="0">
          <div class="task-list-main">${renderTaskReviewHighlight(highlight)}<span class="task-card-code">${escapeHtml(task.id)}</span><h3>${escapeHtml(task.title)}</h3><p>${escapeHtml(getTaskNextAction(task).title)}</p>${renderTaskReviewNote(task, true)}</div>
          <div class="task-list-meta"><span>${escapeHtml(task.pic)}</span><span class="task-review-badge is-${review.tone}">${escapeHtml(task.status)}</span>${task.reviewer && !highlight ? `<span class="task-review-badge is-${review.tone}">${review.label}</span>` : ''}${task.archivedAt ? '<span class="task-archive-badge">Arsip</span>' : ''}${!canUpdateTaskProgress(task, user) ? `<span class="task-readonly-badge">${canReviewTask(task, user) ? 'Reviewer' : 'Hanya lihat'}</span>` : ''}</div>
          <div class="task-list-tail"><span class="priority-badge ${task.priority}">${escapeHtml(task.priority)}</span><span>${deadline ? escapeHtml(deadline.label) : 'Tanpa batas waktu'}</span><span>${(task.checklistDone || []).filter(Boolean).length}/${(task.checklist || []).length} sub-tugas</span></div>
        </article>`;
      }).join('') || '<p class="muted-empty">Tidak ada tugas yang sesuai filter.</p>'}
    </div>`;
  }

  function bindPhaseActionEvents(pageView, phaseKey) {
    pageView.querySelectorAll('.phase-actions [data-work-filter]').forEach(button => {
      button.addEventListener('click', () => {
        activeWorkFilter = button.dataset.workFilter;
        pageView.querySelector('.phase-actions').outerHTML = renderPhaseActionSection(phaseKey, window.capstoneStore.getByPhase(phaseKey), window.capstoneStore.getCurrentUser());
        bindPhaseActionEvents(pageView, phaseKey);
        refreshKanbanBoard(phaseKey);
        pageView.querySelector(`.phase-actions [data-work-filter="${activeWorkFilter}"]`)?.focus({ preventScroll: true });
      });
    });
    pageView.querySelectorAll('.phase-actions [data-expand-work]').forEach(button => {
      button.addEventListener('click', () => {
        const key = `${phaseKey}:${button.dataset.expandWork}`;
        if (expandedActionQueues.has(key)) expandedActionQueues.delete(key);
        else expandedActionQueues.add(key);
        pageView.querySelector('.phase-actions').outerHTML = renderPhaseActionSection(phaseKey, window.capstoneStore.getByPhase(phaseKey), window.capstoneStore.getCurrentUser());
        bindPhaseActionEvents(pageView, phaseKey);
        pageView.querySelector('.phase-actions [data-expand-work]')?.focus({ preventScroll: true });
      });
    });
    pageView.querySelectorAll('.task-action-item').forEach(button => {
      button.addEventListener('click', () => button.dataset.openReviewNotes ? openTaskReviewNotes(button.dataset.taskId) : openEditTaskModal(button.dataset.taskId));
    });
  }

  function renderKanbanBoardHtml(phaseKey, filteredTasks = getFilteredPhaseTasks(phaseKey)) {
    const currentUser = window.capstoneStore.getCurrentUser();
    const users = window.capstoneStore.getUsers();
    return STATUSES.map(status => {
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
    }).join('');
  }

  function refreshKanbanBoard(phaseKey) {
    const pageView = document.getElementById(phaseKey);
    const grid = pageView?.querySelector('.phase-task-board');
    if (!grid) return;
    grid.classList.toggle('kanban-grid', phaseViewMode === 'kanban');
    grid.innerHTML = phaseViewMode === 'list' ? renderTaskListHtml(phaseKey, getFilteredPhaseTasks(phaseKey)) : renderKanbanBoardHtml(phaseKey);
    const count = pageView.querySelector('.phase-result-count');
    if (count) count.textContent = `${getFilteredPhaseTasks(phaseKey).length} tugas`;
    bindKanbanEvents(pageView);
    applyRbacUi();
  }

  function formatPhaseAccessTime(timestamp) {
    const parts = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date(timestamp));
    const part = name => parts.find(item => item.type === name)?.value || '';
    return `${part('weekday')}, ${part('day')} ${part('month')} ${part('year')}, ${part('hour')}:${part('minute')}:${part('second')} WIB`;
  }

  function renderPhaseAccess(phaseKey) {
    const state = phaseAccessState.get(phaseKey);
    const rows = state?.rows || [];
    const serverNow = state?.serverTime + (Date.now() - state?.receivedAt);
    return `<section class="phase-access" aria-label="Akses terakhir tim di ${PHASE_META[phaseKey].short}">
      <div class="phase-access-heading"><div><h3>Akses Terakhir Tim</h3><p>Terakhir aktif di ${PHASE_META[phaseKey].short}</p></div>
        <button type="button" class="sync-refresh-btn phase-access-refresh" title="Perbarui akses terakhir tim" aria-label="Perbarui akses terakhir tim" ${state?.loading ? 'disabled' : ''}>↻</button>
      </div>
      <div class="phase-access-status" role="status">${state?.error ? escapeHtml(state.error) : state?.loading ? 'Memuat akses terakhir...' : ''}</div>
      ${rows.length ? `<ul class="phase-access-list">${rows.map(member => {
        const timestamp = Number(member.lastAccessAt);
        const accessed = Number.isFinite(timestamp) && timestamp > 0;
        const seenAt = Number(member.lastSeenAt);
        const online = seenAt > 0 && serverNow >= seenAt && serverNow - seenAt <= 90000;
        return `<li><span class="phase-access-avatar" aria-hidden="true">${escapeHtml(member.initial || member.name.slice(0, 2))}</span>
          <div><strong>${escapeHtml(member.name)} <span class="phase-presence ${online ? 'is-online' : ''}" title="${online ? 'Aktif di aplikasi dalam 90 detik terakhir' : 'Tidak ada sinyal aktivitas aplikasi dalam 90 detik terakhir'}">${online ? 'Online' : 'Offline'}</span></strong>${accessed
            ? `<time datetime="${new Date(timestamp).toISOString()}">${escapeHtml(formatPhaseAccessTime(timestamp))}</time>`
            : '<span>Belum ada akses tercatat</span>'}</div></li>`;
      }).join('')}</ul>` : !state?.loading && !state?.error ? '<p class="phase-access-empty">Belum ada akses tercatat.</p>' : ''}
    </section>`;
  }

  function updatePhaseAccessSection(phaseKey) {
    const section = document.querySelector(`#${phaseKey} .phase-access`);
    if (!section) return;
    section.outerHTML = renderPhaseAccess(phaseKey);
    document.querySelector(`#${phaseKey} .phase-access-refresh`)?.addEventListener('click', () => loadPhaseAccess(phaseKey, true));
  }

  async function loadPhaseAccess(phaseKey, force = false) {
    const user = window.capstoneStore.getCurrentUser();
    if (!user || !window.RBAC.canPage(user, phaseKey)) return;
    const previous = phaseAccessState.get(phaseKey);
    if (previous?.loading || (!force && previous?.userId === user.id && Date.now() - previous.loadedAt < 30000)) return;
    const state = { userId: user.id, rows: previous?.userId === user.id ? previous.rows : [], serverTime: previous?.serverTime, receivedAt: previous?.receivedAt, loading: true, error: '', loadedAt: 0 };
    phaseAccessState.set(phaseKey, state);
    updatePhaseAccessSection(phaseKey);
    try {
      const summary = await window.capstoneStore.getPhaseAccess(phaseKey);
      if (phaseAccessState.get(phaseKey) !== state || window.capstoneStore.getCurrentUser()?.id !== user.id) return;
      state.rows = summary.members;
      state.serverTime = summary.serverTime;
      state.receivedAt = Date.now();
    } catch (error) {
      state.error = error.message || 'Akses terakhir tim belum dapat dimuat.';
    } finally {
      if (phaseAccessState.get(phaseKey) === state && window.capstoneStore.getCurrentUser()?.id === user.id) {
        state.loading = false;
        state.loadedAt = Date.now();
        updatePhaseAccessSection(phaseKey);
      }
    }
  }

  function renderPhaseView(phaseKey) {
    const pageView = document.getElementById(phaseKey);
    if (!pageView) return;
    ensureDocumentArchivesLoadedForMeetingCards();

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

    const filteredTasks = getFilteredPhaseTasks(phaseKey);

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

      ${renderPhaseAccess(phaseKey)}

      ${renderPhaseActionSection(phaseKey, allPhaseTasks, currentUser)}

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
          <select id="taskReviewFilter-${phaseKey}" class="select-filter" aria-label="Status review">
            ${[['SEMUA', 'Semua review'], ['none', 'Belum diajukan'], ['submitted', 'Menunggu review'], ['revision_requested', 'Perlu revisi'], ['approved', 'Disetujui']].map(([value, label]) => `<option value="${value}" ${activeReviewFilter === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
          <button type="button" class="btn btn-secondary reset-task-filters-btn" title="Reset filter">Reset filter</button>
          ${canViewArchive ? `
            <label class="archive-toggle-filter" title="Tampilkan tugas yang sudah diarsipkan">
              <input type="checkbox" id="taskArchiveToggle-${phaseKey}" ${showArchivedTasks ? 'checked' : ''} />
              <span>Tampilkan arsip (${archivedCount})</span>
            </label>
          ` : ''}
        </div>
        <div class="phase-toolbar-actions">
          ${currentUser?.role === 'superadmin' ? `<button class="btn btn-secondary copy-phase-tasks-btn" data-phase="${phaseKey}" title="Salin daftar tugas yang sedang tampil untuk dibandingkan di ChatGPT">📋 Salin Tugas</button>` : ''}
          ${currentUser?.role === 'superadmin' ? `<button type="button" class="btn btn-secondary phase-task-report-btn" data-phase="${phaseKey}"><span aria-hidden="true">&#9636;</span> Laporan</button>` : ''}
          <button class="btn btn-secondary add-meeting-page-btn" data-phase="${phaseKey}">🗓️ + Buat Pertemuan</button>
          <button class="btn btn-primary add-task-btn" data-phase="${phaseKey}">+ Tambah Tugas</button>
        </div>
      </div>

      <div class="phase-view-toolbar"><span class="phase-result-count">${filteredTasks.length} tugas</span>
        <div class="task-view-switch" role="group" aria-label="Tampilan tugas">
          <button type="button" data-task-view="kanban" aria-pressed="${phaseViewMode === 'kanban'}">▥ Kanban</button>
          <button type="button" data-task-view="list" aria-pressed="${phaseViewMode === 'list'}">☷ Daftar</button>
        </div>
      </div>
      <div class="kanban-board-wrapper">
        <div class="phase-task-board ${phaseViewMode === 'kanban' ? 'kanban-grid' : ''}">
          ${phaseViewMode === 'list' ? renderTaskListHtml(phaseKey, filteredTasks) : renderKanbanBoardHtml(phaseKey, filteredTasks)}
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
              const baArchive = getMeetingBeritaAcaraArchive(m.id);
              const baArchiveId = baArchive ? encodeURIComponent(baArchive.id) : '';
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
                  <button class="btn btn-secondary generate-ba-btn" data-meeting-id="${m.id}" data-task-id="${taskId}" title="${m.hasBeritaAcara ? 'Buka kembali form berita acara untuk revisi atau preview.' : 'Buat berita acara dari data pertemuan.'}" style="margin-top: 0.5rem; width: 100%; font-size: 0.775rem; padding: 0.35rem 0.6rem; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
                    ${m.hasBeritaAcara ? '📝 Buka Form BA' : '📝 Buat BA dari Form'}
                  </button>
                  <button class="btn btn-secondary upload-ba-manual-btn" data-meeting-id="${m.id}" data-task-id="${taskId}" title="${m.hasBeritaAcara ? 'Upload BA manual versi baru ke arsip dokumen.' : 'Upload BA manual yang sudah dibuat di luar aplikasi.'}" style="margin-top: 0.4rem; width: 100%; font-size: 0.775rem; padding: 0.35rem 0.6rem; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
                    ${m.hasBeritaAcara ? '📎 Upload File BA Baru' : '📎 Upload File BA'}
                  </button>
                  ${baArchive ? `
                    <a class="btn btn-primary meeting-ba-view-btn" href="backend/api/index.php?resource=document-archives&id=${baArchiveId}&view=1" target="_blank" rel="noopener" style="margin-top: 0.4rem; width: 100%; font-size: 0.775rem; padding: 0.35rem 0.6rem; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
                      👁️ Lihat File BA
                    </a>
                  ` : m.hasBeritaAcara ? `<div class="meeting-ba-note">BA sudah ditandai ada. File manual belum terhubung ke pertemuan ini.</div>` : ''}
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

    pageView.querySelector('.phase-access-refresh')?.addEventListener('click', () => loadPhaseAccess(phaseKey, true));
    loadPhaseAccess(phaseKey);
    bindPhaseActionEvents(pageView, phaseKey);
    pageView.querySelector(`#taskReviewFilter-${phaseKey}`)?.addEventListener('change', event => {
      activeReviewFilter = event.target.value;
      refreshKanbanBoard(phaseKey);
    });
    pageView.querySelector('.reset-task-filters-btn')?.addEventListener('click', () => {
      activeSearchQuery = '';
      activePicFilter = 'SEMUA';
      activePriorityFilter = 'SEMUA';
      activeReviewFilter = 'SEMUA';
      activeWorkFilter = 'all';
      showArchivedTasks = false;
      pageView.querySelector(`#taskSearchInput-${phaseKey}`).value = '';
      [`taskPicSelect-${phaseKey}`, `taskPrioritySelect-${phaseKey}`, `taskReviewFilter-${phaseKey}`].forEach(id => { document.getElementById(id).value = 'SEMUA'; });
      const archiveToggle = pageView.querySelector(`#taskArchiveToggle-${phaseKey}`);
      if (archiveToggle) archiveToggle.checked = false;
      pageView.querySelector('.phase-actions').outerHTML = renderPhaseActionSection(phaseKey, allPhaseTasks, currentUser);
      bindPhaseActionEvents(pageView, phaseKey);
      refreshKanbanBoard(phaseKey);
    });
    pageView.querySelectorAll('[data-task-view]').forEach(button => {
      button.addEventListener('click', () => {
        phaseViewMode = button.dataset.taskView;
        localStorage.setItem('capstone_task_view_v1', phaseViewMode);
        pageView.querySelectorAll('[data-task-view]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        refreshKanbanBoard(phaseKey);
      });
    });

    pageView.querySelectorAll('.generate-ba-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openBeritaAcaraModal(btn.dataset.meetingId, btn.dataset.taskId);
      });
    });

    pageView.querySelectorAll('.upload-ba-manual-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        uploadManualBeritaAcara(btn.dataset.meetingId, btn.dataset.taskId);
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
        runUiAction(btn, () => deleteMeeting(btn.dataset.meetingId, btn.dataset.taskId));
      });
    });

    bindProgressNoteEvents(pageView, phaseKey);
    bindReviewQueueItems(pageView, currentUser, { navigateToPhase: false });

    const searchInput = document.getElementById(`taskSearchInput-${phaseKey}`);
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        activeSearchQuery = e.target.value;
        refreshKanbanBoard(phaseKey);
      });
    }

    const picSelect = document.getElementById(`taskPicSelect-${phaseKey}`);
    if (picSelect) {
      picSelect.addEventListener('change', (e) => {
        activePicFilter = e.target.value;
        refreshKanbanBoard(phaseKey);
      });
    }

    const prioritySelect = document.getElementById(`taskPrioritySelect-${phaseKey}`);
    if (prioritySelect) {
      prioritySelect.addEventListener('change', (e) => {
        activePriorityFilter = e.target.value;
        refreshKanbanBoard(phaseKey);
      });
    }

    const archiveToggle = document.getElementById(`taskArchiveToggle-${phaseKey}`);
    if (archiveToggle) {
      archiveToggle.addEventListener('change', (e) => {
        showArchivedTasks = e.target.checked;
        refreshKanbanBoard(phaseKey);
      });
    }

    pageView.querySelectorAll('.add-task-btn').forEach(btn => {
      btn.addEventListener('click', () => openNewTaskModal(btn.dataset.phase));
    });

    pageView.querySelectorAll('.add-meeting-page-btn').forEach(btn => {
      btn.addEventListener('click', () => openNewMeetingModal(btn.dataset.phase));
    });

    pageView.querySelectorAll('.copy-phase-tasks-btn').forEach(btn => {
      btn.addEventListener('click', () => copyPhaseTasksForChatGpt(btn.dataset.phase));
    });
    pageView.querySelectorAll('.phase-task-report-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.capstoneStore.getCurrentUser()?.role !== 'superadmin') return;
        window.TaskReportUI?.render({ phase: btn.dataset.phase });
        setPage('reports');
      });
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

  function buildPhaseTasksMarkdown(phaseKey) {
    const meta = PHASE_META[phaseKey] || { label: phaseKey, short: phaseKey };
    const tasks = getFilteredPhaseTasks(phaseKey);
    const allPhaseTasks = window.capstoneStore.getByPhase(phaseKey);
    const generatedAt = formatWibDateTime(Date.now(), true);
    const filterLines = [
      `Search: ${activeSearchQuery.trim() || 'Semua'}`,
      `PIC: ${activePicFilter}`,
      `Prioritas: ${activePriorityFilter}`,
      `Review: ${activeReviewFilter}`,
      `Pekerjaan: ${activeWorkFilter}`,
      `Arsip: ${showArchivedTasks ? 'Ditampilkan' : 'Disembunyikan'}`
    ];

    const lines = [
      `# Rekap Tugas ${meta.short}`,
      '',
      `Tahap: ${meta.label}`,
      `Tanggal salin: ${generatedAt}`,
      `Jumlah tampil: ${tasks.length} dari ${allPhaseTasks.length} tugas`,
      '',
      '## Filter Saat Ini',
      ...filterLines.map(line => `- ${line}`),
      '',
      '## Daftar Tugas'
    ];

    if (!tasks.length) {
      lines.push('', 'Tidak ada tugas yang sesuai filter saat ini.');
      return lines.join('\n');
    }

    tasks.forEach((task, index) => {
      const checklist = task.checklist || [];
      const checklistDone = task.checklistDone || [];
      const doneCount = checklistDone.filter(Boolean).length;
      lines.push(
        '',
        `### ${index + 1}. ${task.title}`,
        `- ID: ${task.id}`,
        `- Tahap: ${PHASE_META[task.phase]?.short || task.phase}`,
        `- PIC: ${task.pic || '-'}`,
        `- Status: ${task.status || '-'}`,
        `- Prioritas: ${task.priority || '-'}`,
        `- Reviewer: ${task.reviewer || '-'}`,
        `- Status Review: ${getReviewStatusMeta(task.reviewStatus || 'none').label}`,
        `- Mulai: ${task.startAt ? formatWibDateTime(task.startAt) : '-'}`,
        `- Deadline: ${task.dueAt ? formatWibDateTime(task.dueAt) : '-'}`,
        `- Update Terakhir: ${formatTaskUpdatedAt(task)}`,
        `- Arsip: ${task.archivedAt ? formatWibDateTime(task.archivedAt) : 'Tidak'}`,
        '',
        'Deskripsi:',
        `${task.description || '-'}`,
        '',
        `Checklist (${doneCount}/${checklist.length}):`
      );

      if (checklist.length) {
        checklist.forEach((item, itemIndex) => {
          lines.push(`- [${checklistDone[itemIndex] ? 'x' : ' '}] ${item}`);
        });
      } else {
        lines.push('- -');
      }

      if (task.deliverableUrl) {
        lines.push('', `Luaran: ${task.deliverableUrl}`);
      }
    });

    return lines.join('\n');
  }

  function copyTextToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok ? Promise.resolve() : Promise.reject(new Error('Clipboard copy failed'));
  }

  function copyPhaseTasksForChatGpt(phaseKey) {
    const currentUser = window.capstoneStore.getCurrentUser();
    if (currentUser?.role !== 'superadmin') return;
    const text = buildPhaseTasksMarkdown(phaseKey);
    copyTextToClipboard(text).then(() => {
      Swal.fire({
        icon: 'success',
        title: 'Daftar tugas disalin',
        text: 'Daftar tugas siap ditempel ke ChatGPT untuk compare.',
        timer: 1400,
        showConfirmButton: false
      });
    }).catch(() => {
      Swal.fire({
        icon: 'info',
        title: 'Tidak bisa menyalin otomatis',
        text: 'Browser menolak akses clipboard. Buka snapshot JSON atau coba lagi dari HTTPS/local.',
        confirmButtonColor: '#1E40AF'
      });
    });
  }

  function renderProgressNoteSection(phaseKey, currentUser) {
    const note = window.capstoneStore.getProgressNote?.(phaseKey) || { content: '' };
    const canEdit = canEditProgressNote(currentUser);
    const content = canEdit && progressNoteDrafts.has(phaseKey) ? progressNoteDrafts.get(phaseKey) : (note.content || '');
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
      progressNoteDrafts.set(phaseKey, input.value);
      if (preview) preview.textContent = input.value || 'Belum ada update progress untuk tahap ini.';
    });

    saveBtn?.addEventListener('click', () => runUiAction(saveBtn, async () => {
      const saved = await window.capstoneStore.saveProgressNote(phaseKey, input?.value || '');
      progressNoteDrafts.delete(phaseKey);
      if (preview) preview.textContent = saved.content || 'Belum ada update progress untuk tahap ini.';
      renderPhaseView(phaseKey);
      Swal.fire({
        icon: 'success',
        title: 'Update progress tersimpan',
        text: 'Anggota tim dapat melihat rangkuman terbaru.',
        timer: 1300,
        showConfirmButton: false
      });
    }));

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
    const reviewMeta = getReviewStatusMeta(t.reviewStatus);
    const deadlineMeta = getTaskDeadlineMeta(t);
    const highlight = getTaskReviewHighlight(t, currentUser);

    return `
      <div class="task-card ${highlight ? `has-review-highlight is-review-${highlight.tone}` : ''} ${isReadonlyProgress ? 'is-readonly-progress' : ''} ${isArchived ? 'is-archived' : ''}" draggable="${canUpdate && !isArchived ? 'true' : 'false'}" data-task-id="${t.id}" style="${isMine && !highlight ? 'border-color: var(--ut-blue-primary);' : ''}">
        <div class="task-priority-indicator" style="background: ${priorityColors[t.priority] || 'transparent'}"></div>
        ${renderTaskReviewHighlight(highlight)}
        <div class="card-header-row">
          <div class="card-title-stack">
            <span class="task-card-code">${escapeHtml(t.id || '-')}</span>
            <div class="card-title">${escapeHtml(t.title)}</div>
          </div>
          <div style="display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end;">
            ${isArchived ? '<span class="task-archive-badge">Arsip</span>' : ''}
            ${isReadonlyProgress ? `<span class="task-readonly-badge">${canReviewTask(t, currentUser) ? 'Reviewer' : 'Hanya lihat'}</span>` : ''}
            ${t.reviewer && !highlight ? `<span class="task-review-badge is-${reviewMeta.tone}">${reviewMeta.label}</span>` : ''}
            <span class="priority-badge ${t.priority}">${t.priority}</span>
          </div>
        </div>
        <div class="card-description">${escapeHtml(t.description || '')}</div>
        <div class="task-action-summary">${escapeHtml(getTaskNextAction(t).title)}</div>
        ${renderTaskReviewNote(t, true)}
        ${deadlineMeta ? `
          <div class="task-deadline-badge is-${deadlineMeta.tone}" title="${escapeHtml(deadlineMeta.date)}">
            <span>Batas waktu</span>
            <strong>${escapeHtml(deadlineMeta.label)}</strong>
          </div>
        ` : ''}
        ${t.deliverableUrl ? `
          <a class="task-deliverable-link" href="${escapeHtml(t.deliverableUrl)}" target="_blank" rel="noopener noreferrer">
            Buka luaran
          </a>
        ` : ''}
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
              <th>Status Akun</th>
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
              const formattedLastSeen = u.isActive === false ? 'Akun nonaktif' : formatLastSeen(u.lastSeen || u.lastLogin);
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
                  <td><span class="account-status ${u.isActive === false ? 'is-inactive' : ''}">${u.isActive === false ? 'Nonaktif' : 'Aktif'}</span></td>
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
                      ${currentUser.role === 'superadmin' && u.role !== 'superadmin' && currentUser.id !== u.id ? `<button type="button" class="btn btn-secondary user-status-btn" data-user-id="${escapeHtml(u.id)}" aria-label="${u.isActive === false ? 'Aktifkan' : 'Nonaktifkan'} ${escapeHtml(u.name)}">${u.isActive === false ? 'Aktifkan' : 'Nonaktifkan'}</button>` : ''}
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

    container.querySelectorAll('.user-status-btn').forEach(btn => {
      btn.addEventListener('click', () => runUiAction(btn, async () => {
        const user = window.capstoneStore.getUserById(btn.dataset.userId);
        if (!user || window.capstoneStore.getCurrentUser()?.role !== 'superadmin') return;
        const activating = user.isActive === false;
        const pending = tasks.filter(task => !task.archivedAt && !isTaskCompletionVerified(task) && (task.pic === user.name || task.reviewer === user.name)).length;
        const answer = await Swal.fire({
          title: `${activating ? 'Aktifkan' : 'Nonaktifkan'} ${user.name}?`,
          text: activating ? 'Akun dapat login dan dipilih kembali sebagai anggota tim.' : `Akun tidak dapat login atau dipilih untuk penugasan dan berita acara. Riwayat tetap tersimpan.${pending ? ` Ada ${pending} tugas berjalan yang perlu diperiksa penanggung jawabnya.` : ''}`,
          icon: 'warning', showCancelButton: true, confirmButtonText: activating ? 'Aktifkan' : 'Nonaktifkan', cancelButtonText: 'Batal'
        });
        if (!answer.isConfirmed) return;
        await window.capstoneStore.setUserActive(user.id, activating);
        phaseAccessState.clear();
        renderCurrentView();
      }));
    });

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
              runUiAction(btn, async () => {
                await window.capstoneStore.deleteUser(uId);
                renderCurrentView();
                Swal.fire('Terhapus!', 'Pengguna berhasil dihapus.', 'success');
              });
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
  async function loadAuditView() {
    if (auditLoading || window.capstoneStore.getCurrentUser()?.role !== 'superadmin') return;
    auditLoading = true;
    auditLoadError = '';
    renderAuditLogView();
    try {
      await window.capstoneStore.fetchAuditData();
    } catch (error) {
      auditLoadError = error.message;
    } finally {
      auditLoading = false;
      if (currentPage === 'audit') renderAuditLogView();
    }
  }

  async function loadBrowserRecoveryBackups() {
    if (window.capstoneStore.getCurrentUser()?.role !== 'superadmin') return;
    const rows = await window.capstoneStore.getBrowserBackups();
    if (window.capstoneStore.getCurrentUser()?.role !== 'superadmin') return;
    const container = document.getElementById('browserBackupList');
    container.innerHTML = rows.length ? rows.map(backup => `<div class="browser-backup-row">
      <div><strong>${escapeHtml(backup.ownerId)}</strong><span>${escapeHtml(formatPhaseAccessTime(backup.createdAt))} · ${Math.ceil(backup.sizeBytes / 1024)} KB</span></div>
      <button type="button" class="btn btn-secondary download-browser-backup" data-id="${escapeHtml(backup.id)}">Unduh Cadangan</button>
    </div>`).join('') : '<p class="muted-empty">Belum ada cadangan browser lama.</p>';
    container.querySelectorAll('.download-browser-backup').forEach(button => button.addEventListener('click', () => runUiAction(button, async () => {
      const backup = await window.capstoneStore.getBrowserBackups(button.dataset.id);
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `cadangan-browser-${backup.id.slice(0, 12)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    })));
  }

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

    if (!container || window.capstoneStore.getCurrentUser()?.role !== 'superadmin') return;
    const backupsButton = document.getElementById('loadBrowserBackupsBtn');
    if (backupsButton) backupsButton.onclick = () => runUiAction(backupsButton, loadBrowserRecoveryBackups);
    if (!window.capstoneStore.auditLoaded) {
      container.innerHTML = auditLoadError
        ? `<div class="form-save-error" role="alert">${escapeHtml(auditLoadError)} <button type="button" id="retryAuditLoadBtn" class="btn btn-secondary">Coba lagi</button></div>`
        : '<p class="muted-empty" role="status">Memuat riwayat aktivitas...</p>';
      document.getElementById('retryAuditLoadBtn')?.addEventListener('click', loadAuditView);
      if (!auditLoading && !auditLoadError) loadAuditView();
      return;
    }
    renderUserActivityLogView();

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
      const userKeys = Object.keys(userCounts);
      const actionKeys = Object.keys(actionCounts);
      let topUser = userKeys.length ? userKeys.reduce((a, b) => userCounts[a] > userCounts[b] ? a : b) : '-';
      let topUserCount = topUser !== '-' ? userCounts[topUser] : 0;
      let topAction = actionKeys.length ? actionKeys.reduce((a, b) => actionCounts[a] > actionCounts[b] ? a : b) : '-';
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
          <button id="inlineResetAuditBtn" class="btn btn-secondary">Pulihkan Data Riwayat</button>
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

  function renderUserActivityLogView() {
    const container = document.getElementById('userActivityTableContainer');
    const countBadge = document.getElementById('userActivityCountBadge');
    const userSelect = document.getElementById('activityUserSelect');
    const typeSelect = document.getElementById('activityTypeSelect');
    const currentUser = window.capstoneStore.getCurrentUser();
    if (!container || currentUser?.role !== 'superadmin') return;

    let activities = typeof window.capstoneStore.getUserActivities === 'function'
      ? window.capstoneStore.getUserActivities()
      : [];
    activities = Array.isArray(activities) ? activities : [];

    const users = [...new Set(activities.map(item => item.user).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const types = [...new Set(activities.map(item => item.activity).filter(Boolean))].sort((a, b) => a.localeCompare(b));

    if (userSelect) {
      userSelect.innerHTML = `
        <option value="SEMUA" ${activityUserFilter === 'SEMUA' ? 'selected' : ''}>Semua Pengguna</option>
        ${users.map(name => `<option value="${escapeHtml(name)}" ${activityUserFilter === name ? 'selected' : ''}>${escapeHtml(name)}</option>`).join('')}
      `;
      userSelect.onchange = (event) => {
        activityUserFilter = event.target.value || 'SEMUA';
        renderUserActivityLogView();
      };
    }

    if (typeSelect) {
      typeSelect.innerHTML = `
        <option value="SEMUA" ${activityTypeFilter === 'SEMUA' ? 'selected' : ''}>Semua Aktivitas</option>
        ${types.map(type => `<option value="${escapeHtml(type)}" ${activityTypeFilter === type ? 'selected' : ''}>${escapeHtml(type)}</option>`).join('')}
      `;
      typeSelect.onchange = (event) => {
        activityTypeFilter = event.target.value || 'SEMUA';
        renderUserActivityLogView();
      };
    }

    if (activityUserFilter !== 'SEMUA') {
      activities = activities.filter(item => item.user === activityUserFilter);
    }
    if (activityTypeFilter !== 'SEMUA') {
      activities = activities.filter(item => item.activity === activityTypeFilter);
    }

    activities = activities
      .slice()
      .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));

    if (countBadge) countBadge.textContent = `${activities.length} aktivitas`;

    if (!activities.length) {
      container.innerHTML = `
        <div class="flow-document-empty">Belum ada aktivitas pengguna yang sesuai dengan filter.</div>
      `;
      return;
    }

    const rowsHtml = activities.slice(0, 80).map(item => {
      const target = item.target || {};
      const targetName = target.name || target.id || '-';
      const targetType = target.type || 'Target';
      const deviceShort = item.device ? (item.device.length > 56 ? `${item.device.slice(0, 56)}...` : item.device) : '-';
      return `
        <tr class="audit-detail-row">
          <td class="audit-td-time">
            <div class="audit-date-primary">${escapeHtml(formatWibDateOnly(item.timestamp))}</div>
            <div class="audit-date-secondary">${escapeHtml(formatWibClock(item.timestamp, true))}</div>
          </td>
          <td>
            <div class="audit-actor-name">${escapeHtml(item.user || '-')}</div>
            <div class="audit-actor-role">${escapeHtml(getRoleLabel({ role: item.role }))}</div>
          </td>
          <td>
            <div class="audit-action-name">${escapeHtml(item.activity || 'Aktivitas')}</div>
            <div class="audit-action-tag">${escapeHtml(item.activityTag || '-')}</div>
          </td>
          <td>
            <div class="audit-object-name">${escapeHtml(targetName)}</div>
            <div class="audit-object-meta">${escapeHtml(item.page || '-')} / ${escapeHtml(targetType)}</div>
          </td>
          <td>
            <div class="activity-detail-text">${escapeHtml(item.details || '-')}</div>
            <div class="audit-device-val">${escapeHtml(item.ip || '-')} · ${escapeHtml(deviceShort)}</div>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="activity-log-table-wrap">
        <table class="audit-detail-table activity-log-table">
          <thead>
            <tr>
              <th class="audit-th-time">Waktu</th>
              <th class="audit-th-actor">Pengguna</th>
              <th class="audit-th-action">Aktivitas</th>
              <th class="audit-th-object">Menu / Target</th>
              <th class="audit-th-changes">Detail</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
      ${activities.length > 80 ? `<div class="activity-log-note">Menampilkan 80 aktivitas terbaru dari filter ini.</div>` : ''}
    `;
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
      card.draggable = canDragCard && !card.classList.contains('task-list-row');
      card.tabIndex = 0;
      card.setAttribute('aria-label', `${task.id}: ${task.title}`);
      card.addEventListener('keydown', event => {
        if (event.target !== card || !['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        if (canReadTaskDetails(task, currentUser)) openEditTaskModal(task.id);
      });
      if (canDragCard) {
        card.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', card.dataset.taskId);
          card.style.opacity = '0.5';
        });

        card.addEventListener('dragend', () => {
          card.style.opacity = '1';
        });
      }
      card.addEventListener('click', event => {
        if (event.target.closest('.task-review-note-link')) {
          openTaskReviewNotes(task.id);
          return;
        }
        if (canReadTaskDetails(task, currentUser)) openEditTaskModal(card.dataset.taskId);
      });
      card.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', event => event.stopPropagation());
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
        if (targetStatus === 'Selesai' && task?.reviewer && task.reviewStatus !== 'approved') {
          Swal.fire({
            icon: 'info',
            title: 'Perlu review dulu',
            text: 'Tugas ini punya reviewer. Ajukan review dan tunggu persetujuan sebelum dipindah ke Selesai.',
            confirmButtonColor: '#1E40AF'
          });
          return;
        }

        if (taskId && targetStatus) {
          runUiAction(col, async () => {
            await window.capstoneStore.update(taskId, { status: targetStatus });
            renderCurrentView();
          });
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

    document.getElementById('modalCloseBtn')?.addEventListener('click', () => attemptCloseModal(taskModalBackdrop, closeTaskModal));
    document.getElementById('modalCancelBtn')?.addEventListener('click', () => attemptCloseModal(taskModalBackdrop, closeTaskModal));
    document.getElementById('addMeetingBtn')?.addEventListener('click', () => {
      addMeetingToModal();
    });

    document.getElementById('dashAddMeetingBtn')?.addEventListener('click', () => {
      openNewMeetingModal('');
    });

    bindBackdropDismiss(taskModalBackdrop, closeTaskModal);

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
        runUiAction(taskForm, saveTaskFromModal);
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
              runUiAction(taskForm, async () => {
                await window.capstoneStore.delete(taskId);
                closeTaskModal();
                renderCurrentView();
                Swal.fire('Terhapus!', 'Tugas berhasil dihapus.', 'success');
              });
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
          runUiAction(taskForm, async () => {
          await window.capstoneStore.update(taskId, { archivedAt: isArchived ? null : Date.now() });
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
      });
    }

    document.getElementById('submitReviewBtn')?.addEventListener('click', () => runUiAction(taskForm, () => submitTaskReviewAction('submit')));
    document.getElementById('cancelReviewBtn')?.addEventListener('click', () => runUiAction(taskForm, () => submitTaskReviewAction('cancel_submit')));
    document.getElementById('requestRevisionBtn')?.addEventListener('click', () => runUiAction(taskForm, () => submitTaskReviewAction('request_revision')));
    document.getElementById('approveTaskBtn')?.addEventListener('click', () => runUiAction(taskForm, () => submitTaskReviewAction('approve')));

    // Modal Pertemuan Standalone Listeners
    bindMeetingModalListeners(document.getElementById('meetingModalBackdrop'));
  }

  function setTaskModalAccess({ canUpdateProgress, canManageStructure, canDelete, canSubmit, canSubmitReview = false, canCancelReview = false, canReview = false, canArchive = false, archiveLabel = 'Arsipkan Tugas', readonlyMessage = 'Status dan checklist hanya bisa diubah oleh PIC tugas ini.' }) {
    modalTaskCanUpdateProgress = Boolean(canUpdateProgress);
    modalTaskCanManageStructure = Boolean(canManageStructure);
    modalTaskCanSubmitReview = Boolean(canSubmitReview);
    modalTaskCanCancelReview = Boolean(canCancelReview);
    modalTaskCanReview = Boolean(canReview);
    const isReadonlyMode = !modalTaskCanUpdateProgress && !modalTaskCanManageStructure && !modalTaskCanCancelReview && !modalTaskCanReview;

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

    ['taskTitleInput', 'taskDescInput', 'taskPhaseSelect', 'taskPicSelect', 'taskPrioritySelect', 'taskStartAtInput', 'taskDueAtInput'].forEach(id => {
      const field = document.getElementById(id);
      if (field) field.disabled = !modalTaskCanManageStructure;
    });

    const reviewerSelect = document.getElementById('taskReviewerSelect');
    const currentUser = window.capstoneStore.getCurrentUser();
    if (reviewerSelect) {
      reviewerSelect.disabled = !(modalTaskCanManageStructure && currentUser?.role === 'superadmin');
    }

    const statusSelect = document.getElementById('taskStatusSelect');
    if (statusSelect) statusSelect.disabled = !modalTaskCanUpdateProgress;

    const deliverableInput = document.getElementById('taskDeliverableUrlInput');
    if (deliverableInput) deliverableInput.disabled = !(modalTaskCanUpdateProgress || modalTaskCanManageStructure);

    const reviewNoteInput = document.getElementById('taskReviewNoteInput');
    if (reviewNoteInput) reviewNoteInput.disabled = !(modalTaskCanReview || modalTaskCanManageStructure || modalTaskCanSubmitReview || modalTaskCanCancelReview);

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
      submitBtn.classList.toggle('btn-primary', !modalTaskCanSubmitReview && !modalTaskCanReview);
      submitBtn.classList.toggle('btn-secondary', modalTaskCanSubmitReview || modalTaskCanReview);
    }

    const submitReviewBtn = document.getElementById('submitReviewBtn');
    if (submitReviewBtn) {
      submitReviewBtn.style.display = modalTaskCanSubmitReview ? 'inline-flex' : 'none';
      const task = window.capstoneStore.getById(document.getElementById('taskIdInput')?.value);
      submitReviewBtn.disabled = currentUser?.role === 'member' && !task?.reviewer;
      submitReviewBtn.title = submitReviewBtn.disabled ? 'Minta superadmin menentukan reviewer terlebih dahulu.' : 'Ajukan pekerjaan untuk diperiksa';
      submitReviewBtn.classList.toggle('btn-primary', modalTaskCanSubmitReview);
      submitReviewBtn.classList.toggle('btn-secondary', !modalTaskCanSubmitReview);
    }

    const cancelReviewBtn = document.getElementById('cancelReviewBtn');
    if (cancelReviewBtn) cancelReviewBtn.style.display = modalTaskCanCancelReview ? 'inline-flex' : 'none';

    const requestRevisionBtn = document.getElementById('requestRevisionBtn');
    if (requestRevisionBtn) requestRevisionBtn.style.display = modalTaskCanReview ? 'inline-flex' : 'none';

    const approveTaskBtn = document.getElementById('approveTaskBtn');
    if (approveTaskBtn) approveTaskBtn.style.display = modalTaskCanReview ? 'inline-flex' : 'none';
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

    document.getElementById('meetingModalCloseBtn')?.addEventListener('click', () => attemptCloseModal(backdrop, closeMeetingModal));
    document.getElementById('meetingModalCancelBtn')?.addEventListener('click', () => attemptCloseModal(backdrop, closeMeetingModal));
    bindBackdropDismiss(backdrop, closeMeetingModal);

    document.getElementById('meetingForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      runUiAction(document.getElementById('meetingForm'), saveMeetingFromModal);
    });
  }

  async function saveMeetingFromModal() {
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
      ? await window.capstoneStore.updateMeeting(meetingId, meetingData)
      : await window.capstoneStore.createMeeting(meetingData);
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
    const visibleUsers = getUsersVisibleToViewer(users, currentUser).filter(user => user.isActive !== false);
    if (hostSelect) {
      hostSelect.innerHTML = visibleUsers.map(u => `
        <option value="${u.name}" ${u.name === currentUser.name ? 'selected' : ''}>${u.name}</option>
      `).join('');
    }

    showFormModal(backdrop);
  }

  function openEditMeetingModal(meetingId, taskId) {
    if (!window.RBAC.can(window.capstoneStore.getCurrentUser(), 'meetings', 'update')) return;
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

    showFormModal(backdrop);
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

    const deleted = await window.capstoneStore.deleteMeeting(context.task?.id || null, context.meeting.id);
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
    const visibleUsers = getUsersVisibleToViewer(users, window.capstoneStore.getCurrentUser()).filter(user => user.isActive !== false);
    hostSelect.innerHTML = visibleUsers.map(u => `
      <option value="${u.name}" ${u.name === selectedHost ? 'selected' : ''}>${u.name}</option>
    `).join('');
    if (selectedHost && !visibleUsers.some(user => user.name === selectedHost)) {
      const option = new Option(`${selectedHost} (Nonaktif)`, selectedHost, true, true);
      option.disabled = true;
      hostSelect.add(option);
    }
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
    document.getElementById('taskStartAtInput').value = '';
    document.getElementById('taskDueAtInput').value = '';
    document.getElementById('taskDeliverableUrlInput').value = '';
    document.getElementById('taskReviewNoteInput').value = '';
    updateTaskReviewPanel({
      reviewStatus: 'none',
      reviewer: '',
      submittedAt: null,
      reviewedAt: null
    });
    const timestampMeta = document.getElementById('taskTimestampMeta');
    if (timestampMeta) {
      timestampMeta.hidden = true;
      timestampMeta.innerHTML = '';
    }

    populatePicOptions(currentUser.role === 'member' ? currentUser.name : 'Febby');
    populateReviewerOptions('');
    
    setTaskModalAccess({
      canUpdateProgress: true,
      canManageStructure: true,
      canDelete: false,
      canSubmit: true,
      canSubmitReview: false,
      canReview: false
    });
    modalChecklistState = [];
    renderModalChecklistBuilder();

    if (modalTitle) modalTitle.textContent = 'Tambah Tugas Baru';
    if (deleteTaskBtn) deleteTaskBtn.style.display = 'none';

    showFormModal(taskModalBackdrop);
  }

  function openTaskReviewNotes(taskId) {
    const task = window.capstoneStore.getById(taskId);
    if (!canReadTaskDetails(task, window.capstoneStore.getCurrentUser())) return;
    openEditTaskModal(taskId);
    requestAnimationFrame(() => {
      if (document.getElementById('taskIdInput').value === taskId && document.getElementById('taskModalBackdrop').classList.contains('active')) {
        document.querySelector('#taskModalBackdrop .task-review-panel')?.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    });
  }

  function openEditTaskModal(taskId) {
    const currentUser = window.capstoneStore.getCurrentUser();
    const taskModalBackdrop = document.getElementById('taskModalBackdrop');
    const modalTitle = document.getElementById('modalTitle');

    const task = window.capstoneStore.getById(taskId);
    if (!task || !taskModalBackdrop) return;
    if (!canReadTaskDetails(task, currentUser)) return;

    trackUserActivity('Buka Detail Tugas', `Membuka detail tugas "${task.title}".`, {
      activityTag: 'open_task_detail',
      page: task.phase || currentPage || '',
      target: { type: 'Tugas', id: task.id, name: task.title }
    });

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
    populateReviewerOptions(task.reviewer || '');

    document.getElementById('taskStatusSelect').value = task.status;
    document.getElementById('taskPrioritySelect').value = task.priority;
    document.getElementById('taskStartAtInput').value = toDateTimeLocalValue(task.startAt);
    document.getElementById('taskDueAtInput').value = toDateTimeLocalValue(task.dueAt);
    document.getElementById('taskDeliverableUrlInput').value = task.deliverableUrl || '';
    document.getElementById('taskReviewNoteInput').value = task.reviewNote || '';
    updateTaskReviewPanel(task);
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
      canSubmitReview: canSubmitTaskReview(task, currentUser) && !['submitted', 'approved'].includes(task.reviewStatus || 'none'),
      canCancelReview: canCancelTaskReview(task, currentUser),
      canReview: canReviewTask(task, currentUser) && task.reviewStatus === 'submitted',
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

    showFormModal(taskModalBackdrop);
    applyRbacUi();
    setTaskModalAccess({
      canUpdateProgress,
      canManageStructure,
      canDelete: canManageStructure && window.RBAC.can(currentUser, 'tasks', 'delete'),
      canSubmit: canUpdateProgress || canManageStructure,
      canSubmitReview: canSubmitTaskReview(task, currentUser) && !['submitted', 'approved'].includes(task.reviewStatus || 'none'),
      canCancelReview: canCancelTaskReview(task, currentUser),
      canReview: canReviewTask(task, currentUser) && task.reviewStatus === 'submitted',
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
            <input type="text" class="modal-checklist-text ${item.done ? 'is-done' : ''}" value="${escapeHtml(item.text)}" placeholder="Ketik nama sub-tugas..." maxlength="255" aria-label="Sub-tugas ${idx + 1}" data-index="${idx}" ${modalTaskCanManageStructure ? '' : 'readonly'} />
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

  async function submitTaskReviewAction(reviewAction) {
    const taskId = document.getElementById('taskIdInput')?.value;
    const task = taskId ? window.capstoneStore.getById(taskId) : null;
    if (!task || task.archivedAt) return;

    const currentUser = window.capstoneStore.getCurrentUser();
    const canSubmit = reviewAction === 'submit' && canSubmitTaskReview(task, currentUser);
    const canCancel = reviewAction === 'cancel_submit' && canCancelTaskReview(task, currentUser);
    const canReview = ['approve', 'request_revision'].includes(reviewAction) && canReviewTask(task, currentUser);
    if (!canSubmit && !canCancel && !canReview) {
      Swal.fire({
        icon: 'info',
        title: 'Akses review terbatas',
        text: 'Aksi ini hanya tersedia untuk PIC, reviewer, atau pengelola tugas.',
        confirmButtonColor: '#1E40AF'
      });
      return;
    }

    const reviewNote = document.getElementById('taskReviewNoteInput')?.value.trim() || '';
    const deliverableUrl = document.getElementById('taskDeliverableUrlInput')?.value.trim() ?? task.deliverableUrl ?? '';
    const selectedReviewer = currentUser?.role === 'superadmin'
      ? (document.getElementById('taskReviewerSelect')?.value || '')
      : (task.reviewer || '');
    if (reviewAction === 'submit' && !selectedReviewer) {
      Swal.fire({
        icon: 'info',
        title: 'Reviewer belum dipilih',
        text: currentUser?.role === 'member'
          ? 'Minta superadmin menentukan reviewer terlebih dahulu sebelum tugas diajukan.'
          : 'Pilih reviewer terlebih dahulu sebelum tugas diajukan.',
        confirmButtonColor: '#1E40AF'
      });
      return;
    }
    const actionLabel = reviewAction === 'submit'
      ? 'Tugas diajukan untuk review.'
      : reviewAction === 'cancel_submit'
        ? 'Ajuan review dibatalkan.'
      : reviewAction === 'approve'
        ? 'Tugas disetujui dan ditandai selesai.'
        : 'Catatan revisi tersimpan untuk PIC.';

    const reviewPayload = {
      reviewAction,
      reviewNote,
      deliverableUrl
    };
    if (reviewAction === 'request_revision' && !reviewNote) {
      const field = document.getElementById('taskReviewNoteInput');
      field.setCustomValidity('Tuliskan bagian yang perlu diperbaiki.');
      field.reportValidity();
      return;
    }
    if (canUpdateTaskProgress(task, currentUser)) {
      if (!document.getElementById('taskForm').reportValidity()) return;
      reviewPayload.status = document.getElementById('taskStatusSelect').value;
      const items = modalChecklistState.filter(item => item.text.trim());
      reviewPayload.checklistDone = items.map(item => item.done);
      if (currentUser.role !== 'member') {
        reviewPayload.checklist = items.map(item => item.text.trim());
        reviewPayload.title = document.getElementById('taskTitleInput').value.trim();
        reviewPayload.description = document.getElementById('taskDescInput').value.trim();
        reviewPayload.phase = document.getElementById('taskPhaseSelect').value;
        reviewPayload.pic = document.getElementById('taskPicSelect').value;
        reviewPayload.priority = document.getElementById('taskPrioritySelect').value;
        const startValue = document.getElementById('taskStartAtInput').value;
        const dueValue = document.getElementById('taskDueAtInput').value;
        reviewPayload.startAt = startValue ? parseWibDate(startValue)?.getTime() : null;
        reviewPayload.dueAt = dueValue ? parseWibDate(dueValue)?.getTime() : null;
        if (reviewPayload.startAt && reviewPayload.dueAt && reviewPayload.dueAt < reviewPayload.startAt) {
          const field = document.getElementById('taskDueAtInput');
          field.setCustomValidity('Batas waktu tidak boleh lebih awal dari waktu mulai.');
          field.reportValidity();
          return;
        }
      }
    }
    if (currentUser?.role === 'superadmin') {
      reviewPayload.reviewer = selectedReviewer;
    }

    await window.capstoneStore.update(taskId, reviewPayload);
    const activityByAction = {
      submit: 'Ajukan Review',
      cancel_submit: 'Batalkan Ajuan Review',
      approve: 'Setujui Review',
      request_revision: 'Minta Revisi'
    };
    trackUserActivity(activityByAction[reviewAction] || 'Aksi Review', `${actionLabel} Tugas: "${task.title}".`, {
      activityTag: `review_${reviewAction}`,
      page: task.phase || currentPage || '',
      target: { type: 'Tugas', id: task.id, name: task.title }
    });

    closeTaskModal();
    renderCurrentView();
    Swal.fire({
      icon: 'success',
      title: 'Berhasil',
      text: actionLabel,
      timer: 1300,
      showConfirmButton: false
    });
  }

  async function saveTaskFromModal() {
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
    const startAtRaw = document.getElementById('taskStartAtInput').value;
    const dueAtRaw = document.getElementById('taskDueAtInput').value;
    const startAt = startAtRaw ? parseWibDate(startAtRaw)?.getTime() : null;
    const dueAt = dueAtRaw ? parseWibDate(dueAtRaw)?.getTime() : null;
    if (startAt && dueAt && dueAt < startAt) {
      const field = document.getElementById('taskDueAtInput');
      field.setCustomValidity('Batas waktu tidak boleh lebih awal dari waktu mulai.');
      field.reportValidity();
      return;
    }
    const currentUser = window.capstoneStore.getCurrentUser();
    const reviewer = currentUser?.role === 'superadmin'
      ? document.getElementById('taskReviewerSelect').value
      : (existingTask?.reviewer || '');
    const deliverableUrl = document.getElementById('taskDeliverableUrlInput').value.trim();
    const reviewNote = document.getElementById('taskReviewNoteInput').value.trim();

    const validItems = modalChecklistState.filter(item => item.text.trim() !== '');
    const checklist = validItems.map(item => item.text.trim());
    const checklistDone = validItems.map(item => item.done);

    if (status === 'Selesai' && reviewer && (existingTask?.reviewStatus || 'none') !== 'approved') {
      Swal.fire({
        icon: 'info',
        title: 'Perlu review dulu',
        text: 'Tugas yang memiliki reviewer perlu diajukan dan disetujui sebelum ditandai selesai.',
        confirmButtonColor: '#1E40AF'
      });
      return;
    }

    if (taskId) {
      const updatePayload = currentUser?.role === 'member'
        ? { status, checklistDone, deliverableUrl }
        : {
        title,
        description,
        phase,
        pic,
        status,
        priority,
        startAt,
        dueAt,
        reviewer,
        deliverableUrl,
        reviewNote,
        checklist,
        checklistDone
      };
      await window.capstoneStore.update(taskId, updatePayload);
    } else {
      await window.capstoneStore.add({
        title: title || 'Tugas Baru Capstone',
        description,
        phase,
        pic,
        status,
        priority,
        startAt,
        dueAt,
        reviewer,
        deliverableUrl,
        reviewNote,
        reviewStatus: 'none',
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

    document.getElementById('userModalCloseBtn')?.addEventListener('click', () => attemptCloseModal(userModalBackdrop, closeUserModal));
    document.getElementById('userModalCancelBtn')?.addEventListener('click', () => attemptCloseModal(userModalBackdrop, closeUserModal));
    bindBackdropDismiss(userModalBackdrop, closeUserModal);

    if (userForm) {
      userForm.addEventListener('submit', (e) => {
        e.preventDefault();
        runUiAction(userForm, saveUserFromModal);
      });
    }

    document.getElementById('userPasswordToggleBtn')?.addEventListener('click', () => {
      const input = document.getElementById('userPasswordInput');
      const button = document.getElementById('userPasswordToggleBtn');
      if (!input || !button) return;
      const shouldShow = input.type === 'password';
      input.type = shouldShow ? 'text' : 'password';
      button.setAttribute('aria-label', shouldShow ? 'Sembunyikan password' : 'Tampilkan password');
      button.setAttribute('title', shouldShow ? 'Sembunyikan password' : 'Tampilkan password');
    });

    if (deleteUserBtn) {
      deleteUserBtn.addEventListener('click', () => {
        if (!requirePermission('users', 'delete')) return;
        const userId = document.getElementById('userIdInput').value;
        if (userId && confirm(`Apakah Anda yakin ingin menghapus pengguna "${userId}" dari sistem?`)) {
          if (!canDeleteUserId(userId)) return;
          runUiAction(userForm, async () => {
            await window.capstoneStore.deleteUser(userId);
            closeUserModal();
            renderCurrentView();
          });
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
    document.getElementById('userPasswordInput').type = 'password';
    document.getElementById('userPasswordInput').required = true;

    if (userModalTitle) userModalTitle.textContent = 'Tambah Pengguna Baru';
    if (deleteUserBtn) deleteUserBtn.style.display = 'none';

    showFormModal(userModalBackdrop);
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
    document.getElementById('userPasswordInput').type = 'password';
    document.getElementById('userPasswordInput').required = false;
    document.getElementById('userRoleFormSelect').value = user.role;
    document.getElementById('userColorSelect').value = user.color || '#1E40AF';

    if (userModalTitle) userModalTitle.textContent = 'Edit Pengguna';
    if (deleteUserBtn) deleteUserBtn.style.display = 'inline-flex';

    showFormModal(userModalBackdrop);
    applyRbacUi();
    applyRbacUi();
  }

  function closeUserModal() {
    const userModalBackdrop = document.getElementById('userModalBackdrop');
    if (userModalBackdrop) userModalBackdrop.classList.remove('active');
  }

  async function saveUserFromModal() {
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
      await window.capstoneStore.updateUser(userId, payload);
    } else {
      await window.capstoneStore.addUser(payload);
    }

    closeUserModal();
    renderCurrentView();
  }

  function countLocalSuperadmins() {
    return Object.values(window.capstoneStore.getUsers() || {}).filter(user => user.role === 'superadmin' && user.isActive !== false).length;
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
    const visibleUsers = getUsersVisibleToViewer(users, window.capstoneStore.getCurrentUser()).filter(user => user.isActive !== false);
    picSelect.innerHTML = visibleUsers.map(u => `
      <option value="${u.name}" ${u.name === selectedPic ? 'selected' : ''}>${u.name}</option>
    `).join('');
    if (selectedPic && !visibleUsers.some(user => user.name === selectedPic)) {
      const old = Object.values(users).find(user => user.name === selectedPic);
      const option = new Option(`${selectedPic}${old?.isActive === false ? ' (Nonaktif)' : ''}`, selectedPic, true, true);
      option.disabled = old?.isActive === false;
      picSelect.add(option);
    }
  }

  function populateReviewerOptions(selectedReviewer = '') {
    const reviewerSelect = document.getElementById('taskReviewerSelect');
    if (!reviewerSelect) return;

    const users = window.capstoneStore.getUsers();
    const visibleUsers = getUsersVisibleToViewer(users, window.capstoneStore.getCurrentUser()).filter(user => user.isActive !== false);
    reviewerSelect.innerHTML = `
      <option value="" ${selectedReviewer ? '' : 'selected'}>Belum ditentukan</option>
      ${visibleUsers.map(u => `
        <option value="${u.name}" ${u.name === selectedReviewer ? 'selected' : ''}>${u.name}</option>
      `).join('')}
    `;
    if (selectedReviewer && !visibleUsers.some(user => user.name === selectedReviewer)) {
      const old = Object.values(users).find(user => user.name === selectedReviewer);
      const option = new Option(`${selectedReviewer}${old?.isActive === false ? ' (Nonaktif)' : ''}`, selectedReviewer, true, true);
      option.disabled = old?.isActive === false;
      reviewerSelect.add(option);
    }
  }

  function updateTaskReviewPanel(task = {}) {
    const next = getTaskNextAction(task);
    const nextAction = document.getElementById('taskNextAction');
    if (nextAction) nextAction.innerHTML = `<strong>${escapeHtml(next.title)}</strong><p>${escapeHtml(next.detail)}</p>`;
    const meta = getReviewStatusMeta(task.reviewStatus || 'none');
    const statusText = document.getElementById('taskReviewStatusText');
    if (statusText) {
      statusText.textContent = meta.label;
      statusText.className = `task-review-status-text is-${meta.tone}`;
    }

    const reviewMeta = document.getElementById('taskReviewMeta');
    if (reviewMeta) {
      const rows = [];
      if (task.reviewer) rows.push(`Reviewer: ${task.reviewer}`);
      if (task.submittedAt) rows.push(`Diajukan: ${formatWibDateTime(task.submittedAt)}`);
      if (task.reviewedAt) rows.push(`Direview: ${formatWibDateTime(task.reviewedAt)}`);
      reviewMeta.textContent = rows.join(' · ');
    }
  }

  /* ==========================================
     Modal Cadangan Data JSON
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
    const visibleUsers = getUsersVisibleToViewer(users, currentUser).filter(user => user.isActive !== false);
    if (hostSelect) {
      hostSelect.innerHTML = visibleUsers.map(u => `
        <option value="${u.name}" ${u.name === currentUser.name ? 'selected' : ''}>${u.name}</option>
      `).join('');
    }

    showFormModal(backdrop);
  }

  /* ==========================================
     Sistem Berita Acara Kerja Kelompok
     ========================================== */
  function initBeritaAcaraSystem() {
    const backdrop = document.getElementById('beritaAcaraModalBackdrop');
    if (!backdrop) return;
    document.addEventListener('mouseup', finishBaSheetSelection);

    document.getElementById('baModalCloseBtn')?.addEventListener('click', () => attemptCloseModal(backdrop, closeBeritaAcaraModal));
    document.getElementById('baModalCancelBtn')?.addEventListener('click', () => attemptCloseModal(backdrop, closeBeritaAcaraModal));
    bindBackdropDismiss(backdrop, closeBeritaAcaraModal);
    backdrop.addEventListener('keydown', (event) => {
      const editableTarget = event.target?.matches?.('input, textarea, select, [contenteditable="true"]');
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.stopPropagation();
        if (!editableTarget && event.key === 'Backspace') {
          event.preventDefault();
        }
      }
    });

    document.getElementById('addBaActivityBtn')?.addEventListener('click', () => {
      baActivitiesState.push({ aktivitas: '', luaran: '', pic: '', catatan: '' });
      renderBaActivitiesInModal();
    });

    document.getElementById('baDocImageInput')?.addEventListener('change', handleBaDocImageUpload);
    document.getElementById('beritaAcaraForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      runUiAction(document.getElementById('beritaAcaraForm'), () => saveBeritaAcaraDraft(true));
    });
    document.getElementById('baDraftSaveBtn')?.addEventListener('click', () => runUiAction(backdrop, () => saveBeritaAcaraDraft(true)));
    document.getElementById('baDraftReloadBtn')?.addEventListener('click', async () => {
      if (!baDraftContext || !await confirmDiscardChanges()) return;
      await loadBaServerDraft(baDraftContext);
    });
    document.getElementById('baDraftLocalBtn')?.addEventListener('click', async () => {
      if (!baDraftContext?.local) return;
      const answer = await Swal.fire({ icon: 'question', title: 'Gunakan versi perangkat?', text: 'Versi ini akan masuk ke form. Draft di server hanya berubah setelah Anda menyimpan.', showCancelButton: true, confirmButtonText: 'Gunakan Versi Perangkat', cancelButtonText: 'Batal' });
      if (!answer.isConfirmed || !baDraftContext?.local) return;
      applyBeritaAcaraDraft(baDraftContext.local);
      ensureMinimumBaActivityRows();
      renderBaActivitiesInModal();
      renderBaImagePreviews();
      document.getElementById('baDraftStatus').textContent = 'Versi perangkat dibuka. Perubahan belum disimpan ke server.';
    });
    document.getElementById('baPreviewBtn')?.addEventListener('click', () => runUiAction(backdrop, openBeritaAcaraPreviewTab));
    document.getElementById('baPrintBtn')?.addEventListener('click', () => runUiAction(backdrop, printBeritaAcara));
    document.getElementById('baPreviewPrintBtn')?.addEventListener('click', () => runUiAction(backdrop, printBeritaAcara));
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
    baDraftContext = null;
  }

  function getBeritaAcaraDraftKey(meetingId = '', taskId = '') {
    return `${meetingId || 'tanpa-meeting'}::${taskId || 'tanpa-task'}`;
  }

  function loadBeritaAcaraDrafts() {
    try {
      const drafts = JSON.parse(localStorage.getItem(BERITA_ACARA_DRAFTS_KEY) || '{}');
      return drafts && typeof drafts === 'object' && !Array.isArray(drafts) ? drafts : {};
    } catch (e) {
      return {};
    }
  }

  function collectBeritaAcaraDraftPayload() {
    const meetingId = document.getElementById('baMeetingIdInput')?.value || '';
    const taskId = document.getElementById('baTaskIdInput')?.value || '';
    const attendingNames = Array.from(document.querySelectorAll('.ba-att-check:checked')).map(chk => chk.value);
    return {
      meetingId,
      taskId,
      judul: document.getElementById('baJudulInput')?.value || '',
      hariTanggal: document.getElementById('baHariTanggalInput')?.value || '',
      waktu: document.getElementById('baWaktuInput')?.value || '',
      lokasi: document.getElementById('baLokasiInput')?.value || '',
      attendingNames,
      activities: baActivitiesState.map(item => ({ ...item })),
      images: [...baUploadedImages],
      updatedAt: Date.now()
    };
  }

  async function saveBeritaAcaraDraft(showMessage = false) {
    const context = baDraftContext;
    if (!context?.loaded) throw new Error('Muat draft dari server terlebih dahulu sebelum menyimpan.');
    const payload = collectBeritaAcaraDraftPayload();
    const form = document.getElementById('beritaAcaraForm');
    form.inert = true;
    try {
      const saved = await window.capstoneStore.saveBeritaAcaraDraft(context.meetingId, payload, context.revision);
      if (baDraftContext !== context) return saved;
      context.revision = saved.revision;
      context.currentDraft = saved;
      markFormClean(form);
      document.getElementById('baDraftStatus').textContent = `Draft tersimpan di server. Diperbarui ${formatPhaseAccessTime(saved.updatedAt)}.`;
      if (showMessage) Swal.fire({ icon: 'success', title: 'Draft tersimpan', text: 'Berita acara sementara sudah disimpan di server.', timer: 1400, showConfirmButton: false });
      return saved;
    } catch (error) {
      if (baDraftContext === context) {
        document.getElementById('baDraftStatus').textContent = error.message;
        document.getElementById('baDraftReloadBtn').hidden = false;
      }
      throw error;
    } finally {
      if (baDraftContext === context) form.inert = false;
    }
  }

  function applyBeritaAcaraDraft(draft) {
    if (!draft) return false;

    const setValue = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.value = value || '';
    };

    setValue('baJudulInput', draft.judul);
    setValue('baHariTanggalInput', draft.hariTanggal);
    setValue('baWaktuInput', draft.waktu);
    setValue('baLokasiInput', draft.lokasi);
    document.querySelectorAll('.ba-att-check').forEach(chk => {
      chk.checked = Array.isArray(draft.attendingNames) ? draft.attendingNames.includes(chk.value) : chk.checked;
    });
    baActivitiesState = Array.isArray(draft.activities)
      ? draft.activities.map(item => ({
          aktivitas: item.aktivitas || '',
          luaran: item.luaran || '',
          pic: item.pic || '',
          catatan: item.catatan || ''
        }))
      : baActivitiesState;
    baUploadedImages = Array.isArray(draft.images) ? draft.images : [];
    document.getElementById('baDocImageInput').value = '';
    return true;
  }

  async function loadBaServerDraft(context) {
    const form = document.getElementById('beritaAcaraForm');
    form.inert = true;
    context.loaded = false;
    document.getElementById('baDraftStatus').textContent = 'Memuat draft dari server...';
    ['baDraftSaveBtn', 'baPreviewBtn', 'baDraftReloadBtn', 'baDraftLocalBtn'].forEach(id => { document.getElementById(id).disabled = true; });
    try {
      const draft = await window.capstoneStore.getBeritaAcaraDraft(context.meetingId);
      if (baDraftContext !== context) return;
      if (draft) applyBeritaAcaraDraft(draft.payload);
      context.revision = draft?.revision || 0;
      context.currentDraft = draft;
      context.loaded = true;
      ensureMinimumBaActivityRows();
      renderBaActivitiesInModal();
      renderBaImagePreviews();
      markFormClean(form);
      const comparable = value => JSON.stringify(['judul', 'hariTanggal', 'waktu', 'lokasi', 'attendingNames', 'activities', 'images'].map(field => value?.[field] ?? null));
      const differentLocal = context.local && comparable(context.local) !== comparable(draft?.payload);
      document.getElementById('baDraftLocalBtn').hidden = !differentLocal;
      document.getElementById('baDraftReloadBtn').hidden = true;
      document.getElementById('baDraftStatus').textContent = draft
        ? `Draft dari server. Diperbarui ${formatPhaseAccessTime(draft.updatedAt)}.${differentLocal ? ' Versi perangkat juga tersedia.' : ''}`
        : 'Belum ada draft tersimpan untuk pertemuan ini.';
    } catch (error) {
      if (baDraftContext !== context) return;
      document.getElementById('baDraftStatus').textContent = error.message;
      document.getElementById('baDraftReloadBtn').hidden = false;
    } finally {
      if (baDraftContext === context) {
        form.inert = !context.loaded;
        document.getElementById('baDraftSaveBtn').disabled = !context.loaded;
        document.getElementById('baPreviewBtn').disabled = !context.loaded;
        document.getElementById('baDraftReloadBtn').disabled = false;
        document.getElementById('baDraftLocalBtn').disabled = !context.loaded;
      }
    }
  }

  async function openBeritaAcaraModal(meetingId, taskId) {
    if (!window.RBAC.can(window.capstoneStore.getCurrentUser(), 'beritaAcara', 'create')) return;
    const backdrop = document.getElementById('beritaAcaraModalBackdrop');
    if (!backdrop) return;
    await window.capstoneStore.refreshUsers();

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
      lokasiStr += `\n${meeting.url}`;
    }
    document.getElementById('baLokasiInput').value = lokasiStr;

    // Attendance checkboxes
    renderBaAttendanceCheckboxes();

    baUploadedImages = [];
    baSheetSelection = null;
    document.getElementById('baDocImageInput').value = '';
    baActivitiesState = buildDefaultBeritaAcaraActivities(meeting, task);
    ensureMinimumBaActivityRows();
    renderBaActivitiesInModal();
    renderBaImagePreviews();
    const printBtn = document.getElementById('baPrintBtn');
    if (printBtn) printBtn.style.display = 'none';
    const previewContainer = document.getElementById('beritaAcaraPreviewContainer');
    if (previewContainer) previewContainer.innerHTML = '';
    const printContainer = document.getElementById('beritaAcaraPrintContainer');
    if (printContainer) printContainer.innerHTML = '';

    showFormModal(backdrop);
    const context = { meetingId: meetingId || '', revision: 0, loaded: false, local: loadBeritaAcaraDrafts()[getBeritaAcaraDraftKey(meetingId || '', taskId || '')] || null };
    baDraftContext = context;
    await loadBaServerDraft(context);
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
      .filter(user => user && user.name && user.isActive !== false)
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
        pic: members.some(member => member.name === task?.pic) ? task.pic : picList,
        catatan: meetingNotes || 'Catatan pembahasan dapat dilengkapi sesuai hasil pertemuan.'
      }
    ];
  }

  function ensureMinimumBaActivityRows(minRows = 10) {
    while (baActivitiesState.length < minRows) {
      baActivitiesState.push({ aktivitas: '', luaran: '', pic: '', catatan: '' });
    }
  }

  function renderBaActivitiesInModal() {
    const container = document.getElementById('baActivitiesContainer');
    if (!container) return;

    if (baActivitiesState.length === 0) {
      container.innerHTML = `<div class="ba-activity-empty">Belum ada aktivitas yang dicatat.</div>`;
      return;
    }

    container.innerHTML = `
      <div class="ba-activity-sheet-wrap">
        <table class="ba-activity-sheet">
          <thead>
            <tr>
              <th class="ba-activity-sheet-no">No</th>
              <th>Aktivitas</th>
              <th>Luaran</th>
              <th>Nama Penanggung Jawab</th>
              <th>Catatan/Kendala yang Dihadapi</th>
              <th class="ba-activity-sheet-action"></th>
            </tr>
          </thead>
          <tbody>
            ${baActivitiesState.map((a, idx) => `
              <tr>
                <td class="ba-activity-sheet-no">${idx + 1}</td>
                <td class="ba-sheet-editable" data-index="${idx}" data-field="aktivitas" data-col="0">
                  <div class="ba-sheet-cell ba-act-input" contenteditable="true" data-index="${idx}" data-field="aktivitas" data-placeholder="Topik kegiatan">${escapeHtml(a.aktivitas)}</div>
                </td>
                <td class="ba-sheet-editable" data-index="${idx}" data-field="luaran" data-col="1">
                  <div class="ba-sheet-cell ba-act-input" contenteditable="true" data-index="${idx}" data-field="luaran" data-placeholder="Hasil pembahasan">${escapeHtml(a.luaran)}</div>
                </td>
                <td class="ba-sheet-editable" data-index="${idx}" data-field="pic" data-col="2">
                  <div class="ba-sheet-cell ba-act-input" contenteditable="true" data-index="${idx}" data-field="pic" data-placeholder="Febby, Cintia...">${escapeHtml(a.pic)}</div>
                </td>
                <td class="ba-sheet-editable" data-index="${idx}" data-field="catatan" data-col="3">
                  <div class="ba-sheet-cell ba-act-input" contenteditable="true" data-index="${idx}" data-field="catatan" data-placeholder="Catatan tambahan">${escapeHtml(a.catatan)}</div>
                </td>
                <td class="ba-activity-sheet-action">
                  <button type="button" class="ba-remove-act-btn" data-index="${idx}" title="Hapus baris">&times;</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="ba-activity-sheet-note">Bisa tempel tabel dari Excel atau Google Sheets langsung ke kolom aktivitas.</div>
    `;

    container.querySelectorAll('.ba-act-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        const field = e.target.dataset.field;
        if (baActivitiesState[idx]) {
          baActivitiesState[idx][field] = getBaEditableText(e.target);
        }
      });
      input.addEventListener('paste', handleBaActivityPaste);
    });

    container.querySelectorAll('.ba-sheet-editable').forEach(cell => {
      cell.addEventListener('mousedown', handleBaSheetMouseDown);
      cell.addEventListener('mouseenter', handleBaSheetMouseEnter);
    });

    container.addEventListener('keydown', handleBaSheetKeyDown);

    container.querySelectorAll('.ba-remove-act-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        baActivitiesState.splice(idx, 1);
        renderBaActivitiesInModal();
      });
    });
  }

  function getBaEditableText(element) {
    return (element.innerText || '').replace(/\u00a0/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  }

  function getBaSheetCellMeta(cell) {
    return {
      row: parseInt(cell.dataset.index, 10),
      col: parseInt(cell.dataset.col, 10),
      field: cell.dataset.field
    };
  }

  function handleBaSheetMouseDown(event) {
    const cell = event.currentTarget;
    if (event.button !== 0 || event.detail > 1) return;

    event.preventDefault();
    const { row, col } = getBaSheetCellMeta(cell);
    baSheetSelection = { startRow: row, startCol: col, endRow: row, endCol: col, dragging: true };
    paintBaSheetSelection();

    const editor = cell.querySelector('.ba-sheet-cell');
    if (editor) {
      window.setTimeout(() => {
        editor.focus();
        placeCaretAtEnd(editor);
      }, 0);
    }
  }

  function handleBaSheetMouseEnter(event) {
    if (!baSheetSelection?.dragging) return;
    const { row, col } = getBaSheetCellMeta(event.currentTarget);
    baSheetSelection.endRow = row;
    baSheetSelection.endCol = col;
    paintBaSheetSelection();
  }

  function finishBaSheetSelection() {
    if (baSheetSelection) baSheetSelection.dragging = false;
  }

  function getBaSheetSelectionBounds() {
    if (!baSheetSelection) return null;
    return {
      minRow: Math.min(baSheetSelection.startRow, baSheetSelection.endRow),
      maxRow: Math.max(baSheetSelection.startRow, baSheetSelection.endRow),
      minCol: Math.min(baSheetSelection.startCol, baSheetSelection.endCol),
      maxCol: Math.max(baSheetSelection.startCol, baSheetSelection.endCol)
    };
  }

  function paintBaSheetSelection() {
    const bounds = getBaSheetSelectionBounds();
    document.querySelectorAll('.ba-sheet-editable').forEach(cell => {
      const { row, col } = getBaSheetCellMeta(cell);
      const selected = bounds && row >= bounds.minRow && row <= bounds.maxRow && col >= bounds.minCol && col <= bounds.maxCol;
      cell.classList.toggle('is-selected', Boolean(selected));
    });
  }

  function placeCaretAtEnd(element) {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function handleBaSheetKeyDown(event) {
    if (!baSheetSelection) return;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
      if (window.getSelection()?.toString()) return;
      const copied = copyBaSheetSelection();
      if (copied) event.preventDefault();
      return;
    }

    if (event.key === 'Delete') {
      const bounds = getBaSheetSelectionBounds();
      if (!bounds || (bounds.minRow === bounds.maxRow && bounds.minCol === bounds.maxCol)) return;
      clearBaSheetSelection();
      event.preventDefault();
    }
  }

  function copyBaSheetSelection() {
    const bounds = getBaSheetSelectionBounds();
    if (!bounds) return false;

    const fields = ['aktivitas', 'luaran', 'pic', 'catatan'];
    const rows = [];
    for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
      const cols = [];
      for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
        cols.push(baActivitiesState[row]?.[fields[col]] || '');
      }
      rows.push(cols.join('\t'));
    }

    const text = rows.join('\n');
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    } else {
      const temp = document.createElement('textarea');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
    }
    return true;
  }

  function clearBaSheetSelection() {
    const bounds = getBaSheetSelectionBounds();
    if (!bounds) return;

    const fields = ['aktivitas', 'luaran', 'pic', 'catatan'];
    for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
      if (!baActivitiesState[row]) continue;
      for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
        baActivitiesState[row][fields[col]] = '';
      }
    }
    renderBaActivitiesInModal();
  }

  function parseClipboardTable(text = '') {
    const rows = [];
    let current = '';
    let row = [];
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        i += 1;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === '\t' && !inQuotes) {
        row.push(current);
        current = '';
        continue;
      }

      if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && next === '\n') i += 1;
        row.push(current);
        rows.push(row);
        row = [];
        current = '';
        continue;
      }

      current += char;
    }

    row.push(current);
    rows.push(row);

    return rows
      .map(cols => cols.map(col => col.trim()))
      .filter(cols => cols.some(Boolean));
  }

  function handleBaActivityPaste(event) {
    const text = event.clipboardData?.getData('text/plain') || '';
    if (!text.includes('\t') && !/\r?\n/.test(text)) {
      event.preventDefault();
      insertPlainTextAtCaret(text);
      window.setTimeout(() => {
        const idx = parseInt(event.target.dataset.index, 10);
        const field = event.target.dataset.field;
        if (baActivitiesState[idx]) baActivitiesState[idx][field] = getBaEditableText(event.target);
      }, 0);
      return;
    }

    const rows = parseClipboardTable(text);
    if (!rows.length || (rows.length === 1 && rows[0].length === 1)) return;

    event.preventDefault();

    const fields = ['aktivitas', 'luaran', 'pic', 'catatan'];
    const startIndex = parseInt(event.target.dataset.index, 10);
    const startField = fields.indexOf(event.target.dataset.field);
    const fieldOffset = startField >= 0 ? startField : 0;

    rows.forEach((cols, rowOffset) => {
      const targetIndex = startIndex + rowOffset;
      if (!baActivitiesState[targetIndex]) {
        baActivitiesState[targetIndex] = { aktivitas: '', luaran: '', pic: '', catatan: '' };
      }

      cols.forEach((value, colOffset) => {
        const field = fields[fieldOffset + colOffset];
        if (field) baActivitiesState[targetIndex][field] = value;
      });
    });

    renderBaActivitiesInModal();
  }

  function insertPlainTextAtCaret(text) {
    if (document.queryCommandSupported?.('insertText')) {
      document.execCommand('insertText', false, text);
      return;
    }

    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
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
        <img src="${escapeHtml(src)}" style="width: 100%; height: 100%; object-fit: cover;" />
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
        <div class="ba-document-frame" style="font-family: 'Times New Roman', Times, serif; color: #000;">
          
          <!-- Header Title -->
          <div class="ba-section-title" style="text-align: center; font-weight: bold; font-size: 13pt; padding: 12px; background: #FFF;">
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
              <td>${linkifyText(lokasi)}</td>
            </tr>
            <tfoot><tr><td colspan="3" class="ba-table-closing-rule"></td></tr></tfoot>
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
                  ${absentMembers.length === 0 ? '-' : absentMembers.map(memberLine).join('<br/>')}
                </td>
              </tr>
            </tbody>
            <tfoot><tr><td colspan="3" class="ba-table-closing-rule"></td></tr></tfoot>
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
                  <td>${linkifyText(a.aktivitas)}</td>
                  <td>${linkifyText(a.luaran)}</td>
                  <td class="ba-pic-cell">${escapeHtml(a.pic)}</td>
                  <td>${linkifyText(a.catatan)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot><tr><td colspan="4" class="ba-table-closing-rule"></td></tr></tfoot>
          </table>

          <!-- Signatures Section -->
          <div class="ba-section-title" style="text-align: center; font-weight: bold; padding: 6px; background: #F8FAFC; font-size: 10.5pt;">
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
          <div class="ba-documentation-first">
          <div class="ba-section-title" style="text-align: center; font-weight: bold; padding: 6px; background: #F8FAFC; font-size: 10.5pt;">
            Dokumentasi
          </div>
          <div class="ba-doc-grid">
            ${baUploadedImages.length === 0 ? `
              <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #64748B; font-style: italic;">
                (Lampiran Dokumentasi Foto / Screenshot Pertemuan)
              </div>
            ` : `<img src="${escapeHtml(baUploadedImages[0])}" class="ba-doc-img" />`}
          </div>
          </div>
          ${baUploadedImages.slice(1).map(imgSrc => `
            <div class="ba-doc-grid"><img src="${escapeHtml(imgSrc)}" class="ba-doc-img" /></div>
          `).join('')}

        </div>
      </div>
    `;
  }

  async function previewBeritaAcara() {
    const previewBackdrop = document.getElementById('beritaAcaraPreviewBackdrop');
    const previewContainer = document.getElementById('beritaAcaraPreviewContainer');
    const printContainer = document.getElementById('beritaAcaraPrintContainer');
    if (!previewBackdrop || !previewContainer || !printContainer) return;

    const meetingId = document.getElementById('baMeetingIdInput')?.value;
    const taskId = document.getElementById('baTaskIdInput')?.value;
    if (meetingId) {
      await window.capstoneStore.markMeetingBeritaAcara(taskId, meetingId);
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

  async function openBeritaAcaraPreviewTab() {
    if (!document.getElementById('beritaAcaraForm').reportValidity()) return;
    const previewTitle = baDraftContext?.currentDraft?.documentNumber ? getBeritaAcaraFileName(baDraftContext.currentDraft) : 'Preview Berita Acara';
    const documentHtml = buildBeritaAcaraHtml();
    const previewDocument = `<!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(previewTitle)}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; }
          body { margin: 0; background: #E5E7EB; color: #111827; font-family: Arial, sans-serif; }
          .preview-toolbar {
            position: sticky;
            top: 0;
            z-index: 10;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 12px 16px;
            background: #FFFFFF;
            border-bottom: 1px solid #CBD5E1;
          }
          .preview-toolbar button {
            border: 1px solid #1E40AF;
            border-radius: 8px;
            background: #1E40AF;
            color: #FFFFFF;
            padding: 8px 14px;
            font: 600 13px Arial, sans-serif;
            cursor: pointer;
          }
          .preview-toolbar button.secondary {
            background: #FFFFFF;
            color: #1E40AF;
          }
          .preview-page {
            width: min(210mm, calc(100vw - 32px));
            min-height: 297mm;
            margin: 24px auto;
            padding: 16mm;
            background: #FFFFFF;
            box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
          }
          .ba-document-wrapper {
            background: #FFFFFF;
            font-family: 'Times New Roman', Times, serif;
          }
          .ba-section-title { border: 0.5pt solid #000; margin-bottom: -0.5pt; }
          .ba-document-table {
            width: 100%;
            border-collapse: collapse;
            font-family: 'Times New Roman', Times, serif;
            font-size: 10.5pt;
            line-height: 1.35;
            color: #000;
            margin-bottom: -0.5pt;
          }
          .ba-document-table th,
          .ba-document-table td {
            border: 0.5pt solid #000;
            padding: 6px;
            vertical-align: top;
          }
          .ba-document-table th {
            background: #F8FAFC;
            text-align: center;
            font-weight: bold;
          }
          .ba-document-table tbody td {
            text-align: justify;
            text-justify: inter-word;
          }
          .ba-document-table tbody td.ba-pic-cell {
            text-align: center;
          }
          .ba-document-table thead { display: table-header-group; }
          .ba-document-table tfoot { display: table-footer-group; }
          .ba-document-table .ba-table-closing-rule { padding: 0; height: 0; line-height: 0; font-size: 0; border: 0; border-top: 0.5pt solid #000; }
          .ba-signature-grid {
            display: flex;
            width: 100%;
            border: 0.5pt solid #000;
            margin-bottom: -0.5pt;
          }
          .ba-signature-col {
            flex: 1;
            border-right: 0.5pt solid #000;
            text-align: center;
            padding: 8px 4px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 130px;
          }
          .ba-signature-col:last-child { border-right: none; }
          .ba-signature-space { height: 80px; }
          .ba-signature-name {
            font-weight: bold;
            font-size: 9.5pt;
          }
          .ba-signature-nim { font-size: 9pt; }
          .ba-doc-grid {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 10px;
            border: 0.5pt solid #000;
            margin-bottom: -0.5pt;
          }
          .ba-doc-img {
            width: 100%;
            max-height: none;
            border: 1px solid #CBD5E1;
            border-radius: 4px;
            object-fit: contain;
          }
          .ba-link {
            color: #1D4ED8;
            text-decoration: underline;
            overflow-wrap: anywhere;
          }
          @media print {
            .ba-documentation-first, .ba-doc-grid { break-inside: avoid; page-break-inside: avoid; }
            .ba-doc-grid { display: block; }
            .ba-doc-img { display: block; max-height: 245mm; }
            .ba-document-table tr { break-inside: avoid; }
            .ba-signature-grid { break-inside: avoid; }
            .ba-section-title { break-after: avoid; }
            body { background: #FFFFFF; }
            .preview-toolbar { display: none; }
            .preview-page {
              width: auto;
              min-height: auto;
              margin: 0;
              padding: 0;
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="preview-toolbar">
          <button type="button" class="secondary" onclick="window.close()">Tutup</button>
          <button type="button" id="baPreviewPrintAction" onclick="window.print()" disabled>Menyiapkan Dokumen...</button>
        </div>
        <main class="preview-page">${documentHtml}</main>
      </body>
      </html>`;

    const previewBlob = new Blob([previewDocument], { type: 'text/html;charset=utf-8' });
    const previewUrl = URL.createObjectURL(previewBlob);
    const previewWindow = window.open(previewUrl, '_blank');
    if (!previewWindow) {
      URL.revokeObjectURL(previewUrl);
      Swal.fire({
        icon: 'info',
        title: 'Preview belum terbuka',
        text: 'Izinkan pop-up untuk membuka preview berita acara di tab baru.',
        confirmButtonColor: '#1E40AF'
      });
      return;
    }

    setTimeout(() => URL.revokeObjectURL(previewUrl), 60000);
    try {
      const saved = await saveBeritaAcaraDraft(false);
      const fileName = getBeritaAcaraFileName(saved);
      const enablePrint = () => {
        if (previewWindow.closed) return;
        const button = previewWindow.document.getElementById('baPreviewPrintAction');
        if (!button) {
          previewWindow.addEventListener('load', enablePrint, { once: true });
          return;
        }
        previewWindow.document.title = fileName;
        button.textContent = 'Cetak / Simpan PDF';
        button.disabled = false;
      };
      enablePrint();
    } catch (error) {
      if (!previewWindow.closed) {
        const button = previewWindow.document.getElementById('baPreviewPrintAction');
        if (button) button.textContent = 'Draft Belum Tersimpan';
      }
      Swal.fire({ icon: 'warning', title: 'Preview terbuka, draft belum tersimpan', text: error.message });
    }
  }

  function closeBeritaAcaraPreview() {
    const previewBackdrop = document.getElementById('beritaAcaraPreviewBackdrop');
    if (previewBackdrop) previewBackdrop.classList.remove('active');
  }

  async function printBeritaAcara() {
    const printContainer = document.getElementById('beritaAcaraPrintContainer');
    if (!printContainer) return;
    const saved = await saveBeritaAcaraDraft(false);
    printContainer.innerHTML = buildBeritaAcaraHtml();
    const originalTitle = document.title;
    document.title = getBeritaAcaraFileName(saved);
    document.body.classList.add('printing-ba');
    const cleanup = () => {
      document.title = originalTitle;
      document.body.classList.remove('printing-ba');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup, { once: true });
    try { window.print(); } catch (error) { cleanup(); throw error; }
  }

  async function uploadManualBeritaAcara(meetingId, taskId) {
    if (!requirePermission('documents', 'create')) return;

    const { meeting, task } = findMeetingForBeritaAcara(meetingId, taskId);
    if (!meeting) {
      Swal.fire({ icon: 'error', title: 'Pertemuan tidak ditemukan', text: 'Data pertemuan belum tersedia.', confirmButtonColor: '#1E40AF' });
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({ icon: 'warning', title: 'File terlalu besar', text: 'Ukuran file maksimal 10 MB.', confirmButtonColor: '#1E40AF' });
        return;
      }

      const dateLabel = meeting.date ? formatWibDateOnly(meeting.date) : '';
      const title = `Berita Acara - ${meeting.title}${dateLabel ? ` (${dateLabel})` : ''}`;
      const descriptionParts = [
        `Berita acara manual untuk pertemuan "${meeting.title}".`,
        task?.title ? `Terkait tugas: ${task.title}.` : '',
        `ID pertemuan: ${meeting.id}.`
      ].filter(Boolean);

      Swal.fire({
        title: 'Mengunggah berita acara...',
        text: 'Mohon tunggu sebentar.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const result = await window.capstoneStore.uploadDocumentArchive({
        title,
        category: 'berita_acara',
        description: descriptionParts.join(' '),
        meetingId: meeting.id,
        file
      });

      if (!result?.ok) {
        Swal.fire({ icon: 'error', title: 'Upload gagal', text: 'Berita acara manual belum dapat disimpan.', confirmButtonColor: '#1E40AF' });
        return;
      }

      try {
        await window.capstoneStore.markMeetingBeritaAcara(taskId, meetingId);
      } catch (error) {
        await loadDocumentArchives(true);
        renderCurrentView();
        Swal.fire({ icon: 'warning', title: 'File BA sudah tersimpan', text: 'Penanda pertemuan belum diperbarui. Perbarui data lalu periksa kembali pertemuannya.' });
        return;
      }
      window.capstoneStore.logAudit('Upload Berita Acara Manual', `Mengunggah berita acara manual untuk pertemuan "${meeting.title}"`, {
        actionTag: 'upload_manual_berita_acara',
        object: { type: 'Pertemuan', id: meetingId, name: meeting.title },
        changes: [
          { field: 'Arsip Dokumen', from: null, to: result.data?.id || title },
          { field: 'Status Berita Acara', from: 'Belum Ada', to: 'Ada' }
        ]
      });

      documentArchivesLoaded = false;
      await loadDocumentArchives(true);
      renderCurrentView();
      Swal.fire({ icon: 'success', title: 'Berita acara tersimpan', text: 'File sudah masuk ke Arsip Dokumen dan pertemuan tetap ditandai memiliki berita acara.', timer: 1800, showConfirmButton: false });
    }, { once: true });

    input.click();
  }

  /* Sanitasi HTML */
  function escapeHtml(str = '') {
    return String(str ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  }

  function linkifyText(str = '') {
    const escaped = escapeHtml(str);
    return escaped
      .replace(/(https?:\/\/[^\s<]+)/g, (match) => {
        const trailing = match.match(/[),.;!?]+$/)?.[0] || '';
        const url = trailing ? match.slice(0, -trailing.length) : match;
        return `<a class="ba-link" href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>${trailing}`;
      })
      .replace(/\r?\n/g, '<br/>');
  }

  function getBeritaAcaraFileName(draft) {
    const number = Number(draft?.documentNumber ?? draft?.payload?.documentNumber);
    if (!Number.isInteger(number) || number < 1) throw new Error('Nomor berita acara belum tersedia. Simpan draft terlebih dahulu.');
    const date = String(draft.payload.hariTanggal || '').replace(/^[^,]*,\s*/, '').trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '-');
    if (!date) throw new Error('Tanggal pertemuan belum diisi.');
    return `01. BA${String(number).padStart(3, '0')} - Berita Acara Pertemuan ${date}`;
  }
});
