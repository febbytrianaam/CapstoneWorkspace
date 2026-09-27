<!-- Modal Dialog Berita Acara Kerja Kelompok -->
<div id="beritaAcaraModalBackdrop" class="modal-backdrop">
  <div class="modal-dialog" style="max-width: 820px;">
    <div class="modal-header">
      <h3>📄 Form Berita Acara Kerja Kelompok Capstone</h3>
      <button id="baModalCloseBtn" class="modal-close-btn">&times;</button>
    </div>
    <div class="modal-body" style="max-height: 78vh; overflow-y: auto;">
      <form id="beritaAcaraForm">
        <input type="hidden" id="baMeetingIdInput" />
        <input type="hidden" id="baTaskIdInput" />

        <div class="form-group">
          <label class="form-label">Judul Proyek / Topik Berita Acara</label>
          <input type="text" id="baJudulInput" class="form-input" value="Pengembangan Sistem Informasi Manajemen Persediaan Obat pada Klinik Shifa Medika" required />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Hari dan Tanggal</label>
            <input type="text" id="baHariTanggalInput" class="form-input" placeholder="Jumat, 25 September 2026" required />
          </div>
          <div class="form-group">
            <label class="form-label">Waktu Pengerjaan</label>
            <input type="text" id="baWaktuInput" class="form-input" placeholder="21.00 WIB – 22.00 WIB" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Lokasi Luring / Daring & Link Platform</label>
          <input type="text" id="baLokasiInput" class="form-input" placeholder="Daring (Microsoft Teams) https://teams.microsoft.com/..." required />
        </div>

        <!-- Kehadiran Anggota Tim -->
        <div class="form-group">
          <label class="form-label">Daftar Kehadiran Anggota Tim (Centang jika Hadir)</label>
          <div id="baAttendanceCheckboxes" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.6rem; background: var(--bg-hover); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-medium);"></div>
        </div>

        <!-- Tabel Aktivitas, Luaran & Catatan/Kendala -->
        <div class="form-group">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <label class="form-label" style="margin-bottom: 0;">Daftar Aktivitas & Hasil Pembahasan</label>
            <button type="button" id="addBaActivityBtn" class="btn btn-secondary" style="padding: 0.25rem 0.65rem; font-size: 0.775rem;">
              ➕ Tambah Baris Aktivitas
            </button>
          </div>
          <div id="baActivitiesContainer"></div>
        </div>

        <!-- Upload Screenshot Dokumentasi -->
        <div class="form-group">
          <label class="form-label">Dokumentasi Foto / Screenshot Pertemuan</label>
          <input type="file" id="baDocImageInput" accept="image/*" multiple class="form-input" style="padding: 0.35rem;" />
          <div class="card-box-subtitle" style="margin-top: 0.25rem;">Anda dapat memilih 1 atau lebih foto/screenshot dari laptop/HP Anda.</div>
          <div id="baDocImagePreviews" style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.75rem;"></div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" id="baModalCancelBtn" class="btn btn-secondary">Batal</button>
      <button type="button" id="baPreviewBtn" class="btn btn-secondary">
        Preview Berita Acara
      </button>
      <button type="button" id="baPrintBtn" class="btn btn-primary" style="background: #1E40AF; border-color: #1E40AF; display: none;">
        Cetak / Simpan PDF
      </button>
    </div>
  </div>
</div>

<!-- Print Container Khusus Berita Acara -->
<div id="beritaAcaraPreviewBackdrop" class="modal-backdrop">
  <div class="modal-dialog" style="max-width: 960px;">
    <div class="modal-header">
      <h3>Preview Berita Acara</h3>
      <button id="baPreviewCloseBtn" class="modal-close-btn">&times;</button>
    </div>
    <div class="modal-body ba-preview-body">
      <div id="beritaAcaraPreviewContainer"></div>
    </div>
    <div class="modal-footer">
      <button type="button" id="baPreviewBackBtn" class="btn btn-secondary">Kembali Edit</button>
      <button type="button" id="baPreviewPrintBtn" class="btn btn-primary">Cetak / Simpan PDF</button>
    </div>
  </div>
</div>

<div id="beritaAcaraPrintContainer" class="print-ba-only"></div>
