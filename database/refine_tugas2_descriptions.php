<?php

declare(strict_types=1);

require_once __DIR__ . '/../backend/Database.php';
require_once __DIR__ . '/../backend/Repository.php';

$mode = $argv[1] ?? '--dry-run';

if (! in_array($mode, ['--dry-run', '--apply'], true)) {
    fwrite(STDERR, "Usage: php database/refine_tugas2_descriptions.php [--dry-run|--apply]\n");
    exit(1);
}

function buildDescription(array $sections): string
{
    $ordered = [
        'Tujuan',
        'Sumber Bahan',
        'Arahan Pengerjaan',
        'Deliverable',
        'Digunakan Untuk',
        'Batas Tanggung Jawab',
        'Reviewer',
    ];

    $parts = [];

    foreach ($ordered as $title) {
        if (! isset($sections[$title])) {
            continue;
        }

        $content = $sections[$title];

        if (is_array($content)) {
            $content = implode("\n", array_map(static fn ($item) => '- ' . $item, $content));
        }

        $parts[] = $title . ":\n" . trim((string) $content);
    }

    return implode("\n\n", $parts);
}

$reviewerNote = 'Tetap mengikuti reviewer yang sudah ditetapkan di sistem.';

$descriptions = [
    't2-dev-01' => buildDescription([
        'Tujuan' => 'Meninjau kembali kebutuhan sistem ShifaStock berdasarkan hasil Tugas 1 dan menyesuaikannya dengan kondisi implementasi yang sedang berjalan.',
        'Sumber Bahan' => [
            'Proposal Tugas 1.',
            'Dokumen kondisi existing dan requirement Klinik Shifa Medika.',
            'Catatan validasi dari Rival dan pihak klinik.',
            'Fitur ShifaStock yang sudah dibuat sampai awal Tugas 2.',
        ],
        'Arahan Pengerjaan' => 'Cocokkan kebutuhan sistem yang sudah disepakati dengan fitur yang sudah tersedia. Tandai kebutuhan yang sudah terpenuhi, masih perlu dilengkapi, atau perlu diklarifikasi ulang.',
        'Deliverable' => 'Ringkasan status kebutuhan dan daftar prioritas penyempurnaan ShifaStock untuk Tugas 2.',
        'Digunakan Untuk' => 'Dasar penyusunan bagian analisis dan implementasi pada laporan kemajuan.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-dev-02' => buildDescription([
        'Tujuan' => 'Merapikan rancangan sistem dan database agar sesuai dengan kebutuhan pengelolaan persediaan obat di Klinik Shifa Medika.',
        'Sumber Bahan' => [
            'Requirement Tugas 1.',
            'Struktur fitur ShifaStock.',
            'Data contoh yang diperbolehkan klinik.',
            'Kebutuhan transaksi obat masuk, obat keluar, stok, batch, expired date, dan pelaporan.',
        ],
        'Arahan Pengerjaan' => 'Periksa kembali alur data, struktur tabel, relasi antar data, dan kebutuhan informasi yang akan ditampilkan di sistem. Pastikan rancangan dapat menjelaskan cara sistem bekerja kepada pembaca laporan.',
        'Deliverable' => 'Rancangan sistem dan database yang siap dimasukkan ke laporan kemajuan.',
        'Digunakan Untuk' => 'Bagian rancangan sistem, rancangan basis data, dan dasar implementasi aplikasi.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-dev-03' => buildDescription([
        'Tujuan' => 'Melanjutkan pengembangan dan penyempurnaan fitur ShifaStock berdasarkan kebutuhan prioritas Tugas 2.',
        'Sumber Bahan' => [
            'Hasil review kebutuhan.',
            'Rancangan sistem dan database.',
            'Masukan dari validasi klinik.',
            'Catatan pengujian awal.',
        ],
        'Arahan Pengerjaan' => 'Kerjakan fitur yang paling berpengaruh terhadap alur persediaan obat, seperti pengelolaan data obat, stok, transaksi, monitoring, dan tampilan informasi yang dibutuhkan pengguna.',
        'Deliverable' => 'Fitur ShifaStock yang sudah diperbarui dan siap didokumentasikan sebagai progress Tugas 2.',
        'Digunakan Untuk' => 'Bukti implementasi, dokumentasi fitur, dan bahan pengujian awal.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-dev-04' => buildDescription([
        'Tujuan' => 'Menyiapkan bukti implementasi dan pengujian awal agar progress pengembangan dapat dipertanggungjawabkan dalam laporan kemajuan.',
        'Sumber Bahan' => [
            'Aplikasi ShifaStock yang sudah berjalan.',
            'Screenshot fitur.',
            'Hasil uji coba input dan alur kerja.',
            'Catatan error atau penyesuaian selama pengembangan.',
        ],
        'Arahan Pengerjaan' => 'Kumpulkan bukti visual dan catatan pengujian untuk fitur utama. Tulis hasilnya secara jelas agar pembaca memahami fitur apa yang sudah berjalan dan bagian mana yang masih perlu dilanjutkan.',
        'Deliverable' => 'Dokumentasi bukti implementasi dan pengujian awal ShifaStock.',
        'Digunakan Untuk' => 'Bagian implementasi, pengujian awal, dan lampiran laporan kemajuan.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-doc-01' => buildDescription([
        'Tujuan' => 'Menyiapkan struktur laporan kemajuan agar seluruh anggota memiliki format kerja yang sama.',
        'Sumber Bahan' => [
            'Panduan Capstone Project.',
            'Template atau arahan laporan dari tutor/prodi.',
            'Proposal Tugas 1.',
            'Pembagian pekerjaan Tugas 2.',
        ],
        'Arahan Pengerjaan' => 'Susun kerangka laporan kemajuan yang rapi, mulai dari bagian awal, pendahuluan, metode, hasil progress, dokumentasi, sampai lampiran. Pastikan struktur mudah diisi oleh setiap anggota.',
        'Deliverable' => 'Draft struktur laporan kemajuan Tugas 2.',
        'Digunakan Untuk' => 'Wadah utama integrasi pekerjaan seluruh anggota.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-doc-02' => buildDescription([
        'Tujuan' => 'Memperbarui bagian pendahuluan laporan kemajuan agar selaras dengan perkembangan project setelah Tugas 1.',
        'Sumber Bahan' => [
            'Proposal Tugas 1.',
            'Judul dan ruang lingkup yang sudah disepakati.',
            'Progress validasi klinik.',
            'Arah implementasi ShifaStock.',
        ],
        'Arahan Pengerjaan' => 'Sesuaikan narasi latar belakang, tujuan, ruang lingkup, dan batasan project dengan kondisi terbaru tanpa mengulang isi proposal secara mentah.',
        'Deliverable' => 'Bagian pendahuluan laporan kemajuan yang sudah diperbarui.',
        'Digunakan Untuk' => 'Bab awal laporan kemajuan dan pengantar progress Tugas 2.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-doc-03' => buildDescription([
        'Tujuan' => 'Mendokumentasikan implementasi dan pengujian awal ShifaStock dalam bentuk narasi laporan yang mudah dipahami.',
        'Sumber Bahan' => [
            'Bukti implementasi dari Febby.',
            'Screenshot fitur.',
            'Catatan pengujian awal.',
            'Rancangan sistem dan database.',
        ],
        'Arahan Pengerjaan' => 'Ubah bukti teknis menjadi penjelasan laporan. Jelaskan fitur yang sudah dibuat, fungsi tiap fitur, serta hasil pengujian awal secara ringkas dan runtut.',
        'Deliverable' => 'Narasi implementasi dan pengujian awal untuk laporan kemajuan.',
        'Digunakan Untuk' => 'Bagian hasil dan pembahasan progress pengembangan.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-doc-04' => buildDescription([
        'Tujuan' => 'Mengintegrasikan seluruh bagian laporan kemajuan menjadi satu draft yang konsisten dan siap direview.',
        'Sumber Bahan' => [
            'Draft dari seluruh anggota.',
            'Dokumentasi requirement.',
            'Dokumentasi implementasi.',
            'Referensi dan lampiran yang sudah tersedia.',
        ],
        'Arahan Pengerjaan' => 'Gabungkan isi laporan, rapikan alur antarbagian, cek konsistensi istilah, judul, penomoran, tabel, gambar, dan sitasi. Hindari duplikasi narasi antarbagian.',
        'Deliverable' => 'Draft laporan kemajuan terintegrasi.',
        'Digunakan Untuk' => 'Bahan final review sebelum dikumpulkan.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-req-01' => buildDescription([
        'Tujuan' => 'Mendokumentasikan metode pengumpulan data yang digunakan tim dalam memahami kebutuhan Klinik Shifa Medika.',
        'Sumber Bahan' => [
            'Catatan komunikasi dengan pihak klinik.',
            'Hasil pertemuan dan validasi.',
            'Dokumen pendukung yang diperbolehkan klinik.',
            'Riwayat koordinasi tim.',
        ],
        'Arahan Pengerjaan' => 'Jelaskan cara data dikumpulkan, siapa pihak yang dilibatkan, jenis informasi yang dicari, serta alasan metode tersebut sesuai untuk project ini.',
        'Deliverable' => 'Narasi metode pengumpulan data untuk laporan kemajuan.',
        'Digunakan Untuk' => 'Bagian metode atau proses pengumpulan kebutuhan sistem.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-req-02' => buildDescription([
        'Tujuan' => 'Mendokumentasikan proses bisnis existing pengelolaan persediaan obat di Klinik Shifa Medika.',
        'Sumber Bahan' => [
            'Hasil penggalian kondisi existing.',
            'Validasi Kepala Apoteker atau pihak klinik.',
            'Catatan alur obat masuk, obat keluar, stok, stock opname, dan pelaporan.',
        ],
        'Arahan Pengerjaan' => 'Tulis alur proses yang berjalan saat ini secara runtut. Pisahkan fakta yang sudah terkonfirmasi dari catatan yang masih perlu klarifikasi.',
        'Deliverable' => 'Dokumentasi proses bisnis existing atau As-Is.',
        'Digunakan Untuk' => 'Dasar analisis kebutuhan pengguna dan perbandingan dengan sistem yang dibuat.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-req-03' => buildDescription([
        'Tujuan' => 'Menyusun analisis kebutuhan pengguna berdasarkan kondisi existing dan peran pengguna di klinik.',
        'Sumber Bahan' => [
            'Dokumentasi proses bisnis existing.',
            'Hasil validasi klinik.',
            'Kebutuhan admin, petugas farmasi, dan pihak yang memantau persediaan.',
            'Scope ShifaStock.',
        ],
        'Arahan Pengerjaan' => 'Identifikasi kebutuhan pengguna dari masalah nyata yang ditemukan. Hubungkan kebutuhan tersebut dengan fitur sistem, bukan hanya daftar keinginan umum.',
        'Deliverable' => 'Daftar dan penjelasan kebutuhan pengguna untuk laporan kemajuan.',
        'Digunakan Untuk' => 'Dasar rancangan fitur, pengujian, dan pembahasan manfaat sistem.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-req-04' => buildDescription([
        'Tujuan' => 'Menjaga agar informasi dari pihak klinik tetap valid selama proses pengerjaan Tugas 2.',
        'Sumber Bahan' => [
            'Pertanyaan lanjutan dari tim.',
            'Temuan saat menyusun laporan atau mengembangkan sistem.',
            'Masukan dari pihak Klinik Shifa Medika.',
        ],
        'Arahan Pengerjaan' => 'Catat poin yang perlu diklarifikasi, tindak lanjuti ke pihak klinik jika diperlukan, lalu rangkum hasil klarifikasi agar dapat digunakan oleh anggota lain.',
        'Deliverable' => 'Catatan klarifikasi dan validasi terbaru dari klinik.',
        'Digunakan Untuk' => 'Mengurangi asumsi yang belum terkonfirmasi pada laporan dan implementasi.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-aca-01' => buildDescription([
        'Tujuan' => 'Memutakhirkan tinjauan pustaka agar sesuai dengan arah Tugas 2 dan implementasi ShifaStock.',
        'Sumber Bahan' => [
            'Referensi ilmiah dari Tugas 1.',
            'Referensi tambahan yang relevan.',
            'Scope sistem persediaan obat, monitoring stok, batch, expired date, FEFO, dan early warning.',
        ],
        'Arahan Pengerjaan' => 'Pilih referensi yang benar-benar mendukung pembahasan sistem. Rapikan ringkasan konsep dan hubungkan dengan kebutuhan project.',
        'Deliverable' => 'Tinjauan pustaka yang sudah diperbarui untuk laporan kemajuan.',
        'Digunakan Untuk' => 'Landasan teori dan dukungan akademik laporan.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-aca-02' => buildDescription([
        'Tujuan' => 'Mendokumentasikan metode pengembangan sistem yang digunakan dalam pengerjaan ShifaStock.',
        'Sumber Bahan' => [
            'Panduan Capstone Project.',
            'Rencana kerja Tugas 2.',
            'Proses analisis, perancangan, implementasi, dan pengujian awal.',
        ],
        'Arahan Pengerjaan' => 'Jelaskan tahapan pengembangan yang dilakukan tim secara realistis sesuai progress project. Hindari narasi yang terlalu umum dan tidak terhubung dengan pekerjaan tim.',
        'Deliverable' => 'Narasi metode pengembangan sistem untuk laporan kemajuan.',
        'Digunakan Untuk' => 'Bagian metode pengembangan atau metodologi project.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-aca-03' => buildDescription([
        'Tujuan' => 'Mendokumentasikan proses perancangan sistem berdasarkan kebutuhan pengguna dan rancangan teknis ShifaStock.',
        'Sumber Bahan' => [
            'Analisis kebutuhan pengguna.',
            'Rancangan sistem dari Febby.',
            'Diagram atau alur yang tersedia.',
            'Referensi terkait perancangan sistem informasi.',
        ],
        'Arahan Pengerjaan' => 'Susun penjelasan perancangan sistem secara runtut, mulai dari kebutuhan, alur sistem, rancangan data, sampai tampilan atau fitur utama yang dirancang.',
        'Deliverable' => 'Dokumentasi proses perancangan sistem.',
        'Digunakan Untuk' => 'Bagian rancangan sistem dan pembahasan implementasi.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-aca-04' => buildDescription([
        'Tujuan' => 'Melakukan review ilmiah agar referensi, istilah, dan narasi akademik laporan tetap konsisten.',
        'Sumber Bahan' => [
            'Draft laporan kemajuan.',
            'Daftar referensi.',
            'Sitasi yang digunakan pada laporan.',
            'Panduan penulisan akademik.',
        ],
        'Arahan Pengerjaan' => 'Periksa kesesuaian referensi dengan pembahasan, konsistensi istilah, serta kelengkapan sitasi. Tandai bagian yang perlu diperjelas atau diperkuat sumbernya.',
        'Deliverable' => 'Catatan review ilmiah dan perbaikan referensi.',
        'Digunakan Untuk' => 'Finalisasi kualitas akademik laporan.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-adm-01' => buildDescription([
        'Tujuan' => 'Memutakhirkan jadwal kegiatan agar mencerminkan rencana dan kondisi pengerjaan Tugas 2.',
        'Sumber Bahan' => [
            'Jadwal Tugas 1.',
            'Periode Tugas 2.',
            'Pembagian pekerjaan anggota.',
            'Progress aktual tim.',
        ],
        'Arahan Pengerjaan' => 'Sesuaikan jadwal dengan pekerjaan yang benar-benar dilakukan dan target yang masih perlu diselesaikan. Pastikan tanggal dan urutan kegiatan masuk akal.',
        'Deliverable' => 'Jadwal kegiatan Tugas 2 yang diperbarui.',
        'Digunakan Untuk' => 'Bagian jadwal kegiatan dan kontrol progress tim.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-adm-02' => buildDescription([
        'Tujuan' => 'Membuat timeline rencana dan realisasi agar progress Tugas 2 dapat dipantau dengan jelas.',
        'Sumber Bahan' => [
            'Jadwal kegiatan.',
            'Tanggal mulai dan target tiap pekerjaan.',
            'Update progress anggota.',
            'Kendala yang memengaruhi realisasi.',
        ],
        'Arahan Pengerjaan' => 'Bedakan rencana dan realisasi. Catat pekerjaan yang sesuai jadwal, bergeser, atau menunggu output lain tanpa mengubah status task secara sembarangan.',
        'Deliverable' => 'Timeline rencana dan realisasi Tugas 2.',
        'Digunakan Untuk' => 'Monitoring internal dan bahan laporan kemajuan.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-adm-03' => buildDescription([
        'Tujuan' => 'Mendokumentasikan pelaksanaan kegiatan tim selama Tugas 2.',
        'Sumber Bahan' => [
            'Catatan progress harian atau mingguan.',
            'Pertemuan, diskusi, dan koordinasi tim.',
            'Bukti kegiatan yang tersedia.',
            'Dokumen atau screenshot pendukung.',
        ],
        'Arahan Pengerjaan' => 'Kumpulkan kegiatan penting dan susun menjadi dokumentasi yang rapi. Fokus pada kegiatan yang mendukung pengerjaan laporan dan pengembangan sistem.',
        'Deliverable' => 'Dokumentasi pelaksanaan kegiatan Tugas 2.',
        'Digunakan Untuk' => 'Lampiran, berita acara bila diperlukan, dan bukti progress project.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-adm-04' => buildDescription([
        'Tujuan' => 'Merekap capaian, kendala, dan tindak lanjut agar tim memiliki gambaran progress yang jelas.',
        'Sumber Bahan' => [
            'Update dari masing-masing anggota.',
            'Status task pada aplikasi.',
            'Catatan kendala pengerjaan.',
            'Rencana tindak lanjut.',
        ],
        'Arahan Pengerjaan' => 'Pisahkan capaian yang sudah selesai, kendala yang masih memengaruhi pekerjaan, dan tindak lanjut yang perlu dilakukan. Gunakan bahasa yang ringkas dan mudah dibaca.',
        'Deliverable' => 'Rekap capaian, kendala, dan tindak lanjut Tugas 2.',
        'Digunakan Untuk' => 'Update progress tim dan bahan narasi laporan kemajuan.',
        'Reviewer' => $reviewerNote,
    ]),
    't2-adm-05' => buildDescription([
        'Tujuan' => 'Mengelola lampiran dan kelengkapan administrasi laporan kemajuan agar dokumen pendukung tersusun rapi.',
        'Sumber Bahan' => [
            'Surat, berita acara, dan dokumen resmi.',
            'Screenshot atau bukti kegiatan.',
            'Diagram, tabel, atau file pendukung.',
            'Dokumen yang sudah tersedia di arsip.',
        ],
        'Arahan Pengerjaan' => 'Cek kelengkapan lampiran, nama file, urutan lampiran, dan keterkaitannya dengan isi laporan. Pastikan dokumen yang digunakan memang relevan dan boleh dilampirkan.',
        'Deliverable' => 'Daftar lampiran dan dokumen pendukung yang siap digunakan.',
        'Digunakan Untuk' => 'Finalisasi laporan kemajuan dan arsip dokumen project.',
        'Batas Tanggung Jawab' => 'Tidak perlu membuat ulang dokumen yang sudah ada, cukup merapikan dan memastikan kelengkapannya.',
        'Reviewer' => $reviewerNote,
    ]),
];

$ids = array_keys($descriptions);

function fetchSnapshot(PDO $db, array $ids): array
{
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $sql = <<<SQL
        SELECT
            t.id,
            t.title,
            t.phase,
            t.pic,
            t.reviewer,
            t.priority,
            t.status,
            t.review_status,
            t.description,
            COUNT(ci.id) AS checklist_total,
            SUM(COALESCE(ci.is_done, 0)) AS checklist_done
        FROM tasks t
        LEFT JOIN task_checklist_items ci ON ci.task_id = t.id
        WHERE t.id IN ($placeholders)
        GROUP BY t.id, t.title, t.phase, t.pic, t.reviewer, t.priority, t.status, t.review_status, t.description
        ORDER BY t.id
    SQL;

    $stmt = $db->prepare($sql);
    $stmt->execute($ids);

    $rows = [];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $row['checklist_total'] = (int) $row['checklist_total'];
        $row['checklist_done'] = (int) $row['checklist_done'];
        $rows[$row['id']] = $row;
    }

    return $rows;
}

function stableFields(array $row): array
{
    return [
        'title' => $row['title'],
        'phase' => $row['phase'],
        'pic' => $row['pic'],
        'reviewer' => $row['reviewer'],
        'priority' => $row['priority'],
        'status' => $row['status'],
        'review_status' => $row['review_status'],
        'checklist_total' => $row['checklist_total'],
        'checklist_done' => $row['checklist_done'],
    ];
}

function assertValidBaseline(array $snapshot, array $ids): void
{
    $missing = array_values(array_diff($ids, array_keys($snapshot)));

    if ($missing !== []) {
        throw new RuntimeException('Missing Tugas 2 task IDs: ' . implode(', ', $missing));
    }

    foreach ($ids as $id) {
        if (($snapshot[$id]['phase'] ?? null) !== 'tugas2') {
            throw new RuntimeException("Task {$id} is not in phase tugas2.");
        }
    }
}

$db = Database::connection();
$repo = Repository::create($db);
$before = fetchSnapshot($db, $ids);

assertValidBaseline($before, $ids);

$changed = [];

foreach ($ids as $id) {
    if (trim((string) $before[$id]['description']) !== trim($descriptions[$id])) {
        $changed[] = $id;
    }
}

if ($mode === '--dry-run') {
    echo "Dry run refinement Tugas 2 descriptions\n";
    echo "Task ditemukan: " . count($before) . "\n";
    echo "Akan diperbarui: " . count($changed) . "\n\n";

    foreach ($ids as $id) {
        $row = $before[$id];
        $flag = in_array($id, $changed, true) ? 'update' : 'skip';
        echo sprintf(
            "%s | %s | %s | PIC: %s | Reviewer: %s | Status: %s | Checklist: %d/%d\n",
            $flag,
            $id,
            $row['title'],
            $row['pic'],
            $row['reviewer'],
            $row['status'],
            $row['checklist_done'],
            $row['checklist_total']
        );
    }

    exit(0);
}

$db->beginTransaction();

try {
    foreach ($ids as $id) {
        if (! in_array($id, $changed, true)) {
            continue;
        }

        $repo->updateTask($id, ['description' => $descriptions[$id]]);
    }

    $after = fetchSnapshot($db, $ids);
    assertValidBaseline($after, $ids);

    foreach ($ids as $id) {
        if (stableFields($before[$id]) !== stableFields($after[$id])) {
            throw new RuntimeException("Protected fields changed for {$id}.");
        }

        if (trim((string) $after[$id]['description']) !== trim($descriptions[$id])) {
            throw new RuntimeException("Description was not applied for {$id}.");
        }
    }

    $db->commit();

    echo "Refinement Tugas 2 selesai.\n";
    echo "Task diperbarui: " . count($changed) . "\n";
    echo "Task divalidasi: " . count($after) . "\n";
    echo "Field terlindungi tetap sama: PIC, reviewer, prioritas, status, review status, dan checklist.\n";
} catch (Throwable $error) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }

    fwrite(STDERR, "Refinement dibatalkan: " . $error->getMessage() . "\n");
    exit(1);
}
