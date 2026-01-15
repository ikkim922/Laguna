
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

// Configure CORS to allow requests from any origin (useful for local development)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

// Database Connection (PostgreSQL)
const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'Laguna92637',
  database: 'laguna_portal',
  port: 5432,
});

// Mailtrap Transporter
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER || "23ba614c35eb4a",
    pass: process.env.MAILTRAP_PASS || "5a6bb7df85ef32"
  }
});

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

/**
 * Notify all members about a new post
 */
app.post('/api/email/notify-new-post', async (req, res) => {
  console.log(`[${new Date().toISOString()}] Received notification request for post: "${req.body.title}"`);
  const { title, author, category, author_email } = req.body;

  try {
    // 1. Fetch all registered member emails from the database
    const { rows } = await pool.query('SELECT email FROM members WHERE email IS NOT NULL');
    const memberEmails = rows.map(r => r.email).filter(e => e && e.includes('@'));

    if (memberEmails.length === 0 && !author_email) {
      console.warn("No recipients found in the database.");
      return res.status(200).json({ success: true, message: "No recipients found." });
    }

    const mailOptions = {
      from: '"라구나 한인들" <noreply@lagunakorean.org>',
      to: author_email || memberEmails[0], // Direct recipient
      bcc: memberEmails, // Bulk recipients (privacy protected)
      subject: `[라구나 소식] 새로운 글이 등록되었습니다: ${title}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #1E40AF;">라구나 한인들 커뮤니티 알림</h2>
          <p>안녕하세요, 라구나 한인들 커뮤니티에 새로운 소식이 올라왔습니다.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>게시판:</strong> ${category}</p>
          <p><strong>제목:</strong> ${title}</p>
          <p><strong>작성자:</strong> ${author}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p>지금 바로 홈페이지에서 확인해보세요!</p>
          <a href="https://laguna-korean.vercel.app/#/board" style="display: inline-block; padding: 10px 20px; background-color: #1E40AF; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">게시판 바로가기</a>
          <p style="font-size: 12px; color: #999; margin-top: 30px;">본 메일은 수신동의를 하신 회원님들께 발송되는 자동 발송 메일입니다.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Bulk notification sent:", info.messageId);
    res.json({ success: true, messageId: info.messageId, recipientCount: memberEmails.length });
  } catch (error) {
    console.error("Notification Error Detail:", error);
    res.status(500).json({ 
      success: false, 
      error: "이메일 알림 발송 중 오류가 발생했습니다.", 
      detail: error.message 
    });
  }
});

// --- DATABASE ROUTES ---
app.get('/api/posts', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM posts ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "데이터베이스 조회 실패", detail: err.message });
  }
});

app.post('/api/posts', async (req, res) => {
  let client;
  try {
    const posts = req.body;
    client = await pool.connect();
    await client.query('BEGIN');
    await client.query('DELETE FROM posts');
    if (posts.length > 0) {
      for (const p of posts) {
        await client.query(
          'INSERT INTO posts (id, title, author, date, category, content) VALUES ($1, $2, $3, $4, $5, $6)',
          [p.id, p.title, p.author, p.date, p.category, p.content]
        );
      }
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    res.status(500).json({ error: "데이터베이스 저장 실패", detail: err.message });
  } finally {
    if (client) client.release();
  }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
