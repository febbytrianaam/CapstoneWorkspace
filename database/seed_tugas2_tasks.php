<?php

declare(strict_types=1);

require_once __DIR__ . '/../backend/Database.php';

const TUGAS2_PHASE = 'tugas2';
const TUGAS2_STATUS = 'Belum Dimulai';

$tasks = [
    [
        'id' => 't2-dev-01',
        'title' => 'Review Kebutuhan dan Status Implementasi ShifaStock',
        'pic' => 'Febby',
        'reviewer' => 'Rival',
        'priority' => 'Tinggi',
        'deliverable' => 'Ringkasan status modul dan kebutuhan implementasi.',
        'checklist' => [
            'Review kebutuhan fungsional yang telah dikumpulkan.',
            'Identifikasi modul yang sudah tersedia.',
            'Identifikasi modul yang masih perlu dikembangkan.',
            'Cocokkan implementasi dengan kebutuhan tervalidasi.',
            'Buat ringkasan status pengembangan.',
        ],
    ],
    [
        'id' => 't2-dev-02',
        'title' => 'Perancangan Sistem dan Database',
        'pic' => 'Febby',
        'reviewer' => 'Farah',
        'priority' => 'Tinggi',
        'deliverable' => 'Diagram perancangan dan dokumentasi teknis.',
        'checklist' => [
            'Review Use Case Diagram.',
            'Susun atau perbarui ERD.',
            'Verifikasi struktur database.',
            'Dokumentasikan rancangan modul utama.',
            'Sediakan diagram untuk laporan Tugas 2.',
        ],
    ],
    [
        'id' => 't2-dev-03',
        'title' => 'Pengembangan dan Penyempurnaan ShifaStock',
        'pic' => 'Febby',
        'reviewer' => 'Rival',
        'priority' => 'Tinggi',
        'deliverable' => 'Implementasi aplikasi beserta ringkasan pengembangan.',
        'checklist' => [
            'Review modul master obat.',
            'Review penerimaan dan pengelolaan persediaan.',
            'Review perpindahan stok gudang-apotek.',
            'Review stock opname dan monitoring.',
            'Dokumentasikan fitur yang sudah berjalan.',
            'Catat fitur yang masih dalam pengembangan.',
        ],
    ],
    [
        'id' => 't2-dev-04',
        'title' => 'Bukti Implementasi dan Pengujian Awal',
        'pic' => 'Febby',
        'reviewer' => 'Cintia',
        'priority' => 'Tinggi',
        'deliverable' => 'Screenshot, catatan implementasi, dan bukti pengujian awal.',
        'checklist' => [
            'Siapkan screenshot fitur yang sudah tersedia.',
            'Dokumentasikan alur penggunaan utama.',
            'Siapkan bukti pengujian awal yang benar-benar telah dilakukan.',
            'Catat hasil dan kendala pengujian.',
            'Serahkan bahan implementasi kepada tim dokumentasi.',
        ],
    ],
    [
        'id' => 't2-doc-01',
        'title' => 'Menyiapkan Struktur Laporan Kemajuan',
        'pic' => 'Cintia',
        'reviewer' => 'Anggi',
        'priority' => 'Tinggi',
        'deliverable' => 'Template laporan Tugas 2.',
        'checklist' => [
            'Pelajari sistematika resmi Tugas 2.',
            'Siapkan struktur dokumen.',
            'Sesuaikan cover dan identitas kelompok.',
            'Buat heading bab dan subbab sesuai panduan.',
            'Pastikan bagian IV dan V tetap kosong.',
            'Siapkan ruang untuk materi anggota lain.',
        ],
    ],
    [
        'id' => 't2-doc-02',
        'title' => 'Pemutakhiran Pendahuluan',
        'pic' => 'Cintia',
        'reviewer' => 'Farah',
        'priority' => 'Tinggi',
        'deliverable' => 'Draft Pendahuluan Tugas 2.',
        'checklist' => [
            'Review Latar Belakang dari Tugas 1.',
            'Review Tujuan project.',
            'Review Ruang Lingkup.',
            'Sesuaikan isi dengan perkembangan terbaru.',
            'Integrasikan Jadwal Kegiatan dari Anggi.',
            'Periksa konsistensi judul project.',
        ],
    ],
    [
        'id' => 't2-doc-03',
        'title' => 'Dokumentasi Implementasi dan Pengujian',
        'pic' => 'Cintia',
        'reviewer' => 'Febby',
        'priority' => 'Tinggi',
        'deliverable' => 'Draft Metodologi bagian Implementasi serta Pengujian dan Evaluasi.',
        'checklist' => [
            'Terima bahan implementasi dari Febby.',
            'Susun narasi proses implementasi.',
            'Integrasikan screenshot yang relevan.',
            'Susun narasi proses pengujian yang sudah dilaksanakan.',
            'Dokumentasikan hasil evaluasi yang tersedia.',
            'Tandai pengujian yang masih direncanakan.',
        ],
    ],
    [
        'id' => 't2-doc-04',
        'title' => 'Integrasi dan Finalisasi Draft Laporan',
        'pic' => 'Cintia',
        'reviewer' => 'Febby',
        'priority' => 'Tinggi',
        'deliverable' => 'Draft Laporan Kemajuan Tugas 2 terintegrasi.',
        'checklist' => [
            'Gabungkan bagian tulisan dari Rival.',
            'Gabungkan bagian tulisan dari Farah.',
            'Integrasikan hasil dokumentasi Anggi.',
            'Integrasikan bahan pengembangan Febby.',
            'Periksa konsistensi narasi.',
            'Siapkan draft untuk review kelompok.',
        ],
    ],
    [
        'id' => 't2-req-01',
        'title' => 'Dokumentasi Metode Pengumpulan Data',
        'pic' => 'Rival',
        'reviewer' => 'Farah',
        'priority' => 'Tinggi',
        'deliverable' => 'Draft Metodologi bagian Metode Penelitian/Pengumpulan Data.',
        'checklist' => [
            'Identifikasi metode pengumpulan informasi yang benar-benar digunakan.',
            'Dokumentasikan narasumber atau peran terkait sesuai izin klinik.',
            'Jelaskan proses pengumpulan data.',
            'Identifikasi jenis dokumen pendukung.',
            'Susun narasi metode pengumpulan data.',
        ],
    ],
    [
        'id' => 't2-req-02',
        'title' => 'Dokumentasi Proses Bisnis Existing',
        'pic' => 'Rival',
        'reviewer' => 'Cintia',
        'priority' => 'Tinggi',
        'deliverable' => 'Narasi proses bisnis existing.',
        'checklist' => [
            'Perbarui uraian proses penerimaan obat.',
            'Dokumentasikan pengelolaan persediaan gudang dan apotek.',
            'Jelaskan perpindahan dan pengeluaran obat.',
            'Dokumentasikan stock opname.',
            'Uraikan masalah dan kendala operasional yang terkonfirmasi.',
        ],
    ],
    [
        'id' => 't2-req-03',
        'title' => 'Analisis Kebutuhan Pengguna',
        'pic' => 'Rival',
        'reviewer' => 'Febby',
        'priority' => 'Tinggi',
        'deliverable' => 'Draft Proses Analisis dan kebutuhan pengguna.',
        'checklist' => [
            'Identifikasi kebutuhan petugas berdasarkan informasi klinik.',
            'Pisahkan fakta existing dan kebutuhan sistem yang diusulkan.',
            'Dokumentasikan kebutuhan operasional.',
            'Tandai informasi yang belum terkonfirmasi.',
            'Sinkronkan kebutuhan dengan implementasi ShifaStock.',
        ],
    ],
    [
        'id' => 't2-req-04',
        'title' => 'Klarifikasi dan Validasi Klinik',
        'pic' => 'Rival',
        'reviewer' => 'Febby',
        'priority' => 'Sedang',
        'deliverable' => 'Rekap hasil klarifikasi dan validasi klinik.',
        'checklist' => [
            'Identifikasi pertanyaan yang masih terbuka.',
            'Koordinasikan konfirmasi dengan narasumber.',
            'Catat hasil klarifikasi.',
            'Dokumentasikan perubahan kebutuhan jika ada.',
            'Sampaikan hasil validasi kepada kelompok.',
        ],
    ],
    [
        'id' => 't2-aca-01',
        'title' => 'Pemutakhiran Tinjauan Pustaka',
        'pic' => 'Farah',
        'reviewer' => 'Cintia',
        'priority' => 'Tinggi',
        'deliverable' => 'Draft Tinjauan Pustaka Tugas 2.',
        'checklist' => [
            'Review referensi yang digunakan pada Tugas 1.',
            'Verifikasi relevansi teori dengan sistem.',
            'Periksa penelitian terdahulu.',
            'Lengkapi referensi yang diperlukan.',
            'Susun dan perbarui narasi Tinjauan Pustaka.',
        ],
    ],
    [
        'id' => 't2-aca-02',
        'title' => 'Dokumentasi Metode Pengembangan Sistem',
        'pic' => 'Farah',
        'reviewer' => 'Febby',
        'priority' => 'Tinggi',
        'deliverable' => 'Narasi metode pengembangan sistem.',
        'checklist' => [
            'Konfirmasi metode pengembangan yang benar-benar digunakan tim.',
            'Jelaskan pendekatan pengembangan.',
            'Uraikan tahapan analisis, perancangan, dan implementasi.',
            'Sesuaikan pembahasan dengan kegiatan aktual.',
            'Tambahkan referensi pendukung bila diperlukan.',
        ],
    ],
    [
        'id' => 't2-aca-03',
        'title' => 'Dokumentasi Proses Perancangan',
        'pic' => 'Farah',
        'reviewer' => 'Febby',
        'priority' => 'Tinggi',
        'deliverable' => 'Draft Metodologi bagian Proses Perancangan.',
        'checklist' => [
            'Pelajari bahan rancangan dari developer.',
            'Susun narasi proses perancangan.',
            'Dokumentasikan hubungan kebutuhan dengan solusi.',
            'Integrasikan penjelasan diagram yang tersedia.',
            'Periksa konsistensi antara perancangan dan implementasi.',
        ],
    ],
    [
        'id' => 't2-aca-04',
        'title' => 'Review Ilmiah dan Konsistensi Referensi',
        'pic' => 'Farah',
        'reviewer' => 'Cintia',
        'priority' => 'Sedang',
        'deliverable' => 'Hasil review ilmiah dan revisi referensi.',
        'checklist' => [
            'Periksa konsistensi sitasi.',
            'Periksa daftar pustaka.',
            'Review keterkaitan teori dan pembahasan.',
            'Tandai klaim yang belum memiliki dukungan.',
            'Perbaiki bagian akademik yang menjadi tanggung jawabnya.',
        ],
    ],
    [
        'id' => 't2-adm-01',
        'title' => 'Pemutakhiran Jadwal Kegiatan',
        'pic' => 'Anggi',
        'reviewer' => 'Cintia',
        'priority' => 'Tinggi',
        'deliverable' => 'Draft Jadwal Kegiatan yang diperbarui.',
        'checklist' => [
            'Pelajari Jadwal Kegiatan pada Proposal Tugas 1.',
            'Identifikasi aktivitas yang sudah terlaksana.',
            'Identifikasi kegiatan yang masih berjalan.',
            'Susun rencana aktivitas berikutnya.',
            'Perbarui tabel Jadwal Kegiatan sesuai kondisi aktual.',
        ],
    ],
    [
        'id' => 't2-adm-02',
        'title' => 'Timeline Rencana dan Realisasi',
        'pic' => 'Anggi',
        'reviewer' => 'Cintia',
        'priority' => 'Tinggi',
        'deliverable' => 'Timeline rencana dan realisasi kegiatan.',
        'checklist' => [
            'Susun daftar aktivitas utama Tugas 2.',
            'Tentukan urutan aktivitas berdasarkan informasi tim.',
            'Catat tanggal aktual yang sudah dikonfirmasi.',
            'Bedakan rencana dan realisasi.',
            'Buat timeline atau Gantt Chart sederhana.',
            'Serahkan draft untuk review.',
        ],
    ],
    [
        'id' => 't2-adm-03',
        'title' => 'Dokumentasi Pelaksanaan Kegiatan',
        'pic' => 'Anggi',
        'reviewer' => 'Rival',
        'priority' => 'Tinggi',
        'deliverable' => 'Dokumen rekap pelaksanaan kegiatan Tugas 2.',
        'checklist' => [
            'Rekap kegiatan koordinasi dan pengerjaan Tugas 2.',
            'Catat aktivitas berdasarkan update yang diberikan tim.',
            'Dokumentasikan PIC dan hasil kegiatan.',
            'Susun narasi perkembangan pelaksanaan project.',
            'Sertakan tautan bukti kegiatan yang tersedia.',
        ],
    ],
    [
        'id' => 't2-adm-04',
        'title' => 'Rekap Capaian, Kendala, dan Tindak Lanjut',
        'pic' => 'Anggi',
        'reviewer' => 'Cintia',
        'priority' => 'Tinggi',
        'deliverable' => 'Rekap capaian, kendala, dan tindak lanjut.',
        'checklist' => [
            'Rekap capaian berdasarkan pekerjaan yang terverifikasi.',
            'Catat kendala dari laporan masing-masing PIC.',
            'Dokumentasikan tindak lanjut yang disepakati.',
            'Bedakan pekerjaan selesai dan pekerjaan tertunda.',
            'Susun laporan progres berkala.',
        ],
    ],
    [
        'id' => 't2-adm-05',
        'title' => 'Administrasi Lampiran dan Kelengkapan Laporan',
        'pic' => 'Anggi',
        'reviewer' => 'Cintia',
        'priority' => 'Sedang',
        'deliverable' => 'Daftar lampiran dan checklist kelengkapan laporan.',
        'checklist' => [
            'Buat daftar lampiran yang diperlukan.',
            'Catat dokumen yang sudah tersedia.',
            'Identifikasi lampiran yang masih diperlukan.',
            'Periksa penomoran dan kelengkapan lampiran.',
            'Periksa format administratif laporan.',
            'Buat checklist kesiapan dokumen.',
        ],
    ],
];

