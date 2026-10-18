/* Native Chrome print regression. Synthetic data only; no application server or database. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { chromium } = require(process.argv[2] || 'playwright');
const source = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const start = source.indexOf('  function buildBeritaAcaraHtml() {');
const end = source.indexOf('  async function previewBeritaAcara()', start);
const helpers = source.slice(source.lastIndexOf('  function escapeHtml('), source.lastIndexOf('\n});'));
const preview = source.indexOf('  async function openBeritaAcaraPreviewTab()');
const templateStart = source.indexOf('`<!DOCTYPE html>', preview);
const templateEnd = source.indexOf('</html>`;', templateStart) + '</html>`'.length;
const members = ['QA A', 'QA B', 'QA C', 'QA D', 'QA E'].map((name, i) => ({ name, fullName: name, nim: `00000000${i}` }));
const data = {
  judul: 'Proyek Pengujian Cetak', hariTanggal: 'Rabu, 14 Oktober 2026', waktu: '21.00-22.34 WIB', lokasi: 'Daring\nhttps://example.test/meeting',
  allMembers: members, attendingMembers: members.slice(0, 4), absentMembers: members.slice(4),
  validActivities: Array.from({ length: 8 }, (_, i) => ({ aktivitas: `${i + 1}. Aktivitas ${i + 1}`, luaran: 'Luaran pengujian dokumen.', pic: 'QA A, QA B',
    catatan: i === 5 ? Array.from({ length: 36 }, (_, j) => `PARAGRAF${j + 1} Catatan panjang harus tetap lengkap dan garis tabel harus tertutup saat berganti halaman.`).join('\n\n') : `Catatan aktivitas ${i + 1}.` }))
};
const context = { collectBeritaAcaraData: () => data, baUploadedImages: [], escapeHtml: undefined, previewTitle: '01. BA003 - Berita Acara Pertemuan 14 Oktober 2026', result: '' };
vm.runInNewContext(`${helpers}\n${source.slice(start, end)}\nconst documentHtml=buildBeritaAcaraHtml();result=${source.slice(templateStart, templateEnd)};`, context);
assert.equal(context.getBeritaAcaraFileName({ documentNumber: 3, payload: { hariTanggal: data.hariTanggal } }), '01. BA003 - Berita Acara Pertemuan 14 Oktober 2026');
assert.equal(context.getBeritaAcaraFileName({ documentNumber: 12, payload: { hariTanggal: 'Senin, 28 September 2026' } }), '01. BA012 - Berita Acara Pertemuan 28 September 2026');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'capstone-ba-print-'));
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.CAPSTONE_BROWSER || 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
    await page.route('**/*', route => route.abort());
    await page.setContent(context.result);
    assert.equal(await page.locator('.ba-document-table').count(), 3);
    assert.equal(await page.locator('.ba-table-closing-rule').count(), 3);
    await page.screenshot({ path: path.join(output, 'preview.png'), fullPage: true });
    await page.pdf({ path: path.join(output, 'ba-print.pdf'), preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false });
    context.baUploadedImages = await page.evaluate(() => [[1600, 900], [900, 1600]].map(([width, height], i) => {
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = i ? '#b8d8c4' : '#bcd4eb'; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#17202a'; ctx.font = '48px Arial'; ctx.fillText(`PHOTO ${i + 1}`, 60, 100);
      ctx.strokeRect(5, 5, width - 10, height - 10);
      return canvas.toDataURL('image/png');
    }));
    const photoContext = { ...context };
    vm.runInNewContext(`${helpers}\n${source.slice(start, end)}\nconst documentHtml=buildBeritaAcaraHtml();result=${source.slice(templateStart, templateEnd)};`, photoContext);
    await page.setContent(photoContext.result);
    await page.locator('.ba-doc-img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    assert.equal(await page.locator('.ba-documentation-first .ba-doc-img').count(), 1);
    assert.equal(await page.locator('.ba-doc-grid').count(), 2);
    await page.pdf({ path: path.join(output, 'docs-print.pdf'), preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false });
    console.log(JSON.stringify({ output, pdf: path.join(output, 'ba-print.pdf'), sourceParagraphs: 36 }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
