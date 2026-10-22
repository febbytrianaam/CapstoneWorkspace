/* Real mobile viewport emulation; synthetic data only, all requests intercepted. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { chromium } = require(process.argv[2] || 'playwright');
const root = path.resolve(__dirname, '..');
const html = execFileSync('php', ['index.php'], { cwd: root, encoding: 'utf8' });
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'capstone-mobile-nav-'));
const assets = Object.fromEntries(['js/app.js', 'js/data.js', 'js/rbac.js', 'js/task-reports.js', 'js/task-reports-ui.js', 'css/style.css'].map(file => [`/${file}`, fs.readFileSync(path.join(root, file))]));
const word = 'Evidence'.repeat(24);

async function main() {
  const browser = await chromium.launch({ channel: process.env.CAPSTONE_BROWSER || 'chrome', headless: true });
  const results = [];
  console.log(`Screenshots: ${output}`);
  try {
    for (const role of ['member', 'superadmin']) for (const width of [360, 390, 412]) for (const mode of ['kanban', 'list']) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      const page = await context.newPage();
      const errors = [], writes = [];
      page.on('pageerror', e => errors.push(e.message));
      const viewer = { id: 'QA', name: 'QA', role, roles: [role], isActive: true, initial: 'QA', color: '#2563eb' };
      const reviewer = { id: 'Reviewer', name: 'Reviewer', role: 'member', roles: ['member'], isActive: true, initial: 'RE', color: '#0f766e' };
      const tasks = ['tugas1', 'tugas2', 'tugas3'].flatMap(phase => ['none', 'submitted', 'revision_requested', 'approved'].map((reviewStatus, i) => ({
        id: `${phase}-qa-${i}`, phase, title: `${phase} - ${word}`, description: `Deskripsi ${word}`,
        pic: 'QA', reviewer: 'Reviewer', status: i === 3 ? 'Selesai' : 'Sedang Dikerjakan', priority: 'Tinggi', reviewStatus,
        reviewNote: i === 2 ? `Perbaiki sumber ${word}` : '', checklist: ['Langkah pengujian'], checklistDone: [false],
        deliverableUrl: `https://example.com/${word}`, updatedAt: Date.now(), createdAt: Date.now(),
        meetings: role === 'member' ? [] : [{ id: `${phase}-meeting`, phase, taskId: `${phase}-qa-${i}`, title: `Agenda ${word}`, notes: `Dokumen https://example.com/${word}`, date: '2026-10-22T19:00', endDate: '2026-10-22T21:00', host: 'QA', url: 'https://example.com/meeting' }]
      })));
      await context.addInitScript(({ mode }) => {
        localStorage.setItem('capstone_current_page_v3', 'tugas1');
        localStorage.setItem('capstone_task_view_v1', mode);
      }, { mode });
      await context.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url());
        if (url.hostname !== 'localhost') {
          if (url.pathname.includes('chart')) return route.fulfill({ contentType: 'text/javascript', body: 'window.Chart=class{destroy(){}};' });
          if (url.pathname.includes('sweetalert')) return route.fulfill({ contentType: 'text/javascript', body: 'window.Swal={fire:async()=>({isConfirmed:true})};' });
          return route.fulfill({ status: 404, body: '' });
        }
        if (url.pathname.includes('/backend/api/')) {
          const resource = url.searchParams.get('resource');
          if (request.method() !== 'GET' && !['presence', 'user-activities'].includes(resource)) writes.push(resource);
          const data = resource === 'snapshot' ? { currentUser: viewer, users: { QA: viewer, Reviewer: reviewer }, tasks, meetings: [], notifications: [], progressNotes: {} }
            : resource === 'auth' ? viewer
            : resource === 'phase-access' ? { members: [{ ...viewer, lastAccessAt: Date.now(), lastSeenAt: Date.now() }], serverTime: Date.now() }
            : resource === 'presence' ? { serverTime: Date.now() }
            : [];
          return route.fulfill({ json: { ok: true, data } });
        }
        if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: html });
        if (assets[url.pathname]) return route.fulfill({ contentType: url.pathname.endsWith('.js') ? 'text/javascript' : 'text/css', body: assets[url.pathname] });
        return route.fulfill({ status: 404, body: '' });
      });
      await page.goto('http://localhost:43798/');
      await page.waitForFunction(() => document.documentElement.classList.contains('data-ready'));
      for (const phase of ['tugas2', 'tugas3', 'tugas1']) {
        await page.locator('#sidebarToggleBtn').tap();
        await page.locator(`.sidebar-nav [data-target="${phase}"]`).tap();
        await page.waitForFunction(id => document.querySelector('.page-view.active')?.id === id && !document.querySelector('.sidebar').classList.contains('open'), phase);
        await page.waitForFunction(() => document.querySelector('.sidebar').getBoundingClientRect().right <= 1);
        const metrics = await page.evaluate(() => ({
          inner: innerWidth, document: document.documentElement.scrollWidth, viewport: visualViewport.width, scale: visualViewport.scale,
          offenders: [...document.querySelectorAll('.page-view.active *')].map(el => ({ tag: el.tagName, className: el.className, width: Math.round(el.getBoundingClientRect().width), right: Math.round(el.getBoundingClientRect().right) })).filter(el => el.right > innerWidth + 1).slice(0, 12)
        }));
        const result = { role, width, mode, phase, ...metrics }; results.push(result);
        if (phase === 'tugas2') { await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.screenshot({ path: path.join(output, `${role}-${width}-${mode}.png`), fullPage: true, animations: 'disabled' }); }
        if (metrics.document > width + 1 || metrics.inner > width + 1 || Math.abs(metrics.scale - 1) > 0.01) console.log(JSON.stringify(result));
        assert.equal(metrics.document <= width + 1, true, 'Page must not expand the mobile viewport');
        assert.equal(metrics.inner <= width + 1, true, 'Layout viewport must retain device width');
        assert.equal(Math.abs(metrics.scale - 1) <= 0.01, true, 'Sidebar navigation must retain the mobile visual scale');
      }
      assert.deepEqual(errors, []); assert.deepEqual(writes, []);
      await context.close();
    }
    console.log(JSON.stringify({ passed: results.length, screenshots: output }));
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
