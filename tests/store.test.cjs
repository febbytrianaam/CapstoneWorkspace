const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function createStore() {
  const cache = new Map();
  const sandbox = {
    window: { location: { protocol: 'file:' }, dispatchEvent() {} },
    localStorage: { getItem: key => cache.get(key) ?? null, setItem: (key, value) => cache.set(key, value), removeItem: key => cache.delete(key) },
    navigator: { userAgent: 'QA fixture' }, console, URLSearchParams,
    CustomEvent: class { constructor(type) { this.type = type; } }
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8'), sandbox);
  const store = sandbox.window.capstoneStore;
  sandbox.window.location.protocol = 'http:';
  store.currentUser = { id: 'QA', name: 'QA', role: 'superadmin' };
  store.users = { QA: { ...store.currentUser, username: 'qa' } };
  store.tasks = [{ id: 'qa-task', title: 'QA task', pic: 'QA', status: 'Sedang Dikerjakan', checklist: ['one'], checklistDone: [false], meetings: [] }];
  store.meetings = [{ id: 'qa-meeting', title: 'QA meeting', taskId: null, hasBeritaAcara: false }];
  store.notifications = [];
  store.auditLogs = [];
  store.progressNotes = {};
  store.legacyEntries = {};
  return { store, sandbox, cache };
}

test('account status waits for server confirmation and never rewrites tasks or notifications', async () => {
  const { store } = createStore();
  store.users.Other = { id: 'Other', name: 'Other', role: 'member', isActive: true };
  const before = JSON.stringify({ tasks: store.tasks, notifications: store.notifications });
  store.commitToBackend = async () => { throw new Error('rejected'); };
  await assert.rejects(() => store.setUserActive('Other', false), /rejected/);
  assert.equal(store.users.Other.isActive, true);
  store.commitToBackend = async () => ({ ...store.users.Other, isActive: false });
  await store.setUserActive('Other', false);
  assert.equal(store.users.Other.isActive, false);
  assert.equal(JSON.stringify({ tasks: store.tasks, notifications: store.notifications }), before);
  store.currentUser.role = 'member';
  await assert.rejects(() => store.setUserActive('Other', true), /superadmin/);
});

test('BA roster and automatic PIC text exclude inactive accounts without deleting history', () => {
  const source = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  const start = source.indexOf('  function getBeritaAcaraMembers()');
  const end = source.indexOf('  function ensureMinimumBaActivityRows(', start);
  assert.ok(start > 0 && end > start);
  const users = Object.fromEntries(['A', 'B', 'C', 'D', 'Former'].map(name => [name, { id: name, name, isActive: name !== 'Former' }]));
  const context = { window: { capstoneStore: { getUsers: () => users, getCurrentUser: () => users.A } } };
  vm.runInNewContext(source.slice(start, end), context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.getBeritaAcaraMembers())).map(user => user.name), ['A', 'B', 'C', 'D']);
  assert.equal(context.buildDefaultBeritaAcaraActivities({}, { pic: 'Former' })[0].pic, 'A, B, C, D');
  assert.equal(context.buildDefaultBeritaAcaraActivities({}, { pic: 'B' })[0].pic, 'B');
  assert.equal(Object.keys(users).length, 5);
});

test('online snapshots and expired sessions preserve unbacked legacy work data', async () => {
  const { store, cache, sandbox } = createStore();
  const original = '{"local":"unsynced work"}';
  cache.set('capstone_workspace_v3', original);
  cache.set('capstone_berita_acara_drafts_v1', '{"legacy":"keep exactly"}');
  store.save();
  assert.equal(cache.get('capstone_workspace_v3'), original);
  store.clearAuthenticatedUser();
  assert.equal(cache.get('capstone_workspace_v3'), original);
  assert.equal(cache.get('capstone_berita_acara_drafts_v1'), '{"legacy":"keep exactly"}');
});

test('legacy recovery backs up before importing and never deletes its source', async () => {
  const { store, cache } = createStore();
  const raw = '{"old-meeting":{"judul":"Original"}}';
  store.legacyEntries = { capstone_berita_acara_drafts_v1: raw };
  cache.set('capstone_berita_acara_drafts_v1', raw);
  const calls = [];
  store.sendToBackend = async resource => {
    calls.push(resource);
    return resource === 'browser-backups' ? { ok: true, data: { id: 'backup-id' } } : { ok: true, data: { saved: 0, conflicts: ['old-meeting'], unresolved: [] } };
  };
  const result = await store.recoverLegacyStorage();
  assert.deepEqual(calls, ['browser-backups', 'ba-drafts']);
  assert.equal(result.backupId, 'backup-id');
  assert.equal(result.conflicts.length, 1);
  assert.equal(cache.get('capstone_berita_acara_drafts_v1'), raw);
  store.legacyRecovery = null;
  calls.length = 0;
  store.sendToBackend = async resource => { calls.push(resource); return { ok: false }; };
  assert.match((await store.recoverLegacyStorage()).error, /belum tersimpan/);
  assert.deepEqual(calls, ['browser-backups']);
  assert.equal(cache.get('capstone_berita_acara_drafts_v1'), raw);
});

test('draft API preserves version conflicts and does not fall back to localStorage', async () => {
  const { store, sandbox, cache } = createStore();
  sandbox.console = { info() {}, error() {} };
  sandbox.fetch = async () => ({ ok: false, status: 409, json: async () => ({ ok: false, conflict: true, message: 'Newer revision', data: { revision: 3 } }) });
  await assert.rejects(() => store.saveBeritaAcaraDraft('qa-meeting', { judul: 'Keep input' }, 1), error => error.conflict && error.currentDraft.revision === 3);
  assert.equal(cache.has('capstone_berita_acara_drafts_v1'), false);
});

