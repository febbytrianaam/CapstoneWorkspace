<!-- Halaman Alur Kerja -->
      <section id="flow" class="page-view">
        <div class="dash-banner" style="background: #1E293B;">
          <div class="banner-content">
            <div>
              <div class="banner-badge" style="background: rgba(59, 130, 246, 0.2); color: #93C5FD; border-color: rgba(59, 130, 246, 0.4);">ALUR PROYEK</div>
              <h2 class="banner-title">Alur Pengerjaan: Tugas 1 → Tugas 2 → Tugas 3</h2>
              <p class="banner-subtitle">Standar alur koordinasi tim dari pendefinisian kebutuhan awal hingga penyerahan laporan dan sistem akhir.</p>
            </div>
          </div>
        </div>

        <div class="flow-grid">
          <div class="flow-step-card" style="border-top-color: var(--ut-blue-primary);">
            <div class="flow-step-number">TAHAP 01</div>
            <h3 class="flow-step-title">Tugas 1 — Proposal</h3>
            <ol class="flow-list">
              <li>Validasi kondisi aktual dan kebutuhan studi kasus.</li>
              <li>Susun latar belakang, tujuan, ruang lingkup, jadwal, dan tinjauan pustaka.</li>
              <li>Tinjau ulang konsistensi proposal.</li>
              <li>Pastikan arahan tutor dan izin mitra terdokumentasi.</li>
            </ol>
            <div class="flow-gate-box">
              <strong>Kriteria Kelayakan:</strong> Proposal disetujui & poin kritis terkonfirmasi.
            </div>
          </div>

          <div class="flow-step-card" style="border-top-color: var(--status-inprogress);">
            <div class="flow-step-number" style="color: var(--status-inprogress);">TAHAP 02</div>
            <h3 class="flow-step-title">Tugas 2 — Kemajuan</h3>
            <ol class="flow-list">
              <li>Turunkan kebutuhan menjadi desain dan rancangan sistem.</li>
              <li>Kerjakan artefak analisis/desain yang dibutuhkan (Use Case, ERD, UI).</li>
              <li>Bangun progres implementasi yang dapat didemonstrasikan.</li>
              <li>Catat hasil review dan penyesuaian.</li>
            </ol>
            <div class="flow-gate-box">
              <strong>Kriteria Kelayakan:</strong> Progres implementasi & laporan kemajuan siap.
            </div>
          </div>

          <div class="flow-step-card" style="border-top-color: var(--ut-gold-primary);">
            <div class="flow-step-number" style="color: var(--ut-gold-primary);">TAHAP 03</div>
            <h3 class="flow-step-title">Tugas 3 — Final</h3>
            <ol class="flow-list">
              <li>Finalisasi sistem dan pengujian kelayakan.</li>
              <li>Finalisasi laporan akhir, bukti uji, dan lampiran.</li>
              <li>Siapkan presentasi dan pembagian penyampaian anggota.</li>
              <li>Arsipkan seluruh tugas sebagai riwayat rekam jejak.</li>
            </ol>
            <div class="flow-gate-box">
              <strong>Kriteria Kelayakan:</strong> Aplikasi, laporan, dan presentasi 100% final.
            </div>
          </div>
        </div>

        <section id="flowDocumentsSection" class="card-box flow-documents-box">
          <div class="card-box-header">
            <div>
              <h2>📚 Panduan & Dokumen Proyek</h2>
              <div class="card-box-subtitle">Dokumen acuan yang dapat dibaca dan diunduh oleh seluruh anggota tim.</div>
            </div>
            <span id="flowDocumentCount" class="column-count">0 dokumen</span>
          </div>

          <form id="flowDocumentForm" class="flow-document-upload-form" enctype="multipart/form-data">
            <div class="form-group">
              <label class="form-label" for="flowDocumentTitle">Judul Dokumen</label>
              <input id="flowDocumentTitle" class="form-input" type="text" placeholder="Contoh: Panduan Tugas 1 UT" maxlength="180" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="flowDocumentFile">File Panduan</label>
              <input id="flowDocumentFile" class="form-input" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" required />
              <small class="form-help">PDF, Word, PowerPoint, atau Excel. Maksimal 5 MB.</small>
            </div>
            <button id="flowDocumentUploadBtn" class="btn btn-primary" type="submit">📤 Upload Panduan</button>
          </form>

          <div id="flowDocumentList" class="flow-document-list"></div>
        </section>
      </section>

      <!-- Catatan Kaki -->
      <footer class="app-footer">
        Proyek Capstone UT · Sistem Informasi · STSI4440
      </footer>
