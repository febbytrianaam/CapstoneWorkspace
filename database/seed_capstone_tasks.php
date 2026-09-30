<?php

declare(strict_types=1);

require_once __DIR__ . '/../backend/Database.php';

$db = Database::connection();

$seedTaskIds = [
    'capstone-t1-consult-title-data',
    'capstone-t1-existing-analysis',
    'capstone-t1-gap-requirement',
    'capstone-t1-clinic-permission-data',
    'capstone-t1-proposal-structure',
    'capstone-t1-proposal-background-scope',
    'capstone-t1-proposal-update',
    'capstone-t1-literature-search',
    'capstone-t1-literature-summary',
    'capstone-t1-analysis-reference-support',
    'capstone-t1-team-coordination',
    'capstone-t1-documentation-admin',
    'capstone-t1-final-submission',
    // Legacy seed ids from the earlier 7-task grouping.
    'capstone-t1-existing-validation',
    'capstone-t1-proposal-draft',
    'capstone-t1-literature-review',
    'capstone-t1-analysis-support',
    'capstone-t1-coordination-review',
];

$tasks = [
    [
        'id' => 'capstone-t1-consult-title-data',
        'title' => 'Konsultasikan Judul Project & Ketentuan Data ke Tutor',
        'pic' => 'Febby',
        'status' => 'Sedang Dikerjakan',
        'priority' => 'Tinggi',
        'description' => 'Mengonfirmasi arah judul, batasan studi kasus, dan ketentuan penggunaan data Klinik Shifa Medika kepada tutor agar proposal Tugas 1 berada pada scope yang benar.',
        'checklist' => [
            'Konfirmasi judul sementara project',
            'Tanyakan ketentuan penggunaan data klinik',
            'Catat arahan tutor terkait scope dan batasan',
            'Sampaikan hasil konsultasi kepada tim',
        ],
    ],
    [
        'id' => 'capstone-t1-existing-analysis',
        'title' => 'Lengkapi Analisis Proses Persediaan Obat Klinik',
        'pic' => 'Rival',
        'status' => 'Sedang Dikerjakan',
        'priority' => 'Tinggi',
        'description' => 'Melengkapi analisis kondisi aktual pengelolaan persediaan obat di Klinik Shifa Medika sebagai dasar requirement gathering dan penyusunan proposal.',
        'checklist' => [
            'Susun analisis kondisi existing',
            'Lengkapi alur pengelolaan persediaan obat',
            'Perjelas pembagian kerja petugas farmasi',
            'Validasi proses stock opname',
            'Validasi kendala proses existing',
            'Catat informasi/temuan baru',
        ],
    ],
    [
        'id' => 'capstone-t1-gap-requirement',
        'title' => 'Konfirmasi Gap Requirement Utama Inventory Obat',
        'pic' => 'Rival',
        'status' => 'Sedang Dikerjakan',
        'priority' => 'Tinggi',
        'description' => 'Menandai dan mengonfirmasi gap requirement utama pada proses inventory obat agar kebutuhan sistem yang diturunkan tidak berdasarkan asumsi.',
        'checklist' => [
            'Review hasil requirement gathering',
            'Tandai informasi yang belum terkonfirmasi',
            'Konfirmasi minimal 5 gap requirement utama',
            'Olah requirement tervalidasi menjadi dasar kebutuhan sistem',
            'Sampaikan hasil terbaru kepada tim',
        ],
    ],
    [
        'id' => 'capstone-t1-clinic-permission-data',
        'title' => 'Koordinasi Klinik & Validasi Data Pendukung',
        'pic' => 'Rival',
        'status' => 'Sedang Dikerjakan',
        'priority' => 'Tinggi',
        'description' => 'Menindaklanjuti koordinasi dengan pihak Klinik Shifa Medika setelah surat pengantar resmi dari Prodi diajukan dan diterima oleh Febby. Fokus Rival adalah memastikan izin owner yang sudah diperoleh dapat dilanjutkan ke validasi lapangan, pertemuan dengan Kepala Apoteker, serta pengumpulan contoh data/dokumen pendukung yang diizinkan klinik.',
        'checklist' => [
            ['text' => 'Tindak lanjuti koordinasi dengan pihak klinik setelah surat pengantar Prodi tersedia', 'done' => true],
            ['text' => 'Konfirmasi izin owner klinik yang sudah didapat', 'done' => true],
            'Bertemu Kepala Apoteker',
            'Siapkan contoh data atau dokumen pendukung yang diizinkan klinik',
            'Catat batasan data yang boleh digunakan',
            'Update tim setelah validasi lapangan 30 September 2026',
        ],
    ],
    [
        'id' => 'capstone-t1-proposal-structure',
        'title' => 'Susun Struktur Awal Proposal Tugas 1',
        'pic' => 'Cintia',
        'status' => 'Sedang Dikerjakan',
        'priority' => 'Tinggi',
        'description' => 'Menyiapkan struktur awal dokumen Proposal Tugas 1 di Microsoft Word sesuai panduan Capstone Project.',
        'checklist' => [
            'Siapkan struktur dokumen proposal',
            'Susun kerangka bab dan subbab',
            'Susun draft jadwal kegiatan Capstone Project',
            'Rapikan format awal dokumen',
        ],
    ],
    [
        'id' => 'capstone-t1-proposal-background-scope',
        'title' => 'Susun Latar Belakang, Tujuan & Ruang Lingkup',
        'pic' => 'Cintia',
        'status' => 'Sedang Dikerjakan',
        'priority' => 'Tinggi',
        'description' => 'Menyusun bagian latar belakang, tujuan, dan ruang lingkup berdasarkan informasi yang sudah tersedia dan arah project sementara.',
        'checklist' => [
            'Susun draft latar belakang',
            'Susun tujuan project',
            'Susun draft ruang lingkup',
            'Sesuaikan ruang lingkup dengan arah project sementara',
            'Revisi ruang lingkup dan jadwal sesuai arahan terbaru',
        ],
    ],
    [
        'id' => 'capstone-t1-proposal-update',
        'title' => 'Perbarui Draft Proposal Berdasarkan Analisis & Arahan',
        'pic' => 'Cintia',
        'status' => 'Sedang Dikerjakan',
        'priority' => 'Tinggi',
        'description' => 'Memperbarui draft proposal mengikuti hasil analisis Rival, referensi tim, hasil validasi klinik, dan arahan tutor terbaru.',
        'checklist' => [
            'Integrasikan hasil analisis Rival',
            'Integrasikan referensi/tinjauan pustaka',
            'Sesuaikan proposal dengan hasil validasi terbaru',
            'Rapikan draft proposal',
            'Serahkan draft untuk review tim',
        ],
    ],
    [
        'id' => 'capstone-t1-literature-search',
        'title' => 'Cari Referensi Sistem Informasi Persediaan Obat',
        'pic' => 'Farah',
        'status' => 'Sedang Dikerjakan',
        'priority' => 'Tinggi',
        'description' => 'Mengumpulkan referensi ilmiah relevan untuk topik sistem informasi persediaan obat, monitoring stok, dan stock opname.',
        'checklist' => [
            'Cari 3-5 referensi sistem informasi persediaan obat',
            'Cari referensi terkait monitoring stok',
            'Cari referensi terkait stock opname',
            'Seleksi referensi yang relevan',
            'Catat sumber referensi',
        ],
    ],
    [
        'id' => 'capstone-t1-literature-summary',
        'title' => 'Buat Ringkasan Referensi untuk Tinjauan Pustaka',
        'pic' => 'Farah',
        'status' => 'Sedang Dikerjakan',
        'priority' => 'Tinggi',
        'description' => 'Meringkas dan memetakan bahan pustaka agar dapat langsung digunakan Cintia dalam penyusunan Tinjauan Pustaka Proposal Tugas 1.',
        'checklist' => [
            'Buat ringkasan referensi',
            'Petakan referensi terhadap kebutuhan proposal',
            'Sesuaikan bahan pustaka dengan scope project',
            'Sampaikan hasil referensi kepada Cintia',
            'Lengkapi referensi jika ada kebutuhan tambahan',
        ],
    ],
    [
        'id' => 'capstone-t1-analysis-reference-support',
        'title' => 'Pendukung Analisis & Referensi Project',
        'pic' => 'Anggi',
        'status' => 'Belum Dimulai',
        'priority' => 'Sedang',
        'description' => 'Mendukung proses penyusunan Tugas 1 melalui pelengkapan informasi, analisis, dan referensi yang dibutuhkan oleh tim berdasarkan perkembangan project. Task dapat diperbarui setelah pembagian pekerjaan Anggi semakin spesifik.',
        'checklist' => [
            'Pelajari recap pertemuan sebelumnya',
            'Pelajari dokumen analisis existing',
            'Identifikasi informasi yang masih kurang',
            'Bantu pencarian referensi pendukung',
            'Bantu cross-check hasil analisis',
            'Sampaikan temuan atau koreksi kepada tim',
            'Update progress pekerjaan melalui Task Tracker',
        ],
    ],
    [
        'id' => 'capstone-t1-team-coordination',
        'title' => 'Koordinasikan Progress Tugas 1 Tim',
        'pic' => 'Febby',
        'status' => 'Sedang Dikerjakan',
        'priority' => 'Tinggi',
        'description' => 'Mengkoordinasikan progress Tugas 1 agar update tiap anggota tersampaikan ke seluruh tim dan hasil pekerjaan tetap sinkron.',
        'checklist' => [
            'Monitor progress masing-masing PIC',
            'Sinkronkan hasil analisis dengan proposal',
            'Cross-check hasil meeting dengan dokumen',
            'Review hasil validasi klinik',
            'Koordinasikan revisi jika diperlukan',
            'Pastikan output anggota sudah terintegrasi',
        ],
    ],
    [
        'id' => 'capstone-t1-documentation-admin',
        'title' => 'Dokumentasi & Administrasi Capstone',
        'pic' => 'Febby',
        'status' => 'Sedang Dikerjakan',
        'priority' => 'Sedang',
        'description' => 'Menyiapkan dan merapikan dokumentasi serta administrasi pendukung Capstone Project. Surat pengantar resmi dari Prodi sudah diajukan Febby pada Senin pagi, 28 September 2026, dan diterima melalui email sekitar pukul 16.00. Surat Pernyataan sedang didraft; tanda tangan direncanakan setelah draft Proposal Tugas 1 selesai agar isi dokumen sinkron. BA Pertemuan Kedua tanggal 27 September sedang dirapikan/revisi pada 29 September 2026.',
        'checklist' => [
            'Rapikan BA Pertemuan Pertama',
            'Rapikan BA Pertemuan Kedua tanggal 27 September',
            'Finalisasi recap pertemuan',
            'Susun draft Surat Pernyataan',
            ['text' => 'Pastikan Surat Pengantar Prodi terdokumentasi', 'done' => true],
            ['text' => 'Arsipkan dokumen pendukung project', 'done' => true],
            'Sinkronkan Surat Pernyataan dengan Proposal Tugas 1',
            'Siapkan Surat Pernyataan untuk tanda tangan setelah proposal selesai',
        ],
    ],
    [
        'id' => 'capstone-t1-final-submission',
        'title' => 'Finalisasi & Submission Proposal Tugas 1',
        'pic' => 'Febby',
        'status' => 'Belum Dimulai',
        'priority' => 'Tinggi',
        'description' => 'Melakukan pengecekan akhir dan finalisasi seluruh bagian Proposal Tugas 1 sebelum dikumpulkan. PIC menggunakan Febby karena sistem hanya mendukung satu PIC.',
        'checklist' => [
            'Pastikan analisis terbaru sudah masuk',
            'Pastikan hasil validasi klinik sudah masuk',
            'Pastikan referensi sudah lengkap',
            'Cross-check konsistensi isi proposal',
            'Cross-check format sesuai panduan',
            'Review bersama anggota',
            'Lakukan revisi terakhir',
            'Finalisasi dokumen',
            'Pastikan file siap submission',
            'Submit Tugas 1',
        ],
    ],
];

