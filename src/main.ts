import { createApp } from "vue";
import App from "./App.vue";
import { initAnalytics } from "./lib/analytics";
import { router } from "./router";
import "./style.css";
import "./font.css";

/*
 * 關掉瀏覽器的捲動位置還原。
 *
 * 預設是 scrollRestoration = "auto"，重整時會把你捲回上次停的位置。
 * 這個站的首頁是一連串 scroll-driven 動畫（Hero 與 About 的 sticky stage），
 * 停在中間重整會還原到動畫的中間態，畫面就錯亂了。
 *
 * 設成 "manual" 之後，捲動位置完全由 App 自己決定：
 *   - 網址沒有 #hash（例如 http://localhost:5173/）→ 一律從最上面開始
 *   - 網址有 #hash → 瀏覽器的片段跳轉不受影響，仍會到該區塊
 *     （manual 只關掉「歷史紀錄的位置還原」，不影響 fragment）
 *
 * 必須在 mount 之前設定，晚於首次繪製就來不及了。
 */
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

// 要在掛載之前初始化，router 的第一次 afterEach 才送得出 page_view
initAnalytics();

createApp(App).use(router).mount("#app");

