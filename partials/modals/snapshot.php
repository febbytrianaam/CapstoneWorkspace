<!-- Modal Dialog Cadangan Data JSON -->
<div id="jsonSnapshotModalBackdrop" class="modal-backdrop">
  <div class="modal-dialog" style="max-width: 680px;">
    <div class="modal-header">
      <h3>📸 Cadangan Data JSON Capstone</h3>
      <button id="jsonSnapshotCloseBtn" class="modal-close-btn">&times;</button>
    </div>
    <div class="modal-body">
      <div class="card-box-subtitle" style="margin-bottom: 0.75rem;">
        Berikut adalah salinan struktur data aplikasi saat ini, termasuk tugas, pengguna, pemberitahuan, dan riwayat aktivitas:
      </div>
      <div style="position: relative;">
        <textarea id="jsonSnapshotTextarea" class="form-textarea" rows="12" readonly style="font-family: monospace; font-size: 0.775rem; background: var(--bg-hover); color: var(--text-main); line-height: 1.4;"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" id="copyJsonBtn" class="btn btn-secondary">📋 Salin Teks JSON</button>
      <button type="button" id="downloadJsonBtn" class="btn btn-primary">📥 Download File JSON</button>
      <button type="button" id="jsonSnapshotCancelBtn" class="btn btn-secondary" style="margin-left: auto;">Tutup</button>
    </div>
  </div>
</div>
