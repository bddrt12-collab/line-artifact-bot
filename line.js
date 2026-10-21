require('./env');

async function push(text) {
  const { LINE_CHANNEL_TOKEN, LINE_USER_ID } = process.env;
  if (!LINE_USER_ID) throw new Error('LINE_USER_ID missing');
  const headers = { 'Content-Type': 'application/json' };
  // Without a token, a cloud Network secret injects the Authorization header for api.line.me.
  if (LINE_CHANNEL_TOKEN) headers.Authorization = `Bearer ${LINE_CHANNEL_TOKEN}`;
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers,
    body: JSON.stringify({ to: LINE_USER_ID, messages: [{ type: 'text', text }] }),
  });
  if (!res.ok) throw new Error(`LINE ${res.status}: ${await res.text()}`);
}

module.exports = { push };
