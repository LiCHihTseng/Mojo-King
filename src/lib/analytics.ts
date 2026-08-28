/**
 * src/lib/analytics.ts
 *
 * Google Analytics 4。
 *
 * 兩個這個站特有的處理：
 *
 * 1. 這是 SPA。GA 官方那段 gtag 片段只會在 index.html 首次載入時送一次
 *    page_view，之後 vue-router 換頁（/services/*、/consultation）都不會
 *    再送 —— 報表裡就只會看到首頁。所以這裡把自動 page_view 關掉
 *    （send_page_view: false），改由 router.afterEach 每次換頁手動送。
 *
 * 2. 手動送的時機在 applyRouteMeta 之後，document.title 已經換成該頁的
 *    標題，GA 的「網頁標題」維度才不會每一頁都顯示首頁的標題。
 *
 * 沒有設 VITE_GA_ID 時整支不做任何事，本機開發不會污染正式資料。
 */

const MEASUREMENT_ID = import.meta.env.VITE_GA_ID;

type GtagArgs =
  | [command: "js", value: Date]
  | [command: "config", targetId: string, config?: Record<string, unknown>]
  | [command: "event", eventName: string, params?: Record<string, unknown>];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

const isEnabled = () => Boolean(MEASUREMENT_ID);

export function initAnalytics() {
  if (!isEnabled() || window.gtag) return;

  window.dataLayer = window.dataLayer ?? [];
  // gtag 必須用 arguments 推進 dataLayer，不能用箭頭函式的 rest 參數改寫：
  // GA 讀的是 arguments 物件本身，換成陣列會被當成單一參數。
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  } as Window["gtag"];

  window.gtag!("js", new Date());
  window.gtag!("config", MEASUREMENT_ID, {
    // 換頁的 page_view 由 trackPageView 送，避免首次載入送出的是還沒被
    // applyRouteMeta 改寫的首頁標題
    send_page_view: false,
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.append(script);
}

/** 每次路由變更後呼叫一次；要在 document.title 更新之後 */
export function trackPageView(path: string) {
  if (!isEnabled() || !window.gtag) return;

  window.gtag("event", "page_view", {
    page_path: path,
    page_title: document.title,
    page_location: window.location.href,
  });
}
