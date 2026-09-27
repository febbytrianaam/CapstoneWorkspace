<!-- Modal Ganti Password Akun -->
<div id="changePasswordModalBackdrop" class="modal-backdrop">
  <div class="modal-dialog" style="max-width: 460px;">
    <div class="modal-header">
      <h3>🔑 Ganti Password</h3>
      <button id="changePasswordModalCloseBtn" class="modal-close-btn" type="button" aria-label="Tutup">&times;</button>
    </div>
    <form id="changePasswordForm" autocomplete="on">
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label" for="currentPasswordInput">Password Saat Ini</label>
          <input id="currentPasswordInput" name="current-password" class="form-input" type="password" autocomplete="current-password" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="newPasswordInput">Password Baru</label>
          <input id="newPasswordInput" name="new-password" class="form-input" type="password" minlength="3" autocomplete="new-password" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="confirmPasswordInput">Konfirmasi Password Baru</label>
          <input id="confirmPasswordInput" name="confirm-password" class="form-input" type="password" minlength="3" autocomplete="new-password" required />
        </div>
        <div id="changePasswordError" class="auth-error" role="alert" aria-live="polite"></div>
      </div>
      <div class="modal-footer">
        <button id="changePasswordCancelBtn" type="button" class="btn btn-secondary">Batal</button>
        <button id="changePasswordSubmitBtn" type="submit" class="btn btn-primary">Simpan Password</button>
      </div>
    </form>
  </div>
</div>
