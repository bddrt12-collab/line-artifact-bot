// Webhook: replies with the sender's User ID (1:1 chat) or the Group ID (group chat),
// either of which can be used as LINE_USER_ID, the push destination.
const http = require('http');
const crypto = require('crypto');
require('./env');

const { LINE_CHANNEL_SECRET, LINE_CHANNEL_TOKEN, PORT = 3000 } = process.env;

http
  .createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/webhook') return res.writeHead(404).end();
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      const body = Buffer.concat(chunks);
      const sig = crypto.createHmac('sha256', LINE_CHANNEL_SECRET || '').update(body).digest('base64');
      if (sig !== req.headers['x-line-signature']) return res.writeHead(401).end();
      res.writeHead(200).end();
      for (const ev of JSON.parse(body).events || []) {
        if (!['message', 'follow', 'join'].includes(ev.type)) continue;
        const { groupId, userId } = ev.source;
        const text = groupId ? `Group ID ของกลุ่มนี้:\n${groupId}` : `User ID ของคุณ:\n${userId}`;
        console.log(text.replace('\n', ' '));
        await fetch('https://api.line.me/v2/bot/message/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LINE_CHANNEL_TOKEN}` },
          body: JSON.stringify({
            replyToken: ev.replyToken,
            messages: [{ type: 'text', text }],
          }),
        }).catch((e) => console.error(e.message));
      }
    });
  })
  .listen(PORT, () => console.log(`webhook on :${PORT}/webhook`));
