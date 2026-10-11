# Rekapan Compare Phase 3 vs Tugas 1 Existing

Dokumen ini merangkum hasil compare handoff Phase 3 Historical Task Reconstruction dengan data Tugas 1 yang sudah ada di Capstone Workspace.

Status dokumen: review-only. Belum ada input, update, atau perubahan data Tugas 1 yang dilakukan berdasarkan Phase 3.

## Ringkasan Kondisi Saat Ini

- Existing task `tugas1`: 24 task.
- Existing meeting record: 1, yaitu Pertemuan Pertama 25 September 2026, sudah ada BA.
- Existing arsip dokumen: 2, yaitu Surat Dinas/Surat Izin Prodi dan BA Pertemuan Pertama.
- Existing catatan progress: 1 catatan Tugas 1 periode 25-30 September 2026.
- Existing `tugas2`: 21 task.
- Existing `tugas3`: 0 task.

## Reconciliation Matrix

### Febby - Coordination & Project Consolidation

| Ref Phase 3 | Aktivitas Historis | PIC | Tanggal/Periode | Match Existing | Status Existing | Rekomendasi |
|---|---|---|---|---|---|---|
| T1-FEB-01 | Koordinasi Awal dan Pembentukan Kelompok | Febby | 20-25 Sep 2026 | Belum ada task eksplisit | - | Create historical task atau catatan milestone |
| T1-FEB-02 | Persiapan dan Pelaksanaan Pertemuan Pertama | Febby | 25 Sep 2026 | `t1-2026-01` Pertemuan Awal | Selesai | Preserve, jangan duplikat |
| T1-FEB-03 | Pertemuan Kedua dan Sinkronisasi Kelompok | Febby | 27 Sep 2026 | `t1-2026-03`, `t1-2026-04` | Selesai | Preserve, jangan duplikat; cek apakah BA kedua sudah ada arsipnya |
| T1-FEB-04 | Pengurusan Surat Pengantar Resmi | Febby | 28 Sep 2026 | `t1-2026-07` + arsip surat izin | Selesai | Preserve |
| T1-FEB-05 | Analisis Ruang Lingkup dan Kebutuhan Sistem | Febby | Sep-Okt 2026 | `t1-2026-02`, `t1-2026-09`, `t1-2026-11`, `t1-2026-14` | Campuran | Jangan create baru; enrich/catat di task terkait |
| T1-FEB-06 | Review dan Penyempurnaan Proposal | Febby | 30 Sep-10 Okt 2026 | `t1-2026-12`, `t1-2026-13`, `t1-2026-18`, `t1-2026-21` | Campuran | Reconcile status dan catatan, jangan duplikat |
| T1-FEB-07 | Dokumentasi Rancangan Awal dan Use Case | Febby | Okt 2026 | Belum ada task eksplisit | - | Create task/milestone baru jika memang ingin tercatat |
| T1-FEB-08 | Finalisasi dan Pengumpulan Proposal Tugas 1 | Febby | 10-11 Okt 2026 | `t1-2026-22` | Ditunda | Perlu update jika evidence submission 11 Okt 08.58 WIB valid |

### Cintia - Proposal & Academic Documentation

| Ref Phase 3 | Aktivitas Historis | PIC | Tanggal/Periode | Match Existing | Status Existing | Rekomendasi |
|---|---|---|---|---|---|---|
| T1-CIN-01 | Menyiapkan Kerangka Proposal | Cintia | 25-30 Sep 2026 | Belum ada task spesifik Cintia | - | Create jika ingin kontribusi Cintia tercatat |
| T1-CIN-02 | Penyusunan Pendahuluan | Cintia | Akhir Sep-awal Okt | Sebagian overlap `t1-2026-13` | PIC existing Febby | Perlu review attribution; jangan overwrite PIC tanpa bukti |
| T1-CIN-03 | Review Struktur dan Kerapian Proposal | Cintia | 30 Sep-Okt 2026 | Sebagian overlap `t1-2026-21`/`t1-2026-19` | PIC Febby/Anggi | Create atau catat sebagai kontribusi review, butuh evidence |
| T1-CIN-04 | Integrasi Dokumen Analisis dan Proposal | Cintia | Okt 2026 | Sebagian overlap `t1-2026-12` | PIC existing Febby | Perlu verifikasi kontribusi dokumen |

### Rival - Clinic Analysis & Stakeholder Coordination

