// Webhook: replies with the sender's LINE User ID so it can be put in .env as LINE_USER_ID.
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
        if (ev.type !== 'message' && ev.type !== 'follow') continue;
        await fetch('https://api.line.me/v2/bot/message/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LINE_CHANNEL_TOKEN}` },
          body: JSON.stringify({
            replyToken: ev.replyToken,
            messages: [{ type: 'text', text: `User ID ของคุณ:\n${ev.source.userId}` }],
          }),
        }).catch((e) => console.error(e.message));
      }
    });
  })
  .listen(PORT, () => console.log(`webhook on :${PORT}/webhook`));
