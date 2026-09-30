<!-- Halaman Arsip Dokumen -->
<section id="documents" class="page-view">
  <div class="dash-banner document-archive-banner">
    <div class="banner-content">
      <div>
        <div class="banner-badge">ARSIP TIM</div>
        <h2 class="banner-title">Arsip Dokumen Capstone</h2>
        <p class="banner-subtitle">Tempat menyimpan dokumen final, bukti kegiatan, surat resmi, diagram, dan lampiran yang perlu mudah ditemukan kembali oleh tim.</p>
      </div>
    </div>
  </div>

  <section id="documentArchiveSection" class="card-box document-archive-box">
    <div class="card-box-header document-archive-header">
      <div>
        <h2>🗂️ Dokumen Tersimpan</h2>
        <div class="card-box-subtitle">Dokumen yang sudah diunggah dapat dilihat dan diunduh oleh anggota tim sesuai kebutuhan.</div>
      </div>
      <span id="documentArchiveCount" class="column-count">0 dokumen</span>
    </div>

    <form id="documentArchiveForm" class="document-archive-upload-form" enctype="multipart/form-data">
      <div class="form-group">
        <label class="form-label" for="documentArchiveTitle">Judul Dokumen</label>
        <input id="documentArchiveTitle" class="form-input" type="text" placeholder="Contoh: Surat Pernyataan Kerja Sama Klinik" maxlength="180" required />
      </div>

      <div class="form-group">
        <label class="form-label" for="documentArchiveCategory">Jenis Dokumen</label>
        <select id="documentArchiveCategory" class="form-input" required>
          <option value="berita_acara">Berita Acara</option>
          <option value="surat_izin">Surat Izin</option>
          <option value="surat_pernyataan">Surat Pernyataan</option>
          <option value="proposal_laporan">Proposal / Laporan</option>
          <option value="diagram_alur">Diagram / Alur / Gambar</option>
          <option value="lampiran">Lampiran</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="documentArchiveFile">File Dokumen</label>
        <input id="documentArchiveFile" class="form-input" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg" required />
        <small class="form-help">PDF, Word, PowerPoint, Excel, PNG, atau JPG. Maksimal 10 MB.</small>
      </div>

      <div class="form-group document-archive-note-field">
        <label class="form-label" for="documentArchiveDescription">Catatan Singkat</label>
        <textarea id="documentArchiveDescription" class="form-input" rows="2" placeholder="Contoh: Sudah ditandatangani owner klinik dan siap dilampirkan." maxlength="500"></textarea>
      </div>

      <button id="documentArchiveUploadBtn" class="btn btn-primary" type="submit">📤 Simpan Dokumen</button>
    </form>

    <div class="document-archive-toolbar">
      <div class="search-filter-group">
        <select id="documentArchiveCategoryFilter" class="select-filter">
          <option value="SEMUA">Semua Jenis</option>
          <option value="berita_acara">Berita Acara</option>
          <option value="surat_izin">Surat Izin</option>
          <option value="surat_pernyataan">Surat Pernyataan</option>
          <option value="proposal_laporan">Proposal / Laporan</option>
          <option value="diagram_alur">Diagram / Alur / Gambar</option>
          <option value="lampiran">Lampiran</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </div>
    </div>

    <div id="documentArchiveList" class="document-archive-list"></div>
  </section>
</section>
