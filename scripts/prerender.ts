/**
 * scripts/prerender.ts
 *
 * 為每條非首頁的路由產生一份自己的靜態 HTML。build 之後跑。
 *
 * 為什麼需要：src/lib/routeMeta.ts 是在瀏覽器裡改寫 head 的。Google 會
 * 執行 JS 所以吃得到，但 Facebook / LINE 的分享爬蟲不執行 JS —— 不管
 * 轉介人丟的是哪一支服務頁，對方在聊天室看到的預覽都是首頁那組標題與
 * 摘要。而轉介正是這門生意最主要、也最高品質的流量來源。
 *
 * 做法：把 dist/index.html 複製成 dist/services/<slug>/index.html 與
 * dist/consultation/index.html，並就地改寫 title / description /
 * canonical / og:* / twitter:*。Vercel 的靜態檔優先於 vercel.json 的
 * rewrite，所以這些路徑會直接命中檔案，爬蟲第一次抓就拿到正確的 meta。
 * 使用者端拿到的還是同一份 SPA，行為完全不變。
 *
 * 已知取捨：og:image 全站共用 /og-image.png。要讓每個服務頁有自己的
 * 分享圖，得先從 build manifest 解出雜湊後的圖檔路徑，暫時不做。
 * JSON-LD 是公司層級的 ProfessionalService，每頁都帶著是對的，不動。
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createServer } from "vite";

const DIST = "dist";

const escapeAttribute = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/** 換掉某個屬性標籤內的 content=""。找不到那個標籤就拋錯，不要默默沒作用。 */
const replaceTagAttribute = (
  html: string,
  tagPattern: RegExp,
  attribute: string,
  value: string,
) => {
  let replaced = false;

  const next = html.replace(tagPattern, (tag) => {
    replaced = true;
    return tag.replace(
      new RegExp(`${attribute}="[^"]*"`),
      `${attribute}="${escapeAttribute(value)}"`,
    );
  });

  if (!replaced) {
    throw new Error(`prerender: 在 index.html 裡找不到 ${tagPattern}`);
  }

  return next;
};

/*
 * 屬性值連引號一起比對，所以 name="description" 不會誤中
 * name="twitter:description"。[^>]* 進不了下一個標籤，跨行寫的 meta
 * （index.html 裡好幾個都是）也吃得到。
 */
const metaTag = (attribute: string, key: string) =>
  new RegExp(`<meta[^>]*${attribute}="${key}"[^>]*>`);

export interface PrerenderMeta {
  title: string;
  description: string;
  canonical: string;
  socialTitle?: string;
  socialDescription?: string;
}

/** 純函式：吃 dist/index.html 的內容 + 一組 meta，吐出這條路由的 HTML */
export function renderRouteHtml(template: string, meta: PrerenderMeta) {
  const socialTitle = meta.socialTitle ?? meta.title;
  const socialDescription = meta.socialDescription ?? meta.description;

  let html = template;

  if (!/<title>[\s\S]*?<\/title>/.test(html)) {
    throw new Error("prerender: 在 index.html 裡找不到 <title>");
  }
  html = html.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${meta.title}</title>`,
  );

  html = replaceTagAttribute(
    html,
    /<link\b[^>]*rel="canonical"[^>]*>/,
    "href",
    meta.canonical,
  );

  const contents: [RegExp, string][] = [
    [metaTag("name", "description"), meta.description],
    [metaTag("property", "og:url"), meta.canonical],
    [metaTag("property", "og:title"), socialTitle],
    [metaTag("property", "og:description"), socialDescription],
    [metaTag("name", "twitter:title"), socialTitle],
    [metaTag("name", "twitter:description"), socialDescription],
  ];

  for (const [pattern, value] of contents) {
    html = replaceTagAttribute(html, pattern, "content", value);
  }

  return html;
}

async function main() {
  // services.ts / routeMeta.ts 會 import .avif，node 自己解析不了副檔名，
  // 交給 vite 載入 —— 跟 tests/ 底下的做法一致。
  const vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });

  try {
    const { resolveRouteMeta } = await vite.ssrLoadModule("/src/lib/routeMeta.ts");
    const { services } = await vite.ssrLoadModule("/src/data/services.ts");

    const template = await readFile(path.join(DIST, "index.html"), "utf8");

    const routes: { dir: string; meta: PrerenderMeta }[] = [
      ...services.map((service: { slug: string }) => ({
        dir: path.join("services", service.slug),
        meta: resolveRouteMeta("service-detail", { slug: service.slug }),
      })),
      { dir: "consultation", meta: resolveRouteMeta("consultation", {}) },
    ];

    for (const route of routes) {
      const target = path.join(DIST, route.dir);
      await mkdir(target, { recursive: true });
      await writeFile(
        path.join(target, "index.html"),
        renderRouteHtml(template, route.meta),
        "utf8",
      );
      console.log(`prerendered /${route.dir.split(path.sep).join("/")}`);
    }
  } finally {
    await vite.close();
  }
}

// 被 test import 時不要自己跑起來
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  await main();
}
