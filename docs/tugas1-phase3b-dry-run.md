# Phase 3B Dry-Run Reconciliation - Tugas 1

Dokumen ini adalah laporan dry-run untuk final reconciliation Tugas 1 berdasarkan handoff Phase 3B.

Status: rekomendasi review-only. Belum ada update database Tugas 1 yang dilakukan dari Phase 3B.

## 1. Current Database Baseline

Hasil query read-only terbaru:

| Data | Count |
|---|---:|
| Tugas 1 tasks | 24 |
| Tugas 2 tasks | 21 |
| Tugas 3 tasks | 0 |
| Meeting records aktif | 1 |
| Document archives | 2 |
| Tugas 1 progress notes | 1 |

Evidence yang terlihat di database:

| Jenis | Record |
|---|---|
| Meeting | Pertemuan Pertama Capstone Project 17 Kelompok B, 25 Sep 2026, has BA |
| Arsip dokumen | Surat Dinas Permohonan Kesediaan Klinik Shifa Medika Menjadi Mitra Pelaksanaan Capstone Project Mahasiswa Program Studi Sistem Informasi FST-UT |
| Arsip dokumen | Berita Acara - Pertemuan Pertama Capstone Project 17 Kelompok B (25 Sep 2026) |
| Catatan progress | Catatan progress Tugas 1 periode 25-30 Sep 2026 |

Catatan baseline:

- Tidak ada task Tugas 3.
- Tugas 2 sudah berisi 21 task dan tidak boleh diubah dalam Phase 3B.
- Arsip clinic response letter belum terlihat.
- Arsip BA Pertemuan Kedua belum terlihat.
- Submission evidence 11 Oct 2026 08.58 WIB disebut di owner clarification, tetapi belum terlihat sebagai arsip dokumen di database.

## 2. Corrected Attribution Rules

Phase 3B mengoreksi attribution:

| Member | Attribution final |
|---|---|
| Febby | PIC utama proposal, struktur, Pendahuluan, Ruang Lingkup, integrasi Tinjauan Pustaka, lampiran, requirements, Use Case revisions, finalisasi, submission |
| Cintia | Reviewer proposal, struktur, format, kelengkapan, konsistensi, koreksi jika terdokumentasi |
| Rival | Clinical information source, dokumen analisis, requirement klinik, contoh data, izin/koordinasi klinik |
| Farah | Referensi ilmiah dan academic supporting material |
| Anggi | Historical assignments perlu evidence; signed document adalah kontribusi administratif, bukan authorship proposal |

## 3. Task-Level Dry-Run Change Matrix

### A. Proposal Completion & Final Submission

| Task ID | PIC | Existing status | Proposed status | Evidence | Proposed action | Reason |
|---|---|---|---|---|---|---|
| `t1-2026-12` Penyusunan Draft Proposal Tugas 1 | Febby | Sedang Dikerjakan | Selesai | Owner clarification: all substantive work for final Tugas 1 submission completed; proposal submitted | Update | Task scope is proposal draft/integration. Final proposal submission implies this deliverable was completed. Preserve Febby as PIC. |
| `t1-2026-13` Penyusunan Latar Belakang dan Tujuan | Febby | Sedang Dikerjakan | Selesai | Owner clarification and final submitted proposal | Update | Pendahuluan was part of required final proposal and completed by Febby. |
| `t1-2026-14` Penyusunan Ruang Lingkup | Febby | Sedang Dikerjakan | Selesai | Owner clarification and final submitted proposal | Update | Preserve Febby as final section PIC. Do not reassign to Anggi based on earlier historical assignment. |
| `t1-2026-15` Penyusunan Jadwal Kegiatan dan Gantt Chart | Febby | Selesai | Selesai | Existing completed task | Preserve | Already aligned. |
| `t1-2026-18` Penyusunan Tinjauan Pustaka | Febby | Sedang Dikerjakan | Selesai | Owner clarification; Farah supplied references, Febby integrated final prose | Update | Preserve Febby as author/PIC; Farah's contribution remains supporting reference work. |
| `t1-2026-21` Final Review Proposal Seluruh Tim | Febby | Ditunda | Needs Review or partial update | Owner says final work completed, but Anggi review must not be fabricated | Needs Review | Recommended: mark Rival/Farah/Cintia/final consolidation checklist as complete if accepted; keep Anggi review unchecked or note as unverified. Avoid falsely marking every member review complete. |
| `t1-2026-22` Finalisasi dan Submission Proposal Tugas 1 | Febby | Ditunda | Selesai | Owner clarification: proposal submitted 11 Oct 2026 approximately 08.58 WIB | Update | Highest-priority closure task. Could mark checklist complete if submission evidence is accepted. |
| `t1-2026-23` Finalisasi Surat Pernyataan | Febby | Ditunda | Needs Review | No direct evidence in DB | Preserve / Needs Review | Do not mark complete unless signed/final surat pernyataan evidence is available. |

