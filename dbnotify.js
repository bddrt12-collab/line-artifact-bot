// Diff the artifact's `machines` collection (exported as one JSON file per document)
// against the last snapshot and push a short Thai summary to LINE.
// Usage: node dbnotify.js <dir with machines/*.json>
const fs = require('fs');
const path = require('path');
const { push } = require('./line');

const SNAP = path.join(__dirname, '.snapshots', 'machines.json');
const MAX_LINES = 5;

function load(dir) {
  const rows = {};
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    rows[path.basename(f, '.json')] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  }
  return rows;
}

const label = (id, r) => `${id} ${r.branch || ''}${r.province ? ` (${r.province})` : ''}`.trim();
const show = (v) => (v === '' || v == null ? '-' : String(v));

function section(icon, title, lines) {
  if (!lines.length) return [];
  const more = lines.length > MAX_LINES ? [`  …และอีก ${lines.length - MAX_LINES} รายการ`] : [];
  return [`${icon} ${title} ${lines.length}`, ...lines.slice(0, MAX_LINES).map((l) => `• ${l}`), ...more];
}

function summarize(prev, now) {
  const ids = Object.keys(now);
  if (!prev) return `🔔 เบิกเครื่อง: เริ่มติดตาม ${ids.length} รายการ`;

  const added = ids.filter((id) => !(id in prev)).map((id) => label(id, now[id]));
  const removed = Object.keys(prev).filter((id) => !(id in now)).map((id) => label(id, prev[id]));
  const changed = [];
  for (const id of ids.filter((id) => id in prev)) {
    const keys = new Set([...Object.keys(prev[id]), ...Object.keys(now[id])]);
    const diffs = [...keys]
      .filter((k) => JSON.stringify(prev[id][k]) !== JSON.stringify(now[id][k]))
      .map((k) => `${k}: ${show(prev[id][k])} → ${show(now[id][k])}`);
    if (diffs.length) changed.push(`${label(id, now[id])} — ${diffs.join(', ')}`);
  }
  if (!added.length && !removed.length && !changed.length) return null;
  return [
    '🔔 เบิกเครื่อง: มีการเปลี่ยนแปลง',
    ...section('➕', 'เพิ่ม', added),
    ...section('✏️', 'แก้ไข', changed),
    ...section('➖', 'ลบ', removed),
  ].join('\n');
}

async function main() {
  const dir = process.argv[2];
  if (!dir || !fs.existsSync(dir)) throw new Error(`export dir not found: ${dir}`);
  const now = load(dir);
  const prev = fs.existsSync(SNAP) ? JSON.parse(fs.readFileSync(SNAP, 'utf8')) : null;
  const text = summarize(prev, now);
  if (text) await push(text);
  // Only advance the snapshot after LINE accepted the message, so a failed push is retried next run.
  fs.mkdirSync(path.dirname(SNAP), { recursive: true });
  const sorted = Object.fromEntries(Object.keys(now).sort().map((id) => [id, now[id]]));
  fs.writeFileSync(SNAP, JSON.stringify(sorted, null, 2));
  console.log(text ? 'sent' : 'no change');
}

if (require.main === module)
  main().catch((e) => {
    console.error('[dbnotify]', e.message);
    process.exit(1);
  });

module.exports = { load, summarize };
