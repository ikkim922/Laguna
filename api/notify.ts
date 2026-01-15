
import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Vercel server-side environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

// SMTP Config (Defaults to Mailtrap for testing, but can be overridden by ENV)
const smtpConfig = {
  host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
  port: parseInt(process.env.SMTP_PORT || "2525"),
  auth: {
    user: process.env.SMTP_USER || "23ba614c35eb4a",
    pass: process.env.SMTP_PASS || "5a6bb7df85ef32"
  }
};

const transporter = nodemailer.createTransport(smtpConfig);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration for Vercel functions
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, author, category, author_email } = req.body;

  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment variables are missing on the server.");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Fetch member emails from Supabase
    const { data: members, error: supabaseError } = await supabase
      .from('members')
      .select('email')
      .not('email', 'is', null);

    if (supabaseError) {
      console.error("Supabase Query Error:", supabaseError);
      throw new Error(`Failed to fetch members: ${supabaseError.message}`);
    }

    const memberEmails = (members || [])
      .map((m: any) => m.email)
      .filter((e: string) => e && e.includes('@'));

    // 2. Determine recipients
    // If no members, and no author email provided, we can't send anything
    if (memberEmails.length === 0 && !author_email) {
      console.log("No recipients found for this notification.");
      return res.status(200).json({ success: true, message: "No recipients found." });
    }

    // Combine author and members, then deduplicate
    const allRecipients = Array.from(new Set([
      ...(author_email ? [author_email] : []),
      ...memberEmails
    ]));

    // 3. Send Email
    const mailOptions = {
      from: '"라구나 한인들" <noreply@lagunakorean.org>',
      to: author_email || allRecipients[0],
      bcc: allRecipients.filter(email => email !== author_email),
      subject: `[라구나 소식] 새로운 글이 등록되었습니다: ${title}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #1E40AF; border-bottom: 2px solid #1E40AF; padding-bottom: 10px;">라구나 한인들 커뮤니티 알림</h2>
          <p style="font-size: 16px; line-height: 1.6;">안녕하세요, 라구나 한인들 커뮤니티에 새로운 소식이 올라왔습니다.</p>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e5e7eb;">
            <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">게시판: ${category}</p>
            <p style="margin: 10px 0; font-size: 20px; font-weight: bold; color: #111827;">${title}</p>
            <p style="margin: 5px 0; color: #4b5563;">작성자: ${author}</p>
          </div>
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://laguna-korean.vercel.app/#/board" style="display: inline-block; padding: 14px 30px; background-color: #1E40AF; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(30, 64, 175, 0.2);">게시판 바로가기</a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
          <p style="font-size: 12px; color: #9ca3af; line-height: 1.5;">본 메일은 라구나 한인들 커뮤니티 회원님들께 발송되는 자동 알림 메일입니다. 실제 이메일 수신 여부는 서버 환경 변수(SMTP) 설정에 따라 달라질 수 있습니다.</p>
        </div>
      `
    };

    console.log(`Sending email to ${allRecipients.length} recipients...`);
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    
    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      recipientCount: allRecipients.length,
      isTest: smtpConfig.host.includes('mailtrap')
    });
  } catch (err: any) {
    console.error("Notification Handler Critical Error:", err);
    return res.status(500).json({ 
      error: "이메일 발송 서버 오류", 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  }
}
