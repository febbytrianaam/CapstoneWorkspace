(function () {
  'use strict';
  let snapshot = null, owner = null, busy = false, initialized = false, error = '', epoch = 0, excelLoading = null;
  const R = window.TaskReports;
  const el = id => document.getElementById(id);
  const user = () => window.capstoneStore?.getCurrentUser();
  const allowed = () => user()?.role === 'superadmin';
  const fields = ['taskReportPhase', 'taskReportPic', 'taskReportStatus', 'taskReportReview', 'taskReportArchive'];
  const controls = [...fields, 'taskReportRefresh', 'taskReportExcel', 'taskReportPreview'];
  const filters = () => ({ pic: el('taskReportPic').value, status: el('taskReportStatus').value, review: el('taskReportReview').value, archive: el('taskReportArchive').value });
  function clear() {
    epoch++; snapshot = null; owner = null; busy = false; error = '';
    if (el('taskReportBody')) el('taskReportBody').replaceChildren();
    if (el('taskReportFeedback')) el('taskReportFeedback').textContent = '';
    if (el('taskReportPic')) el('taskReportPic').innerHTML = '<option value="">Semua PIC</option>';
  }
  function draw() {
    if (!allowed()) { clear(); return; }
    controls.forEach(id => { el(id).disabled = busy; });
    el('reports').setAttribute('aria-busy', String(busy));
    el('taskReportFeedback').className = error ? 'form-save-error' : 'report-loading';
    el('taskReportFeedback').textContent = error || (busy ? 'Menyiapkan laporan terbaru...' : '');
    const report = snapshot ? R.build(snapshot, filters()) : null;
    if (!report) {
      el('taskReportBody').innerHTML = '<p class="muted-empty">Belum ada laporan yang ditampilkan.</p>';
      el('taskReportTimestamp').textContent = 'Ringkasan pekerjaan tim per tahap Capstone.';
      return;
    }
    el('taskReportTimestamp').textContent = `Data per ${R.date(report.generatedAt)}`;
    const s = report.summary;
    el('taskReportBody').innerHTML = `<h3>${R.esc(report.title)}</h3><div class="report-kpis">
      ${[[s.total, 'Total tugas'], [`${s.completed} (${s.percent}%)`, 'Selesai terverifikasi'], [s.reviews.submitted, 'Menunggu review'], [s.reviews.revision_requested, 'Perlu revisi'], [`${s.checklistDone}/${s.checklistTotal}`, 'Checklist selesai']].map(([value, label]) => `<div><strong>${value}</strong><span>${label}</span></div>`).join('')}
      </div><div class="report-status-counts">${R.statuses.map(status => `<span>${R.esc(status)} <strong>${s.statuses[status]}</strong></span>`).join('')}</div>${R.table(report)}
      <details class="report-details"><summary>Rincian tugas dan subtugas (${s.total})</summary>${R.details(report)}</details>`;
  }
  function assertSession(id, token) {
    if (!allowed() || user()?.id !== id || token !== epoch) throw new Error('Sesi berubah. Buka kembali laporan setelah masuk.');
  }
  async function fetchReport(id, token) {
    const phase = el('taskReportPhase').value;
    const url = new URL(window.CAPSTONE_API_BASE || 'backend/api/index.php', document.baseURI);
    url.searchParams.set('resource', 'task-reports'); url.searchParams.set('phase', phase);
    const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
    const payload = await response.json().catch(() => null);
    assertSession(id, token);
    if (response.status === 401) { window.dispatchEvent(new CustomEvent('capstone:auth-required')); throw new Error('Sesi berakhir. Silakan masuk kembali.'); }
    if (response.status === 403) snapshot = null;
    if (!response.ok || !payload?.ok) throw new Error(payload?.message || 'Laporan belum dapat dimuat. Coba perbarui kembali.');
    if (payload.data?.phase !== phase) throw new Error('Tahap laporan tidak sesuai. Silakan perbarui.');
    R.build(payload.data, filters());
    snapshot = payload.data;
    const names = [...new Set(snapshot.tasks.map(t => t.pic).filter(Boolean).concat(el('taskReportPic').value || []))].sort();
    const selected = el('taskReportPic').value;
    el('taskReportPic').innerHTML = '<option value="">Semua PIC</option>' + names.map(name => `<option value="${R.esc(name)}" ${name === selected ? 'selected' : ''}>${R.esc(name)}</option>`).join('');
    return R.build(snapshot, filters());
  }
  async function excel() {
    if (window.ExcelJS) return window.ExcelJS;
    if (!excelLoading) excelLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = 'js/vendor/exceljs-4.4.0.min.js';
      script.onload = () => { if (window.ExcelJS) resolve(window.ExcelJS); else { excelLoading = null; reject(new Error('Komponen Excel tidak tersedia.')); } };
      script.onerror = () => { script.remove(); excelLoading = null; reject(new Error('Komponen Excel gagal dimuat. Silakan coba lagi.')); };
      document.head.append(script);
    });
    return excelLoading;
  }
  async function load(action = 'view') {
    if (!allowed() || busy) return;
    const id = user().id, token = epoch;
    owner = id; busy = true; error = '';
    let preview = null;
    try {
      if (action === 'print') {
        preview = window.open('about:blank', '_blank');
        if (!preview) throw new Error('Tab preview diblokir. Izinkan pop-up untuk membuka laporan.');
        preview.document.title = 'Menyiapkan Laporan';
        preview.document.body.textContent = 'Menyiapkan laporan terbaru...';
      }
      draw();
      const report = await fetchReport(id, token);
      if (action === 'excel') {
        const library = await excel(); assertSession(id, token);
        const buffer = await R.workbook(report, library).xlsx.writeBuffer(); assertSession(id, token);
        const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
        const link = document.createElement('a'); link.href = url; link.download = R.filename(report, 'xlsx');
        document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
      } else if (action === 'print' && !preview.closed) {
        assertSession(id, token);
        preview.document.open(); preview.document.write(R.printHtml(report)); preview.document.close();
        preview.document.getElementById('taskReportPrint').addEventListener('click', () => preview.print());
        preview.opener = null;
      }
    } catch (failure) {
      if (preview && !preview.closed) { preview.document.body.textContent = failure.message || 'Laporan gagal dimuat.'; preview.document.title = 'Laporan Tidak Tersedia'; preview.opener = null; }
      if (token === epoch && user()?.id === id) error = failure.message || 'Laporan gagal dibuat.';
    } finally {
      if (token === epoch) { busy = false; draw(); }
    }
  }
  function render(options = {}) {
    if (!allowed()) { clear(); return; }
    if (owner && owner !== user().id) clear();
    if (!initialized) {
      fields.forEach(id => el(id).addEventListener('change', () => {
        error = '';
        if (id === 'taskReportPhase') { snapshot = null; load(); } else draw();
      }));
      el('taskReportRefresh').addEventListener('click', () => load());
      el('taskReportExcel').addEventListener('click', () => load('excel'));
      el('taskReportPreview').addEventListener('click', () => load('print'));
      initialized = true;
    }
    if (options.phase && R.phases[options.phase] && el('taskReportPhase').value !== options.phase) {
      epoch++; busy = false; error = '';
      el('taskReportPhase').value = options.phase; snapshot = null;
    }
    draw();
    if (!snapshot && !busy && !error) load();
  }
  window.addEventListener('capstone:auth-required', clear);
  window.TaskReportUI = { render, clear };
})();
