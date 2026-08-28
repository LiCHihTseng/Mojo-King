/**
 * src/lib/routeMeta.ts
 *
 * 每條路由自己的 title / description / canonical。
 *
 * index.html 的靜態 meta 只描述首頁，SPA 換頁時整份 head 不會變 ——
 * 搜尋結果裡 /services/* 和 /consultation 都會顯示成首頁的標題與摘要，
 * 等於三個服務頁的內容白寫。這裡在每次導覽後改寫 head 補上這件事。
 *
 * 注意：這是 client-side 改寫。Google 會執行 JS 所以吃得到，
 * 但 Facebook / LINE 的分享爬蟲不執行 JS，og:* 仍只會讀到 index.html
 * 的首頁版本。要讓分享預覽也跟著換，得做 SSR 或預先產生靜態 HTML。
 */
import { getServiceBySlug } from "../data/services";

export const SITE_ORIGIN = "https://www.mojo-king.com";

export interface RouteMeta {
  title: string;
  description: string;
  /** 絕對網址，對應 <link rel="canonical"> 與 og:url */
  canonical: string;
  /** 分享預覽用的短版標題／摘要，沒給就沿用上面兩個 */
  socialTitle?: string;
  socialDescription?: string;
}

/** 與 index.html 的靜態 meta 保持一致，換回首頁時才不會殘留別頁的標題 */
export const HOME_META: RouteMeta = {
  title: "慕玖 MoJo King｜人資顧問・人才發展與雇用策略｜共享人資長服務",
  description:
    "慕玖 MoJo King 是專注於人力資源管理與組織發展的人資顧問公司。由 20 年上市櫃人資長經驗的顧問親自帶領，提供共享人資長、人才發展、雇用與招募制度、主管培訓與組織診斷服務，協助企業把人才策略真正落地。",
  canonical: `${SITE_ORIGIN}/`,
  // index.html 原本就替首頁寫了較短的分享版本，別被上面的完整版蓋掉
  socialTitle: "慕玖 MoJo King｜人資顧問・人才發展與雇用策略",
  socialDescription:
    "20 年上市櫃人資長經驗的人資顧問，提供共享人資長、人才發展、雇用制度與主管培訓，協助企業把人才策略真正落地。",
};

export const CONSULTATION_META: RouteMeta = {
  title: "預約諮詢｜慕玖 MoJo King 人資顧問",
  description:
    "填寫諮詢表單，慕玖團隊會與你聯繫，安排第一次的諮詢對談。從人資制度、人才發展到主管培訓，先了解你的狀況，再一起找出適合的做法。",
  canonical: `${SITE_ORIGIN}/consultation`,
};

/**
 * 依路由名稱與參數決定 head 內容。
 * 認不出來的路由（含找不到的服務 slug）一律回到首頁那組，
 * 避免把上一頁的標題留在畫面上。
 */
export function resolveRouteMeta(
  name: unknown,
  params: { slug?: unknown } = {},
): RouteMeta {
  if (name === "consultation") return CONSULTATION_META;

  if (name === "service-detail") {
    const service = getServiceBySlug(String(params.slug ?? ""));
    if (!service) return HOME_META;

    return {
      title: `${service.tag}｜慕玖 MoJo King 人資顧問`,
      description: service.summary,
      canonical: `${SITE_ORIGIN}/services/${service.slug}`,
    };
  }

  return HOME_META;
}

const setMetaContent = (selector: string, content: string) => {
  const tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (tag) tag.content = content;
};

/** 把 resolveRouteMeta 的結果寫進 head。index.html 已有的標籤就地改寫。 */
export function applyRouteMeta(meta: RouteMeta) {
  document.title = meta.title;

  const socialTitle = meta.socialTitle ?? meta.title;
  const socialDescription = meta.socialDescription ?? meta.description;

  setMetaContent('meta[name="description"]', meta.description);
  setMetaContent('meta[property="og:title"]', socialTitle);
  setMetaContent('meta[property="og:description"]', socialDescription);
  setMetaContent('meta[property="og:url"]', meta.canonical);
  setMetaContent('meta[name="twitter:title"]', socialTitle);
  setMetaContent('meta[name="twitter:description"]', socialDescription);

  const canonical = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (canonical) canonical.href = meta.canonical;
}
