const { test } = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/task-reports.js');
const ExcelJS = require('../js/vendor/exceljs-4.4.0.min.js');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

function fixture() {
  const base = { phase: 'tugas2', pic: 'QA', priority: 'Tinggi', description: 'Baris satu\nBaris dua', reviewer: 'Reviewer', reviewNote: 'Periksa catatan.', checklist: ['Langkah A', 'Langkah B'], checklistDone: [true, false, true], createdAt: 1792612800000, dueAt: null };
  return { phase: 'tugas2', generatedAt: Date.parse('2026-10-21T20:30:15Z'), generatedBy: 'Admin', progressNote: { content: 'Progress\nTetap dua baris', updatedAt: 1792612800000 }, tasks: [
    { ...base, id: 't2-10', title: 'Task 10', status: 'Belum Dimulai', reviewStatus: 'none' },
    { ...base, id: 't2-2', title: 'Task 2', status: 'Sedang Dikerjakan', reviewStatus: 'submitted', checklist: [] },
    { ...base, id: 't2-3', title: 'Task 3', status: 'Ditunda', reviewStatus: 'revision_requested' },
    { ...base, id: 't2-4', title: 'Task 4', status: 'Selesai', reviewStatus: 'approved', checklistDone: [true, true] },
    { ...base, id: 't2-5', title: 'Archived', status: 'Selesai', reviewStatus: 'none', reviewer: '', archivedAt: 1792612800000 },
    { ...base, id: 't1-1', title: 'Other phase', phase: 'tugas1', status: 'Selesai' }
  ] };
}

test('report filters, stable task-code sort, archive scope, and checklist totals do not mutate source', () => {
  const data = fixture(), before = JSON.stringify(data), report = R.build(data);
  assert.deepEqual(report.tasks.map(t => t.id), ['t2-2', 't2-3', 't2-4', 't2-10']);
  assert.equal(report.summary.total, 4);
  assert.equal(report.summary.completed, 1);
  assert.equal(report.summary.checklistDone, 4);
  assert.equal(report.summary.checklistTotal, 6);
  assert.equal(report.summary.reviews.submitted, 1);
  assert.equal(R.build(data, { archive: 'all' }).summary.total, 5);
  assert.equal(R.build(data, { archive: 'archived' }).summary.archived, 1);
  assert.equal(R.build(data, { review: 'revision_requested', status: 'Ditunda', pic: 'QA' }).summary.total, 1);
  assert.equal(JSON.stringify(data), before);
});

test('verified completion matches the task workflow, not just checklist completion', () => {
  assert.equal(R.completed({ status: 'Selesai', reviewer: 'QA', reviewStatus: 'submitted' }), false);
  assert.equal(R.completed({ status: 'Selesai', reviewer: 'QA', reviewStatus: 'approved' }), true);
  assert.equal(R.completed({ status: 'Sedang Dikerjakan', checklistDone: [true] }), false);
});

test('empty reports are valid, but invalid phase, time, and filters are rejected', () => {
  const report = R.build(fixture(), { pic: 'Nobody' });
  assert.equal(report.summary.total, 0); assert.equal(report.summary.percent, 0);
  assert.match(R.printHtml(report), /Tidak ada tugas sesuai filter/);
  assert.throws(() => R.build({ ...fixture(), phase: 'audit' }), /tidak valid/);
  assert.throws(() => R.build({ ...fixture(), generatedAt: null }), /tidak valid/);
  assert.throws(() => R.build(fixture(), { archive: 'anything' }), /tidak valid/);
  assert.throws(() => R.build(fixture(), { review: 'bad' }), /tidak valid/);
});

