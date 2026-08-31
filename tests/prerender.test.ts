import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderRouteHtml } from "../scripts/prerender.ts";

// 真的拿 index.html 當樣板：它的 meta 標籤是跨行寫的，
// 用假字串測會漏掉「正則吃不到換行屬性」這個實際會壞的情況。
const template = readFileSync("index.html", "utf8");

const meta = {
  title: "共享人資長｜慕玖 MoJo King 人資顧問",
  description: "定期參與經營與人資決策的策略人資夥伴。",
  canonical: "https://www.mojo-king.com/services/fractional-chro",
};

test("每條路由的 head 都被改寫成自己的內容", () => {
  const html = renderRouteHtml(template, meta);

  assert.match(html, new RegExp(`<title>${meta.title}</title>`));
  assert.ok(html.includes(`content="${meta.description}"`));
  assert.ok(html.includes(`href="${meta.canonical}"`));
  assert.ok(html.includes(`content="${meta.canonical}"`), "og:url 沒被換掉");

  // og:title 與 twitter:title 沒給社群短版時沿用主標題
  assert.equal(
    html.match(new RegExp(`content="${meta.title}"`, "g"))?.length,
    2,
  );

  // 分享預覽讀的是 og:/twitter: 的 content，首頁那組不能有任何殘留，
  // 否則轉介人把服務頁丟進 LINE，對方看到的還是首頁。
  assert.ok(
    !html.includes('content="慕玖 MoJo King｜人資顧問・人才發展與雇用策略"'),
    "首頁的社群標題殘留在服務頁的 og:/twitter: 上",
  );
});

test("社群短版存在時優先用短版，主標題只留給 <title> 與搜尋結果", () => {
  const html = renderRouteHtml(template, {
    ...meta,
    socialTitle: "共享人資長",
    socialDescription: "短版摘要。",
  });

  assert.ok(html.includes(`<title>${meta.title}</title>`));
  assert.equal(html.match(/content="共享人資長"/g)?.length, 2);
  assert.equal(html.match(/content="短版摘要。"/g)?.length, 2);
  assert.ok(html.includes(`content="${meta.description}"`), "description 應保留完整版");
});

test("樣板缺了要改寫的標籤時要爆掉，不能默默產生首頁的 meta", () => {
  assert.throws(
    () => renderRouteHtml(template.replace(/<link\b[^>]*rel="canonical"[^>]*>/, ""), meta),
    /canonical/,
  );
});
