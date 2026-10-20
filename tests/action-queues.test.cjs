const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function queues(role = 'member') {
  const source = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  const start = source.indexOf('  function getWorkTasks(');
  const end = source.indexOf('  function loadProgressNoteCollapseState()', start);
  assert.ok(start > 0 && end > start);
  const user = { name: 'Me', role };
  const context = {
    activeWorkFilter: 'all', expandedActionQueues: new Set(),
    window: { capstoneStore: { getCurrentUser: () => user } },
    isTaskPic: (task, viewer) => task.pic === viewer?.name,
    isTaskCompletionVerified: task => task.status === 'Selesai',
    canReviewTask: (task, viewer) => role === 'superadmin' || task.reviewer === viewer?.name && task.pic !== viewer?.name,
    getTaskNextAction: () => ({ title: 'Lanjutkan pekerjaan' }),
    escapeHtml: value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
  };
  vm.runInNewContext(source.slice(start, end), context);
  const tasks = [
    { id: 'mine', pic: 'Me', reviewer: 'Other', reviewStatus: 'none' },
    { id: 'waiting', pic: 'Me', reviewer: 'Other', reviewStatus: 'submitted' },
    { id: 'review', pic: 'Other', reviewer: 'Me', reviewStatus: 'submitted' },
    { id: 'not-my-review', pic: 'Other', reviewer: 'Third', reviewStatus: 'submitted' },
    { id: 'revision', pic: 'Me', reviewer: 'Other', reviewStatus: 'revision_requested' },
    { id: 'archived', pic: 'Me', reviewer: 'Other', reviewStatus: 'submitted', archivedAt: 123 },
    { id: 'done', pic: 'Me', reviewer: 'Other', reviewStatus: 'approved', status: 'Selesai' }
  ].map(task => ({ title: 'A task', status: 'Sedang Dikerjakan', checklist: ['one', 'two'], checklistDone: [true, false], ...task }));
  return { context, tasks, user };
}

for (const role of ['member', 'superadmin', 'koordinator']) test(`${role}: my waiting submissions are separate from my assigned review queue`, () => {
  const { context: c, tasks, user } = queues(role);
  const ids = type => Array.from(c.getWorkTasks(type, tasks, user), task => task.id);
  assert.deepEqual(ids('mine'), ['mine', 'revision']);
  assert.deepEqual(ids('waiting'), ['waiting']);
  assert.deepEqual(ids('review'), ['review']);
  const before = JSON.stringify(tasks);
  c.activeWorkFilter = 'waiting';
  const html = c.renderPhaseActionSection('tugas2', tasks, user);
  assert.match(html, /data-queue="waiting"/);
  assert.match(html, /Menunggu Other/);
  assert.doesNotMatch(html, /data-task-id="review"/);
  assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1);
  assert.equal(JSON.stringify(tasks), before, 'Rendering must not mutate tasks or review state');
});

test('review permission remains enforced; preview expansion is scoped per phase and queue', () => {
  const { context: c, tasks, user } = queues();
  c.canReviewTask = () => false;
  assert.equal(c.getWorkTasks('review', tasks, user).length, 0);
  const own = Array.from({ length: 7 }, (_, index) => ({ ...tasks[0], id: `own-${index}` }));
  assert.equal((c.renderPhaseActionSection('tugas2', own, user).match(/class="task-action-item/g) || []).length, 3);
  c.expandedActionQueues.add('tugas2:mine');
  assert.equal((c.renderPhaseActionSection('tugas2', own, user).match(/class="task-action-item/g) || []).length, 7);
  assert.equal((c.renderPhaseActionSection('tugas1', own, user).match(/class="task-action-item/g) || []).length, 3);
});

test('queue markup escapes user text, handles missing checklist, and bounds numeric progress', () => {
  const { context: c, tasks, user } = queues();
  const task = { ...tasks[0], title: '<img src=x onerror=alert(1)>', checklist: [], checklistDone: [] };
  const html = c.renderPhaseActionSection('tugas2', [task], user);
  assert.match(html, /&lt;img/);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /Tanpa checklist/);
  assert.doesNotMatch(html, /<progress/);
  assert.match(c.renderPhaseActionItem({ ...task, checklist: ['one'], checklistDone: [true, true] }, 'mine'), /max="1" value="1"/);
});
