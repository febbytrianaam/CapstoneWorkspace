/**
 * Capstone Workspace — Layer Data, Pengguna, Notifikasi & Rekam Jejak Audit
 * UT STSI4440 Capstone Project
 */

const STORAGE_KEY = 'capstone_workspace_v3';
const USER_KEY = 'capstone_current_user_v3';
const AUTH_KEY = 'capstone_auth_v1';
const USERS_LIST_KEY = 'capstone_users_list_v3';
const NOTIFS_KEY = 'capstone_notifications_v3';
const AUDIT_LOGS_KEY = 'capstone_audit_logs_v3';
const USER_ACTIVITIES_KEY = 'capstone_user_activities_v1';
const MEETINGS_KEY = 'capstone_general_meetings_v1';
const PROGRESS_NOTES_KEY = 'capstone_progress_notes_v1';
const API_BASE = window.CAPSTONE_API_BASE || 'backend/api/index.php';
const LEGACY_WORK_KEYS = [STORAGE_KEY, MEETINGS_KEY, PROGRESS_NOTES_KEY, NOTIFS_KEY, AUDIT_LOGS_KEY, USER_ACTIVITIES_KEY, 'capstone_berita_acara_drafts_v1'];

function saveCache(key, value) {
  if (window.location.protocol !== 'file:' && [...LEGACY_WORK_KEYS, USERS_LIST_KEY].includes(key)) return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.info('Cache perangkat tidak tersedia; data tetap disimpan di server.');
  }
}

// Fallback offline non-sensitif. Data asli selalu diambil dari backend setelah login.
const DEFAULT_USERS = {
  'Febby': {
    id: 'Febby',
    name: 'Febby',
    fullName: 'Superadmin Capstone',
    nim: '',
    role: 'superadmin',
    color: '#1E40AF',
    initial: 'FB',
    lastLogin: Date.now()
  },
  'Cintia': {
    id: 'Cintia',
    name: 'Cintia',
    fullName: 'Anggota Tim 1',
    nim: '',
    role: 'member',
    color: '#7C3AED',
    initial: 'CT',
    lastLogin: Date.now() - (1000 * 60 * 45)
  },
  'Rival': {
    id: 'Rival',
    name: 'Rival',
    fullName: 'Anggota Tim 2',
    nim: '',
    role: 'member',
    color: '#059669',
    initial: 'RV',
    lastLogin: Date.now() - (1000 * 60 * 60 * 3)
  },
  'Farah': {
    id: 'Farah',
    name: 'Farah',
    fullName: 'Anggota Tim 3',
    nim: '',
    role: 'member',
    color: '#DB2777',
    initial: 'FR',
    lastLogin: Date.now() - (1000 * 60 * 60 * 24)
  },
  'Anggi': {
    id: 'Anggi',
    name: 'Anggi',
    fullName: 'Anggota Tim 4',
    nim: '',
    role: 'member',
    color: '#EA580C',
    initial: 'AG',
    lastLogin: Date.now() - (1000 * 60 * 60 * 48)
  }
};

// Notifikasi hanya memakai data aktivitas nyata.
const DEFAULT_NOTIFICATIONS = [];

// Dataset Rekam Jejak Audit Awal yang Lengkap (Audit Trail Dummy Data)
// Data awal riwayat aktivitas untuk fallback lokal
const DUMMY_IPS = ['192.168.1.45', '10.0.0.12', '172.16.0.88', '192.168.0.101', '10.10.5.33'];
const DUMMY_DEVICES = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) Safari/17.5',
  'Mozilla/5.0 (Linux; Android 14) Chrome/128 Mobile',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6) Safari/604',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/128'
];

