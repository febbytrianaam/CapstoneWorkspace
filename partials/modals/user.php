<!-- Modal Dialog Pengguna (Tambah / Edit Pengguna) -->
<div id="userModalBackdrop" class="modal-backdrop">
  <div class="modal-dialog" style="max-width: 480px;">
    <div class="modal-header">
      <h3 id="userModalTitle">Tambah Pengguna Baru</h3>
      <button id="userModalCloseBtn" class="modal-close-btn">&times;</button>
    </div>
    <form id="userForm">
      <input type="hidden" id="userIdInput" />
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Nama Tampilan</label>
          <input type="text" id="userNameInput" class="form-input" required placeholder="Contoh: Febby" />
        </div>

        <div class="form-group">
          <label class="form-label">Nama Lengkap</label>
          <input type="text" id="userFullNameInput" class="form-input" required placeholder="Contoh: Febby Triana Amalia" />
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Username Login</label>
            <input type="text" id="userUsernameInput" class="form-input" required autocomplete="username" placeholder="Contoh: febby" />
          </div>

          <div class="form-group">
            <label class="form-label">NIM</label>
            <input type="text" id="userNimInput" class="form-input" placeholder="Contoh: 050000000" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Password Sementara</label>
          <input type="password" id="userPasswordInput" class="form-input" minlength="8" autocomplete="new-password" placeholder="Minimal 8 karakter" />
          <small class="form-help">Wajib untuk pengguna baru. Kosongkan saat edit jika tidak ingin reset password.</small>
        </div>

        <div class="form-group">
          <label class="form-label">Peran Hak Akses (Role)</label>
          <select id="userRoleFormSelect" class="form-select">
            <option value="member">Member</option>
            <option value="koordinator">Koordinator</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Warna Identitas Avatar</label>
          <select id="userColorSelect" class="form-select">
            <option value="#1E40AF">Biru Royal (#1E40AF)</option>
            <option value="#7C3AED">Ungu (#7C3AED)</option>
            <option value="#059669">Hijau Emerald (#059669)</option>
            <option value="#DB2777">Merah Muda (#DB2777)</option>
            <option value="#EA580C">Jingga (#EA580C)</option>
            <option value="#0284C7">Biru Cerah (#0284C7)</option>
          </select>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" id="deleteUserBtn" class="btn btn-danger" style="display:none;">Hapus Pengguna</button>
        <div style="margin-left: auto; display: flex; gap: 0.75rem;">
          <button type="button" id="userModalCancelBtn" class="btn btn-secondary">Batal</button>
          <button type="submit" class="btn btn-primary">Simpan Pengguna</button>
        </div>
      </div>
    </form>
  </div>
</div>
