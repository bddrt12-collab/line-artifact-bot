// Minimal .env loader (no dependencies).
const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, '.env');
if (fs.existsSync(f))
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
