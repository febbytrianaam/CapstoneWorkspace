<section id="authScreen" class="auth-screen" aria-label="Login aplikasi">
  <div class="auth-panel">
    <div class="auth-logo">
      <img src="https://image.pngaaa.com/327/4257327-middle.png" alt="Logo Universitas Terbuka" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
      <span style="display:none;">UT</span>
    </div>
    <div class="auth-eyebrow">PROYEK CAPSTONE</div>
    <h1>Masuk ke Ruang Kerja Tim</h1>
    <p class="auth-subtitle">Gunakan username dan password akun Anda untuk melanjutkan.</p>

    <form id="loginForm" class="auth-form" autocomplete="off">
      <div class="form-group">
        <label class="form-label" for="loginUsername">Username</label>
        <input id="loginUsername" class="form-input" type="text" autocomplete="off" required placeholder="Masukkan username" />
      </div>
      <div class="form-group">
        <label class="form-label" for="loginPassword">Password</label>
        <input id="loginPassword" class="form-input" type="password" autocomplete="off" required placeholder="Masukkan password" />
      </div>
      <div id="loginError" class="auth-error" role="alert"></div>
      <button id="loginSubmitBtn" class="btn btn-primary auth-submit" type="submit">Masuk</button>
    </form>
  </div>
</section>