$mode = $argv[1] ?? '--dry-run';
if (!in_array($mode, ['--dry-run', '--apply'], true)) {
    fwrite(STDERR, "Usage: php database/seed_tugas2_tasks.php [--dry-run|--apply]\n");
    exit(2);
}

$db = Database::connection();
$requiredColumns = ['start_at', 'due_at', 'reviewer', 'review_status', 'deliverable_url'];
$columns = $db->query('SHOW COLUMNS FROM tasks')->fetchAll(PDO::FETCH_COLUMN);
$missingColumns = array_values(array_diff($requiredColumns, $columns));
if ($missingColumns) {
    fwrite(STDERR, 'Missing task workflow columns: ' . implode(', ', $missingColumns) . PHP_EOL);
    exit(1);
}

$users = $db->query('SELECT name FROM users')->fetchAll(PDO::FETCH_COLUMN);
$userMap = array_fill_keys($users, true);
$plannedPeople = [];
foreach ($tasks as $task) {
    $plannedPeople[$task['pic']] = true;
    if ($task['reviewer'] !== '') {
        $plannedPeople[$task['reviewer']] = true;
    }
}
$missingUsers = array_values(array_diff(array_keys($plannedPeople), array_keys($userMap)));
if ($missingUsers) {
    fwrite(STDERR, 'Missing users: ' . implode(', ', $missingUsers) . PHP_EOL);
    exit(1);
}

