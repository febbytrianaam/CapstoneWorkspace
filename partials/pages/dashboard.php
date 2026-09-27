<section id="dashboard" class="page-view active">
        <!-- Banner Ucapan -->
        <div id="dashBanner" class="dash-banner">
          <div class="banner-content">
            <div>
              <div id="bannerRoleBadge" class="banner-badge">UNIVERSITAS TERBUKA · STSI4440</div>
              <h2 id="bannerGreeting" class="banner-title">Ruang Kerja Tim Capstone</h2>
              <p id="bannerSubtext" class="banner-subtitle">Platform koordinasi pengerjaan Tugas 1 hingga Tugas 3. Pantau status beban kerja tim, prioritas tugas, dan kemajuan tahapan secara langsung.</p>
            </div>
          </div>
        </div>

        <!-- Seksi Tugas Personal (Muncul untuk Anggota) -->
        <div id="personalTaskSection" style="display: none; margin-bottom: 2rem;">
          <div class="card-box" style="border-left: 4px solid var(--ut-blue-primary);">
            <div class="card-box-header">
              <div>
                <h2 id="personalSectionTitle">Tugasku (Tugas Diberikan)</h2>
                <div class="card-box-subtitle">Tugas yang ditugaskan secara khusus untuk kamu</div>
              </div>
              <span id="personalTaskBadgeCount" class="column-count">0 tugas</span>
            </div>
            <div id="personalTaskList" class="dash-personal-grid"></div>
          </div>
        </div>

        <!-- Kartu Statistik Metrik -->
        <div id="statsGrid" class="stats-grid"></div>

        <!-- Seksi Visualisasi Grafik Analisis Proyek (Charts) -->
        <div id="dashboardChartsSection" class="dash-columns" style="margin-bottom: 2rem;">
          <div id="statusChartSection" class="card-box">
            <div class="card-box-header">
              <div>
                <h2>📊 Distribusi Status Tugas Tim</h2>
                <div class="card-box-subtitle">Proporsi status pengerjaan seluruh tugas Capstone</div>
              </div>
            </div>
            <div id="statusChartContainer" style="min-height: 250px; display: flex; align-items: center; justify-content: center; padding: 1rem 0.5rem;">
              <canvas id="statusDoughnutChart" style="max-height: 240px;"></canvas>
            </div>
          </div>

          <div id="phaseChartSection" class="card-box">
            <div class="card-box-header">
              <div>
                <h2>📈 Grafik Progres per Tahap</h2>
                <div class="card-box-subtitle">Perbandingan visual persentase penyelesaian Tugas 1, 2, dan 3</div>
              </div>
            </div>
            <div id="phaseChartContainer" style="min-height: 250px; display: flex; align-items: center; justify-content: center; padding: 1rem 0.5rem;">
              <canvas id="phaseBarChart" style="max-height: 240px;"></canvas>
            </div>
          </div>
        </div>

        <!-- Dua Kolom Dasbor -->
        <div class="dash-columns">
          <div id="phaseProgressSection" class="card-box">
            <div class="card-box-header">
              <div>
                <h2>Progress Tahapan Capstone (Rincian Proyek)</h2>
                <div class="card-box-subtitle">Rincian angka tugas selesai per tahap, klik untuk membuka kanban</div>
              </div>
            </div>
            <div id="phaseProgressList"></div>
          </div>

          <div id="attentionSection" class="card-box">
            <div class="card-box-header">
              <div>
                <h2>Perlu Perhatian</h2>
                <div class="card-box-subtitle">Tugas Prioritas Tinggi yang belum selesai</div>
              </div>
            </div>
            <div id="attentionList"></div>
          </div>
        </div>

        <!-- Seksi Jadwal Pertemuan & Bimbingan Tim (Monitoring) -->
        <div id="meetingsSection" class="card-box">
          <div class="card-box-header">
            <div>
              <h2>Jadwal Pertemuan & Bimbingan Tim</h2>
              <div class="card-box-subtitle">Monitoring agenda rapat tim, bimbingan tutor, dan tautan (URL) pertemuan online</div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span id="meetingCountBadge" class="column-count">0 pertemuan</span>
              <button id="dashAddMeetingBtn" class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.35rem;">
                ➕ Tambah Pertemuan
              </button>
            </div>
          </div>
          <div id="dashboardMeetingsGrid" class="meetings-grid"></div>
        </div>

        <!-- Beban Kerja Tim -->
        <div id="workloadSection" class="card-box">
          <div class="card-box-header">
            <div>
              <h2>Pembagian Beban Kerja Tim</h2>
              <div class="card-box-subtitle">Jumlah tugas aktif dan rasio penyelesaian setiap anggota</div>
            </div>
          </div>
          <div id="teamWorkloadGrid" class="workload-grid"></div>
        </div>
      </section>