| Ref Phase 3 | Aktivitas Historis | PIC | Tanggal/Periode | Match Existing | Status Existing | Rekomendasi |
|---|---|---|---|---|---|---|
| T1-RIV-01 | Pengusulan dan Klarifikasi Studi Kasus | Rival | 21-27 Sep 2026 | Sebagian overlap `t1-2026-01`, `t1-2026-02` | Selesai/Sedang Dikerjakan | Bisa create historical task jika ingin pengusulan klinik tercatat |
| T1-RIV-02 | Penyusunan Dokumen Analisis Existing | Rival | Akhir Sep-awal Okt | `t1-2026-02`, `t1-2026-11` | Sedang Dikerjakan/Ditunda | Preserve; mungkin enrich catatan |
| T1-RIV-03 | Klarifikasi Gap Requirement | Rival | Sep-Okt 2026 | `t1-2026-09` | Sedang Dikerjakan | Preserve; jangan auto-selesai |
| T1-RIV-04 | Koordinasi Izin dan Dokumen Klinik | Rival | 28 Sep-8 Okt 2026 | `t1-2026-08` | Sedang Dikerjakan | Preserve; update hanya jika surat balasan klinik terbukti |
| T1-RIV-05 | Pengumpulan Contoh Dokumen Operasional | Rival | Sep-Okt 2026 | `t1-2026-10` | Sedang Dikerjakan | Preserve; jangan auto-selesai |
| T1-RIV-06 | Pemutakhiran Dokumen Analisis | Rival/source klinik | 6-10 Okt 2026 | `t1-2026-11` | Ditunda | Perlu verifikasi revision history sebelum update |

### Farah - Literature & Academic References

| Ref Phase 3 | Aktivitas Historis | PIC | Tanggal/Periode | Match Existing | Status Existing | Rekomendasi |
|---|---|---|---|---|---|---|
| T1-FAR-01 | Pencarian Referensi Ilmiah | Farah | Akhir Sep-awal Okt | `t1-2026-16` | Sedang Dikerjakan | Preserve |
| T1-FAR-02 | Penyusunan dan Pemeriksaan Data Referensi | Farah | Awal Okt | Sebagian overlap `t1-2026-17` | PIC existing Cintia | Perlu attribution review; bisa create jika ada evidence Farah |
| T1-FAR-03 | Tinjauan Pustaka dan Keterkaitan Penelitian | Farah | Okt 2026 | Sebagian overlap `t1-2026-18` | PIC existing Febby, support Farah | Jangan overwrite; catat support jika perlu |
| T1-FAR-04 | Review Akademik Proposal | Farah | Okt 2026 | Sebagian overlap `t1-2026-21` | Ditunda | Butuh evidence; jangan auto-selesai |

### Anggi - Historical Assignments

| Ref Phase 3 | Aktivitas Historis | PIC | Tanggal/Periode | Match Existing | Status Existing | Rekomendasi |
|---|---|---|---|---|---|---|
| T1-ANG-01 | Penyusunan Draft Ruang Lingkup | Anggi | Sep 2026 | Existing `t1-2026-14` tapi PIC Febby | Sedang Dikerjakan | Missing historical assignment; jangan ubah PIC tanpa bukti |
| T1-ANG-02 | Penyusunan Draft Jadwal Kegiatan | Anggi | Sep 2026 | Existing `t1-2026-15` tapi PIC Febby | Selesai | Missing historical assignment; completion Anggi unverified |
| T1-ANG-03 | Rencana Penugasan Alternatif QC Proposal | Anggi | 30 Sep 2026 ±14.45 WIB | `t1-2026-19` | Belum Dimulai | Preserve sebagai rencana/QC, jangan framing gagal |
| T1-ANG-04 | Pengembalian Dokumen Bertanda Tangan | Anggi | 7 Okt 2026 ±16.54 WIB | Belum ada task eksplisit | - | Create administrative contribution task/milestone |

## Milestone Yang Sudah Terwakili

| Milestone | Bukti Existing | Catatan |
|---|---|---|
| Pertemuan pertama 25 Sep | Meeting record + BA archive + `t1-2026-01` | Aman, jangan duplikat |
| Surat pengantar Prodi | Arsip dokumen + `t1-2026-07` | Aman |
| Rekap progress 25-30 Sep | Catatan progress Tugas 1 | Aman |
| Pertemuan kedua 27 Sep | Task `t1-2026-03`/`t1-2026-04` | Task ada, tapi arsip BA kedua belum terlihat |
| Draft/task Proposal Tugas 1 | `t1-2026-12`, `t1-2026-13`, `t1-2026-14`, `t1-2026-18`, `t1-2026-21`, `t1-2026-22` | Status perlu reconcile |
| Referensi awal | `t1-2026-16`, `t1-2026-17`, `t1-2026-18` | PIC/contribution perlu verifikasi |

## Milestone Yang Belum Terlihat

| Milestone | Tanggal/Periode | Rekomendasi |
|---|---|---|
| Pembentukan kelompok 20-22 Sep | 20-22 Sep | Buat historical milestone/task jika ingin timeline lengkap |
| Klinik Shifa Medika diusulkan sebagai studi kasus | 21 Sep | Bisa masuk task Rival atau milestone awal |
| Dokumen Analisis v2 dipindah ke Google Docs | 30 Sep | Butuh evidence/link dokumen |
| Surat balasan klinik | 8 Okt | Belum terlihat di arsip; upload/link jika ada |
| Review data master obat sekitar 160 item | 8-10 Okt | Buat task/milestone jika ada dokumen/evidence |
| Use Case Diagram revisions | Okt | Belum ada task eksplisit |
| Submission Proposal Tugas 1 | 11 Okt 08.58 WIB | Existing task ada tapi masih Ditunda; perlu evidence lalu update |