$existingRows = $db->query('SELECT id, title, phase, pic, status, priority, reviewer, review_status, deliverable_url, start_at, due_at FROM tasks')->fetchAll(PDO::FETCH_ASSOC);
$existingById = [];
$existingByNormalizedTitle = [];
foreach ($existingRows as $row) {
    $existingById[$row['id']] = $row;
    $existingByNormalizedTitle[normalizeTitle($row['title'])][] = $row;
}

$toCreate = [];
$preserved = [];
$conflicts = [];
foreach ($tasks as $task) {
    if (isset($existingById[$task['id']])) {
        $existing = $existingById[$task['id']];
        $mismatches = compareTask($task, $existing);
        $preserved[] = $task + ['mismatches' => $mismatches];
        if ($mismatches) {
            $conflicts[] = [
                'id' => $task['id'],
                'title' => $task['title'],
                'reason' => 'Stable ID exists with different assignment fields: ' . implode(', ', $mismatches),
            ];
        }
        continue;
    }

    $sameTitle = $existingByNormalizedTitle[normalizeTitle($task['title'])] ?? [];
    if ($sameTitle) {
        $conflicts[] = [
            'id' => $task['id'],
            'title' => $task['title'],
            'reason' => 'Equivalent title already exists with ID(s): ' . implode(', ', array_column($sameTitle, 'id')),
        ];
        continue;
    }

    $toCreate[] = $task;
}

