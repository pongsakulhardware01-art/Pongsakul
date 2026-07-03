<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally or deploy it to Render.com.

View your app in AI Studio: https://ai.studio/apps/c0da662b-fcba-42e5-8b8c-56edbf777868

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in `.env` to your Gemini API key
3. Run the app:
   `npm run dev`

---

## Deploy to Render (วิธีอัพโหลดขึ้น Render.com)

แอปพลิเคชันนี้ใช้โครงสร้างแบบ Full-Stack (Express Server + React-Vite Frontend) เพื่อให้สามารถสแกนบิลและคำนวณราคาด้วย AI ได้อย่างปลอดภัยและรวดเร็ว

### วิธีการแก้ไขปัญหา "Unexpected token '<' ... is not valid JSON" 
หากท่านพบข้อผิดพลาดขณะเริ่ม Deploy บน Render เนื่องมาจากไฟล์ `package.json` ถูกมองว่าเป็นแผ่นของหน้าเว็บ HTML (`<!doctype html>`) ให้ทำตามขั้นตอนการแก้ไขด้านล่าง:

1. เข้าไปที่คลังเก็บโค้ด (GitHub Repository) ของท่าน: **pongsakulhardware5-star/technologia**
2. ไปที่ไฟล์ `package.json` บนหน้าจอ GitHub แล้วเลือกเขียนทับเนื้อหาด้วยข้อความ JSON ที่ถูกต้องด้านล่างนี้
3. นำเนื้อหา JSON ในหัวข้อด้านล่างนี้ไปวางแทนที่ของเดิมทั้งหมด แล้วกด **Commit changes**
4. ทำการ **Manual Deploy** ใหม่บน Render ระบบจะทำงานผ่านอย่างเรียบร้อยครับ!

### เนื้อหาที่ถูกต้องของ `package.json`
```json
{
  "name": "react-example",
  "private": true,
  "version": "3.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "node dist/server.cjs",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^1.29.0",
    "@tailwindcss/vite": "^4.1.14",
    "@vitejs/plugin-react": "^5.0.4",
    "dotenv": "^17.2.3",
    "express": "^4.21.2",
    "firebase": "^12.13.0",
    "html2canvas": "^1.4.1",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^6.2.3"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^22.14.0",
    "autoprefixer": "^10.4.21",
    "esbuild": "^0.25.0",
    "tailwindcss": "^4.1.14",
    "tsx": "^4.21.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.3"
  }
}
```

### การตั้งค่า Service บน Render.com
เมื่อสร้าง **New Web Service** บน Render:
1. **Repository**: เลือกเชื่อมต่อกับ Repository `technologia` ของท่าน
2. **Language / Runtime**: เลือก **Node**
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. **Environment Variables**:
   - เพิ่มคีย์ `NODE_ENV` ค่าเป็น `production`
   - เพิ่มคีย์ `GEMINI_API_KEY` และใส่รหัส Gemini API Key ของท่านเพื่อเปิดใช้งานระบบแยกสแกนสเปก AI 🤖

