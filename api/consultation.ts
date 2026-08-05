/**
 * api/consultation.ts
 * Vercel Serverless Function：接收 ConsultationForm.vue 送出的資料，
 * 透過 Resend 寄一封信到你指定的信箱。
 *
 * 需要在 Vercel 專案的 Settings → Environment Variables 設定：
 *   RESEND_API_KEY        你在 resend.com 申請到的 API Key
 *   CONSULTATION_TO_EMAIL 你想收信的信箱（例如 jasonjasonken@gmail.com）
 *
 * 本機開發要測試這支 function，要用 `vercel dev` 啟動（不是 `npm run dev`），
 * 因為 Vite 本身不會執行 /api 底下的 serverless function，只有 Vercel 的
 * 執行環境（正式部署或 `vercel dev`）才會處理。
 */

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const {
    name,
    title,
    companyAddress,
    referrer,
    inquiry,
    reason,
  } = req.body ?? {};

  if (!name || !inquiry) {
    res.status(400).json({ error: "缺少必填欄位（姓名 / 想詢問的事情）" });
    return;
  }

  const toEmail = process.env.CONSULTATION_TO_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;

  if (!toEmail || !apiKey) {
    console.error("缺少環境變數 RESEND_API_KEY 或 CONSULTATION_TO_EMAIL");
    res.status(500).json({ error: "伺服器尚未設定完成" });
    return;
  }

  const lines = [
    `姓名：${name}`,
    `職位：${title || "未填寫"}`,
    `公司地址：${companyAddress || "未填寫"}`,
    `是誰推薦：${referrer || "未填寫"}`,
    `想詢問的事情：${inquiry}`,
    `想預約諮詢的原因：${reason || "未填寫"}`,
  ];

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // 還沒驗證自己的網域前，只能用 onboarding@resend.dev 當寄件人。
        // 之後在 Resend 驗證 mojo-kingtw.com 後，可以換成
        // 例如 "慕玖網站表單 <notify@mojo-kingtw.com>"
        from: "慕玖網站表單 <onboarding@resend.dev>",
        to: [toEmail],
        subject: `新的預約諮詢：${name}`,
        text: lines.join("\n"),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Resend 寄信失敗", errorBody);
      res.status(502).json({ error: "寄信失敗" });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("送出預約表單發生錯誤", error);
    res.status(500).json({ error: "伺服器錯誤" });
  }
}