### B. Clinical Information, Permission, and Analysis

| Task ID | PIC | Existing status | Proposed status | Evidence | Proposed action | Reason |
|---|---|---|---|---|---|---|
| `t1-2026-02` Penggalian Kondisi Existing Klinik | Rival | Sedang Dikerjakan | Selesai or partial update | Owner clarification: Rival supplied clinical information and analysis | Needs Review | Some checklist already done; specific unchecked items include obat keluar, kartu stok, stock opname, correction, reporting, FIFO/FEFO. Only mark complete if owner confirms all were covered sufficiently for proposal. |
| `t1-2026-08` Perizinan Studi Kasus Klinik | Rival | Sedang Dikerjakan | Selesai or partial update | Prodi letter archived; owner says clinical coordination/permissions completed; clinic response archive not visible | Needs Review | Checklist includes clinic response/Head Pharmacist/data confirmation. Complete only supported items unless clinic response evidence is added. |
| `t1-2026-09` Validasi Requirement dengan Kepala Apoteker | Rival | Sedang Dikerjakan | Needs Review | Owner says requirements were clarified; no specific Head Pharmacist evidence visible in DB | Preserve / Needs Review | Do not blindly complete all checklist. Need confirmation whether Head Pharmacist validation and each listed clarification happened. |
| `t1-2026-10` Pengumpulan Sampel Data Existing Klinik | Rival | Sedang Dikerjakan | Needs Review | Owner says available examples/supporting clinical information were provided; exact datasets not visible | Preserve / Needs Review | Checklist asks specific items: kartu stok, transaksi, laporan bulanan, contoh alur. Confirm exact received examples first. |
| `t1-2026-11` Finalisasi Dokumen Analisis Existing | Rival | Ditunda | Selesai if Analysis Document revisions are accepted as evidence | Owner says Rival prepared/supplied Analysis Document and latest revisions existed | Needs Review | Could update if Analysis Document/revision history is accepted. Preserve Rival as clinical source; Febby may be final integrator. |

### C. Reference and Academic Support

| Task ID | PIC | Existing status | Proposed status | Evidence | Proposed action | Reason |
|---|---|---|---|---|---|---|
| `t1-2026-16` Pengumpulan Referensi Ilmiah | Farah | Sedang Dikerjakan | Selesai | Owner clarification: Farah searched/collected academic references | Update | This aligns directly with Farah's confirmed responsibility. |
| `t1-2026-17` Verifikasi Referensi Ilmiah | Cintia | Sedang Dikerjakan | Selesai or partial update | Phase 3B: Farah participated in verification/corrections where documented; Cintia reviewed proposal | Needs Review | Existing PIC is Cintia with collaborators Farah + Febby. Can update if reference verification was completed for submitted proposal. |
| `t1-2026-18` Penyusunan Tinjauan Pustaka | Febby | Sedang Dikerjakan | Selesai | See proposal completion section | Update | Do not reassign final prose to Farah. |

