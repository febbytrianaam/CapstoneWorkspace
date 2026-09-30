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
const MEETINGS_KEY = 'capstone_general_meetings_v1';
const PROGRESS_NOTES_KEY = 'capstone_progress_notes_v1';
const API_BASE = window.CAPSTONE_API_BASE || 'backend/api/index.php';

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

// Dataset Pemberitahuan Notifikasi Awal
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'n-1',
    user: 'Febby',
    text: 'memperbarui status tugas "Konsultasikan judul project" menjadi Sedang Dikerjakan',
    time: Date.now() - (1000 * 60 * 12),
    read: false
  },
  {
    id: 'n-2',
    user: 'Rival',
    text: 'menyelesaikan 3 sub-tugas pada "Lengkapi analisis proses persediaan obat"',
    time: Date.now() - (1000 * 60 * 65),
    read: false
  },
  {
    id: 'n-3',
    user: 'Cintia',
    text: 'menambahkan struktur awal dokumen proposal Tugas 1',
    time: Date.now() - (1000 * 60 * 180),
    read: false
  }
];

// Dataset Rekam Jejak Audit Awal yang Lengkap (Audit Trail Dummy Data)
// Simulasi IP & Device untuk prototipe frontend
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
    this.users = this.loadUsers();
    this.tasks = this.loadTasks();
    this.notifications = this.loadNotifications();
    this.auditLogs = this.loadAuditLogs();
    this.meetings = this.loadGeneralMeetings();
    this.progressNotes = this.loadProgressNotes();
    this.currentUser = this.loadUser();
    // Database menjadi sumber utama; localStorage hanya cache/fallback saat backend tidak tersedia.
    this.ready = this.syncFromBackend();
  }

  async syncFromBackend() {
    if (window.location.protocol === 'file:') return;

    try {
      const response = await fetch(`${API_BASE}?resource=snapshot`, {
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json'
        }
      });
      if (response.status === 401) {
        this.clearAuthenticatedUser();
        window.dispatchEvent(new CustomEvent('capstone:auth-required'));
        return;
      }
      if (!response.ok) return;

      const payload = await response.json();
      if (!payload.ok || !payload.data) return;

      const snapshot = payload.data;
      this.users = snapshot.users || this.users;
      this.tasks = snapshot.tasks || this.tasks;
      this.notifications = snapshot.notifications || this.notifications;
      this.auditLogs = snapshot.auditLogs || this.auditLogs;
      this.meetings = Array.isArray(snapshot.meetings) ? snapshot.meetings : this.meetings;
      this.progressNotes = snapshot.progressNotes || this.progressNotes;

      this.currentUser = snapshot.currentUser || null;

      this.save();
      this.saveUsers();
      this.saveNotifications();
      this.saveAuditLogs();
      this.saveMeetings();
      this.saveProgressNotes();
      if (this.currentUser) this.setAuthenticatedUser(this.currentUser);

      window.dispatchEvent(new CustomEvent('capstone:data-synced'));
    } catch (e) {
      console.info('Backend belum tersedia, memakai data lokal prototype.', e);
    }
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
      }
      return payload;
    } catch (e) {
      console.info('Sinkronisasi backend gagal, data lokal tetap dipakai.', e);
      return null;
    }
  }

  async getProjectGuides() {
    if (window.location.protocol === 'file:') return [];
    try {
      const response = await fetch(`${API_BASE}?resource=guides`, {
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json'
        }
      });
      if (!response.ok) return [];
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    } catch (e) {
      console.info('Daftar panduan belum tersedia.', e);
      return [];
    }
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
    try {
      const response = await fetch(`${API_BASE}?resource=document-archives`, {
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json'
        }
      });
      if (!response.ok) return [];
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    } catch (e) {
      console.info('Daftar arsip dokumen belum tersedia.', e);
      return [];
    }
  }

  async uploadDocumentArchive({ title, category, description, file }) {
    if (window.location.protocol === 'file:' || !file) return null;
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('description', description || '');
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
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
      return JSON.parse(JSON.stringify(DEFAULT_AUDIT_LOGS));
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
        return JSON.parse(JSON.stringify(DEFAULT_AUDIT_LOGS));
      }
      return parsed;
    } catch (e) {
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
      return JSON.parse(JSON.stringify(DEFAULT_AUDIT_LOGS));
    }
  }

  saveAuditLogs() {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(this.auditLogs));
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

  /* ==========================================
     Manajemen Notifikasi
     ========================================== */
  loadNotifications() {
    const raw = localStorage.getItem(NOTIFS_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFS_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return JSON.parse(JSON.stringify(DEFAULT_NOTIFICATIONS));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_NOTIFICATIONS));
    }
  }

  saveNotifications() {
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(this.notifications));
  }

  getNotifications() {
    return this.notifications;
  }

  addNotification(userName, text) {
    const newNotif = {
      id: 'n-' + Date.now(),
      user: userName,
      text,
      time: Date.now(),
      read: false
    };
    this.notifications.unshift(newNotif);
    this.saveNotifications();
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
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(DEFAULT_USERS));
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
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(this.users));
  }

  getUsers() {
    return this.users;
  }

  getUserById(id) {
    return this.users[id];
  }

  addUser(userData) {
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
    this.users[id] = newUser;
    this.saveUsers();
    this.addNotification(this.currentUser?.name || 'System', `menambahkan pengguna baru "${name}"`);
    const addedRoleLabel = userData.role === 'superadmin' ? 'Superadmin' : userData.role === 'koordinator' ? 'Koordinator' : 'Member';
    this.logAudit('Tambah Pengguna', `Menambahkan pengguna baru "${name}" dengan peran ${addedRoleLabel}`);
    this.sendToBackend('users', 'POST', { ...newUser, password: userData.password || '' });
    return newUser;
  }

  updateUser(id, updatedData) {
    if (this.users[id]) {
      const { password, ...safeUpdatedData } = updatedData;
      this.users[id] = { ...this.users[id], ...safeUpdatedData };
      this.saveUsers();
        const updatedRoleLabel = safeUpdatedData.role === 'superadmin' ? 'Superadmin' : safeUpdatedData.role === 'koordinator' ? 'Koordinator' : 'Member';
        this.logAudit('Ubah Pengguna', `Mengubah profil data pengguna "${id}" (${updatedRoleLabel})`);
        this.sendToBackend('users', 'PUT', { ...this.users[id], ...(password ? { password } : {}) }, { id });
      return this.users[id];
    }
    return null;
  }

  deleteUser(id) {
    if (this.users[id]) {
      delete this.users[id];
      this.saveUsers();
      this.logAudit('Hapus Pengguna', `Menghapus akun pengguna "${id}" dari sistem`);
      this.sendToBackend('users', 'DELETE', null, { id });
      return true;
    }
    return false;
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
      localStorage.setItem(USER_KEY, userId);
      return this.currentUser;
    }
    return null;
  }

  setAuthenticatedUser(user) {
    if (!user || !user.id) return null;
    this.users[user.id] = { ...(this.users[user.id] || {}), ...user };
    this.currentUser = this.users[user.id];
    this.saveUsers();
    localStorage.setItem(USER_KEY, user.id);
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return this.currentUser;
  }

  clearAuthenticatedUser() {
    this.currentUser = null;
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(AUTH_KEY);
  }

  async logout() {
    if (window.location.protocol !== 'file:') {
      try {
        await fetch(`${API_BASE}?resource=auth`, {
          method: 'DELETE',
          credentials: 'same-origin',
          headers: { Accept: 'application/json' }
        });
      } catch (e) {
        console.info('Logout server gagal, membersihkan sesi lokal.', e);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
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
    localStorage.setItem(MEETINGS_KEY, JSON.stringify(this.meetings));
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
    localStorage.setItem(PROGRESS_NOTES_KEY, JSON.stringify(this.progressNotes));
  }

  getProgressNote(phase) {
    return this.progressNotes?.[phase] || { phase, content: '', updatedBy: '', createdAt: null, updatedAt: null };
  }

  saveProgressNote(phase, content) {
    const previous = this.getProgressNote(phase);
    const note = {
      ...previous,
      phase,
      content,
      updatedBy: this.currentUser?.name || previous.updatedBy || 'System',
      createdAt: previous.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    this.progressNotes = { ...(this.progressNotes || {}), [phase]: note };
    this.saveProgressNotes();
    this.logAudit('Ubah Catatan Progress', `Memperbarui catatan progress ${phase.toUpperCase()}`);
    this.sendToBackend('progress-notes', 'PUT', { phase, content }, { phase }).then(payload => {
      if (payload?.ok && payload.data) {
        this.progressNotes = { ...(this.progressNotes || {}), [phase]: payload.data };
        this.saveProgressNotes();
        window.dispatchEvent(new CustomEvent('capstone:data-synced'));
      }
    });
    return note;
  }

  saveDefault() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TASKS));
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

  add(taskData) {
    const now = Date.now();
    const newTask = {
      id: 't-' + Date.now(),
      ...taskData,
      createdAt: taskData.createdAt || now,
      updatedAt: taskData.updatedAt || now,
      checklistDone: taskData.checklist ? taskData.checklist.map(() => false) : []
    };
    this.tasks.push(newTask);
    this.save();
    this.addNotification(this.currentUser?.name || 'Anggota', `menambahkan tugas baru "${taskData.title}"`);
    this.logAudit('Tambah Tugas', `Menambahkan tugas baru "${taskData.title}" untuk PIC ${taskData.pic}`);
    this.sendToBackend('tasks', 'POST', newTask);
    return newTask;
  }

  update(id, updatedData) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      const oldStatus = this.tasks[index].status;
      this.tasks[index] = { ...this.tasks[index], ...updatedData, updatedAt: Date.now() };
      this.save();
      
      if (updatedData.status && updatedData.status !== oldStatus) {
        this.addNotification(this.currentUser?.name || 'Anggota', `mengubah status "${this.tasks[index].title}" menjadi ${updatedData.status}`);
        this.logAudit('Ubah Status', `Mengubah status tugas "${this.tasks[index].title}" dari ${oldStatus} menjadi ${updatedData.status}`);
      } else {
        this.logAudit('Ubah Tugas', `Perbarui rincian tugas "${this.tasks[index].title}"`);
      }
      this.sendToBackend('tasks', 'PUT', this.tasks[index], { id });
      return this.tasks[index];
    }
    return null;
  }

  createMeeting(meetingData) {
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
    this.sendToBackend('meetings', 'POST', meeting);
    return { ok: true, meeting };
  }

  updateMeeting(meetingId, meetingData) {
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
    this.sendToBackend('meetings', 'PUT', { action: 'update', ...updated }, { id: meetingId });
    return { ok: true, meeting: updated };
  }

  deleteMeeting(taskId, meetingId) {
    if (!taskId) {
      const meeting = this.meetings.find(m => m.id === meetingId);
      if (!meeting) return { ok: false, message: 'Pertemuan tidak ditemukan.' };
      if (meeting.hasBeritaAcara) {
        return { ok: false, message: 'Pertemuan yang sudah memiliki berita acara tidak boleh dihapus.' };
      }
      this.meetings = this.meetings.filter(m => m.id !== meetingId);
      this.saveMeetings();
      this.logAudit('Hapus Pertemuan', `Soft delete pertemuan "${meeting.title}"`);
      this.sendToBackend('meetings', 'DELETE', null, { id: meetingId });
      return { ok: true, meeting };
    }
    const task = this.getById(taskId);
    const meeting = task?.meetings?.find(m => m.id === meetingId);
    if (!task || !meeting) return { ok: false, message: 'Pertemuan tidak ditemukan.' };
    if (meeting.hasBeritaAcara) {
      return { ok: false, message: 'Pertemuan yang sudah memiliki berita acara tidak boleh dihapus.' };
    }

    task.meetings = (task.meetings || []).filter(m => m.id !== meetingId);
    this.save();
    this.logAudit('Hapus Pertemuan', `Soft delete pertemuan "${meeting.title}"`);
    this.sendToBackend('meetings', 'DELETE', null, { id: meetingId });
    return { ok: true, meeting };
  }

  markMeetingBeritaAcara(taskId, meetingId) {
    if (!taskId) {
      const meeting = this.meetings.find(m => m.id === meetingId);
      if (!meeting) return null;
      meeting.hasBeritaAcara = true;
      this.saveMeetings();
      this.sendToBackend('meetings', 'PUT', { action: 'mark_berita_acara' }, { id: meetingId });
      return meeting;
    }
    const task = this.getById(taskId);
    const meeting = task?.meetings?.find(m => m.id === meetingId);
    if (!task || !meeting) return null;

    meeting.hasBeritaAcara = true;
    this.save();
    this.sendToBackend('meetings', 'PUT', { action: 'mark_berita_acara' }, { id: meetingId });
    return meeting;
  }

  delete(id) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      const removed = this.tasks.splice(index, 1);
      this.save();
      this.addNotification(this.currentUser?.name || 'Anggota', `menghapus tugas "${removed[0].title}"`);
      this.logAudit('Hapus Tugas', `Menghapus tugas "${removed[0].title}"`);
      this.sendToBackend('tasks', 'DELETE', null, { id });
      return removed[0];
    }
    return null;
  }

  toggleChecklist(taskId, checklistIndex, isDone) {
    const task = this.getById(taskId);
    if (task) {
      if (!task.checklistDone) task.checklistDone = [];
      task.checklistDone[checklistIndex] = isDone;
      this.save();
      const itemTitle = task.checklist[checklistIndex] || 'Sub-tugas';
      this.logAudit('Centang Checklist', `${isDone ? 'Menyelesaikan' : 'Membatalkan'} centang sub-tugas "${itemTitle}" pada tugas "${task.title}"`);
      this.sendToBackend('tasks', 'PUT', task, { id: taskId });
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
      meetings: this.meetings,
      progressNotes: this.progressNotes
    };
    return JSON.stringify(snapshot, null, 2);
  }
}

// Instantiate global store
window.capstoneStore = new DataStore();
