const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function fixture() {
  const cache = new Map();
  const sandbox = { window: { location: { protocol: 'http:' } }, console,
    localStorage: { getItem: key => cache.get(key) ?? null, setItem: (key, value) => cache.set(key, value), removeItem: key => cache.delete(key) },
    fetch: async () => ({ ok: false, json: async () => ({ ok: false, message: 'QA rejected' }) }) };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/rbac.js'), 'utf8'), sandbox);
  return { sandbox, rbac: sandbox.window.RBAC, cache };
}

test('rejected permission writes do not change the matrix or browser cache', async () => {
  const { rbac, cache } = fixture();
  const before = rbac.matrix.member.pages.tugas2;
  await assert.rejects(() => rbac.set('member', 'pages', 'tugas2', !before), /QA rejected/);
  assert.equal(rbac.matrix.member.pages.tugas2, before);
  assert.equal(cache.size, 0);
});

test('confirmed server permission is authoritative even if browser cache is unavailable', async () => {
  const { rbac, sandbox } = fixture();
  sandbox.fetch = async () => ({ ok: true, json: async () => ({ ok: true, data: { allowed: false } }) });
  sandbox.localStorage.setItem = () => { throw new Error('QA storage full'); };
  await rbac.set('member', 'pages', 'tugas2', true);
  assert.equal(rbac.matrix.member.pages.tugas2, false);
});