### D. Anggi Records

| Task ID | PIC | Existing status | Proposed status | Evidence | Proposed action | Reason |
|---|---|---|---|---|---|---|
| `t1-2026-19` Quality Control Proposal | Anggi | Belum Dimulai | Belum Dimulai / Ditunda with explanatory note | Phase 3B: QC alternative discussed but access not demonstrably supplied | Preserve / Enrich note | Do not mark complete and do not frame as failure. Suggested note: "Historical proposed QC assignment; completion not verified; working access not clearly documented." |
| `t1-2026-20` Finalisasi Lampiran Tugas 1 | Anggi | Belum Dimulai | Needs Review; possible PIC correction to Febby if approved | Phase 3B: final appendix preparation handled by Febby | Needs Review | Do not silently reassign. Could preserve as historical assignment, or create/update separate Febby appendix closure task if owner approves. |
| Proposed new record | Anggi administrative signed document return | Not existing | Selesai if evidence exists | Phase 3B: signed document returned 7 Oct 2026 around 16.54 WIB | Create only with evidence | Administrative contribution, not proposal authorship. Needs source evidence before creation. |

### E. Existing Completed Historical Tasks

| Task ID | PIC | Existing status | Proposed status | Evidence | Proposed action | Reason |
|---|---|---|---|---|---|---|
| `t1-2026-01` Pertemuan Awal dan Penentuan Arah Studi Kasus | Febby | Selesai | Selesai | Existing task complete; meeting/BA exists | Preserve | Already aligned. |
| `t1-2026-03` Pertemuan Sinkronisasi Kondisi Existing | Febby | Selesai | Selesai | Existing complete | Preserve | Already aligned. |
| `t1-2026-04` Dokumentasi Pertemuan Kedua | Febby | Selesai | Selesai | Existing complete, but BA archive for second meeting not visible | Preserve / verify archive | Task says complete. Consider adding/attaching BA evidence if available. |
| `t1-2026-05` Konsultasi Judul dengan Tutor | Febby | Selesai | Selesai | Existing complete | Preserve | Already aligned. |
| `t1-2026-06` Klarifikasi Data Pengujian dan Deployment | Febby | Selesai | Selesai | Existing complete | Preserve | Already aligned. |
| `t1-2026-07` Pengurusan Surat Pengantar Studi Kasus | Febby | Selesai | Selesai | Existing complete + archived Prodi letter | Preserve | Already aligned. |
| `t1-2026-24` Sinkronisasi Progress Seluruh Anggota | Febby | Sedang Dikerjakan | Selesai or preserve | Checklist all complete; status still in progress | Update candidate | Since checklist done=4/4, status can be reconciled to Selesai if owner agrees. |

## 4. Candidate Updates Requiring Approval

### Recommended Safe Updates

These have the strongest support from owner clarification and existing final submission context:

| Task ID | Proposed status | Checklist proposal |
|---|---|---|
| `t1-2026-12` | Selesai | Mark all checklist complete |
| `t1-2026-13` | Selesai | Mark all checklist complete |
| `t1-2026-14` | Selesai | Mark all checklist complete |
| `t1-2026-18` | Selesai | Mark all checklist complete |
| `t1-2026-22` | Selesai | Mark all checklist complete if submission evidence is accepted |
| `t1-2026-24` | Selesai | Checklist already complete; only status update needed |

### Updates That Need Evidence Review

| Task ID | Proposed handling |
|---|---|
| `t1-2026-02` | Partial or complete update only after confirming exact clinical coverage |
| `t1-2026-08` | Complete only if clinic response/permission items are verified |
| `t1-2026-09` | Needs specific validation evidence |
| `t1-2026-10` | Needs confirmation of exact examples/data received |
| `t1-2026-11` | Complete if Analysis Document final/revision evidence is accepted |
| `t1-2026-17` | Complete if final reference verification is accepted |
| `t1-2026-21` | Partial checklist update; avoid fabricating Anggi review |
| `t1-2026-23` | Needs signed/final surat pernyataan evidence |
| `t1-2026-20` | Needs ownership decision; Phase 3B says final appendix preparation was handled by Febby |