test('print preview escapes user content, preserves newlines, and rejects executable URLs', () => {
  const data = fixture(); data.tasks[0].title = '</title><script>alert(1)</script>';
  data.tasks[0].reviewNote = '<img src=x onerror=bad()>\nSecond line';
  data.tasks[0].deliverableUrl = 'javascript:alert(1)';
  const html = R.printHtml(R.build(data));
  assert.doesNotMatch(html, /<script>|<img|href="javascript:/);
  assert.match(html, /&lt;script&gt;/); assert.match(html, /Second line/);
  assert.match(html, /white-space:pre-wrap/); assert.match(html, /Cetak \/ Simpan PDF/);
  assert.match(html, /thead\{display:table-header-group\}/);
  assert.equal(R.safeUrl('data:text/html,hi'), '');
  assert.equal(R.safeUrl('https://example.com/file'), 'https://example.com/file');
});

test('report dates and filenames use WIB even across UTC date boundaries', () => {
  const report = R.build(fixture());
  assert.match(R.date(report.generatedAt), /22 Oktober 2026/);
  assert.match(R.date(report.generatedAt), /03.30.15 WIB/);
  assert.equal(R.filename(report, 'xlsx'), 'Laporan-tugas2-20261022033015-WIB.xlsx');
  assert.equal(R.date(null), '-'); assert.equal(R.date('bad'), '-');
});

test('real XLSX roundtrip preserves text, formulas, checklist rows, filters, and frozen headers', async () => {
  const data = fixture(); data.tasks[0].title = '=HYPERLINK("https://bad.example")';
  const report = R.build(data), wb = R.workbook(report, ExcelJS);
  const bytes = await wb.xlsx.writeBuffer();
  assert.equal(Buffer.from(bytes).subarray(0, 2).toString(), 'PK');
  const read = new ExcelJS.Workbook(); await read.xlsx.load(bytes);
  assert.deepEqual(read.worksheets.map(s => s.name), ['Ringkasan', 'Tugas', 'Subtugas']);
  assert.equal(read.getWorksheet('Tugas').rowCount, 9);
  assert.equal(read.getWorksheet('Subtugas').rowCount, 11);
  assert.equal(read.getWorksheet('Tugas').getCell('B9').value, data.tasks[0].title, 'User text must not become a formula');
  assert.equal(read.getWorksheet('Tugas').getCell('M9').value, data.tasks[0].description);
  assert.equal(read.getWorksheet('Tugas').getCell('K9').value, 0.5);
  assert.equal(read.getWorksheet('Ringkasan').getCell('B6').value.result, 4);
  assert.equal(read.getWorksheet('Ringkasan').getCell('B7').value.result, 1);
  assert.equal(read.getWorksheet('Tugas').views[0].ySplit, 5);
  assert.ok(read.getWorksheet('Tugas').autoFilter);
});

test('zero-task Excel keeps valid summary formulas and no fabricated task or subtask rows', async () => {
  const wb = R.workbook(R.build(fixture(), { pic: 'Nobody' }), ExcelJS);
  const read = new ExcelJS.Workbook(); await read.xlsx.load(await wb.xlsx.writeBuffer());
  assert.equal(read.getWorksheet('Tugas').rowCount, 5);
  assert.equal(read.getWorksheet('Subtugas').rowCount, 5);
  assert.equal(read.getWorksheet('Ringkasan').getCell('B8').value.result || 0, 0);
});

test('Excel reports reject oversized cells explicitly instead of silently truncating notes', () => {
  const data = fixture(); data.tasks[0].reviewNote = 'a'.repeat(32768);
  assert.throws(() => R.workbook(R.build(data), ExcelJS), /preview\/PDF/);
  assert.match(R.printHtml(R.build(data)), /a{32768}/);
});

test('actual PHP API router denies member/coordinator, writes, invalid phase, and revoked access before producing reports', () => {
  for (const [role, method, phase, denied, status] of [
    ['anonymous', 'GET', 'tugas2', '', 401], ['member', 'GET', 'tugas2', '', 403], ['koordinator', 'GET', 'tugas2', '', 403],
    ['superadmin', 'POST', 'tugas2', '', 405], ['superadmin', 'GET', 'audit', '', 422],
    ['superadmin', 'GET', 'tugas2', 'tasks', 403], ['superadmin', 'GET', 'tugas2', 'pages', 403],
    ['superadmin', 'GET', 'tugas2', '', 200]
  ]) {
    const result = spawnSync('php', [path.join(__dirname, 'task-report-router-fixture.php'), role, method, phase, denied], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, new RegExp(`HTTP:${status}`));
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.ok, status === 200);
    if (status === 200) assert.equal(payload.data.phase, 'tugas2');
  }
});
