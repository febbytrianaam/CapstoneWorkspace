/* Shared report model for screen, XLSX, and print. No datastore writes. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TaskReports = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const phases = { tugas1: 'Tugas 1 - Proposal', tugas2: 'Tugas 2 - Kemajuan', tugas3: 'Tugas 3 - Final' };
  const statuses = ['Belum Dimulai', 'Sedang Dikerjakan', 'Ditunda', 'Selesai'];
  const reviews = { none: 'Belum diajukan', submitted: 'Menunggu review', revision_requested: 'Perlu revisi', approved: 'Disetujui' };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const text = value => String(value ?? '');
  function date(value) {
    if (value === null || value === undefined || value === '') return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(d) + ' WIB';
  }
  const completed = task => task.status === 'Selesai' && (!task.reviewer || ['none', 'approved'].includes(task.reviewStatus || 'none'));
  const checklistDone = task => (task.checklist || []).reduce((n, _, i) => n + (task.checklistDone?.[i] ? 1 : 0), 0);
  function safeUrl(value) {
    try { const url = new URL(text(value)); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
  }
  function build(snapshot, selected = {}) {
    if (!snapshot || !phases[snapshot.phase] || !Array.isArray(snapshot.tasks) || !Number.isFinite(snapshot.generatedAt)) throw new Error('Data laporan tidak valid.');
    const filters = { pic: '', status: '', review: '', archive: 'active', ...selected };
    if (!['active', 'all', 'archived'].includes(filters.archive) || (filters.status && !statuses.includes(filters.status)) || (filters.review && !Object.hasOwn(reviews, filters.review))) throw new Error('Filter laporan tidak valid.');
    const tasks = snapshot.tasks.filter(t => t.phase === snapshot.phase
      && (!filters.pic || t.pic === filters.pic) && (!filters.status || t.status === filters.status)
      && (!filters.review || (t.reviewStatus || 'none') === filters.review)
      && (filters.archive === 'all' || (filters.archive === 'archived' ? Boolean(t.archivedAt) : !t.archivedAt)))
      .map(t => ({ ...t, checklist: [...(t.checklist || [])], checklistDone: [...(t.checklistDone || [])] }))
      .sort((a, b) => text(a.id).localeCompare(text(b.id), 'id', { numeric: true }));
    const summary = {
      total: tasks.length, completed: tasks.filter(completed).length,
      checklistTotal: tasks.reduce((n, t) => n + t.checklist.length, 0),
      checklistDone: tasks.reduce((n, t) => n + checklistDone(t), 0),
      archived: tasks.filter(t => t.archivedAt).length,
      statuses: Object.fromEntries(statuses.map(s => [s, tasks.filter(t => t.status === s).length])),
      reviews: Object.fromEntries(Object.keys(reviews).map(s => [s, tasks.filter(t => (t.reviewStatus || 'none') === s).length]))
    };
    summary.percent = summary.total ? Math.round(summary.completed / summary.total * 100) : 0;
    const filterLabel = `PIC: ${filters.pic || 'Semua'} | Status: ${filters.status || 'Semua'} | Review: ${reviews[filters.review] || 'Semua'} | Arsip: ${{ active: 'Tanpa arsip', all: 'Termasuk arsip', archived: 'Hanya arsip' }[filters.archive]}`;
    return { phase: snapshot.phase, title: phases[snapshot.phase], generatedAt: snapshot.generatedAt, generatedBy: text(snapshot.generatedBy), progressNote: snapshot.progressNote, tasks, filters, filterLabel, summary };
  }
  function filename(report, ext) {
    const stamp = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date(report.generatedAt)).replace(/[^0-9]/g, '');
    return `Laporan-${report.phase}-${stamp}-WIB.${ext}`;
  }
  function table(report) {
    return `<div class="report-table-scroll"><table class="report-table"><thead><tr><th>Kode / Tugas</th><th>PIC</th><th>Status</th><th>Review</th><th>Checklist</th><th>Batas waktu</th></tr></thead><tbody>${report.tasks.map(t => `<tr><td><strong>${esc(t.id)}</strong><br>${esc(t.title)}${t.archivedAt ? '<br><small>Diarsipkan</small>' : ''}</td><td>${esc(t.pic)}</td><td>${esc(t.status)}</td><td><span class="report-review is-${esc(Object.hasOwn(reviews, t.reviewStatus) ? t.reviewStatus : 'none')}">${esc(reviews[t.reviewStatus] || reviews.none)}</span><br><small>${esc(t.reviewer || 'Belum ada reviewer')}</small></td><td>${checklistDone(t)}/${t.checklist.length}</td><td>${esc(date(t.dueAt))}</td></tr>`).join('') || '<tr><td colspan="6">Tidak ada tugas sesuai filter.</td></tr>'}</tbody></table></div>`;
  }
  function details(report) {
    return report.tasks.map(t => `<section class="report-task-detail"><h3>${esc(t.id)} - ${esc(t.title)}</h3><p>${esc(t.pic)} | ${esc(t.status)} | ${esc(reviews[t.reviewStatus] || reviews.none)} | Prioritas ${esc(t.priority)}</p><dl><dt>Deskripsi</dt><dd class="report-preserve">${esc(t.description || '-')}</dd><dt>Reviewer / Catatan review</dt><dd>${esc(t.reviewer || '-')}<div class="report-preserve">${esc(t.reviewNote || '-')}</div></dd><dt>Luaran</dt><dd>${safeUrl(t.deliverableUrl) ? `<a href="${esc(safeUrl(t.deliverableUrl))}" target="_blank" rel="noopener noreferrer">${esc(t.deliverableUrl)}</a>` : '-'}</dd><dt>Tanggal</dt><dd>Mulai: ${esc(date(t.startAt))}<br>Batas waktu: ${esc(date(t.dueAt))}<br>Dibuat: ${esc(date(t.createdAt))}<br>Diperbarui: ${esc(date(t.updatedAt))}<br>Diajukan: ${esc(date(t.submittedAt))}<br>Direview: ${esc(date(t.reviewedAt))}<br>Diarsipkan: ${esc(date(t.archivedAt))}</dd></dl><h4>Checklist / Subtugas (${checklistDone(t)}/${t.checklist.length})</h4><ol>${t.checklist.map((item, i) => `<li class="report-preserve">[${t.checklistDone[i] ? 'x' : ' '}] ${esc(item)}</li>`).join('') || '<li>Tanpa checklist.</li>'}</ol></section>`).join('');
  }
  function printHtml(report) {
    const s = report.summary;
    return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'none'"><title>${esc(filename(report, 'pdf').replace(/\.pdf$/, ''))}</title><style>
      *{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#17202a;margin:24px auto;padding:0 24px;max-width:1120px}h1{font-size:24px;margin:8px 0}h2{font-size:18px;margin:24px 0 12px}h3{font-size:15px}h4{font-size:12px}.report-toolbar{display:flex;justify-content:flex-end}button{font:inherit;padding:10px 16px;border:1px solid #cbd5e1;background:white;border-radius:6px;cursor:pointer}.report-meta{color:#526173;line-height:1.6;overflow-wrap:anywhere}.report-summary{display:flex;flex-wrap:wrap;gap:16px;margin:20px 0;padding:14px 0;border-block:1px solid #cbd5e1}.report-summary strong{font-size:18px}.report-table-scroll{overflow-x:auto}.report-table{width:100%;border-collapse:collapse;font-size:11px}.report-table th,.report-table td{border:1px solid #b8c1cc;padding:8px;text-align:left;vertical-align:top;overflow-wrap:anywhere}.report-table th{background:#eef2f6}.report-table th:first-child{width:34%}.report-table th:last-child{width:18%}.report-task-detail{border-bottom:1px solid #b8c1cc;padding:12px 0}.report-task-detail h3,.report-task-detail h4{break-after:avoid}dl{display:grid;grid-template-columns:145px minmax(0,1fr);gap:8px}dt{font-weight:bold}dd{margin:0;overflow-wrap:anywhere}.report-preserve{white-space:pre-wrap;overflow-wrap:anywhere}li{margin-bottom:5px}thead{display:table-header-group}a{color:#1d4ed8}small{font-size:10px}.report-statuses{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:16px}.report-review{font-weight:600}.is-revision_requested{color:#be123c}.is-submitted{color:#9a5709}.is-approved{color:#08765b}@page{size:A4 landscape;margin:14mm}@media print{body{margin:0;padding:0;max-width:none}.report-toolbar{display:none}.report-table-scroll{overflow:visible}.report-table{table-layout:fixed}h2{break-after:avoid}.report-task-detail{break-inside:auto}p,li,dd{orphans:3;widows:3}a{color:inherit}}
    @media print{.report-task-detail{break-inside:avoid}}
    </style></head><body><div class="report-toolbar"><button type="button" id="taskReportPrint">Cetak / Simpan PDF</button></div><header><p>CAPSTONE WORKSPACE - STSI4440</p><h1>Laporan ${esc(report.title)}</h1><p class="report-meta">Data per ${esc(date(report.generatedAt))} | Oleh ${esc(report.generatedBy)}<br>${esc(report.filterLabel)}</p></header><div class="report-summary"><span><strong>${s.total}</strong> tugas</span><span><strong>${s.completed}</strong> selesai terverifikasi (${s.percent}%)</span><span><strong>${s.reviews.submitted}</strong> menunggu review</span><span><strong>${s.reviews.revision_requested}</strong> perlu revisi</span><span><strong>${s.checklistDone}/${s.checklistTotal}</strong> checklist</span><span><strong>${s.archived}</strong> arsip</span></div><div class="report-statuses">${statuses.map(status => `<span>${esc(status)}: <strong>${s.statuses[status]}</strong></span>`).join('')}</div><h2>Ringkasan Tugas</h2>${table(report)}${report.progressNote?.content ? `<h2>Catatan Progress Tahap</h2><p class="report-meta">Diperbarui ${esc(date(report.progressNote.updatedAt))}</p><div class="report-preserve">${esc(report.progressNote.content)}</div>` : ''}<h2>Rincian Tugas dan Subtugas</h2>${details(report) || '<p>Tidak ada tugas sesuai filter.</p>'}</body></html>`;
  }
  function workbook(report, ExcelJS) {
    if (!ExcelJS?.Workbook) throw new Error('Komponen Excel belum tersedia.');
    const strings = [report.filterLabel, report.progressNote?.content, ...report.tasks.flatMap(t => [t.id, t.title, t.description, t.pic, t.reviewer, t.reviewNote, t.deliverableUrl, ...t.checklist])];
    if (strings.some(value => text(value).length > 32767)) throw new Error('Ada teks melebihi batas Excel (32.767 karakter). Gunakan preview/PDF untuk laporan lengkap.');
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Capstone Workspace'; wb.created = new Date(report.generatedAt);
    const summary = wb.addWorksheet('Ringkasan');
    const tasks = wb.addWorksheet('Tugas');
    const items = wb.addWorksheet('Subtugas');
    function header(sheet, labels, widths) {
      sheet.addRow([`Laporan ${report.title}`]); sheet.addRow([`Data per ${date(report.generatedAt)} | Oleh ${report.generatedBy}`]); sheet.addRow([report.filterLabel]); sheet.addRow([]); sheet.addRow(labels);
      sheet.views = [{ state: 'frozen', ySplit: 5 }];
      sheet.columns = widths.map(width => ({ width }));
      sheet.getRow(1).font = { size: 16, bold: true, color: { argb: 'FF1D4ED8' } };
      for (let row = 1; row <= 3; row++) { sheet.mergeCells(row, 1, row, labels.length); sheet.getRow(row).alignment = { wrapText: true, vertical: 'top' }; }
      sheet.getRow(2).height = 30; sheet.getRow(3).height = 32;
      sheet.getRow(5).height = 32;
      sheet.getRow(5).eachCell(cell => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } }; cell.alignment = { wrapText: true, vertical: 'middle' }; });
      sheet.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:5' };
    }
    header(tasks, ['Kode', 'Judul Tugas', 'Tahap', 'PIC', 'Status', 'Prioritas', 'Reviewer', 'Status Review', 'Checklist Selesai', 'Total Checklist', 'Progress Checklist', 'Selesai Terverifikasi', 'Deskripsi', 'Catatan Review', 'Link Luaran', 'Mulai (WIB)', 'Batas Waktu (WIB)', 'Diajukan (WIB)', 'Direview (WIB)', 'Dibuat (WIB)', 'Diperbarui (WIB)', 'Diarsipkan (WIB)', 'Arsip'], [20, 48, 26, 20, 24, 16, 20, 24, 14, 14, 16, 22, 60, 60, 50, 34, 34, 34, 34, 34, 34, 34, 14]);
    report.tasks.forEach(t => {
      const done = checklistDone(t), total = t.checklist.length;
      const row = tasks.addRow([text(t.id), text(t.title), report.title, text(t.pic), text(t.status), text(t.priority), text(t.reviewer), reviews[t.reviewStatus] || reviews.none, done, total, total ? done / total : 0, completed(t) ? 'Ya' : 'Tidak', text(t.description), text(t.reviewNote), text(t.deliverableUrl), ...['startAt', 'dueAt', 'submittedAt', 'reviewedAt', 'createdAt', 'updatedAt', 'archivedAt'].map(k => date(t[k])), t.archivedAt ? 'Ya' : 'Tidak']);
      row.getCell(11).numFmt = '0%';
    });
    header(items, ['Kode Tugas', 'Judul Tugas', 'PIC', 'No.', 'Subtugas / Checklist', 'Status'], [20, 48, 20, 8, 80, 20]);
    report.tasks.forEach(t => t.checklist.forEach((item, i) => items.addRow([text(t.id), text(t.title), text(t.pic), i + 1, text(item), t.checklistDone[i] ? 'Selesai' : 'Belum selesai'])));
    header(summary, ['Ringkasan', 'Nilai'], [48, 100]);
    const last = Math.max(6, tasks.rowCount), s = report.summary;
    summary.addRow(['Jumlah tugas', { formula: `COUNTA('Tugas'!A6:A${last})`, result: s.total }]);
    summary.addRow(['Selesai terverifikasi', { formula: `COUNTIF('Tugas'!L6:L${last},"Ya")`, result: s.completed }]);
    const progress = summary.addRow(['Progress tugas', { formula: 'IF(B6=0,0,B7/B6)', result: s.total ? s.completed / s.total : 0 }]); progress.getCell(2).numFmt = '0%';
    statuses.forEach(status => summary.addRow([status, { formula: `COUNTIF('Tugas'!E6:E${last},"${status}")`, result: s.statuses[status] }]));
    Object.entries(reviews).forEach(([key, label]) => summary.addRow([label, { formula: `COUNTIF('Tugas'!H6:H${last},"${label}")`, result: s.reviews[key] }]));
    summary.addRow(['Checklist selesai', { formula: `SUM('Tugas'!I6:I${last})`, result: s.checklistDone }]);
    summary.addRow(['Total checklist', { formula: `SUM('Tugas'!J6:J${last})`, result: s.checklistTotal }]);
    summary.addRow(['Tugas arsip', { formula: `COUNTIF('Tugas'!W6:W${last},"Ya")`, result: s.archived }]);
    summary.addRow(['Catatan progress tahap', text(report.progressNote?.content)]);
    summary.addRow(['Catatan progress diperbarui (WIB)', date(report.progressNote?.updatedAt)]);
    [summary, tasks, items].forEach(sheet => {
      sheet.eachRow((row, n) => { if (n > 5) row.eachCell(cell => { cell.alignment = { wrapText: true, vertical: 'top' }; cell.border = { bottom: { style: 'hair', color: { argb: 'FFDDE3EB' } } }; }); });
      sheet.eachRow((row, n) => {
        if (n <= 5) return;
        let lines = 1;
        row.eachCell((cell, column) => {
          if (typeof cell.value === 'string') lines = Math.max(lines, cell.value.split('\n').reduce((count, line) => count + Math.max(1, Math.ceil(line.length / Math.max(8, sheet.getColumn(column).width - 2))), 0));
        });
        row.height = Math.min(360, Math.max(24, lines * 15));
      });
      if (sheet !== summary) sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: Math.max(5, sheet.rowCount), column: sheet.columnCount } };
    });
    return wb;
  }
  return { phases, statuses, reviews, esc, date, completed, checklistDone, safeUrl, build, filename, table, details, printHtml, workbook };
});
