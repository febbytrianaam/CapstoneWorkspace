<!-- Halaman Rekam Jejak Audit (Audit Trail Log) -->
      <section id="audit" class="page-view">
        <div class="phase-banner">
          <div>
            <h2>Rekam Jejak Audit System (Audit Trail)</h2>
            <div class="phase-banner-desc">Catatan riwayat seluruh riwayat aktivitas, pembuatan tugas, perubahan status, centang checklist, dan manipulasi pengguna secara kronologis.</div>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button id="viewSnapshotBtn" class="btn btn-primary">📸 Snapshot JSON Prototipe</button>
            <button id="exportCsvBtn" class="btn btn-secondary" title="Unduh Log sebagai File CSV / Excel">📥 Export CSV</button>
            <button id="exportJsonBtn" class="btn btn-secondary" title="Unduh Log sebagai File JSON">📄 Export JSON</button>
            <button id="printAuditBtn" class="btn btn-secondary" title="Cetak atau Simpan ke PDF">🖨️ Cetak / PDF</button>
            <button id="resetAuditBtn" class="btn btn-secondary">Isi Ulang Data Dummy</button>
            <button id="clearAuditBtn" class="btn btn-danger">Bersihkan Log Audit</button>
          </div>
        </div>

        <!-- Mini KPI Cards Grid untuk Audit -->
        <div id="auditKpiGrid" class="stats-grid" style="margin-bottom: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));"></div>

        <div class="toolbar" style="gap: 0.75rem; flex-wrap: wrap;">
          <div class="search-filter-group" style="flex: 1; flex-wrap: wrap; gap: 0.5rem;">
            <input type="text" id="auditSearchInput" class="input-search" placeholder="🔍 Cari aktivitas atau tugas..." style="min-width: 200px;" />
            <select id="auditUserSelect" class="select-filter"></select>
            <select id="auditActionSelect" class="select-filter">
              <option value="SEMUA">Semua Kategori Aksi</option>
              <option value="Tambah Tugas">Tambah Tugas</option>
              <option value="Ubah Status">Ubah Status</option>
              <option value="Ubah Tugas">Ubah Tugas</option>
              <option value="Hapus Tugas">Hapus Tugas</option>
              <option value="Tambah Pertemuan">Tambah Pertemuan</option>
              <option value="Hapus Pertemuan">Hapus Pertemuan</option>
              <option value="Centang Checklist">Centang Checklist</option>
              <option value="Tambah Pengguna">Tambah Pengguna</option>
              <option value="Ubah Pengguna">Ubah Pengguna</option>
              <option value="Hapus Pengguna">Hapus Pengguna</option>
            </select>
            <select id="auditDateRangeSelect" class="select-filter">
              <option value="SEMUA">Semua Rentang Waktu</option>
              <option value="HARI_INI">Hari Ini</option>
              <option value="7_HARI">7 Hari Terakhir</option>
              <option value="BULAN_INI">Bulan Ini</option>
              <option value="CUSTOM">Rentang Tanggal Custom...</option>
            </select>
            <div id="auditCustomDateBox" style="display: none; align-items: center; gap: 0.35rem; background: var(--bg-card); padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-medium);">
              <span style="font-size: 0.75rem; color: var(--text-muted);">Mulai:</span>
              <input type="date" id="auditStartDate" class="select-filter" style="padding: 0.2rem 0.4rem; font-size: 0.75rem;" />
              <span style="font-size: 0.75rem; color: var(--text-muted);">s/d</span>
              <input type="date" id="auditEndDate" class="select-filter" style="padding: 0.2rem 0.4rem; font-size: 0.75rem;" />
            </div>
          </div>
        </div>

        <div class="card-box">
          <div class="card-box-header">
            <div>
              <h2>Log Riwayat Aktivitas System</h2>
              <div class="card-box-subtitle">Diurutkan berdasarkan waktu aktivitas terbaru</div>
            </div>
            <span id="auditCountBadge" class="column-count">0 aktivitas</span>
          </div>
          <div id="auditTableContainer"></div>
          <div id="auditPrintContainer" class="print-only"></div>
        </div>
      </section>