printPreview($mode, $toCreate, $preserved, $conflicts);

if ($mode === '--dry-run') {
    exit($conflicts ? 1 : 0);
}
if ($conflicts) {
    fwrite(STDERR, "Apply aborted because conflicts were detected.\n");
    exit(1);
}

$db->beginTransaction();
try {
    $taskStmt = $db->prepare(
        'INSERT INTO tasks (id, phase, title, pic, status, priority, description, start_at, due_at, reviewer, review_status, submitted_at, reviewed_at, review_note, deliverable_url, archived_at)
         VALUES (:id, :phase, :title, :pic, :status, :priority, :description, NULL, NULL, :reviewer, "none", NULL, NULL, "", NULL, NULL)'
    );
    $checklistStmt = $db->prepare(
        'INSERT INTO task_checklist_items (task_id, item_order, text, is_done)
         VALUES (:task_id, :item_order, :text, 0)'
    );
    $notificationStmt = $db->prepare(
        'INSERT INTO notifications (id, user_name, target_user_name, text, occurred_at, is_read)
         VALUES (:id, :user_name, :target_user_name, :text, NOW(), 0)
         ON DUPLICATE KEY UPDATE
            user_name = VALUES(user_name),
            target_user_name = VALUES(target_user_name),
            text = VALUES(text)'
    );

    foreach ($toCreate as $task) {
        $taskStmt->execute([
            'id' => $task['id'],
            'phase' => TUGAS2_PHASE,
            'title' => $task['title'],
            'pic' => $task['pic'],
            'status' => TUGAS2_STATUS,
            'priority' => $task['priority'],
            'description' => buildDescription($task),
            'reviewer' => $task['reviewer'],
        ]);

        foreach ($task['checklist'] as $index => $item) {
            $checklistStmt->execute([
                'task_id' => $task['id'],
                'item_order' => $index + 1,
                'text' => $item,
            ]);
        }
    }

    foreach ($tasks as $task) {
        $notificationStmt->execute([
            'id' => 'n-seed-' . $task['id'],
            'user_name' => $task['pic'],
            'target_user_name' => $task['pic'],
            'text' => 'mendapat assignment Tugas 2: "' . $task['title'] . '"',
        ]);
    }

    if ($toCreate) {
        $auditStmt = $db->prepare(
            'INSERT INTO audit_logs (id, occurred_at, user_name, role, action, action_tag, object_type, object_id, object_name, details, changes_json, ip, device)
             VALUES (:id, NOW(), "System", "system", "Inisialisasi Tugas 2", "seed_tugas2", "Task", "tugas2", "Tugas 2", :details, :changes_json, "127.0.0.1", "CLI Seeder")'
        );
        $auditStmt->execute([
            'id' => 'a-seed-tugas2-' . time(),
            'details' => 'Menambahkan ' . count($toCreate) . ' assignment awal Tugas 2 secara idempotent.',
            'changes_json' => json_encode(array_map(static fn (array $task): array => [
                'field' => 'task',
                'from' => null,
                'to' => $task['id'] . ' - ' . $task['title'],
            ], $toCreate), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
    }

    $db->commit();
} catch (Throwable $e) {
    $db->rollBack();
    throw $e;
}

echo PHP_EOL . 'Applied: ' . count($toCreate) . ' task(s) created, ' . count($preserved) . ' preserved.' . PHP_EOL;

function normalizeTitle(string $title): string
{
    return mb_strtolower(trim(preg_replace('/\s+/', ' ', $title)));
}

function buildDescription(array $task): string
{
    return trim(
        'Tujuan: Menyelesaikan assignment Tugas 2 sesuai pembagian kerja tim.' . PHP_EOL .
        'Deliverable: ' . $task['deliverable']
    );
}

function compareTask(array $planned, array $existing): array
{
    $fields = [
        'phase' => TUGAS2_PHASE,
        'title' => $planned['title'],
        'pic' => $planned['pic'],
        'status' => TUGAS2_STATUS,
        'priority' => $planned['priority'],
        'reviewer' => $planned['reviewer'],
        'review_status' => 'none',
    ];
    $mismatches = [];
    foreach ($fields as $field => $expected) {
        $actual = (string) ($existing[$field] ?? '');
        if ($actual !== $expected) {
            $mismatches[] = $field;
        }
    }
    if (($existing['deliverable_url'] ?? null) !== null && (string) $existing['deliverable_url'] !== '') {
        $mismatches[] = 'deliverable_url_not_empty';
    }
    if (($existing['start_at'] ?? null) !== null || ($existing['due_at'] ?? null) !== null) {
        $mismatches[] = 'dates_not_empty';
    }
    return $mismatches;
}

function printPreview(string $mode, array $toCreate, array $preserved, array $conflicts): void
{
    echo 'Mode: ' . $mode . PHP_EOL;
    echo 'Planned assignments: 21' . PHP_EOL;
    echo 'To create: ' . count($toCreate) . PHP_EOL;
    echo 'Preserved: ' . count($preserved) . PHP_EOL;
    echo 'Conflicts: ' . count($conflicts) . PHP_EOL . PHP_EOL;

    if ($toCreate) {
        echo "TASKS TO CREATE\n";
        echo "ID | Judul | PIC | Reviewer | Prioritas\n";
        foreach ($toCreate as $task) {
            echo $task['id'] . ' | ' . $task['title'] . ' | ' . $task['pic'] . ' | ' . $task['reviewer'] . ' | ' . $task['priority'] . PHP_EOL;
        }
        echo PHP_EOL;
    }

    if ($preserved) {
        echo "EXISTING TASKS TO PRESERVE\n";
        foreach ($preserved as $task) {
            $note = $task['mismatches'] ? ' [DIFF: ' . implode(', ', $task['mismatches']) . ']' : '';
            echo $task['id'] . ' | ' . $task['title'] . $note . PHP_EOL;
        }
        echo PHP_EOL;
    }

    if ($conflicts) {
        echo "CONFLICTS REQUIRING REVIEW\n";
        foreach ($conflicts as $conflict) {
            echo $conflict['id'] . ' | ' . $conflict['title'] . ' | ' . $conflict['reason'] . PHP_EOL;
        }
        echo PHP_EOL;
    }
}