$history = [
    ['id' => 'capstone-history-20260925', 'occurred_at' => '2026-09-25 12:00:00', 'details' => 'Pertemuan pertama tim. Pengenalan dan penentuan arah studi kasus, pembahasan awal kondisi Klinik Shifa Medika, serta pembagian pekerjaan awal tim.'],
    ['id' => 'capstone-history-20260927', 'occurred_at' => '2026-09-27 12:00:00', 'details' => 'Pertemuan kedua. Sinkronisasi hasil requirement gathering, klarifikasi kondisi existing, pembahasan proses persediaan dan stock opname, serta penyusunan recap dan Berita Acara pertemuan.'],
    ['id' => 'capstone-history-20260928', 'occurred_at' => '2026-09-28 16:00:00', 'details' => 'Tugas 1 mulai tersedia. Tim memutuskan kuesioner tidak diperlukan, Febby mengajukan surat pengantar resmi ke Prodi, Rival mendapat arahan membawa surat resmi kampus, surat pengantar diterima sekitar pukul 16.00, surat ditindaklanjuti ke klinik, owner klinik memberi izin, dan direncanakan pertemuan dengan Kepala Apoteker pada 30 September.'],
    ['id' => 'capstone-history-20260929', 'occurred_at' => '2026-09-29 12:00:00', 'details' => 'Febby melakukan revisi BA Pertemuan Kedua, menyusun draft Surat Pernyataan, dan tim mempersiapkan validasi lapangan tanggal 30 September.'],
];