const DEFAULT_AUDIT_LOGS = [
  {
    id: 'a-101',
    timestamp: Date.now() - (1000 * 60 * 8),
    user: 'Febby',
    role: 'superadmin',
    action: 'Ubah Status',
    actionTag: 'update_status',
    object: { type: 'Tugas', id: 't-101', name: 'Konsultasikan judul project dan ketentuan penggunaan data' },
    details: 'Mengubah status tugas "Konsultasikan judul project dan ketentuan penggunaan data" dari Belum Dimulai menjadi Sedang Dikerjakan',
    changes: [
      { field: 'Status', from: 'Belum Dimulai', to: 'Sedang Dikerjakan' }
    ],
    ip: '192.168.1.45', device: DUMMY_DEVICES[0]
  },
  {
    id: 'a-102',
    timestamp: Date.now() - (1000 * 60 * 18),
    user: 'Febby',
    role: 'superadmin',
    action: 'Centang Checklist',
    actionTag: 'checklist_toggle',
    object: { type: 'Tugas', id: 't-101', name: 'Konsultasikan judul project dan ketentuan penggunaan data' },
    details: 'Menyelesaikan sub-tugas "Konfirmasi judul sementara" dan "Tanyakan aturan data" pada tugas proposal',
    changes: [
      { field: 'Checklist[0] "Konfirmasi judul sementara"', from: 'false', to: 'true' },
      { field: 'Checklist[1] "Tanyakan aturan data"', from: 'false', to: 'true' }
    ],
    ip: '192.168.1.45', device: DUMMY_DEVICES[0]
  },
  {
    id: 'a-103',
    timestamp: Date.now() - (1000 * 60 * 42),
    user: 'Rival',
    role: 'member',
    action: 'Ubah Status',
    actionTag: 'update_status',
    object: { type: 'Tugas', id: 't-105', name: 'Lengkapi analisis proses persediaan obat Klinik Shifa Medika' },
    details: 'Mengubah status tugas "Lengkapi analisis proses persediaan obat Klinik Shifa Medika" menjadi Sedang Dikerjakan',
    changes: [
      { field: 'Status', from: 'Belum Dimulai', to: 'Sedang Dikerjakan' }
    ],
    ip: '10.0.0.12', device: DUMMY_DEVICES[2]
  },
  {
    id: 'a-104',
    timestamp: Date.now() - (1000 * 60 * 65),
    user: 'Rival',
    role: 'member',
    action: 'Centang Checklist',
    actionTag: 'checklist_toggle',
    object: { type: 'Tugas', id: 't-105', name: 'Lengkapi analisis proses persediaan obat Klinik Shifa Medika' },
    details: 'Menyelesaikan sub-tugas "Obat masuk", "Penyimpanan", dan "Gudang ke apotek"',
    changes: [
      { field: 'Checklist[0] "Obat masuk"', from: 'false', to: 'true' },
      { field: 'Checklist[1] "Penyimpanan"', from: 'false', to: 'true' },
      { field: 'Checklist[2] "Gudang ke apotek"', from: 'false', to: 'true' }
    ],
    ip: '10.0.0.12', device: DUMMY_DEVICES[2]
  },
  {
    id: 'a-105',
    timestamp: Date.now() - (1000 * 60 * 110),
    user: 'Cintia',
    role: 'member',
    action: 'Tambah Tugas',
    actionTag: 'create_task',
    object: { type: 'Tugas', id: 't-109', name: 'Susun struktur awal dokumen proposal Tugas 1 di Microsoft Word' },
    details: 'Menambahkan tugas baru "Susun struktur awal dokumen proposal Tugas 1 di Microsoft Word"',
    changes: [
      { field: 'Judul', from: null, to: 'Susun struktur awal dokumen proposal Tugas 1' },
      { field: 'PIC', from: null, to: 'Cintia' },
      { field: 'Tahap', from: null, to: 'Tugas 1 — Proposal' },
      { field: 'Prioritas', from: null, to: 'Tinggi' }
    ],
    ip: '172.16.0.88', device: DUMMY_DEVICES[1]
  },
  {
    id: 'a-106',
    timestamp: Date.now() - (1000 * 60 * 155),
    user: 'Cintia',
    role: 'member',
    action: 'Centang Checklist',
    actionTag: 'checklist_toggle',
    object: { type: 'Tugas', id: 't-109', name: 'Susun struktur awal dokumen proposal Tugas 1 di Microsoft Word' },
    details: 'Menandai sub-tugas "Cover" dan "Pendahuluan" selesai diisi',
    changes: [
      { field: 'Checklist[0] "Cover"', from: 'false', to: 'true' },
      { field: 'Checklist[1] "Pendahuluan"', from: 'false', to: 'true' }
    ],
    ip: '172.16.0.88', device: DUMMY_DEVICES[1]
  },
  {
    id: 'a-107',
    timestamp: Date.now() - (1000 * 60 * 240),
    user: 'Farah',
    role: 'member',
    action: 'Ubah Status',
    actionTag: 'update_status',
    object: { type: 'Tugas', id: 't-112', name: 'Cari 3–5 referensi relevan untuk sistem informasi persediaan obat' },
    details: 'Mengubah status tugas "Cari 3–5 referensi relevan untuk sistem informasi persediaan obat" dari Sedang Dikerjakan menjadi Selesai',
    changes: [
      { field: 'Status', from: 'Sedang Dikerjakan', to: 'Selesai' }
    ],
    ip: '192.168.0.101', device: DUMMY_DEVICES[3]
  },
  {
    id: 'a-108',
    timestamp: Date.now() - (1000 * 60 * 290),
    user: 'Farah',
    role: 'member',
    action: 'Centang Checklist',
    actionTag: 'checklist_toggle',
    object: { type: 'Tugas', id: 't-112', name: 'Cari 3–5 referensi relevan untuk sistem informasi persediaan obat' },
    details: 'Menyelesaikan sub-tugas "Cari minimal 3 referensi", "Pastikan relevan", dan "Catat sumber"',
    changes: [
      { field: 'Checklist[0] "Cari minimal 3 referensi"', from: 'false', to: 'true' },
      { field: 'Checklist[1] "Pastikan relevan"', from: 'false', to: 'true' },
      { field: 'Checklist[2] "Catat sumber"', from: 'false', to: 'true' }
    ],
    ip: '192.168.0.101', device: DUMMY_DEVICES[3]
  },
  {
    id: 'a-109',
    timestamp: Date.now() - (1000 * 60 * 410),
    user: 'Anggi',
    role: 'member',
    action: 'Ubah Status',
    actionTag: 'update_status',
    object: { type: 'Tugas', id: 't-116', name: 'Susun draft Jadwal Kegiatan Capstone Project' },
    details: 'Mengubah status tugas "Susun draft Jadwal Kegiatan Capstone Project" dari Sedang Dikerjakan menjadi Selesai',
    changes: [
      { field: 'Status', from: 'Sedang Dikerjakan', to: 'Selesai' }
    ],
    ip: '10.10.5.33', device: DUMMY_DEVICES[4]
  },
  {
    id: 'a-110',
    timestamp: Date.now() - (1000 * 60 * 520),
    user: 'Anggi',
    role: 'member',
    action: 'Centang Checklist',
    actionTag: 'checklist_toggle',
    object: { type: 'Tugas', id: 't-116', name: 'Susun draft Jadwal Kegiatan Capstone Project' },
    details: 'Menyelesaikan sub-tugas "Analisis", "Proposal", "Perancangan", "Implementasi", "Pengujian", dan "Finalisasi"',
    changes: [
      { field: 'Checklist[0] "Analisis"', from: 'false', to: 'true' },
      { field: 'Checklist[1] "Proposal"', from: 'false', to: 'true' },
      { field: 'Checklist[2] "Perancangan"', from: 'false', to: 'true' },
      { field: 'Checklist[3] "Implementasi"', from: 'false', to: 'true' },
      { field: 'Checklist[4] "Pengujian"', from: 'false', to: 'true' },
      { field: 'Checklist[5] "Finalisasi"', from: 'false', to: 'true' }
    ],
    ip: '10.10.5.33', device: DUMMY_DEVICES[4]
  },
  {
    id: 'a-111',
    timestamp: Date.now() - (1000 * 60 * 720),
    user: 'Febby',
    role: 'superadmin',
    action: 'Tambah Pengguna',
    actionTag: 'create_user',
    object: { type: 'Pengguna', id: 'Anggi', name: 'Anggi' },
    details: 'Menambahkan pengguna baru "Anggi" dengan hak akses Anggota Tim',
    changes: [
      { field: 'Nama', from: null, to: 'Anggi' },
      { field: 'Role', from: null, to: 'member' },
      { field: 'Warna', from: null, to: '#EA580C' }
    ],
    ip: '192.168.1.45', device: DUMMY_DEVICES[0]
  },
  {
    id: 'a-112',
    timestamp: Date.now() - (1000 * 60 * 960),
    user: 'Febby',
    role: 'superadmin',
    action: 'Ubah Pengguna',
    actionTag: 'update_user',
    object: { type: 'Pengguna', id: 'Cintia', name: 'Cintia' },
    details: 'Memperbarui profil hak akses "Cintia" dan menetapkan warna identitas avatar',
    changes: [
      { field: 'Warna Avatar', from: '#2563EB', to: '#7C3AED' }
    ],
    ip: '192.168.1.45', device: DUMMY_DEVICES[0]
  },
  {
    id: 'a-113',
    timestamp: Date.now() - (1000 * 60 * 1440),
    user: 'Febby',
    role: 'superadmin',
    action: 'Tambah Tugas',
    actionTag: 'create_task',
    object: { type: 'Tugas', id: 't-201', name: 'Turunkan kebutuhan tervalidasi menjadi kebutuhan fungsional' },
    details: 'Menambahkan tugas berprioritas Tinggi "Turunkan kebutuhan tervalidasi menjadi kebutuhan fungsional"',
    changes: [
      { field: 'Judul', from: null, to: 'Turunkan kebutuhan tervalidasi menjadi kebutuhan fungsional' },
      { field: 'PIC', from: null, to: 'Febby' },
      { field: 'Tahap', from: null, to: 'Tugas 2 — Kemajuan' },
      { field: 'Prioritas', from: null, to: 'Tinggi' }
    ],
    ip: '192.168.1.45', device: DUMMY_DEVICES[0]
  },
  {
    id: 'a-114',
    timestamp: Date.now() - (1000 * 60 * 2160),
    user: 'Rival',
    role: 'member',
    action: 'Ubah Status',
    actionTag: 'update_status',
    object: { type: 'Tugas', id: 't-106', name: 'Konfirmasi 5 celah kebutuhan utama pada proses persediaan obat' },
    details: 'Mengubah status tugas "Konfirmasi 5 celah kebutuhan utama pada proses persediaan obat" dari Belum Dimulai menjadi Sedang Dikerjakan',
    changes: [
      { field: 'Status', from: 'Belum Dimulai', to: 'Sedang Dikerjakan' }
    ],
    ip: '10.0.0.12', device: DUMMY_DEVICES[2]
  },
  {
    id: 'a-115',
    timestamp: Date.now() - (1000 * 60 * 2880),
    user: 'Febby',
    role: 'superadmin',
    action: 'Centang Checklist',
    actionTag: 'checklist_toggle',
    object: { type: 'Tugas', id: 't-103', name: 'Review hasil pengumpulan kebutuhan dan tandai informasi yang belum terkonfirmasi' },
    details: 'Menyelesaikan sub-tugas "Review dokumen analisis" dan "Tandai kekurangan"',
    changes: [
      { field: 'Checklist[0] "Review dokumen analisis"', from: 'false', to: 'true' },
      { field: 'Checklist[1] "Tandai kekurangan"', from: 'false', to: 'true' }
    ],
    ip: '192.168.1.45', device: DUMMY_DEVICES[0]
  }
];

// Metadata Tahapan
const PHASE_META = {
  tugas1: { label: 'Tugas 1 — Proposal', short: 'Tugas 1', desc: 'Fokus pada proposal, pengumpulan kebutuhan, ruang lingkup, jadwal, referensi, serta arahan tutor.' },
  tugas2: { label: 'Tugas 2 — Laporan Kemajuan', short: 'Tugas 2', desc: 'Fokus pada analisis/desain, progres implementasi, dan dokumentasi laporan kemajuan.' },
  tugas3: { label: 'Tugas 3 — Laporan Akhir & Final', short: 'Tugas 3', desc: 'Fokus pada finalisasi aplikasi, pengujian, laporan akhir, lampiran, dan presentasi.' }
};