test('phase access waits for recorded navigation and does not request audit logs', async () => {
  const { store } = createStore();
  let finishWrite;
  store.activityWrite = new Promise(resolve => { finishWrite = resolve; });
  const calls = [];
  store.sendToBackend = async (...args) => {
    calls.push(args);
    return { ok: true, data: { members: [{ id: 'QA', name: 'QA', lastAccessAt: 123 }], serverTime: 456 } };
  };
  const pending = store.getPhaseAccess('tugas2');
  assert.equal(calls.length, 0);
  finishWrite();
  const result = await pending;
  assert.equal(result.members[0].lastAccessAt, 123);
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [['phase-access', 'GET', null, { phase: 'tugas2' }]]);
  await assert.rejects(() => store.getPhaseAccess('users'), /tidak valid/);
  assert.equal(calls.length, 1);
});

test('phase access rejects failed requests and responses from an old session', async () => {
  const { store } = createStore();
  store.sendToBackend = async () => ({ ok: false, message: 'QA rejected' });
  await assert.rejects(() => store.getPhaseAccess('tugas1'), /Akses terakhir tim belum dapat dimuat/);
  store.sendToBackend = async () => {
    store.currentUser = { id: 'Other' };
    return { ok: true, data: { members: [], serverTime: 123 } };
  };
  await assert.rejects(() => store.getPhaseAccess('tugas1'), /Sesi telah berubah/);
});

test('rejected CRUD requests leave business data and notifications unchanged', async () => {
  const actions = [
    store => store.add({ title: 'not saved', pic: 'QA' }),
    store => store.update('qa-task', { description: 'not saved' }),
    store => store.delete('qa-task'),
    store => store.addUser({ name: 'New QA', username: 'newqa', password: 'temporary-test-password' }),
    store => store.updateUser('QA', { name: 'not saved' }),
    store => store.deleteUser('QA'),
    store => store.saveProgressNote('tugas2', 'not saved'),
    store => store.createMeeting({ title: 'not saved' }),
    store => store.updateMeeting('qa-meeting', { title: 'not saved' }),
    store => store.deleteMeeting(null, 'qa-meeting'),
    store => store.markMeetingBeritaAcara(null, 'qa-meeting')
  ];
  for (const action of actions) {
    const { store } = createStore();
    store.sendToBackend = async () => ({ ok: false, message: 'QA rejected' });
    const before = JSON.stringify({ users: store.users, tasks: store.tasks, meetings: store.meetings, notes: store.progressNotes, notifications: store.notifications });
    await assert.rejects(() => action(store), /QA rejected/);
    assert.equal(JSON.stringify({ users: store.users, tasks: store.tasks, meetings: store.meetings, notes: store.progressNotes, notifications: store.notifications }), before);
  }
});

test('task update sends a delta and uses server state without retaining review commands', async () => {
  const { store } = createStore();
  const sent = [];
  store.sendToBackend = async (resource, method, body) => {
    if (resource !== 'tasks') return { ok: true, data: body };
    sent.push(structuredClone(body));
    return { ok: true, data: { ...store.tasks[0], description: body.description || '', status: 'Selesai', reviewStatus: 'approved', updatedAt: 123 } };
  };
  await store.update('qa-task', { reviewAction: 'approve' });
  await store.update('qa-task', { description: 'changed' });
  assert.deepEqual(sent, [{ reviewAction: 'approve' }, { description: 'changed' }]);
  assert.equal(store.tasks[0].updatedAt, 123);
  assert.equal(store.tasks[0].reviewAction, undefined);
});

test('initial snapshot opts out of logs while audit data is fetched on demand', async () => {
  const { store, sandbox } = createStore();
  let requested = '';
  sandbox.fetch = async url => {
    requested = url;
    return { status: 200, ok: true, json: async () => ({ ok: true, data: { currentUser: store.currentUser, tasks: [], users: {}, notifications: [], meetings: [], progressNotes: {} } }) };
  };
  assert.equal((await store.syncFromBackend()).ok, true);
  assert.match(requested, /include_logs=0/);
  const calls = [];
  store.sendToBackend = async resource => { calls.push(resource); return { ok: true, data: [] }; };
  await store.fetchAuditData();
  assert.deepEqual(calls.sort(), ['audit-logs', 'user-activities']);
  assert.equal(store.auditLoaded, true);
});

test('a failed logout preserves the current session state and is reported', async () => {
  const { store, sandbox } = createStore();
  sandbox.fetch = async () => ({ ok: false, status: 500 });
  await assert.rejects(() => store.logout(), /Belum berhasil keluar/);
  assert.equal(store.currentUser.id, 'QA');
});

test('a full browser cache does not turn a confirmed server write into a failed save', async () => {
  const { store, sandbox } = createStore();
  sandbox.localStorage.setItem = () => { throw new Error('QA cache full'); };
  sandbox.console = { info() {}, error() {} };
  store.sendToBackend = async (resource, method, body) => ({ ok: true, data: resource === 'tasks' ? { ...store.tasks[0], ...body } : body });
  await store.update('qa-task', { description: 'server confirmed' });
  assert.equal(store.tasks[0].description, 'server confirmed');
});