## Existing Task Yang Statusnya Perlu Ditinjau

| Existing ID | Judul | PIC | Status Sekarang | Catatan |
|---|---|---|---|---|
| `t1-2026-12` | Penyusunan Draft Proposal Tugas 1 | Febby | Sedang Dikerjakan | Jika proposal sudah submitted, mungkin perlu update/catatan |
| `t1-2026-13` | Penyusunan Latar Belakang dan Tujuan | Febby | Sedang Dikerjakan | Perlu cek final proposal |
| `t1-2026-14` | Penyusunan Ruang Lingkup | Febby | Sedang Dikerjakan | Ada historical assignment ke Anggi, tapi existing PIC Febby |
| `t1-2026-18` | Penyusunan Tinjauan Pustaka | Febby | Sedang Dikerjakan | Support Farah tercatat di deskripsi, tapi PIC Febby |
| `t1-2026-21` | Final Review Proposal Seluruh Tim | Febby | Ditunda | Perlu evidence final review |
| `t1-2026-22` | Finalisasi dan Submission Proposal Tugas 1 | Febby | Ditunda | Phase 3 menyebut submitted 11 Okt 08.58 WIB |
| `t1-2026-08` | Perizinan Studi Kasus Klinik | Rival | Sedang Dikerjakan | Jika surat balasan klinik sudah ada, bisa update |
| `t1-2026-09` | Validasi Requirement Kepala Apoteker | Rival | Sedang Dikerjakan | Jangan auto-selesai tanpa hasil kunjungan |
| `t1-2026-10` | Pengumpulan Sampel Data Existing Klinik | Rival | Sedang Dikerjakan | Jangan auto-selesai tanpa bukti dataset diterima |
| `t1-2026-11` | Finalisasi Dokumen Analisis Existing | Rival | Ditunda | Phase 3 menyebut revisi 6-10 Okt, tapi editor/output perlu verifikasi |
| `t1-2026-19` | Quality Control Proposal | Anggi | Belum Dimulai | Phase 3 bilang ini rencana alternatif, jangan dianggap gagal |
| `t1-2026-20` | Finalisasi Lampiran Tugas 1 | Anggi | Belum Dimulai | Perlu cek apakah lampiran akhirnya disiapkan oleh siapa |

## Candidate Create Historical Record

| Ref | Judul Usulan | PIC | Tanggal/Periode | Status Awal Aman |
|---|---|---|---|---|
| T1-FEB-01 | Koordinasi Awal dan Pembentukan Kelompok | Febby | 20-25 Sep 2026 | Selesai jika evidence koordinasi tersedia; kalau tidak, gunakan catatan needs verification |
| T1-FEB-07 | Dokumentasi Rancangan Awal dan Use Case | Febby | Okt 2026 | Needs verification |
| T1-CIN-01 | Menyiapkan Kerangka Proposal | Cintia | 25-30 Sep 2026 | Needs verification |
| T1-CIN-03 | Review Struktur dan Kerapian Proposal | Cintia | 30 Sep-Okt | Needs verification |
| T1-RIV-01 | Pengusulan dan Klarifikasi Studi Kasus | Rival | 21-27 Sep | Selesai jika chat awal tersedia |
| T1-FAR-02 | Penyusunan dan Pemeriksaan Data Referensi | Farah | Awal Okt | Needs verification |
| T1-FAR-04 | Review Akademik Proposal | Farah | Okt | Needs verification |
| T1-ANG-01 | Historical Assignment: Draft Ruang Lingkup | Anggi | Sep | Jangan mark selesai tanpa bukti |
| T1-ANG-02 | Historical Assignment: Draft Jadwal Kegiatan | Anggi | Sep | Jangan mark selesai tanpa bukti |
| T1-ANG-04 | Pengembalian Dokumen Bertanda Tangan | Anggi | 7 Okt 2026 16.54 WIB | Selesai jika file/chat tersedia |

## Rekomendasi Dry-Run Nanti

Gunakan tiga kategori, bukan langsung create semua:

1. `preserve`: task sudah ada dan cukup dipertahankan.
2. `enrich/review`: task sudah ada tapi perlu catatan/status/PIC contribution clarification.
3. `create historical record`: hanya untuk aktivitas yang benar-benar belum ada.

## Catatan Penting

- Jangan langsung insert semua Phase 3.
- Banyak aktivitas Phase 3 overlap dengan 24 task Tugas 1 existing.
- Jangan ubah PIC existing tanpa bukti dokumen/revision history.
- Jangan ubah `created_at` untuk menyamakan tanggal historis.
- Tanggal historis sebaiknya dicatat di deskripsi/catatan, bukan system timestamp.
- Jangan membuat audit/log palsu seolah-olah member melakukan aksi lama.
- Kalau ingin update `t1-2026-22` ke Selesai, perlu evidence submission 11 Okt 2026 08.58 WIB.
- Untuk Anggi, gunakan bahasa netral: assignment/historical planning/unverified output, bukan framing gagal.