// Default Dataset Tugas
const DEFAULT_TASKS = [
  {
    id: 't-101', phase: 'tugas1', title: 'Konsultasikan judul project dan ketentuan penggunaan data kepada tutor', pic: 'Febby', status: 'Sedang Dikerjakan', priority: 'Tinggi',
    description: 'Tanyakan konfirmasi judul sementara serta aturan data yang boleh digunakan dalam Capstone: data asli, data yang dianonimkan, atau data contoh. Catat jawaban tutor dan sampaikan ke tim.',
    checklist: ['Konfirmasi judul sementara', 'Tanyakan aturan data', 'Catat jawaban tutor', 'Sampaikan ke tim'],
    checklistDone: [true, true, false, false],
    meetings: [
      {
        id: 'm-101-1',
        title: 'Bimbingan Tutor #1 — Konsultasi Judul & Ketentuan Data',
        date: '2026-09-28T14:30',
        endDate: '2026-09-28T15:30',
        url: 'https://meet.google.com/abc-defg-hij',
        notes: 'Diskusi persetujuan judul Klinik Shifa Medika & ketentuan anonimitas data UT.'
      },
      {
        id: 'm-101-2',
        title: 'Rapat Internal Tim — Persiapan Poin Bimbingan',
        date: '2026-09-27T19:00',
        endDate: '2026-09-27T20:00',
        url: 'https://zoom.us/j/987654321',
        notes: 'Penyamaan persepsi tim sebelum bimbingan dengan tutor.'
      }
    ]
  },
  {
    id: 't-102', phase: 'tugas1', title: 'Koordinasikan progress Tugas 1 dan pastikan update anggota tersampaikan', pic: 'Febby', status: 'Sedang Dikerjakan', priority: 'Tinggi',
    description: 'Kumpulkan perkembangan pekerjaan dari setiap anggota, rangkum perubahan penting dari rapat atau tutor, dan pastikan seluruh anggota menerima informasi.',
    checklist: ['Kumpulkan update anggota', 'Rangkum keputusan', 'Sebarkan update'],
    checklistDone: [true, false, false]
  },
  {
    id: 't-103', phase: 'tugas1', title: 'Review hasil pengumpulan kebutuhan dan tandai informasi yang belum terkonfirmasi', pic: 'Febby', status: 'Sedang Dikerjakan', priority: 'Tinggi',
    description: 'Cek alur As-Is, aktor, data transaksi, aturan batch/expiry, stok gudang-apotek, dan stock opname yang masih belum jelas. Buat daftar pertanyaan.',
    checklist: ['Review dokumen analisis', 'Tandai kekurangan', 'Susun daftar pertanyaan'],
    checklistDone: [true, true, false]
  },
  {
    id: 't-104', phase: 'tugas1', title: 'Siapkan kebutuhan izin resmi studi kasus ke Klinik Shifa Medika', pic: 'Febby', status: 'Ditunda', priority: 'Sedang',
    description: 'Siapkan poin kebutuhan surat izin studi kasus, akses informasi proses kerja, dan data pendukung. Lanjutkan setelah arahan tutor cukup jelas.',
    checklist: ['Draft poin izin', 'Tunggu arahan tutor'],
    checklistDone: [false, false]
  },
  {
    id: 't-105', phase: 'tugas1', title: 'Lengkapi analisis proses persediaan obat berdasarkan kondisi aktual Klinik Shifa Medika', pic: 'Rival', status: 'Sedang Dikerjakan', priority: 'Tinggi',
    description: 'Lengkapi kondisi nyata proses persediaan obat dari obat masuk, penyimpanan, perpindahan gudang-apotek, obat keluar, pengecekan stok, hingga penanganan obat kadaluarsa.',
    checklist: ['Obat masuk', 'Penyimpanan', 'Gudang ke apotek', 'Obat keluar', 'Stock opname', 'Kadaluarsa/rusak/retur'],
    checklistDone: [true, true, true, false, false, false],
    meetings: [
      {
        id: 'm-105-1',
        title: 'Wawancara Petugas Farmasi Klinik Shifa Medika',
        date: '2026-09-29T10:00',
        endDate: '2026-09-29T11:00',
        url: 'https://meet.google.com/xyz-uvwx-rst',
        notes: 'Observasi alur penerimaan obat, gudang, dan stock opname.'
      }
    ]
  },
  {
    id: 't-106', phase: 'tugas1', title: 'Konfirmasi 5 celah kebutuhan utama pada proses persediaan obat', pic: 'Rival', status: 'Sedang Dikerjakan', priority: 'Tinggi',
    description: 'Pastikan jawaban untuk pemisahan saldo gudang dan apotek, kapan stok berkurang, field data transaksi, koreksi selisih stock opname, serta aturan FIFO/FEFO.',
    checklist: ['Saldo gudang-apotek', 'Trigger stok berkurang', 'Field transaksi', 'Koreksi selisih', 'FIFO/FEFO'],
    checklistDone: [true, false, true, false, false]
  },
  {
    id: 't-107', phase: 'tugas1', title: 'Perjelas pembagian kerja petugas farmasi pada proses persediaan', pic: 'Rival', status: 'Sedang Dikerjakan', priority: 'Tinggi',
    description: 'Jelaskan siapa yang menerima obat, melakukan input, mengecek stok malam, stock opname, koreksi selisih, dan menyiapkan laporan.',
    checklist: ['Penerimaan', 'Input', 'Cek malam', 'Stock opname', 'Koreksi', 'Laporan'],
    checklistDone: [true, true, false, false, false, false]
  },
  {
    id: 't-108', phase: 'tugas1', title: 'Siapkan contoh data atau dokumen pendukung yang diizinkan klinik', pic: 'Rival', status: 'Belum Dimulai', priority: 'Sedang',
    description: 'Identifikasi contoh data transaksi, kartu stok, laporan, screenshot, atau dokumen lain yang boleh digunakan sebagai bahan analisis.',
    checklist: ['Daftar dokumen', 'Cek izin penggunaan'],
    checklistDone: [false, false]
  },
  {
    id: 't-109', phase: 'tugas1', title: 'Susun struktur awal dokumen proposal Tugas 1 di Microsoft Word', pic: 'Cintia', status: 'Sedang Dikerjakan', priority: 'Tinggi',
    description: 'Siapkan dokumen utama proposal mulai dari cover dan struktur isi sesuai panduan UT agar setiap bagian dapat langsung diisi.',
    checklist: ['Cover', 'Pendahuluan', 'Tinjauan pustaka', 'Lampiran'],
    checklistDone: [true, true, false, false],
    meetings: [
      {
        id: 'm-109-1',
        title: 'Review Draf Proposal Tugas 1 Bersama Tim',
        date: '2026-09-30T16:00',
        endDate: '2026-09-30T17:00',
        url: 'https://teams.microsoft.com/l/meetup-join/123456',
        notes: 'Pemeriksaan kelengkapan latar belakang, tujuan, dan lampiran.'
      }
    ]
  },
  {
    id: 't-110', phase: 'tugas1', title: 'Susun draft Latar Belakang dan Tujuan berdasarkan informasi yang tersedia', pic: 'Cintia', status: 'Sedang Dikerjakan', priority: 'Tinggi',
    description: 'Tulis draft awal dengan alur pentingnya pengelolaan persediaan obat, kondisi Klinik Shifa Medika, masalah aktual, dampak, dan kebutuhan sistem.',
    checklist: ['Latar belakang', 'Tujuan', 'Penyesuaian data'],
    checklistDone: [true, true, false]
  },
  {
    id: 't-111', phase: 'tugas1', title: 'Perbarui draft proposal mengikuti hasil analisis dan arahan tutor', pic: 'Cintia', status: 'Belum Dimulai', priority: 'Sedang',
    description: 'Revisi isi proposal secara bertahap setelah hasil analisis atau arahan tutor diterima.',
    checklist: ['Cek pembaruan kebutuhan', 'Cek arahan tutor', 'Revisi proposal'],
    checklistDone: [false, false, false]
  },
  {
    id: 't-112', phase: 'tugas1', title: 'Cari 3–5 referensi relevan untuk sistem informasi persediaan obat', pic: 'Farah', status: 'Selesai', priority: 'Tinggi',
    description: 'Cari referensi tentang persediaan obat, pemantauan stok, tanggal kadaluarsa, dan sistem informasi persediaan sebagai bahan Tinjauan Pustaka.',
    checklist: ['Cari minimal 3 referensi', 'Pastikan relevan', 'Catat sumber'],
    checklistDone: [true, true, true]
  },
  {
    id: 't-113', phase: 'tugas1', title: 'Buat ringkasan referensi sebagai bahan Tinjauan Pustaka', pic: 'Farah', status: 'Sedang Dikerjakan', priority: 'Sedang',
    description: 'Ringkas teori utama, konsep, metode, atau temuan penting dari setiap referensi agar mudah digunakan saat penyusunan Tinjauan Pustaka.',
    checklist: ['Ringkas teori', 'Ringkas temuan', 'Catat sitasi'],
    checklistDone: [true, false, false]
  },
  {
    id: 't-114', phase: 'tugas1', title: 'Sesuaikan bahan pustaka dengan ruang lingkup proyek yang disepakati', pic: 'Farah', status: 'Ditunda', priority: 'Sedang',
    description: 'Pilih referensi yang benar-benar relevan dan eliminasi bahan yang tidak mendukung fokus sistem persediaan obat.',
    checklist: ['Tunggu ruang lingkup stabil', 'Filter referensi'],
    checklistDone: [false, false]
  },
  {
    id: 't-115', phase: 'tugas1', title: 'Susun draft Ruang Lingkup berdasarkan arah proyek sementara', pic: 'Anggi', status: 'Sedang Dikerjakan', priority: 'Tinggi',
    description: 'Buat batasan awal proyek berdasarkan fokus persediaan obat, termasuk proses yang masuk dan tidak masuk scope.',
    checklist: ['Scope masuk', 'Scope luar', 'Catatan asumsi'],
    checklistDone: [true, true, false]
  },
  {
    id: 't-116', phase: 'tugas1', title: 'Susun draft Jadwal Kegiatan Capstone Project', pic: 'Anggi', status: 'Selesai', priority: 'Tinggi',
    description: 'Buat jadwal awal kegiatan Capstone secara runtut dari analisis, proposal, perancangan, implementasi, pengujian, hingga finalisasi.',
    checklist: ['Analisis', 'Proposal', 'Perancangan', 'Implementasi', 'Pengujian', 'Finalisasi'],
    checklistDone: [true, true, true, true, true, true]
  },
  {
    id: 't-117', phase: 'tugas1', title: 'Revisi Ruang Lingkup dan Jadwal sesuai hasil analisis terbaru', pic: 'Anggi', status: 'Ditunda', priority: 'Sedang',
    description: 'Perbarui ruang lingkup dan jadwal setelah pengumpulan kebutuhan dan arahan tutor lebih stabil.',
    checklist: ['Tunggu kebutuhan', 'Tunggu arahan tutor', 'Revisi'],
    checklistDone: [false, false, false]
  },
  {
    id: 't-201', phase: 'tugas2', title: 'Turunkan kebutuhan tervalidasi menjadi kebutuhan fungsional dan non-fungsional', pic: 'Febby', status: 'Belum Dimulai', priority: 'Tinggi',
    description: 'Gunakan hasil kebutuhan Tugas 1 sebagai dasar untuk menyusun kebutuhan sistem, aturan bisnis, dan batasan implementasi.',
    checklist: ['Kebutuhan fungsional', 'Kebutuhan non-fungsional', 'Aturan bisnis'],
    checklistDone: [false, false, false]
  },
  {
    id: 't-202', phase: 'tugas2', title: 'Susun artefak analisis dan desain sistem yang dibutuhkan', pic: 'Febby', status: 'Belum Dimulai', priority: 'Tinggi',
    description: 'Siapkan artefak seperti use case, proses To-Be, ERD, dan rancangan antarmuka.',
    checklist: ['Use case', 'To-Be', 'ERD', 'Draft antarmuka'],
    checklistDone: [false, false, false, false]
  },
  {
    id: 't-203', phase: 'tugas2', title: 'Dokumentasikan progres implementasi untuk laporan kemajuan', pic: 'Cintia', status: 'Belum Dimulai', priority: 'Sedang',
    description: 'Kumpulkan tangkapan layar, catatan perkembangan, dan perubahan penting yang akan masuk ke laporan kemajuan.',
    checklist: ['Screenshot', 'Catatan progres', 'Perubahan'],
    checklistDone: [false, false, false]
  },
  {
    id: 't-301', phase: 'tugas3', title: 'Finalisasi aplikasi dan pastikan seluruh fitur utama dapat digunakan', pic: 'Febby', status: 'Belum Dimulai', priority: 'Tinggi',
    description: 'Pastikan fungsi utama berjalan lancar dan hasil implementasi sesuai dengan kebutuhan yang telah disepakati.',
    checklist: ['Fungsi utama', 'Validasi', 'Hak akses', 'Uji fungsi'],
    checklistDone: [false, false, false, false]
  },
  {
    id: 't-302', phase: 'tugas3', title: 'Finalisasi laporan akhir, lampiran, dan bukti pendukung', pic: 'Cintia', status: 'Belum Dimulai', priority: 'Tinggi',
    description: 'Gabungkan seluruh bagian laporan final, bukti pengujian, dokumentasi, dan lampiran agar siap dikumpulkan.',
    checklist: ['Laporan akhir', 'Lampiran', 'Bukti uji', 'Review format'],
    checklistDone: [false, false, false, false]
  },
  {
    id: 't-303', phase: 'tugas3', title: 'Siapkan presentasi final dan pembagian penyampaian anggota', pic: 'Febby', status: 'Belum Dimulai', priority: 'Sedang',
    description: 'Susun alur presentasi final dan bagi bagian penyampaian agar seluruh anggota memiliki peran yang jelas.',
    checklist: ['Outline slide', 'Pembagian pembicara', 'Latihan'],
    checklistDone: [false, false, false]
  }
];

