/**
 * api/consultation.ts
 * Vercel Serverless Function：接收 ConsultationForm.vue 送出的資料，
 * 透過 Resend 寄兩封信：
 *   1. 通知信 → 慕玖（CONSULTATION_TO_EMAIL）
 *   2. 確認信 → 填表者本人（表單裡的 email）
 *
 * 需要在 Vercel 專案的 Settings → Environment Variables 設定：
 *   RESEND_API_KEY        你在 resend.com 申請到的 API Key
 *   CONSULTATION_TO_EMAIL 你想收信的信箱
 *   CONSULTATION_FROM     選填，寄件人。驗證網域後改成
 *                         "慕玖 MoJo King <notify@mojo-king.com>"
 *
 * ⚠️ 尚未在 Resend 驗證自己的網域前，寄件人只能是 onboarding@resend.dev，
 *    而它「只能寄到你 Resend 帳號註冊的信箱」。也就是說給填表者的確認信
 *    一定會被 Resend 擋下。所以確認信採 best-effort：失敗只記 log，
 *    不會讓整個表單送出失敗（使用者的資料還是有送到）。
 *
 * 本機開發要測試這支 function，要用 `vercel dev` 啟動（不是 `npm run dev`），
 * 因為 Vite 本身不會執行 /api 底下的 serverless function。
 */

const DEFAULT_FROM = "慕玖網站表單 <onboarding@resend.dev>";

const isValidEmail = (value: unknown): value is string =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

interface SendEmailArgs {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

async function sendEmail({
  apiKey,
  from,
  to,
  subject,
  text,
  replyTo,
}: SendEmailArgs) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend ${response.status}: ${await response.text()}`);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const {
    name,
    email,
    title,
    company,
    referrer,
    inquiry,
    reason,
    service,
    agreeContact,
  } = req.body ?? {};

  if (!name || !inquiry) {
    res.status(400).json({ error: "缺少必填欄位（姓名 / 想詢問的事情）" });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error: "請填寫正確的 email" });
    return;
  }

  // 同意聯繫是法律上的閘門，不能只擋在前端。
  if (!agreeContact) {
    res.status(400).json({ error: "需要同意讓慕玖與你聯繫，才能送出預約" });
    return;
  }

  const toEmail = process.env.CONSULTATION_TO_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONSULTATION_FROM || DEFAULT_FROM;

  if (!toEmail || !apiKey) {
    console.error("缺少環境變數 RESEND_API_KEY 或 CONSULTATION_TO_EMAIL");
    res.status(500).json({ error: "伺服器尚未設定完成" });
    return;
  }

  const details = [
    `姓名：${name}`,
    `Email：${email}`,
    `職位：${title || "未填寫"}`,
    `公司名稱：${company || "未填寫"}`,
    `是誰推薦：${referrer || "未填寫"}`,
    // 表單頁的 ?from= 帶進來的，代表他是讀完哪一頁才決定聯繫
    `從哪個服務頁來：${service || "直接進入表單"}`,
    `想詢問的事情：${inquiry}`,
    `想預約諮詢的原因：${reason || "未填寫"}`,
  ].join("\n");

  // 1) 通知信給慕玖。這封失敗才算整體失敗，因為資料等於沒送到。
  //    reply_to 設成填表者，收到信直接按回覆就能聯繫對方。
  try {
    await sendEmail({
      apiKey,
      from,
      to: toEmail,
      subject: `新的預約諮詢：${name}`,
      text: details,
      replyTo: email,
    });
  } catch (error) {
    console.error("通知信寄送失敗", error);
    res.status(502).json({ error: "寄信失敗" });
    return;
  }

  // 2) 確認信給填表者。best-effort：失敗只記 log，不影響回傳結果。
  const confirmation = [
    `${name} 你好，`,
    "",
    "我們已經收到你的預約諮詢申請，謝謝你花時間填寫。",
    "慕玖團隊會盡快與你聯繫，安排第一次的諮詢對談。",
    "",
    "以下是你送出的內容：",
    "",
    details,
    "",
    "如果有任何補充，直接回覆這封信即可。",
    "",
    "慕玖股份有限公司 MoJo King",
  ].join("\n");

  try {
    await sendEmail({
      apiKey,
      from,
      to: email,
      subject: "我們已收到你的預約諮詢申請｜慕玖 MoJo King",
      text: confirmation,
      replyTo: toEmail,
    });
  } catch (error) {
    // 最常見的原因：還沒驗證網域，onboarding@resend.dev 只能寄給帳號本人
    console.error("確認信寄送失敗（不影響表單送出）", error);
    res.status(200).json({ ok: true, confirmationSent: false });
    return;
  }

  res.status(200).json({ ok: true, confirmationSent: true });
}
