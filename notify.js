// PostToolUse hook: when an artifact is published, push a short summary to LINE.
const fs = require('fs');
const path = require('path');
const { push } = require('./line');

const SNAP_DIR = path.join(__dirname, '.snapshots');

const textLines = (html) =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

const clip = (s, n = 50) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

function summarize(file, input) {
  const html = fs.readFileSync(file, 'utf8');
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || path.basename(file);
  const snap = path.join(SNAP_DIR, path.basename(file) + '.txt');
  const now = textLines(html);
  fs.mkdirSync(SNAP_DIR, { recursive: true });
  const prev = fs.existsSync(snap) ? fs.readFileSync(snap, 'utf8').split('\n') : null;
  fs.writeFileSync(snap, now.join('\n'));

  const head = `🔔 อัปเดต: ${title}`;
  const note = input.label || input.description;
  if (!prev) return [head, note && `📝 ${clip(note, 80)}`, '(เผยแพร่ครั้งแรก)'].filter(Boolean).join('\n');

  const before = new Set(prev);
  const after = new Set(now);
  const added = now.filter((l) => !before.has(l));
  const removed = prev.filter((l) => !after.has(l));
  if (!added.length && !removed.length) return null;
  return [
    head,
    note && `📝 ${clip(note, 80)}`,
    `➕ ${added.length} บรรทัด  ➖ ${removed.length} บรรทัด`,
    ...added.slice(0, 3).map((l) => `• ${clip(l)}`),
  ]
    .filter(Boolean)
    .join('\n');
}

async function main() {
  const hook = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  const input = hook.tool_input || {};
  const action = input.action || 'publish';
  if (action !== 'publish' || input.asset || !input.file_path || !/\.html?$/i.test(input.file_path)) return;
  const file = path.resolve(hook.cwd || process.cwd(), input.file_path);
  if (!fs.existsSync(file)) return;
  const text = summarize(file, input);
  if (text) await push(text);
}

main().catch((e) => {
  console.error('[line-artifact-bot]', e.message);
  process.exit(0);
});