// Pengelola Data Store
class DataStore {
  constructor() {
    const offlineMode = window.location.protocol === 'file:';
    this.users = offlineMode ? this.loadUsers() : {};
    this.tasks = offlineMode ? this.loadTasks() : [];
    this.notifications = offlineMode ? this.loadNotifications() : [];
    this.auditLogs = offlineMode ? this.loadAuditLogs() : [];
    this.userActivities = offlineMode ? this.loadUserActivities() : [];
    this.meetings = offlineMode ? this.loadGeneralMeetings() : [];
    this.progressNotes = offlineMode ? this.loadProgressNotes() : {};
    this.currentUser = this.loadUser();
    this.lastSyncedAt = null;
    this.syncError = '';
    this.auditLoaded = false;
    this.legacyEntries = {};
    for (const key of LEGACY_WORK_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw !== null) this.legacyEntries[key] = raw;
    }
    this.legacyRecovery = null;
    this.legacyStorageReady = Promise.resolve();
    // Database menjadi sumber utama untuk aplikasi login. Fallback seed hanya aktif saat file dibuka langsung.
    this.ready = this.syncFromBackend();
  }

  async syncFromBackend() {
    if (window.location.protocol === 'file:') return { ok: true };

    try {
      const response = await fetch(`${API_BASE}?resource=snapshot&include_logs=0`, {
        cache: 'no-store',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json'
        }
      });
      if (response.status === 401) {
        this.clearAuthenticatedUser();
        window.dispatchEvent(new CustomEvent('capstone:auth-required'));
        return { ok: false, message: 'Sesi berakhir. Silakan masuk kembali.' };
      }
      if (!response.ok) throw new Error('Data belum dapat diperbarui. Coba lagi sebentar.');

      const payload = await response.json();
      if (!payload.ok || !payload.data) throw new Error('Data dari server belum dapat dibaca.');

      const snapshot = payload.data;
      if (this.currentUser?.id !== snapshot.currentUser?.id || snapshot.currentUser?.role !== 'superadmin') {
        this.auditLogs = [];
        this.userActivities = [];
        this.auditLoaded = false;
      }
      this.users = snapshot.users && typeof snapshot.users === 'object' ? snapshot.users : {};
      this.tasks = Array.isArray(snapshot.tasks) ? snapshot.tasks : [];
      this.notifications = Array.isArray(snapshot.notifications) ? snapshot.notifications : [];
      if (Array.isArray(snapshot.auditLogs)) this.auditLogs = snapshot.auditLogs;
      if (Array.isArray(snapshot.userActivities)) this.userActivities = snapshot.userActivities;
      this.meetings = Array.isArray(snapshot.meetings) ? snapshot.meetings : this.meetings;
      this.progressNotes = snapshot.progressNotes && typeof snapshot.progressNotes === 'object' ? snapshot.progressNotes : {};

      this.currentUser = snapshot.currentUser || null;

      this.save();
      this.saveUsers();
      this.saveNotifications();
      this.saveAuditLogs();
      this.saveUserActivities();
      this.saveMeetings();
      this.saveProgressNotes();
      if (this.currentUser) this.setAuthenticatedUser(this.currentUser);
      this.lastSyncedAt = Date.now();
      this.syncError = '';
      window.dispatchEvent(new CustomEvent('capstone:data-synced'));
      if (!this.legacyRecovery || this.legacyRecovery.userId !== this.currentUser?.id || this.legacyRecovery.error) {
        this.legacyStorageReady = this.recoverLegacyStorage(Boolean(this.legacyRecovery?.error));
      }
      return { ok: true };
    } catch (e) {
      this.syncError = e.message || 'Server tidak dapat dihubungi.';
      return { ok: false, message: this.syncError };
    }
  }

  async commitToBackend(resource, method, body = null, params = {}) {
    if (window.location.protocol === 'file:') return null;
    const result = await this.sendToBackend(resource, method, body, params);
    if (!result?.ok) throw new Error(result?.message || 'Perubahan belum tersimpan. Periksa koneksi lalu coba lagi.');
    if (method !== 'DELETE' && (!result.data || typeof result.data !== 'object')) throw new Error('Konfirmasi data dari server belum dapat dibaca. Perbarui data sebelum mencoba kembali.');
    return result.data;
  }

  async recoverLegacyStorage(force = false) {
    const user = this.currentUser;
    if (window.location.protocol === 'file:' || !['superadmin', 'koordinator'].includes(user?.role) || !Object.keys(this.legacyEntries).length) return null;
    if (!force && this.legacyRecovery?.userId === user.id) return this.legacyRecovery;
    const result = { userId: user.id, loading: true, backupId: '', error: '', saved: 0, conflicts: [], unresolved: [] };
    this.legacyRecovery = result;
    try {
      const backup = await this.sendToBackend('browser-backups', 'POST', { entries: this.legacyEntries });
      if (!backup?.ok || !backup.data?.id) throw new Error('Cadangan data browser belum tersimpan. Salinan di perangkat tetap dipertahankan.');
      if (this.currentUser?.id !== user.id) return null;
      result.backupId = backup.data.id;
      const imported = await this.sendToBackend('ba-drafts', 'POST', { backupId: result.backupId });
      if (!imported?.ok) throw new Error('Cadangan sudah tersimpan, tetapi pemulihan draft belum selesai.');
      Object.assign(result, imported.data);
    } catch (error) {
      result.error = error.message;
    } finally {
      result.loading = false;
      if (this.currentUser?.id === user.id) window.dispatchEvent(new CustomEvent('capstone:legacy-recovered'));
    }
    return result;
  }

  async getBeritaAcaraDraft(meetingId) {
    const userId = this.currentUser?.id;
    await this.legacyStorageReady;
    const result = await this.sendToBackend('ba-drafts', 'GET', null, { meeting_id: meetingId });
    if (!userId || this.currentUser?.id !== userId) throw new Error('Sesi telah berubah.');
    if (!result?.ok) throw new Error(result?.message || 'Draft belum dapat dimuat. Silakan coba lagi.');
    if (result.data !== null && (!result.data?.payload || !Number.isInteger(result.data.revision) || result.data.revision < 1)) throw new Error('Draft dari server belum dapat dibaca. Silakan muat ulang.');
    return result.data;
  }

  async saveBeritaAcaraDraft(meetingId, payload, revision) {
    const userId = this.currentUser?.id;
    const result = await this.sendToBackend('ba-drafts', 'PUT', { payload, revision }, { meeting_id: meetingId });
    if (!userId || this.currentUser?.id !== userId) throw new Error('Sesi telah berubah.');
    if (!result?.ok || !result.data?.payload || !Number.isInteger(result.data.revision)) {
      const error = new Error(result?.message || 'Draft belum tersimpan. Input Anda tetap tersedia.');
      error.conflict = Boolean(result?.conflict);
      error.currentDraft = result?.data || null;
      throw error;
    }
    return result.data;
  }

  async getBrowserBackups(id = '') {
    const result = await this.sendToBackend('browser-backups', 'GET', null, id ? { id } : {});
    if (!result?.ok) throw new Error(result?.message || 'Cadangan browser belum dapat dimuat.');
    return result.data;
  }

  async getPhaseAccess(phase) {
    if (!['tugas1', 'tugas2', 'tugas3'].includes(phase)) throw new Error('Tahap tugas tidak valid.');
    const userId = this.currentUser?.id;
    if (!userId) throw new Error('Silakan masuk kembali.');
    if (window.location.protocol === 'file:') return { members: [], serverTime: Date.now() };
    await this.activityWrite;
    const payload = await this.sendToBackend('phase-access', 'GET', null, { phase });
    if (this.currentUser?.id !== userId) throw new Error('Sesi telah berubah.');
    if (!payload?.ok || !Array.isArray(payload.data?.members) || !Number.isFinite(payload.data.serverTime)) throw new Error('Akses terakhir tim belum dapat dimuat. Silakan perbarui kembali.');
    return payload.data;
  }

  async fetchAuditData() {
    if (this.currentUser?.role !== 'superadmin') throw new Error('Akses hanya untuk superadmin.');
    const userId = this.currentUser.id;
    const [logs, activities] = await Promise.all([
      this.sendToBackend('audit-logs'), this.sendToBackend('user-activities')
    ]);
    if (!logs?.ok || !activities?.ok) throw new Error('Riwayat aktivitas belum dapat dimuat.');
    if (this.currentUser?.id !== userId || this.currentUser?.role !== 'superadmin') throw new Error('Sesi telah berubah.');
    this.auditLogs = Array.isArray(logs.data) ? logs.data : [];
    this.userActivities = Array.isArray(activities.data) ? activities.data : [];
    this.auditLoaded = true;
    return true;
  }

  async sendToBackend(resource, method = 'GET', body = null, params = {}) {
    if (window.location.protocol === 'file:') return null;

    const search = new URLSearchParams({ resource, ...params });
    try {
      const response = await fetch(`${API_BASE}?${search.toString()}`, {
        method,
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: body ? JSON.stringify(body) : null
      });
      const payload = await response.json().catch(() => null);
      if (response.status === 401) {
        this.clearAuthenticatedUser();
        window.dispatchEvent(new CustomEvent('capstone:auth-required'));
      }
      if (!response.ok) {
        console.error(`Backend ${method} ${resource} gagal:`, payload?.message || response.statusText);
        return { ...payload, ok: false, status: response.status, message: payload?.message || 'Permintaan belum dapat diproses.' };
      }
      return payload;
    } catch (e) {
      console.info('Sinkronisasi backend gagal, data lokal tetap dipakai.', e);
      return null;
    }
  }

  async getProjectGuides() {
    if (window.location.protocol === 'file:') return [];
    const payload = await this.sendToBackend('guides');
    if (!payload?.ok) throw new Error('Panduan belum dapat dimuat. Coba lagi.');
    return Array.isArray(payload.data) ? payload.data : [];
  }

  async uploadProjectGuide(title, file) {
    if (window.location.protocol === 'file:' || !file) return null;
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    try {
      const response = await fetch(`${API_BASE}?resource=guides`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json'
        },
        body: formData
      });
      return response.ok ? response.json() : null;
    } catch (e) {
      console.info('Upload panduan gagal.', e);
      return null;
    }
  }

  async deleteProjectGuide(id) {
    return this.sendToBackend('guides', 'DELETE', null, { id });
  }

  async getDocumentArchives() {
    if (window.location.protocol === 'file:') return [];
    const payload = await this.sendToBackend('document-archives');
    if (!payload?.ok) throw new Error('Arsip dokumen belum dapat dimuat. Coba lagi.');
    return Array.isArray(payload.data) ? payload.data : [];
  }

  async uploadDocumentArchive({ title, category, description, meetingId, file }) {
    if (window.location.protocol === 'file:' || !file) return null;
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('description', description || '');
    if (meetingId) formData.append('meeting_id', meetingId);
    formData.append('file', file);
    try {
      const response = await fetch(`${API_BASE}?resource=document-archives`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json'
        },
        body: formData
      });
      return response.ok ? response.json() : null;
    } catch (e) {
      console.info('Upload arsip dokumen gagal.', e);
      return null;
    }
  }

  async updateDocumentArchive(id, { title, category, description, meetingId }) {
    return this.sendToBackend('document-archives', 'PUT', {
      title,
      category,
      description: description || '',
      meetingId: meetingId || ''
    }, { id });
  }

  async deleteDocumentArchive(id) {
    return this.sendToBackend('document-archives', 'DELETE', null, { id });
  }

  async changePassword(currentPassword, newPassword) {
    if (window.location.protocol === 'file:') return null;

    const search = new URLSearchParams({ resource: 'auth' });
    try {
      const response = await fetch(`${API_BASE}?${search.toString()}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          action: 'change_password',
          currentPassword,
          newPassword
        })
      });
      const payload = await response.json().catch(() => null);
      if (response.status === 401) {
        this.clearAuthenticatedUser();
        window.dispatchEvent(new CustomEvent('capstone:auth-required'));
      }
      if (!response.ok) {
        return {
          ok: false,
          message: payload?.message || 'Password gagal diubah.'
        };
      }
      if (payload?.ok && payload.data) this.setAuthenticatedUser(payload.data);
      return payload;
    } catch (e) {
      console.info('Perubahan password gagal disinkronkan.', e);
      return { ok: false, message: 'Server tidak dapat dihubungi.' };
    }
  }

  /* ==========================================
     Manajemen Rekam Jejak Audit (Audit Trail Log)
     ========================================== */
  loadAuditLogs() {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    if (!raw) {
      saveCache(AUDIT_LOGS_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
      return JSON.parse(JSON.stringify(DEFAULT_AUDIT_LOGS));
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        saveCache(AUDIT_LOGS_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
        return JSON.parse(JSON.stringify(DEFAULT_AUDIT_LOGS));
      }
      return parsed;
    } catch (e) {
      saveCache(AUDIT_LOGS_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
      return JSON.parse(JSON.stringify(DEFAULT_AUDIT_LOGS));
    }
  }

  saveAuditLogs() {
    saveCache(AUDIT_LOGS_KEY, JSON.stringify(this.auditLogs));
  }

  resetAuditLogs() {
    this.auditLogs = JSON.parse(JSON.stringify(DEFAULT_AUDIT_LOGS));
    this.saveAuditLogs();
    this.sendToBackend('audit-logs', 'DELETE').then(() => {
      this.auditLogs.forEach(log => this.sendToBackend('audit-logs', 'POST', log));
    });
    return this.auditLogs;
  }

  getAuditLogs() {
    return this.auditLogs;
  }

  logAudit(action, details, extra = {}) {
    const activeUser = this.currentUser || { name: 'System', role: 'member' };
    const newLog = {
      id: 'a-' + Date.now(),
      timestamp: Date.now(),
      user: activeUser.name,
      role: activeUser.role,
      action,
      actionTag: extra.actionTag || action.toLowerCase().replace(/\s/g, '_'),
      object: extra.object || null,
      details,
      changes: extra.changes || [],
      ip: extra.ip || DUMMY_IPS[Math.floor(Math.random() * DUMMY_IPS.length)],
      device: extra.device || DUMMY_DEVICES[Math.floor(Math.random() * DUMMY_DEVICES.length)]
    };
    this.auditLogs.unshift(newLog);
    this.saveAuditLogs();
    this.sendToBackend('audit-logs', 'POST', newLog);
    return newLog;
  }

  clearAuditLogs() {
    this.auditLogs = [];
    this.saveAuditLogs();
    this.sendToBackend('audit-logs', 'DELETE');
  }

  loadUserActivities() {
    const raw = localStorage.getItem(USER_ACTIVITIES_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  saveUserActivities() {
    saveCache(USER_ACTIVITIES_KEY, JSON.stringify(this.userActivities || []));
  }

  getUserActivities() {
    return this.userActivities || [];
  }

  logUserActivity(activity, details = '', extra = {}) {
    const activeUser = this.currentUser || { name: 'System', role: 'member' };
    const newActivity = {
      id: 'ua-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
      user: activeUser.name,
      role: activeUser.role,
      activity,
      activityTag: extra.activityTag || activity.toLowerCase().replace(/\s+/g, '_'),
      page: extra.page || '',
        target: extra.target || {},
      details,
      ip: extra.ip || '',
      device: extra.device || navigator.userAgent || 'Browser'
    };
    this.userActivities = [newActivity, ...(this.userActivities || [])].slice(0, 500);
    this.saveUserActivities();
    this.activityWrite = this.sendToBackend('user-activities', 'POST', newActivity);
    return newActivity;
  }

  /* ==========================================
     Manajemen Notifikasi
     ========================================== */
  loadNotifications() {
    const raw = localStorage.getItem(NOTIFS_KEY);
    if (!raw) {
      saveCache(NOTIFS_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return JSON.parse(JSON.stringify(DEFAULT_NOTIFICATIONS));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_NOTIFICATIONS));
    }
  }

  saveNotifications() {
    saveCache(NOTIFS_KEY, JSON.stringify(this.notifications));
  }

  getNotifications() {
    return this.notifications;
  }

  addNotification(userName, text, targetUser = null) {
    const newNotif = {
      id: 'n-' + Date.now(),
      user: userName,
      targetUser,
      text,
      time: Date.now(),
      read: false
    };
    if (!targetUser || !this.currentUser?.name || targetUser === this.currentUser.name) {
      this.notifications.unshift(newNotif);
      this.saveNotifications();
    }
    this.sendToBackend('notifications', 'POST', newNotif);
    return newNotif;
  }

  markAllNotificationsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.sendToBackend('notifications', 'PUT', { action: 'mark_all_read' });
  }

  /* ==========================================
     Manajemen Pengguna (User CRUD)
     ========================================== */
  loadUsers() {
    const raw = localStorage.getItem(USERS_LIST_KEY);
    if (!raw) {
      saveCache(USERS_LIST_KEY, JSON.stringify(DEFAULT_USERS));
      return JSON.parse(JSON.stringify(DEFAULT_USERS));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Gagal membaca daftar pengguna, reset ke default:', e);
      return JSON.parse(JSON.stringify(DEFAULT_USERS));
    }
  }

  saveUsers() {
    saveCache(USERS_LIST_KEY, JSON.stringify(this.users));
  }

  getUsers() {
    return this.users;
  }

  getUserById(id) {
    return this.users[id];
  }

  async addUser(userData) {
    const name = userData.name.trim();
    const id = name;
    const initial = name.slice(0, 2).toUpperCase();
    const newUser = {
      id,
      username: userData.username || name.toLowerCase().replace(/[^a-z0-9]+/g, '.'),
      name,
      fullName: userData.fullName || name,
      nim: userData.nim || '',
      role: userData.role || 'member',
      color: userData.color || '#2563EB',
      initial,
      lastLogin: Date.now()
    };
    const saved = await this.commitToBackend('users', 'POST', { ...newUser, password: userData.password || '' });
    this.users[id] = saved || newUser;
    this.saveUsers();
    this.addNotification(this.currentUser?.name || 'System', `menambahkan pengguna baru "${name}"`);
    const addedRoleLabel = userData.role === 'superadmin' ? 'Superadmin' : userData.role === 'koordinator' ? 'Koordinator' : 'Member';
    this.logAudit('Tambah Pengguna', `Menambahkan pengguna baru "${name}" dengan peran ${addedRoleLabel}`);
    return this.users[id];
  }

  async updateUser(id, updatedData) {
    if (this.users[id]) {
      const { password, ...safeUpdatedData } = updatedData;
      const saved = await this.commitToBackend('users', 'PUT', { ...safeUpdatedData, ...(password ? { password } : {}) }, { id });
      this.users[id] = saved || { ...this.users[id], ...safeUpdatedData };
      if (this.currentUser?.id === id) this.setAuthenticatedUser(this.users[id]);
      this.saveUsers();
        const updatedRoleLabel = safeUpdatedData.role === 'superadmin' ? 'Superadmin' : safeUpdatedData.role === 'koordinator' ? 'Koordinator' : 'Member';
        this.logAudit('Ubah Pengguna', `Mengubah profil data pengguna "${id}" (${updatedRoleLabel})`);
      return this.users[id];
    }
    return null;
  }

  async deleteUser(id) {
    if (this.users[id]) {
      await this.commitToBackend('users', 'DELETE', null, { id });
      delete this.users[id];
      this.saveUsers();
      this.logAudit('Hapus Pengguna', `Menghapus akun pengguna "${id}" dari sistem`);
      return true;
    }
    return false;
  }

  async setUserActive(id, isActive) {
    if (this.currentUser?.role !== 'superadmin') throw new Error('Hanya superadmin yang dapat mengubah status akun.');
    const saved = await this.commitToBackend('users', 'PUT', { action: 'set_status', isActive }, { id });
    if (!saved || saved.id !== id || saved.isActive !== isActive) throw new Error('Perubahan status akun belum dapat dikonfirmasi.');
    this.users[id] = saved;
    this.saveUsers();
    return saved;
  }

  async refreshUsers() {
    const result = await this.sendToBackend('users', 'GET');
    if (!result?.ok || !result.data || Array.isArray(result.data)) throw new Error('Daftar anggota belum dapat dimuat. Silakan coba lagi.');
    this.users = result.data;
    this.saveUsers();
    return this.users;
  }

  loadUser() {
    if (window.location.protocol === 'file:') {
      const savedId = localStorage.getItem(USER_KEY);
      if (savedId && this.users[savedId]) {
        this.updateLastLogin(savedId);
        return this.users[savedId];
      }
      this.updateLastLogin('Febby');
      return this.users['Febby'] || Object.values(this.users)[0];
    }

    try {
      const savedUser = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
      if (savedUser?.id) {
        this.users[savedUser.id] = { ...(this.users[savedUser.id] || {}), ...savedUser };
        return this.users[savedUser.id];
      }
    } catch (e) {
      localStorage.removeItem(AUTH_KEY);
    }
    return null;
  }

  setCurrentUser(userId) {
    if (this.users[userId]) {
      this.updateLastLogin(userId);
      this.currentUser = this.users[userId];
      saveCache(USER_KEY, userId);
      return this.currentUser;
    }
    return null;
  }

  setAuthenticatedUser(user) {
    if (!user || !user.id) return null;
    this.users[user.id] = { ...(this.users[user.id] || {}), ...user };
    this.currentUser = this.users[user.id];
    this.saveUsers();
    saveCache(USER_KEY, user.id);
    saveCache(AUTH_KEY, JSON.stringify(user));
    return this.currentUser;
  }

  clearAuthenticatedUser() {
    this.currentUser = null;
    this.users = {};
    this.tasks = [];
    this.meetings = [];
    this.notifications = [];
    this.auditLogs = [];
    this.userActivities = [];
    this.progressNotes = {};
    this.auditLoaded = false;
    this.lastSyncedAt = null;
    this.legacyRecovery = null;
    [USER_KEY, AUTH_KEY, USERS_LIST_KEY]
      .forEach(key => localStorage.removeItem(key));
  }

  async logout() {
    if (window.location.protocol !== 'file:') {
      try {
        const response = await fetch(`${API_BASE}?resource=auth`, {
          method: 'DELETE',
          credentials: 'same-origin',
          headers: { Accept: 'application/json' }
        });
        if (!response.ok && response.status !== 401) throw new Error('Belum berhasil keluar. Silakan coba lagi.');
      } catch (e) {
        throw new Error('Belum berhasil keluar. Periksa koneksi lalu coba lagi.');
      }
    }
    this.clearAuthenticatedUser();
  }

  updateLastLogin(userId) {
    if (this.users[userId]) {
      this.users[userId].lastLogin = Date.now();
      this.saveUsers();
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  /* ==========================================
     Manajemen Tugas (Task CRUD)
     ========================================== */
  loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.saveDefault();
      return JSON.parse(JSON.stringify(DEFAULT_TASKS));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Gagal membaca data tugas, reset ke default:', e);
      return JSON.parse(JSON.stringify(DEFAULT_TASKS));
    }
  }

  save() {
    saveCache(STORAGE_KEY, JSON.stringify(this.tasks));
  }

  loadGeneralMeetings() {
    const raw = localStorage.getItem(MEETINGS_KEY);
    if (!raw) return [];
    try {
      const meetings = JSON.parse(raw);
      return Array.isArray(meetings) ? meetings : [];
    } catch (e) {
      console.error('Gagal membaca meeting umum dari cache lokal:', e);
      return [];
    }
  }

  saveMeetings() {
    saveCache(MEETINGS_KEY, JSON.stringify(this.meetings));
  }

  getMeetings() {
    return this.meetings;
  }

  loadProgressNotes() {
    const raw = localStorage.getItem(PROGRESS_NOTES_KEY);
    if (!raw) return {};
    try {
      const notes = JSON.parse(raw);
      return notes && typeof notes === 'object' && !Array.isArray(notes) ? notes : {};
    } catch (e) {
      console.error('Gagal membaca catatan progress dari cache lokal:', e);
      return {};
    }
  }

  saveProgressNotes() {
    saveCache(PROGRESS_NOTES_KEY, JSON.stringify(this.progressNotes));
  }

  getProgressNote(phase) {
    return this.progressNotes?.[phase] || { phase, content: '', updatedBy: '', createdAt: null, updatedAt: null };
  }

  async saveProgressNote(phase, content) {
    const previous = this.getProgressNote(phase);
    const note = {
      ...previous,
      phase,
      content,
      updatedBy: this.currentUser?.name || previous.updatedBy || 'System',
      createdAt: previous.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    const saved = await this.commitToBackend('progress-notes', 'PUT', { phase, content }, { phase });
    this.progressNotes = { ...(this.progressNotes || {}), [phase]: saved || note };
    this.saveProgressNotes();
    this.logAudit('Ubah Catatan Progress', `Memperbarui catatan progress ${phase.toUpperCase()}`);
    return this.progressNotes[phase];
  }

  saveDefault() {
    saveCache(STORAGE_KEY, JSON.stringify(DEFAULT_TASKS));
  }

  reset() {
    this.tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS));
    this.users = JSON.parse(JSON.stringify(DEFAULT_USERS));
    this.notifications = JSON.parse(JSON.stringify(DEFAULT_NOTIFICATIONS));
    this.auditLogs = JSON.parse(JSON.stringify(DEFAULT_AUDIT_LOGS));
    this.meetings = [];
    this.progressNotes = {};
    this.save();
    this.saveUsers();
    this.saveNotifications();
    this.saveAuditLogs();
    this.saveMeetings();
    this.saveProgressNotes();
    return this.tasks;
  }

  getAll() {
    return this.tasks;
  }

  getById(id) {
    return this.tasks.find(t => t.id === id);
  }

  getByPhase(phase) {
    return this.tasks.filter(t => t.phase === phase);
  }

  async add(taskData) {
    const now = Date.now();
    const newTask = {
      id: 't-' + Date.now(),
      ...taskData,
      createdAt: taskData.createdAt || now,
      updatedAt: taskData.updatedAt || now,
      checklistDone: taskData.checklistDone || (taskData.checklist || []).map(() => false)
    };
    const saved = await this.commitToBackend('tasks', 'POST', newTask);
    this.tasks.push(saved || newTask);
    this.save();
    this.addNotification(taskData.pic || this.currentUser?.name || 'Anggota', `mendapat tugas baru "${taskData.title}"`, taskData.pic || null);
    this.logAudit('Tambah Tugas', `Menambahkan tugas baru "${taskData.title}" untuk PIC ${taskData.pic}`);
    return saved || newTask;
  }

  async update(id, updatedData) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      const oldStatus = this.tasks[index].status;
      const nextData = { ...updatedData };
      if (this.currentUser?.role !== 'superadmin' && Object.prototype.hasOwnProperty.call(nextData, 'reviewer')) {
        delete nextData.reviewer;
      }
      if (nextData.reviewAction === 'submit') {
        nextData.reviewStatus = 'submitted';
        nextData.submittedAt = Date.now();
        nextData.reviewedAt = null;
      } else if (nextData.reviewAction === 'cancel_submit') {
        nextData.reviewStatus = 'none';
        nextData.submittedAt = null;
        nextData.reviewedAt = null;
      } else if (nextData.reviewAction === 'request_revision') {
        nextData.reviewStatus = 'revision_requested';
        nextData.reviewedAt = Date.now();
      } else if (nextData.reviewAction === 'approve') {
        nextData.reviewStatus = 'approved';
        nextData.reviewedAt = Date.now();
        nextData.status = 'Selesai';
      }
      const request = { ...updatedData };
      if (this.currentUser?.role !== 'superadmin') delete request.reviewer;
      Object.keys(request).forEach(key => {
        if (key !== 'reviewAction' && JSON.stringify(request[key]) === JSON.stringify(this.tasks[index][key])) delete request[key];
      });
      if (!Object.keys(request).length) return this.tasks[index];
      const saved = await this.commitToBackend('tasks', 'PUT', request, { id });
      this.tasks[index] = saved || { ...this.tasks[index], ...nextData, updatedAt: Date.now() };
      delete this.tasks[index].reviewAction;
      this.save();
      
      if (updatedData.status && updatedData.status !== oldStatus) {
        this.addNotification(this.currentUser?.name || 'Anggota', `mengubah status "${this.tasks[index].title}" menjadi ${updatedData.status}`, this.tasks[index].pic);
        this.logAudit('Ubah Status', `Mengubah status tugas "${this.tasks[index].title}" dari ${oldStatus} menjadi ${updatedData.status}`);
      } else {
        this.logAudit('Ubah Tugas', `Perbarui rincian tugas "${this.tasks[index].title}"`);
      }
      return this.tasks[index];
    }
    return null;
  }

  async createMeeting(meetingData) {
    const taskId = meetingData.taskId || null;
    const meeting = {
      id: meetingData.id || `m-${Date.now()}`,
      title: meetingData.title || 'Agenda Pertemuan Baru',
      phase: meetingData.phase || null,
      date: meetingData.date || '',
      endDate: meetingData.endDate || '',
      host: meetingData.host || '',
      url: meetingData.url || '',
      notes: meetingData.notes || '',
      taskId,
      hasBeritaAcara: false
    };
    if (taskId && !this.getById(taskId)) throw new Error('Tugas terkait tidak ditemukan.');
    const saved = await this.commitToBackend('meetings', 'POST', meeting);
    if (saved) Object.assign(meeting, saved);

    if (taskId) {
      const task = this.getById(taskId);
      if (!task) return { ok: false, message: 'Tugas terkait tidak ditemukan.' };
      task.meetings = [...(task.meetings || []), meeting];
      this.save();
    } else {
      this.meetings.push(meeting);
      this.saveMeetings();
    }

    this.logAudit('Tambah Pertemuan', `Menambahkan agenda pertemuan "${meeting.title}"`);
    return { ok: true, meeting };
  }

  async updateMeeting(meetingId, meetingData) {
    let existing = this.meetings.find(m => m.id === meetingId) || null;
    let sourceTask = null;
    if (!existing) {
      for (const task of this.tasks) {
        const candidate = (task.meetings || []).find(m => m.id === meetingId);
        if (candidate) {
          existing = candidate;
          sourceTask = task;
          break;
        }
      }
    }
    if (!existing) return { ok: false, message: 'Pertemuan tidak ditemukan.' };

    const targetTaskId = Object.prototype.hasOwnProperty.call(meetingData, 'taskId')
      ? (meetingData.taskId || null)
      : (sourceTask?.id || null);
    if (targetTaskId && !this.getById(targetTaskId)) {
      return { ok: false, message: 'Tugas terkait tidak ditemukan.' };
    }

    const updated = { ...existing, ...meetingData, id: meetingId, taskId: targetTaskId, phase: meetingData.phase ?? existing.phase ?? null };
    const saved = await this.commitToBackend('meetings', 'PUT', { action: 'update', ...meetingData }, { id: meetingId });
    if (saved) Object.assign(updated, saved);
    this.meetings = this.meetings.filter(m => m.id !== meetingId);
    this.tasks.forEach(task => {
      task.meetings = (task.meetings || []).filter(m => m.id !== meetingId);
    });

    if (targetTaskId) {
      const targetTask = this.getById(targetTaskId);
      targetTask.meetings = [...(targetTask.meetings || []), updated];
    } else {
      this.meetings.push(updated);
    }
    this.save();
    this.saveMeetings();
    this.logAudit('Ubah Pertemuan', `Memperbarui agenda pertemuan "${updated.title}"`);
    return { ok: true, meeting: updated };
  }

  async deleteMeeting(taskId, meetingId) {
    if (!taskId) {
      const meeting = this.meetings.find(m => m.id === meetingId);
      if (!meeting) return { ok: false, message: 'Pertemuan tidak ditemukan.' };
      if (meeting.hasBeritaAcara) {
        return { ok: false, message: 'Pertemuan yang sudah memiliki berita acara tidak boleh dihapus.' };
      }
      await this.commitToBackend('meetings', 'DELETE', null, { id: meetingId });
      this.meetings = this.meetings.filter(m => m.id !== meetingId);
      this.saveMeetings();
      this.logAudit('Hapus Pertemuan', `Soft delete pertemuan "${meeting.title}"`);
      return { ok: true, meeting };
    }
    const task = this.getById(taskId);
    const meeting = task?.meetings?.find(m => m.id === meetingId);
    if (!task || !meeting) return { ok: false, message: 'Pertemuan tidak ditemukan.' };
    if (meeting.hasBeritaAcara) {
      return { ok: false, message: 'Pertemuan yang sudah memiliki berita acara tidak boleh dihapus.' };
    }
    await this.commitToBackend('meetings', 'DELETE', null, { id: meetingId });
    task.meetings = (task.meetings || []).filter(m => m.id !== meetingId);
    this.save();
    this.logAudit('Hapus Pertemuan', `Soft delete pertemuan "${meeting.title}"`);
    return { ok: true, meeting };
  }

  async markMeetingBeritaAcara(taskId, meetingId) {
    const saved = await this.commitToBackend('meetings', 'PUT', { action: 'mark_berita_acara' }, { id: meetingId });
    if (!taskId) {
      const meeting = this.meetings.find(m => m.id === meetingId);
      if (!meeting) return null;
      Object.assign(meeting, saved || { hasBeritaAcara: true });
      this.saveMeetings();
      return meeting;
    }
    const task = this.getById(taskId);
    const meeting = task?.meetings?.find(m => m.id === meetingId);
    if (!task || !meeting) return null;

    Object.assign(meeting, saved || { hasBeritaAcara: true });
    this.save();
    return meeting;
  }

  async delete(id) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      await this.commitToBackend('tasks', 'DELETE', null, { id });
      const removed = this.tasks.splice(index, 1);
      this.save();
      this.addNotification(this.currentUser?.name || 'Anggota', `menghapus tugas "${removed[0].title}"`);
      this.logAudit('Hapus Tugas', `Menghapus tugas "${removed[0].title}"`);
      return removed[0];
    }
    return null;
  }

  async toggleChecklist(taskId, checklistIndex, isDone) {
    const task = this.getById(taskId);
    if (task) {
      const done = [...(task.checklistDone || [])];
      done[checklistIndex] = isDone;
      await this.update(taskId, { checklistDone: done });
      const itemTitle = task.checklist[checklistIndex] || 'Sub-tugas';
      this.logAudit('Centang Checklist', `${isDone ? 'Menyelesaikan' : 'Membatalkan'} centang sub-tugas "${itemTitle}" pada tugas "${task.title}"`);
    }
  }

  getSnapshotJSON() {
    const snapshot = {
      timestamp: Date.now(),
      dateFormatted: new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'short',
        timeStyle: 'medium',
        timeZone: 'Asia/Jakarta'
      }).format(new Date()),
      system: 'STSI4440 Capstone Workspace v3.2',
      currentUser: this.currentUser,
      users: this.users,
      tasks: this.tasks,
      notifications: this.notifications,
      auditLogs: this.auditLogs,
      userActivities: this.userActivities || [],
      meetings: this.meetings,
      progressNotes: this.progressNotes
    };
    return JSON.stringify(snapshot, null, 2);
  }
}

// Instantiate global store
window.capstoneStore = new DataStore();
