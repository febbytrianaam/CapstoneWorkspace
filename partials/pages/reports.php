<section id="reports" class="page-view">
  <div class="report-page-heading">
    <div><h2>Laporan Tugas</h2><p id="taskReportTimestamp">Ringkasan pekerjaan tim per tahap Capstone.</p></div>
    <div class="report-page-actions">
      <button type="button" id="taskReportRefresh" class="btn btn-secondary"><span aria-hidden="true">&#8635;</span> Perbarui</button>
      <button type="button" id="taskReportExcel" class="btn btn-secondary"><span aria-hidden="true">&#8595;</span> Excel</button>
      <button type="button" id="taskReportPreview" class="btn btn-primary"><span aria-hidden="true">&#9636;</span> Preview / PDF</button>
    </div>
  </div>
  <div class="report-filters">
    <label>Tahap<select id="taskReportPhase" class="form-select"><option value="tugas1">Tugas 1 - Proposal</option><option value="tugas2">Tugas 2 - Kemajuan</option><option value="tugas3">Tugas 3 - Final</option></select></label>
    <label>PIC<select id="taskReportPic" class="form-select"><option value="">Semua PIC</option></select></label>
    <label>Status<select id="taskReportStatus" class="form-select"><option value="">Semua status</option><option>Belum Dimulai</option><option>Sedang Dikerjakan</option><option>Ditunda</option><option>Selesai</option></select></label>
    <label>Review<select id="taskReportReview" class="form-select"><option value="">Semua review</option><option value="none">Belum diajukan</option><option value="submitted">Menunggu review</option><option value="revision_requested">Perlu revisi</option><option value="approved">Disetujui</option></select></label>
    <label>Arsip<select id="taskReportArchive" class="form-select"><option value="active">Tanpa arsip</option><option value="all">Termasuk arsip</option><option value="archived">Hanya arsip</option></select></label>
  </div>
  <div id="taskReportFeedback" role="status" aria-live="polite"></div>
  <div id="taskReportBody" class="report-body"></div>
</section>