### Records to Preserve Without Completion

| Task ID | Reason |
|---|---|
| `t1-2026-19` | Anggi QC was a proposed alternative; completion not verified and access not demonstrably supplied |
| `t1-2026-20` | Anggi finalisasi lampiran not verified; final appendix attribution points to Febby |

## 5. Candidate New Records

No new record should be created automatically.

Candidate new record only if owner approves and evidence exists:

| Proposed ID | Title | PIC | Status | Required evidence |
|---|---|---|---|---|
| `t1-hist-usecase` | Dokumentasi Rancangan Awal dan Use Case | Febby | Selesai | Use Case revision or final diagram evidence |
| `t1-hist-anggi-signature` | Pengembalian Dokumen Bertanda Tangan | Anggi | Selesai | Chat/file evidence showing returned signed document 7 Oct 2026 16.54 WIB |

Prefer enriching existing tasks over adding many historical tasks.

## 6. Second-Pass Review

Potential risks and safeguards:

- Risk: marking all tasks complete just because proposal submitted.
  - Safeguard: only recommend strong completion for proposal deliverables and final submission.
- Risk: misattributing proposal authorship to Cintia/Farah.
  - Safeguard: preserve Febby as proposal author/PIC; Cintia reviewer; Farah references.
- Risk: completing Anggi tasks without evidence.
  - Safeguard: preserve `t1-2026-19` and `t1-2026-20` unless specific evidence appears.
- Risk: completing clinic data tasks without exact evidence.
  - Safeguard: keep `t1-2026-09` and `t1-2026-10` in Needs Review.
- Risk: fake historical timestamps/audit entries.
  - Safeguard: do not edit `created_at`; if updates are approved, record current administrative reconciliation honestly.
- Risk: affecting Tugas 2/Tugas 3.
  - Safeguard: Phase 3B plan touches only `phase='tugas1'`.

## 7. Proposed Approval Options

### Option A - Conservative Closure

Apply only the strongest, low-risk updates:

- `t1-2026-12` -> Selesai, checklist complete.
- `t1-2026-13` -> Selesai, checklist complete.
- `t1-2026-14` -> Selesai, checklist complete.
- `t1-2026-18` -> Selesai, checklist complete.
- `t1-2026-22` -> Selesai, checklist complete.
- `t1-2026-24` -> Selesai, status only.
- Preserve `t1-2026-19` and `t1-2026-20`.
- No new records.

### Option B - Conservative Closure + Evidence Notes

Option A plus description notes on:

- `t1-2026-19`: QC was proposed/historical planning; completion not verified.
- `t1-2026-20`: final appendix ownership needs review; final preparation attributed to Febby by owner clarification.
- `t1-2026-21`: final review completed sufficiently for submission, but Anggi review not verified.

### Option C - Full Reconciliation After More Evidence

Wait for:

- Submission screenshot or record.
- Clinic response letter.
- Analysis Document final/revision evidence.
- Reference spreadsheet/list.
- Signed document return evidence.
- Use Case diagram/revision evidence.

Then update clinic/reference/Use Case/Anggi administrative records with stronger support.

## 8. Verification Plan If Approved Later

After any approved write:

1. Query `tasks WHERE phase='tugas1'`.
2. Verify only approved task IDs changed.
3. Verify `tugas2` remains 21.
4. Verify `tugas3` remains 0.
5. Verify no duplicate new historical records.
6. Verify no fake historical `created_at` changes.
7. Verify checklist completion matches approved changes.
8. Confirm dashboard/kanban loads after update.

## 9. Current Implementation Result

No database implementation has been executed from this Phase 3B plan.

This document is the approval-gate dry-run matrix.