$db->beginTransaction();

try {
    $placeholders = implode(',', array_fill(0, count($seedTaskIds), '?'));
    $deleteChecklist = $db->prepare("DELETE FROM task_checklist_items WHERE task_id IN ($placeholders)");
    $deleteChecklist->execute($seedTaskIds);
    $deleteTasks = $db->prepare("DELETE FROM tasks WHERE id IN ($placeholders)");
    $deleteTasks->execute($seedTaskIds);

    $taskStmt = $db->prepare(
        'INSERT INTO tasks (id, phase, title, pic, status, priority, description)
         VALUES (:id, :phase, :title, :pic, :status, :priority, :description)'
    );
    $checklistStmt = $db->prepare(
        'INSERT INTO task_checklist_items (task_id, item_order, text, is_done)
         VALUES (:task_id, :item_order, :text, :is_done)'
    );

    foreach ($tasks as $task) {
        $taskStmt->execute([
            'id' => $task['id'],
            'phase' => 'tugas1',
            'title' => $task['title'],
            'pic' => $task['pic'],
            'status' => $task['status'],
            'priority' => $task['priority'],
            'description' => $task['description'],
        ]);
        foreach ($task['checklist'] as $index => $item) {
            $text = is_array($item) ? $item['text'] : $item;
            $isDone = is_array($item) && !empty($item['done']);
            $checklistStmt->execute([
                'task_id' => $task['id'],
                'item_order' => $index + 1,
                'text' => $text,
                'is_done' => $isDone ? 1 : 0,
            ]);
        }
    }

    $auditStmt = $db->prepare(
        'INSERT INTO audit_logs
         (id, occurred_at, user_name, role, action, action_tag, object_type, object_id, object_name, details, changes_json, ip, device)
         VALUES (:id, :occurred_at, :user_name, :role, :action, :action_tag, :object_type, :object_id, :object_name, :details, JSON_ARRAY(), :ip, :device)
         ON DUPLICATE KEY UPDATE occurred_at = VALUES(occurred_at), details = VALUES(details)'
    );
    foreach ($history as $entry) {
        $auditStmt->execute([
            'id' => $entry['id'],
            'occurred_at' => $entry['occurred_at'],
            'user_name' => 'Febby',
            'role' => 'superadmin',
            'action' => 'Progress History',
            'action_tag' => 'progress_history',
            'object_type' => 'Project',
            'object_id' => 'capstone-tugas1',
            'object_name' => 'Capstone Project Tugas 1',
            'details' => $entry['details'],
            'ip' => '127.0.0.1',
            'device' => 'Seed Data',
        ]);
    }

    $db->commit();
} catch (Throwable $e) {
    $db->rollBack();
    throw $e;
}

echo 'Seeded ' . count($tasks) . ' operational tasks and ' . count($history) . ' history entries.' . PHP_EOL;
