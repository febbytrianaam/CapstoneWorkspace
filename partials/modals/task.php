<!-- Modal Dialog Tugas (Tambah / Edit Tugas) -->
<div id="taskModalBackdrop" class="modal-backdrop">
  <div class="modal-dialog">
    <div class="modal-header">
      <h3 id="modalTitle">Tambah Tugas Baru</h3>
      <button id="modalCloseBtn" class="modal-close-btn">&times;</button>
    </div>
    <form id="taskForm">
      <input type="hidden" id="taskIdInput" />
      <div class="modal-body">
        <div id="taskReadonlyNotice" class="task-readonly-notice" hidden>
          <strong>Mode lihat saja</strong>
          <span>Status dan checklist hanya bisa diubah oleh PIC tugas ini.</span>
        </div>

        <div id="taskTimestampMeta" class="task-timestamp-meta" hidden></div>

        <div class="form-group">
          <label class="form-label">Judul Tugas</label>
          <input type="text" id="taskTitleInput" class="form-input" required placeholder="Contoh: Lengkapi analisis proses persediaan obat" />
        </div>

        <div class="form-group">
          <label class="form-label">Deskripsi & Catatan Target</label>
          <textarea id="taskDescInput" class="form-textarea" rows="3" placeholder="Jelaskan detail yang harus dikerjakan dan target luaran..."></textarea>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Tahap Capstone</label>
            <select id="taskPhaseSelect" class="form-select">
              <option value="tugas1">Tugas 1 - Proposal</option>
              <option value="tugas2">Tugas 2 - Kemajuan</option>
              <option value="tugas3">Tugas 3 - Final</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Penanggung Jawab (PIC)</label>
            <select id="taskPicSelect" class="form-select"></select>
          </div>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="taskStatusSelect" class="form-select">
              <option value="Belum Dimulai">Belum Dimulai</option>
              <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
              <option value="Ditunda">Ditunda</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Prioritas</label>
            <select id="taskPrioritySelect" class="form-select">
              <option value="Tinggi">Tinggi (High)</option>
              <option value="Sedang">Sedang (Medium)</option>
              <option value="Rendah">Rendah (Low)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <label class="form-label" style="margin-bottom: 0;">Daftar Sub-tugas (Checklist)</label>
            <button type="button" id="addChecklistItemBtn" class="btn btn-secondary" style="padding: 0.25rem 0.65rem; font-size: 0.775rem;">
              + Tambah Sub-tugas
            </button>
          </div>
          <div id="checklistInteractiveContainer"></div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" id="deleteTaskBtn" class="btn btn-danger" style="display:none;">Hapus Tugas</button>
        <button type="button" id="archiveTaskBtn" class="btn btn-secondary" style="display:none;">Arsipkan Tugas</button>
        <div style="margin-left: auto; display: flex; gap: 0.75rem;">
          <button type="button" id="modalCancelBtn" class="btn btn-secondary">Batal</button>
          <button type="submit" class="btn btn-primary">Simpan Tugas</button>
        </div>
      </div>
    </form>
  </div>
</div>
