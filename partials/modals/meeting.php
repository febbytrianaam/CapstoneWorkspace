<!-- Modal Dialog Pertemuan / Bimbingan Baru -->
<div id="meetingModalBackdrop" class="modal-backdrop">
  <div class="modal-dialog" style="max-width: 540px;">
    <div class="modal-header">
      <h3 id="meetingModalTitle">Buat Agenda Pertemuan / Bimbingan</h3>
      <button id="meetingModalCloseBtn" class="modal-close-btn">&times;</button>
    </div>
    <form id="meetingForm">
      <input type="hidden" id="meetingIdInput" />
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
