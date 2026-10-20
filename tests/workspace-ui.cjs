/* Isolated regression suite: every browser request is intercepted; no live API or database is used. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { chromium } = require(process.argv[2] || 'playwright');
const root = path.resolve(__dirname, '..');
const html = execFileSync('php', ['index.php'], { cwd: root, encoding: 'utf8' });
const fixtures = {
  user: 'Febby', authenticated: true, anonymousSnapshotDelay: 0, fail: new Set(), calls: [], errors: [], snapshots: 0,
  accesses: {},
  clockOffset: 0,
  seen: { Rival: Date.now(), Farah: Date.now() - 180000 },
  baDrafts: {}, backups: {}, nextBaNumber: 3,
  users: Object.fromEntries(['Febby', 'Coord', 'Rival', 'Farah', 'Cintia'].map(name => [name, {
    id: name, username: `qa.${name}`, name, fullName: `QA ${name}`, nim: '000',
    role: name === 'Febby' ? 'superadmin' : name === 'Coord' ? 'koordinator' : 'member',
    roles: [name === 'Febby' ? 'superadmin' : name === 'Coord' ? 'koordinator' : 'member'],
    color: '#2563EB', initial: name.slice(0, 2), lastLogin: null, lastSeen: null
  }])),
  tasks: [
    ['t2-dev-03', 'Pengembangan aplikasi dan dokumentasi pengujian', 'Rival', 'Farah', 'none'],
    ['t2-revision', 'Perbaikan laporan sesuai catatan', 'Rival', 'Farah', 'revision_requested'],
    ['t2-review', 'Laporan untuk diperiksa', 'Cintia', 'Rival', 'submitted'],
    ['t2-done', 'Pekerjaan selesai', 'Rival', '', 'none'],
    ['t2-admin', 'Pekerjaan koordinator', 'Febby', 'Rival', 'none']
  ].map(([id, title, pic, reviewer, reviewStatus]) => ({
    id, phase: 'tugas2', title, pic, reviewer, reviewStatus,
    status: id === 't2-done' ? 'Selesai' : 'Sedang Dikerjakan', priority: 'Tinggi',
    description: 'Deskripsi pengujian sintetis.', checklist: ['Langkah pertama', 'Langkah kedua'],
    checklistDone: [false, false], reviewNote: reviewStatus === 'revision_requested' ? 'Lengkapi hasil pengujian.' : '',
    createdAt: Date.now(), updatedAt: Date.now(), archivedAt: null, meetings: []
  })),
  archives: [
    { id: 'qa-doc-a', title: 'Analisis Kebutuhan', originalName: 'requirements.pdf', category: 'dokumen', createdAt: 1000 },
    { id: 'qa-doc-b', title: 'Berita Acara Kedua', originalName: 'pertemuan.pdf', category: 'berita_acara', createdAt: 2000 },
    { id: 'qa-doc-c', title: 'Poster Hasil Pengembangan Sistem Informasi Manajemen Persediaan Obat Klinik', originalName: 'poster.png', category: 'poster', createdAt: 3000 }
  ].map(item => ({ ...item, description: '', fileSize: 1024, mimeType: 'application/pdf', uploadedBy: 'QA', meetingId: '' }))
};
fixtures.tasks[0].meetings = ['qa-meeting-a', 'qa-meeting-b'].map((id, i) => ({
  id, taskId: 't2-dev-03', phase: 'tugas2', title: `Pertemuan QA ${i + 1}`, date: '2026-10-17T19:00',
  endDate: '2026-10-17T20:00', host: 'Rival', hasBeritaAcara: false, notes: '', url: ''
}));
const assets = Object.fromEntries(['js/app.js', 'js/data.js', 'js/rbac.js', 'css/style.css'].map(file => [`/${file}`, fs.readFileSync(path.join(root, file))]));
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'capstone-ui-'));
console.log(`Screenshots: ${output}`);

async function main() {
  const browser = await chromium.launch({ headless: true, channel: process.env.CAPSTONE_BROWSER || 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', error => fixtures.errors.push(error.stack));
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname !== 'localhost') {
      if (url.pathname.includes('chart')) return route.fulfill({ contentType: 'text/javascript', body: 'window.Chart = class { destroy() {} };' });
      if (url.pathname.includes('sweetalert')) return route.fulfill({ contentType: 'text/javascript', body: 'window.qaAlerts=[];window.qaConfirm=true;window.Swal={fire:async function(...args){qaAlerts.push(args);return {isConfirmed:qaConfirm};},showLoading(){},showValidationMessage(){}};' });
      return route.fulfill({ status: 404, body: '' });
    }
    if (url.pathname.includes('/backend/api/')) {
      const resource = url.searchParams.get('resource');
      const method = request.method();
      const body = request.headers()['content-type']?.includes('application/json') ? request.postDataJSON() : null;
      fixtures.calls.push({ resource, method, body, params: Object.fromEntries(url.searchParams) });
      if (fixtures.fail.has(`${resource}:${method}`)) return route.fulfill({ status: 422, json: { ok: false, message: 'QA: server menolak perubahan.' } });
      const user = fixtures.users[fixtures.user];
      if (resource === 'auth' && method === 'POST') {
        fixtures.authenticated = true;
        return route.fulfill({ json: { ok: true, data: user } });
      }
      if (!fixtures.authenticated) {
        if (resource === 'snapshot' && fixtures.anonymousSnapshotDelay) await new Promise(resolve => setTimeout(resolve, fixtures.anonymousSnapshotDelay));
        return route.fulfill({ status: 401, json: { ok: false, message: 'Silakan masuk.' } });
      }
      if (resource === 'browser-backups') {
        if (method === 'POST') {
          const id = require('node:crypto').createHash('sha256').update(JSON.stringify(body.entries)).digest('hex');
          fixtures.backups[id] = { id, ownerId: fixtures.user, entries: body.entries, createdAt: Date.now(), sizeBytes: JSON.stringify(body.entries).length };
          return route.fulfill({ json: { ok: true, data: { id } } });
        }
        return route.fulfill({ json: { ok: true, data: url.searchParams.has('id') ? fixtures.backups[url.searchParams.get('id')] : Object.values(fixtures.backups) } });
      }
      if (resource === 'ba-drafts') {
        const id = url.searchParams.get('meeting_id');
        const current = fixtures.baDrafts[id];
        if (method === 'GET') return route.fulfill({ json: { ok: true, data: current || null } });
        if (method === 'PUT') {
          if ((current?.revision || 0) !== body.revision) return route.fulfill({ status: 409, json: { ok: false, conflict: true, message: 'Draft sudah diperbarui dari perangkat lain.', data: current } });
          const documentNumber = current?.documentNumber || fixtures.nextBaNumber++;
          fixtures.baDrafts[id] = { meetingId: id, payload: { ...body.payload, documentNumber }, documentNumber, revision: body.revision + 1, updatedAt: Date.now(), updatedBy: fixtures.user };
          return route.fulfill({ json: { ok: true, data: fixtures.baDrafts[id] } });
        }
        const backup = fixtures.backups[body.backupId];
        const legacy = JSON.parse(backup.entries.capstone_berita_acara_drafts_v1 || '{}');
        const result = { saved: 0, conflicts: [], unresolved: [] };
        for (const [key, draft] of Object.entries(legacy)) {
          if (fixtures.baDrafts[draft.meetingId]) result.conflicts.push(key);
          else {
            fixtures.baDrafts[draft.meetingId] = { meetingId: draft.meetingId, payload: draft, revision: 1, updatedAt: Date.now(), updatedBy: fixtures.user };
            result.saved++;
          }
        }
        return route.fulfill({ json: { ok: true, data: result } });
      }
      if (resource === 'user-activities' && method === 'POST') {
        if (['tugas1', 'tugas2', 'tugas3'].includes(body.page)) fixtures.accesses[`${fixtures.user}:${body.page}`] = Date.now();
        return route.fulfill({ json: { ok: true, data: body } });
      }
      if (resource === 'presence' && method === 'POST') {
        fixtures.seen[fixtures.user] = Date.now();
        return route.fulfill({ json: { ok: true, data: { serverTime: Date.now() } } });
      }
      if (resource === 'phase-access') return route.fulfill({ json: { ok: true, data: {
        serverTime: Date.now() + fixtures.clockOffset, members: Object.values(fixtures.users).filter(item => item.isActive !== false).map(item => ({
          id: item.id, name: item.name, initial: item.initial,
          lastAccessAt: fixtures.accesses[`${item.id}:${url.searchParams.get('phase')}`] || null,
          lastSeenAt: fixtures.seen[item.id] || null
        }))
      } } });
      if (resource === 'snapshot') {
        fixtures.snapshots++;
        const tasks = structuredClone(fixtures.tasks);
        if (user.role === 'member') tasks.forEach(task => { task.meetings = []; });
        const data = {
          currentUser: user,
          users: Object.fromEntries(Object.entries(fixtures.users).filter(([, item]) => user.role !== 'member' || item.role !== 'superadmin')),
          tasks, meetings: [], notifications: [], progressNotes: {}
        };
        if (url.searchParams.get('include_logs') !== '0') Object.assign(data, { auditLogs: [], userActivities: [] });
        return route.fulfill({ json: { ok: true, data } });
      }
      if (method === 'GET') return route.fulfill({ json: { ok: true, data: resource === 'users' ? fixtures.users : resource === 'document-archives' ? fixtures.archives : [] } });
      if (resource === 'users' && method === 'PUT' && body.action === 'set_status') {
        const target = fixtures.users[url.searchParams.get('id')];
        target.isActive = body.isActive;
        return route.fulfill({ json: { ok: true, data: structuredClone(target) } });
      }
      if (resource === 'tasks' && method === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 80));
        const task = fixtures.tasks.find(item => item.id === url.searchParams.get('id'));
        Object.assign(task, body, { updatedAt: Date.now() });
        if (body.reviewAction) {
          task.reviewStatus = { submit: 'submitted', cancel_submit: 'none', approve: 'approved', request_revision: 'revision_requested' }[body.reviewAction];
          if (body.reviewAction === 'approve') task.status = 'Selesai';
          delete task.reviewAction;
        }
        return route.fulfill({ json: { ok: true, data: structuredClone(task) } });
      }
      return route.fulfill({ json: { ok: true, data: body } });
    }
    if (url.pathname === '/' || url.pathname === '/index.php') return route.fulfill({ contentType: 'text/html', body: html });
    if (assets[url.pathname]) {
      // Guarantee that a snapshot with meetings can arrive before app initialization.
      if (url.pathname === '/js/app.js') await new Promise(resolve => setTimeout(resolve, 150));
      return route.fulfill({ contentType: url.pathname.endsWith('.js') ? 'text/javascript' : 'text/css', body: assets[url.pathname] });
    }
    return route.fulfill({ status: 404, body: '' });
  });
  const ready = () => page.waitForFunction(() => document.documentElement.classList.contains('data-ready'));
  const nav = async target => {
    if ((await page.viewportSize()).width < 1024 && !await page.locator('.sidebar').evaluate(el => el.classList.contains('open'))) await page.locator('#sidebarToggleBtn').click();
    await page.locator(`.sidebar-nav [data-target="${target}"]`).click();
    await page.waitForFunction(id => document.querySelector('.page-view.active')?.id === id, target);
    if (/^tugas[123]$/.test(target)) {
      assert.equal(await page.locator(`#${target}`).evaluate(el => {
        const summary = el.querySelector('.progress-note-panel');
        const access = el.querySelector('.phase-access');
        return Boolean(summary && access && (summary.compareDocumentPosition(access) & Node.DOCUMENT_POSITION_FOLLOWING));
      }), true, 'Phase summary must precede team access');
    }
    if ((await page.viewportSize()).width < 1024) await page.waitForFunction(() => document.querySelector('.sidebar').getBoundingClientRect().right <= 1);
  };
  const openTask = id => page.locator(`#tugas2 .phase-task-board .task-card[data-task-id="${id}"]`).click();
  const closeTask = () => page.locator('#modalCloseBtn').click();
  const checks = [];
  try {
    await page.goto('http://localhost:43799/');
    await ready();
    assert.equal(fixtures.errors.length, 0, 'fast snapshot bootstrap must not throw');
    assert.equal(fixtures.calls.filter(call => ['audit-logs', 'user-activities'].includes(call.resource) && call.method === 'GET').length, 0);
    assert.equal(fixtures.calls.find(call => call.resource === 'snapshot').params.include_logs, '0');
    checks.push('fast snapshot startup; audit excluded from initial requests');

    await nav('tugas2');
    await page.locator('#taskSearchInput-tugas2').fill('t2-dev');
    await page.locator('#taskSearchInput-tugas2').pressSequentially('-03');
    assert.equal(await page.locator('#tugas2 .phase-task-board .task-card').count(), 1);
    assert.equal(await page.locator('#taskSearchInput-tugas2').evaluate(el => el === document.activeElement), true);
    await page.locator('.page-view.active .reset-task-filters-btn').click();
    await page.locator('.page-view.active [data-task-view="list"]').click();
    assert.equal(await page.locator('.task-list-row').count(), fixtures.tasks.length);
    checks.push('task ID search preserves focus; reset filters; list view');

    await openTask('t2-dev-03');
    await page.locator('#taskDescInput').fill('Input tidak boleh hilang');
    await page.evaluate(() => { window.qaConfirm = false; });
    await closeTask();
    assert.equal(await page.locator('#taskModalBackdrop').isVisible(), true);
    const beforeRefresh = fixtures.snapshots;
    await page.locator('#refreshDataBtn').evaluate(el => el.click());
    assert.equal(fixtures.snapshots, beforeRefresh);
    fixtures.fail.add('tasks:PUT');
    await page.locator('#taskForm button[type="submit"]').click();
    await page.locator('#taskForm .form-save-error').waitFor();
    assert.equal(await page.locator('#taskModalBackdrop').isVisible(), true);
    assert.equal(await page.locator('#taskDescInput').inputValue(), 'Input tidak boleh hilang');
    assert.notEqual(fixtures.tasks[0].description, 'Input tidak boleh hilang');
    fixtures.fail.delete('tasks:PUT');
    await page.locator('#taskForm button[type="submit"]').click();
    await page.locator('#taskModalBackdrop').waitFor({ state: 'hidden' });
    assert.equal(fixtures.tasks[0].description, 'Input tidak boleh hilang');
    assert.equal(Object.hasOwn(fixtures.calls.filter(call => call.resource === 'tasks' && call.method === 'PUT').at(-1).body, 'meetings'), false);
    checks.push('dirty form protects close/refresh; rejected save retains input; retry commits; no meeting replacement');

    fixtures.user = 'Rival';
    await page.reload(); await ready();
    assert.equal(await page.evaluate(() => capstoneStore.getCurrentUser().role), 'member');
    await nav('tugas2');
    await page.locator('#tugas2 .phase-access time').first().waitFor();
    const accessRow = name => page.locator('#tugas2 .phase-access-list li').filter({ has: page.locator('strong', { hasText: name }) });
    await page.locator('#tugas2 .phase-access-refresh').click();
    await page.waitForFunction(() => !document.querySelector('#tugas2 .phase-access-refresh').disabled);
    assert.match(await accessRow('Rival').innerText(), /Online/);
    assert.match(await accessRow('Farah').innerText(), /Offline/);
    assert.match(await accessRow('Rival').locator('time').innerText(), /(?:Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu), \d{2} \S+ \d{4}, \d{2}:\d{2}:\d{2} WIB/);
    assert.match(await accessRow('Cintia').innerText(), /Belum ada akses tercatat/);
    assert.equal(fixtures.calls.some(call => call.resource === 'user-activities' && call.method === 'GET'), false);
    fixtures.clockOffset = 95000;
    await page.locator('#tugas2 .phase-access-refresh').click();
    await page.waitForFunction(() => !document.querySelector('#tugas2 .phase-access-refresh').disabled);
    assert.match(await accessRow('Rival').innerText(), /Offline/);
    fixtures.clockOffset = 0;
    fixtures.fail.add('phase-access:GET');
    await page.locator('#tugas2 .phase-access-refresh').click();
    await page.waitForFunction(() => document.querySelector('#tugas2 .phase-access-status').textContent.includes('belum dapat dimuat'));
    fixtures.fail.delete('phase-access:GET');
    await page.locator('#tugas2 .phase-access-refresh').click();
    await page.waitForFunction(() => !document.querySelector('#tugas2 .phase-access-refresh').disabled);
    await nav('tugas3');
    await page.waitForFunction(() => document.querySelector('#tugas3 .phase-access time'));
    assert.equal(fixtures.calls.some(call => call.resource === 'phase-access' && call.params.phase === 'tugas3'), true);
    await nav('tugas2');
    checks.push('member phase access summary; full WIB timestamps; online/offline; no history; failure retry; distinct phase requests');
    await page.locator('[data-work-filter="mine"]').first().click();
    assert.equal(await page.locator('.phase-task-board [data-task-id="t2-done"]').count(), 0);
    await page.locator('[data-work-filter="revision"]').first().click();
    assert.equal(await page.locator('.phase-task-board .task-card').count(), 1);
    await page.locator('[data-work-filter="review"]').first().click();
    assert.equal(await page.locator('.phase-task-board [data-task-id="t2-review"]').count(), 1);
    await page.locator('.page-view.active .reset-task-filters-btn').click();
    await openTask('t2-admin');
    assert.equal(await page.locator('#taskPicSelect').inputValue(), 'Febby');
    assert.equal(await page.locator('#taskStatusSelect').isDisabled(), true);
    assert.equal(await page.locator('#taskReviewerSelect').isDisabled(), true);
    await closeTask();
    await openTask('t2-dev-03');
    await page.locator('.modal-checklist-check[data-index="0"]').check();
    const presenceBefore = fixtures.calls.filter(call => call.resource === 'presence').length;
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    assert.equal(fixtures.calls.filter(call => call.resource === 'presence').length, presenceBefore);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForFunction(() => !document.querySelector('#tugas2 .phase-access-refresh').disabled);
    assert.equal(await page.locator('#taskModalBackdrop').isVisible(), true);
    assert.equal(await page.locator('.modal-checklist-check[data-index="0"]').isChecked(), true);
    await page.locator('#submitReviewBtn').click();
    await page.locator('#taskModalBackdrop').waitFor({ state: 'hidden' });
    assert.equal(fixtures.tasks[0].checklistDone[0], true);
    assert.equal(fixtures.tasks[0].reviewStatus, 'submitted');
    checks.push('role-specific action queues; readonly owner/reviewer; review includes unsaved checklist');
    await page.locator('.page-view.active [data-work-filter="waiting"]').click();
    assert.equal(await page.locator('.page-view.active .phase-actions').getAttribute('data-queue'), 'waiting');
    assert.equal(await page.locator('.phase-task-board [data-task-id="t2-dev-03"]').count(), 1);
    assert.equal(await page.locator('.page-view.active .task-action-item[data-task-id="t2-dev-03"]').count(), 1);
    assert.match(await page.locator('.page-view.active .task-action-state').innerText(), /Menunggu Farah/);
    await page.locator('.page-view.active [data-work-filter="review"]').click();
    assert.equal(await page.locator('.phase-task-board [data-task-id="t2-dev-03"]').count(), 0, 'My submission is not a review assigned to me');
    assert.equal(await page.locator('.phase-task-board [data-task-id="t2-review"]').count(), 1);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.workFilter), 'review', 'Replacing the queue must retain control focus');
    await page.locator('.page-view.active [data-work-filter="all"]').click();
    checks.push('own waiting submissions and assigned reviews are separate; category focus survives rerender');
    checks.push('online expires after 90 seconds; hidden tabs do not heartbeat; returning preserves unsaved checklist');

    fixtures.user = 'Febby';
    await page.reload(); await ready();
    await openTask('t2-dev-03');
    await page.locator('#approveTaskBtn').click();
    await page.locator('#taskModalBackdrop').waitFor({ state: 'hidden' });
    await openTask('t2-dev-03');
    await page.locator('#taskDescInput').fill('Edit setelah disetujui');
    await page.locator('#taskForm button[type="submit"]').click();
    await page.locator('#taskModalBackdrop').waitFor({ state: 'hidden' });
    assert.equal(fixtures.calls.filter(call => call.resource === 'tasks' && call.method === 'PUT').at(-1).body.reviewAction, undefined);
    checks.push('review command is not replayed by subsequent edits');

    await page.locator('.progress-note-toggle-btn').click();
    await page.locator('#progressNoteInput-tugas2').fill('Catatan yang masih dikerjakan');
    await openTask('t2-admin');
    await page.locator('#taskDescInput').fill('Perubahan tugas lain');
    await page.locator('#taskForm button[type="submit"]').click();
    await page.locator('#taskModalBackdrop').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('#progressNoteInput-tugas2').inputValue(), 'Catatan yang masih dikerjakan');
    fixtures.fail.add('progress-notes:PUT');
    await page.locator('.save-progress-note-btn').click();
    await page.locator('.progress-note-panel .form-save-error').waitFor();
    assert.equal(await page.locator('#progressNoteInput-tugas2').inputValue(), 'Catatan yang masih dikerjakan');
    fixtures.fail.delete('progress-notes:PUT');
    await page.evaluate(() => { window.qaConfirm = true; });
    checks.push('unsaved phase note survives task saves and a rejected note save');

    await nav('documents');
    await page.locator('.document-archive-card').first().waitFor();
    await page.locator('#documentArchiveSearch').fill('requirements');
    assert.equal(await page.locator('.document-archive-card').count(), 1);
    await page.locator('#resetDocumentFiltersBtn').click();
    await page.locator('#documentArchiveSort').selectOption('name');
    assert.equal(await page.locator('.document-archive-card h3').first().innerText(), 'Analisis Kebutuhan');
    await page.locator('#documentArchiveCategoryFilter').selectOption('poster');
    assert.equal(await page.locator('.document-archive-card').count(), 1);
    checks.push('document filename search, category, sorting, reset');

    await nav('audit');
    await page.waitForFunction(() => capstoneStore.auditLoaded === true);
    assert.equal(fixtures.calls.some(call => call.resource === 'audit-logs' && call.method === 'GET'), true);
    assert.equal(fixtures.calls.some(call => call.resource === 'user-activities' && call.method === 'GET'), true);
    checks.push('audit and activity fetched on demand');

    fixtures.fail.add('snapshot:GET');
    await page.locator('#refreshDataBtn').click();
    await page.locator('#workspaceFeedback .form-save-error').waitFor();
    assert.equal(await page.evaluate(() => capstoneStore.getAll().length), fixtures.tasks.length);
    fixtures.fail.delete('snapshot:GET');
    await page.locator('#refreshDataBtn').click();
    await page.waitForFunction(() => !capstoneStore.syncError);
    assert.match(await page.locator('#dataSyncStatus').innerText(), /Diperbarui/);
    checks.push('failed refresh retains existing data and supports retry');

    await nav('tugas2');
    await page.locator('.page-view.active .generate-ba-btn[data-meeting-id="qa-meeting-a"]').click();
    await page.waitForFunction(() => document.querySelector('#baMeetingIdInput').value === 'qa-meeting-a' && document.querySelector('#beritaAcaraModalBackdrop').classList.contains('active') && !document.querySelector('#baDraftSaveBtn').disabled);
    const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
    await page.locator('#baDocImageInput').setInputFiles({ name: 'qa.png', mimeType: 'image/png', buffer: image });
    await page.waitForFunction(() => document.querySelectorAll('#baDocImagePreviews img').length === 1);
    await page.evaluate(() => { window.qaConfirm = true; });
    await page.locator('#baModalCloseBtn').click();
    await page.locator('.page-view.active .generate-ba-btn[data-meeting-id="qa-meeting-b"]').click();
    await page.waitForFunction(() => document.querySelector('#baMeetingIdInput').value === 'qa-meeting-b' && document.querySelector('#beritaAcaraModalBackdrop').classList.contains('active') && !document.querySelector('#baDraftSaveBtn').disabled);
    assert.equal(await page.locator('#baDocImagePreviews img').count(), 0);
    await page.locator('#baJudulInput').press('Control+a');
    await page.locator('#baJudulInput').press('Backspace');
    assert.equal(await page.locator('#beritaAcaraModalBackdrop').isVisible(), true);
    await page.locator('#baModalCloseBtn').click();
    checks.push('BA meeting state isolated; title deletion does not close modal');

    const openBa = async id => {
      await page.locator(`.page-view.active .generate-ba-btn[data-meeting-id="${id}"]`).click();
      await page.waitForFunction(meetingId => document.querySelector('#baMeetingIdInput').value === meetingId && document.querySelector('#beritaAcaraModalBackdrop').classList.contains('active') && !document.querySelector('#baDraftSaveBtn').disabled, id);
    };
    await openBa('qa-meeting-a');
    await page.locator('#baJudulInput').fill('Judul BA dari server');
    await page.locator('#baLokasiInput').fill('Microsoft Teams\nhttps://example.test/meeting');
    await page.locator('.ba-att-check[value="Farah"]').check();
    await page.locator('.ba-sheet-cell[data-index="0"][data-field="aktivitas"]').fill('Review\nbaris kedua');
    await page.locator('#baDocImageInput').setInputFiles({ name: 'qa.png', mimeType: 'image/png', buffer: image });
    await page.waitForFunction(() => document.querySelectorAll('#baDocImagePreviews img').length === 1);
    fixtures.fail.add('ba-drafts:PUT');
    await page.locator('#baDraftSaveBtn').click();
    await page.locator('#beritaAcaraModalBackdrop .form-save-error').waitFor();
    assert.equal(await page.locator('#baJudulInput').inputValue(), 'Judul BA dari server');
    assert.equal(fixtures.baDrafts['qa-meeting-a'], undefined);
    fixtures.fail.delete('ba-drafts:PUT');
    await page.locator('#baDraftSaveBtn').click();
    await page.waitForFunction(() => document.querySelector('#baDraftStatus').textContent.includes('tersimpan di server'));
    assert.equal(fixtures.baDrafts['qa-meeting-a'].revision, 1);
    assert.equal(fixtures.baDrafts['qa-meeting-a'].payload.images.length, 1);
    const popupReady = page.waitForEvent('popup');
    await page.locator('#baPreviewBtn').click();
    const baPopup = await popupReady;
    await baPopup.waitForFunction(() => document.querySelector('#baPreviewPrintAction')?.disabled === false);
    assert.equal(await baPopup.title(), '01. BA003 - Berita Acara Pertemuan 17 Oktober 2026');
    assert.equal(await baPopup.locator('.ba-table-closing-rule').count(), 3);
    await baPopup.close();
    checks.push('PDF preview waits for persisted BA code; fixed 01 prefix, sequential code, meeting date, repeated closing rules');
    await page.locator('#baModalCloseBtn').click();
    await page.evaluate(() => localStorage.clear());
    await page.reload(); await ready(); await nav('tugas2');
    await openBa('qa-meeting-a');
    assert.equal(await page.locator('#baJudulInput').inputValue(), 'Judul BA dari server');
    assert.equal(await page.locator('#baLokasiInput').inputValue(), 'Microsoft Teams\nhttps://example.test/meeting');
    assert.equal(await page.locator('.ba-att-check[value="Farah"]').isChecked(), true);
    assert.equal(await page.locator('#baDocImagePreviews img').count(), 1);
    assert.match(await page.locator('.ba-sheet-cell[data-index="0"][data-field="aktivitas"]').innerText(), /Review\nbaris kedua/);
    fixtures.baDrafts['qa-meeting-a'].revision += 1;
    fixtures.baDrafts['qa-meeting-a'].payload.judul = 'Versi perangkat lain';
    await page.locator('#baJudulInput').fill('Edit saya jangan hilang');
    await page.locator('#baDraftSaveBtn').click();
    await page.locator('#beritaAcaraModalBackdrop .form-save-error').waitFor();
    assert.equal(await page.locator('#baJudulInput').inputValue(), 'Edit saya jangan hilang');
    assert.equal(fixtures.baDrafts['qa-meeting-a'].payload.judul, 'Versi perangkat lain');
    await page.locator('#baDraftReloadBtn').click();
    await page.waitForFunction(() => document.querySelector('#baJudulInput').value === 'Versi perangkat lain');
    await page.locator('#baModalCloseBtn').click();
    checks.push('BA server roundtrip without localStorage; images/attendance/newlines; save retry; concurrent revision conflict preserves both inputs');

    const legacyPayload = { ...structuredClone(fixtures.baDrafts['qa-meeting-a'].payload), judul: 'Draft lama perangkat', meetingId: 'qa-meeting-a', taskId: 't2-dev-03' };
    const secondLegacy = { ...legacyPayload, judul: 'Draft lama pertemuan kedua', meetingId: 'qa-meeting-b' };
    const legacyRaw = JSON.stringify({ 'qa-meeting-a::t2-dev-03': legacyPayload, 'qa-meeting-b::t2-dev-03': secondLegacy });
    await page.evaluate(raw => {
      localStorage.setItem('capstone_berita_acara_drafts_v1', raw);
      localStorage.setItem('capstone_workspace_v3', '{"historic":"keep without merging into tasks"}');
    }, legacyRaw);
    await page.reload(); await ready();
    await page.waitForFunction(() => capstoneStore.legacyRecovery && !capstoneStore.legacyRecovery.loading);
    assert.equal(await page.evaluate(() => localStorage.getItem('capstone_berita_acara_drafts_v1')), legacyRaw);
    assert.equal(fixtures.baDrafts['qa-meeting-a'].payload.judul, 'Versi perangkat lain');
    assert.equal(fixtures.baDrafts['qa-meeting-b'].payload.judul, 'Draft lama pertemuan kedua');
    assert.equal(await page.evaluate(() => capstoneStore.getAll().length), fixtures.tasks.length);
    assert.equal(Object.values(fixtures.backups).some(backup => backup.entries.capstone_berita_acara_drafts_v1 === legacyRaw), true);
    await nav('tugas2'); await openBa('qa-meeting-a');
    assert.equal(await page.locator('#baDraftLocalBtn').isVisible(), true);
    assert.equal(await page.locator('#baJudulInput').inputValue(), 'Versi perangkat lain');
    await page.locator('#baDraftLocalBtn').click();
    await page.waitForFunction(() => document.querySelector('#baJudulInput').value === 'Draft lama perangkat');
    assert.equal(fixtures.baDrafts['qa-meeting-a'].payload.judul, 'Versi perangkat lain');
    await page.locator('#baModalCloseBtn').click();
    await nav('audit');
    await page.locator('#loadBrowserBackupsBtn').click();
    await page.locator('.download-browser-backup').first().waitFor();
    checks.push('legacy drafts backed up before safe import; server conflict retained; source unchanged; admin recovery downloads available');

    await nav('rbac');
    const permission = () => page.locator('.rbac-permission-toggle[data-role="member"][data-area="pages"][data-permission="tugas2"]');
    const togglePermission = () => permission().locator('..').click();
    fixtures.fail.add('rbac:POST');
    await togglePermission();
    await page.waitForFunction(() => document.querySelector('.rbac-permission-toggle[data-role="member"][data-area="pages"][data-permission="tugas2"]').disabled === false);
    assert.equal(await permission().isChecked(), true);
    fixtures.fail.delete('rbac:POST');
    await togglePermission();
    await page.waitForFunction(() => RBAC.matrix.member.pages.tugas2 === false);
    await togglePermission();
    await page.waitForFunction(() => RBAC.matrix.member.pages.tugas2 === true);
    checks.push('permission toggles await server persistence; failed writes roll back; retry succeeds');

    fixtures.authenticated = false;
    await page.evaluate(() => localStorage.clear());
    await page.reload(); await ready();
    await page.locator('#loginUsername').fill('qa.Febby');
    await page.locator('#loginPassword').fill('synthetic-only');
    fixtures.fail.add('snapshot:GET');
    await page.locator('#loginSubmitBtn').click();
    await page.waitForFunction(() => document.querySelector('#loginError').textContent.length > 0);
    assert.equal(await page.locator('body').evaluate(el => el.classList.contains('is-authenticated')), false);
    assert.equal(await page.locator('#loginSubmitBtn').isEnabled(), true);
    assert.equal(await page.locator('#loginUsername').inputValue(), 'qa.Febby');
    fixtures.fail.delete('snapshot:GET');
    await page.locator('#loginSubmitBtn').click();
    await page.waitForFunction(() => document.body.classList.contains('is-authenticated'));
    await page.waitForFunction(() => document.querySelector('#bannerGreeting').textContent.includes('Dasbor Manajemen'));
    assert.equal(await page.locator('#dashboard .personal-task-card').count(), 1);
    assert.equal(fixtures.errors.length, 0, fixtures.errors.join('\n'));
    checks.push('first login snapshot failure stays on login; retry renders dashboard without reload');

    fixtures.authenticated = false;
    fixtures.anonymousSnapshotDelay = 4000;
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#loginUsername').fill('qa.Febby');
    await page.locator('#loginPassword').fill('synthetic-only');
    await page.locator('#loginSubmitBtn').click();
    await page.evaluate(() => capstoneStore.ready);
    await page.waitForFunction(() => document.body.classList.contains('is-authenticated') && document.querySelector('#bannerGreeting').textContent.includes('Dasbor Manajemen'));
    await page.waitForFunction(() => document.querySelector('#loginSubmitBtn').disabled === false);
    assert.equal(await page.evaluate(() => capstoneStore.getCurrentUser().id), 'Febby');
    assert.equal(await page.locator('#dashboard .personal-task-card').count(), 1);
    assert.equal(await page.locator('.page-view.active').getAttribute('id'), 'dashboard');
    fixtures.anonymousSnapshotDelay = 0;
    checks.push('login waits for delayed anonymous snapshot; session and dashboard remain populated');

    fixtures.user = 'Rival';
    fixtures.authenticated = false;
    await page.evaluate(() => localStorage.clear());
    await page.reload(); await ready();
    await page.locator('#loginUsername').fill('qa.Rival');
    await page.locator('#loginPassword').fill('synthetic-only');
    await page.locator('#loginSubmitBtn').click();
    await page.waitForFunction(() => document.body.classList.contains('is-authenticated') && document.querySelector('.page-view.active')?.id === 'tugas1');
    assert.equal(await page.locator('.sidebar-nav [data-target="users"]').isVisible(), false);
    assert.equal(await page.evaluate(() => capstoneStore.getAll().length), fixtures.tasks.length);
    fixtures.user = 'Febby';
    await page.reload(); await ready();
    checks.push('first member login activates permitted page without exposing admin menus');

    const businessBeforeStatus = JSON.stringify({ tasks: fixtures.tasks, archives: fixtures.archives, drafts: fixtures.baDrafts });
    await nav('users');
    const farahStatus = () => page.locator('.user-status-btn[data-user-id="Farah"]');
    fixtures.fail.add('users:PUT');
    await farahStatus().click();
    await page.waitForFunction(() => document.querySelector('.user-status-btn[data-user-id="Farah"]').disabled === false);
    assert.notEqual(fixtures.users.Farah.isActive, false);
    fixtures.fail.delete('users:PUT');
    await farahStatus().click();
    await page.waitForFunction(() => capstoneStore.getUserById('Farah').isActive === false);
    assert.equal(JSON.stringify({ tasks: fixtures.tasks, archives: fixtures.archives, drafts: fixtures.baDrafts }), businessBeforeStatus, 'Account status must not rewrite business records');
    assert.equal(await page.locator('.user-status-btn[data-user-id="Febby"]').count(), 0);
    await nav('tugas2');
    await openTask('t2-revision');
    assert.match(await page.locator('#taskNextAction').innerText(), /nonaktif/);
    assert.equal(await page.locator('#taskPicSelect option[value="Farah"]').count(), 0);
    assert.equal(await page.locator('#taskReviewerSelect option[value="Farah"]').isDisabled(), true);
    await closeTask();
    await openBa('qa-meeting-a');
    assert.equal(await page.locator('.ba-att-check').count(), 4);
    assert.equal(await page.locator('.ba-att-check[value="Farah"]').count(), 0);
    for (const checkbox of await page.locator('.ba-att-check').all()) await checkbox.check();
    const rosterPopupPromise = page.waitForEvent('popup');
    await page.locator('#baPreviewBtn').click();
    const rosterPopup = await rosterPopupPromise;
    await rosterPopup.locator('#baPreviewPrintAction:not([disabled])').waitFor();
    const attendanceCells = rosterPopup.locator('.ba-document-table').nth(1).locator('tbody td');
    assert.doesNotMatch(await attendanceCells.nth(0).innerText(), /Farah/);
    assert.equal((await attendanceCells.nth(2).innerText()).trim(), '-');
    assert.equal(await rosterPopup.locator('.ba-signature-col').count(), 4);
    await rosterPopup.close();
    await page.locator('#baModalCloseBtn').click();
    await nav('users');
    await farahStatus().click();
    await page.waitForFunction(() => capstoneStore.getUserById('Farah').isActive === true);
    checks.push('superadmin deactivation/reactivation; rejected status retains data; inactive assignees readonly; four-member BA roster and dash absence; historical records retained');

    const originalTasksForActionDesign = fixtures.tasks;
    fixtures.tasks = [...fixtures.tasks, ...Array.from({ length: 5 }, (_, i) => ({
      ...fixtures.tasks[0], id: `qa-action-${i}`, phase: 'tugas2', pic: i === 4 ? 'Rival' : 'Febby', reviewer: i === 4 ? 'Febby' : 'Cintia',
      title: ['Perancangan Sistem dan Database', 'Pengembangan dan Penyempurnaan ShifaStock', 'Dokumentasi Hasil Implementasi dan Pengujian Sistem Persediaan Obat', 'Review Ringkasan Kebutuhan Sistem', 'Validasi Proses Bisnis Klinik'][i],
      status: 'Sedang Dikerjakan', reviewStatus: i >= 3 ? 'submitted' : 'none', meetings: [], checklistDone: [true, i === 2]
    }))];
    await page.reload(); await ready(); await nav('tugas2');
    const actionSection = () => page.locator('#tugas2 .phase-actions');
    const writesBeforeDesign = fixtures.calls.filter(call => ['tasks', 'users', 'ba-drafts'].includes(call.resource) && ['PUT', 'POST', 'DELETE'].includes(call.method)).length;
    await actionSection().locator('[data-work-filter="mine"]').click();
    assert.equal(await actionSection().locator('.task-action-item').count(), 3);
    await actionSection().locator('[data-expand-work]').click();
    assert.equal(await actionSection().locator('.task-action-item').count(), 4);
    assert.equal(await actionSection().locator('[data-expand-work]').getAttribute('aria-expanded'), 'true');
    await actionSection().locator('[data-expand-work]').click();
    assert.equal(await actionSection().locator('.task-action-item').count(), 3);
    for (const width of [360, 390, 768, 1365]) {
      await page.setViewportSize({ width, height: 900 });
      await actionSection().scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1);
      await actionSection().evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `action queue width ${width}`);
      assert.equal(await actionSection().locator('.phase-action-tab').count(), 4);
      await actionSection().screenshot({ path: path.join(output, `action-queues-${width}.png`), animations: 'disabled' });
    }
    await actionSection().locator('[data-work-filter="waiting"]').click();
    assert.equal(await actionSection().locator('.task-action-item').count(), 1);
    await actionSection().screenshot({ path: path.join(output, 'action-queues-waiting.png'), animations: 'disabled' });
    await actionSection().locator('[data-work-filter="review"]').click();
    assert.equal(await actionSection().locator('.task-action-item[data-task-id="qa-action-4"]').count(), 1);
    assert.equal(await actionSection().locator('.task-action-item[data-task-id="qa-action-3"]').count(), 0);
    await actionSection().locator('.task-action-item').first().click();
    assert.equal(await page.locator('#taskModalBackdrop').isVisible(), true);
    await closeTask();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await actionSection().locator('.has-attention').first().evaluate(el => getComputedStyle(el, '::after').animationName), 'none');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await actionSection().screenshot({ path: path.join(output, 'action-queues-dark.png'), animations: 'disabled' });
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    assert.equal(await actionSection().locator('.has-attention').first().evaluate(el => getComputedStyle(el, '::after').animationIterationCount), '2');
    assert.equal(fixtures.calls.filter(call => ['tasks', 'users', 'ba-drafts'].includes(call.resource) && ['PUT', 'POST', 'DELETE'].includes(call.method)).length, writesBeforeDesign, 'Queue selection/expansion must not write business data');
    fixtures.tasks = originalTasksForActionDesign;
    await page.setViewportSize({ width: 1365, height: 900 });
    await page.reload(); await ready();
    checks.push('four colored action queues; real expand/collapse; task opening; responsive light/dark; reduced motion; no business writes');

    const layout = [];
    for (const width of [360, 390, 768, 1365]) {
      await page.setViewportSize({ width, height: 900 });
      await nav('tugas2');
      await page.locator('.page-view.active [data-task-view="list"]').click();
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `task layout ${width}`);
      await page.screenshot({ path: path.join(output, `tasks-${width}.png`), fullPage: true, animations: 'disabled' });
      await nav('documents');
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: path.join(output, `documents-${width}.png`), fullPage: true, animations: 'disabled' });
      const overflow = await page.evaluate(() => Array.from(document.querySelectorAll('#documents *, .top-header *')).filter(el => el.getClientRects().length && el.getBoundingClientRect().right > innerWidth + 1).map(el => ({ tag: el.tagName, id: el.id, class: el.className, right: el.getBoundingClientRect().right })).slice(0, 12));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `documents layout ${width}: ${JSON.stringify(overflow)}`);
      layout.push(width);
      await nav('users');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `users layout ${width}`);
      await page.screenshot({ path: path.join(output, `users-${width}.png`), fullPage: true, animations: 'disabled' });
    }
    fixtures.user = 'Rival';
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => { localStorage.removeItem('capstone_task_view_v1'); });
    await page.reload(); await ready();
    await nav('tugas2');
    assert.equal(await page.locator('.page-view.active [data-task-view="list"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#documentArchiveForm').isVisible(), false);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: path.join(output, 'member-mobile.png'), fullPage: true, animations: 'disabled' });
    checks.push('mobile defaults to list; member has no document CRUD');
    assert.equal(await page.locator('.user-status-btn').count(), 0, 'Members must not receive account status controls');
    assert.equal(fixtures.errors.length, 0, fixtures.errors.join('\n'));
    console.log(JSON.stringify({ passed: checks, responsiveWidths: layout, screenshots: output, errors: fixtures.errors }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
