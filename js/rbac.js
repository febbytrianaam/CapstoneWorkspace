/* Matrix RBAC aplikasi. Permission frontend hanya untuk UX; API tetap memvalidasi role. */
(function () {
  const MATRIX = {
    superadmin: {
      pages: { dashboard: true, tugas1: true, tugas2: true, tugas3: true, flow: true, documents: true, users: true, audit: true, rbac: true },
      widgets: { personal: true, stats: true, charts: true, attention: true, meetings: true, workload: true },
      tasks: { create: true, read: true, update: true, delete: true },
      users: { create: true, read: true, update: true, delete: true },
      meetings: { create: true, read: true, update: true, delete: true },
      guides: { create: true, read: true, delete: true },
      documents: { create: true, read: true, delete: true },
      beritaAcara: { create: true, read: true, update: true, delete: false },
      audit: { read: true, create: true, manage: true }
    },
    koordinator: {
      pages: { dashboard: true, tugas1: true, tugas2: true, tugas3: true, flow: true, documents: true, users: false, audit: true, rbac: false },
      widgets: { personal: true, stats: true, charts: true, attention: true, meetings: true, workload: true },
      tasks: { create: true, read: true, update: true, delete: true },
      users: { create: false, read: true, update: false, delete: false },
      meetings: { create: true, read: true, update: true, delete: true },
      guides: { create: true, read: true, delete: true },
      documents: { create: false, read: true, delete: false },
      beritaAcara: { create: true, read: true, update: true, delete: false },
      audit: { read: true, create: true, manage: false }
    },
    member: {
      pages: { dashboard: false, tugas1: true, tugas2: true, tugas3: true, flow: true, documents: true, users: false, audit: false, rbac: false },
      widgets: { personal: false, stats: false, charts: false, attention: false, meetings: false, workload: false },
      tasks: { create: false, read: true, update: true, delete: false },
      users: { create: false, read: false, update: false, delete: false },
      meetings: { create: false, read: false, update: false, delete: false },
      guides: { create: false, read: true, delete: false },
      documents: { create: false, read: true, delete: false },
      beritaAcara: { create: false, read: true, update: false, delete: false },
      audit: { read: false, create: true, manage: false }
    }
  };

  const STORAGE_KEY = 'capstone_rbac_matrix_v1';
  const API_BASE = window.CAPSTONE_API_BASE || 'backend/api/index.php';
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    Object.entries(saved).forEach(([role, areas]) => {
      Object.entries(areas || {}).forEach(([area, permissions]) => {
        Object.entries(permissions || {}).forEach(([permission, value]) => {
          if (MATRIX[role]?.[area] && permission in MATRIX[role][area]) {
            MATRIX[role][area][permission] = Boolean(value);
          }
        });
      });
    });
  } catch (e) {
    localStorage.removeItem(STORAGE_KEY);
  }

  function roleOf(user) {
    return user?.role && MATRIX[user.role] ? user.role : 'member';
  }

  function applyBackendRows(rows) {
    (Array.isArray(rows) ? rows : []).forEach(row => {
      if (MATRIX[row.role]?.[row.area] && row.permission in MATRIX[row.role][row.area]) {
        MATRIX[row.role][row.area][row.permission] = Boolean(Number(row.allowed));
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MATRIX));
  }

  async function loadFromBackend() {
    try {
      const response = await fetch(`${API_BASE}?resource=rbac`, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) return;
      const payload = await response.json();
      if (payload?.ok) {
        applyBackendRows(payload.data);
        window.dispatchEvent(new CustomEvent('capstone:rbac-synced'));
      }
    } catch (error) {
      console.info('Permission RBAC backend belum tersedia, memakai matrix lokal.', error);
    } finally {
      document.documentElement.classList.add('rbac-ready');
    }
  }

  function persistToBackend(role, area, permission, value) {
    fetch(`${API_BASE}?resource=rbac`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ role, area, permission, allowed: Boolean(value) })
    }).catch(() => {});
  }

  window.RBAC = {
    matrix: MATRIX,
    roleOf,
    loadFromBackend,
    set(role, area, permission, value) {
      if (!MATRIX[role]?.[area] || !(permission in MATRIX[role][area])) return;
      MATRIX[role][area][permission] = Boolean(value);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MATRIX));
      persistToBackend(role, area, permission, value);
    },
    can(user, area, action) {
      return Boolean(MATRIX[roleOf(user)]?.[area]?.[action]);
    },
    canPage(user, page) {
      return Boolean(MATRIX[roleOf(user)]?.pages?.[page]);
    },
    canWidget(user, widget) {
      return Boolean(MATRIX[roleOf(user)]?.widgets?.[widget]);
    }
  };

})();
