# line-artifact-bot

แจ้งเตือน LINE สรุปสั้น ๆ ทุกครั้งที่ Claude publish artifact (.html)

## ตั้งค่า LINE (ครั้งเดียว)
1. https://developers.line.biz/console → สร้าง Provider → Create **Messaging API** channel
2. แท็บ Basic settings คัดลอก **Channel secret** / แท็บ Messaging API กด Issue **Channel access token (long-lived)**
3. `copy .env.example .env` แล้วใส่ secret + token
4. `node server.js` และเปิด tunnel (เช่น `npx cloudflared tunnel --url http://localhost:3000`) ใส่ `https://<tunnel>/webhook` ใน Webhook URL, เปิด Use webhook
5. สแกน QR เพิ่มบอทเป็นเพื่อน แล้วพิมพ์อะไรก็ได้ — บอทตอบ User ID กลับมา ใส่ใน `LINE_USER_ID`
6. หลังได้ User ID แล้วปิด server/tunnel ได้ — การแจ้งเตือนใช้ push API โดยตรง ไม่ต้องมี server

## การทำงาน
Hook `PostToolUse` (Artifact) ใน `.claude/settings.json` เรียก `notify.js` → เทียบเนื้อหากับ snapshot ครั้งก่อนใน `.snapshots/` → ส่งสรุป (ชื่อ, จำนวนบรรทัดที่เพิ่ม/ลบ, 3 บรรทัดใหม่)
ครั้งแรกที่ publish จะส่ง "เผยแพร่ครั้งแรก" ถ้าเนื้อหาไม่เปลี่ยนจะไม่ส่ง

ข้อจำกัด: จับได้เฉพาะการ publish ผ่าน Claude Code session นี้ (ไม่ใช่การแก้ในหน้าเว็บโดยตรง)
