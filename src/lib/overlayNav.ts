/**
 * src/lib/overlayNav.ts
 *
 * 「由下往上推出來的頁面」（服務詳情、預約表單）共用的導覽入口。
 *
 * 這段邏輯原本在 Service.vue 與 Contact.vue 各抄了一份：判斷是不是
 * 一般左鍵點擊（cmd/ctrl 點擊要留給瀏覽器開新分頁）、有轉場控制器就走
 * App.vue 的覆蓋式轉場、沒有就退回一般 router.push。集中在這裡一份。
 *
 * 順帶修掉的 IA 問題：Nav、Hero、服務詳情頁的「預約諮詢」原本指向
 * #contact，只有 Contact 區塊的按鈕真的把人帶到表單 —— 同一個字四個
 * 位置兩種目的地，而且從詳情頁按下去還得先回首頁再點一次才碰得到
 * 輸入框。現在一律走 consultationHref()。
 *
 * from 帶的是使用者從哪個服務頁按下來的（slug），表單會據此預填
 * 「想詢問的事情」，不必要求使用者把剛剛讀完的東西再打一次。
 */
import { inject } from "vue";
import { useRouter } from "vue-router";
import { routeTransitionKey } from "./appShell";
import type { ServiceSlug } from "../data/services";

export const CONSULTATION_PATH = "/consultation";

export const consultationHref = (from?: ServiceSlug) =>
  from ? `${CONSULTATION_PATH}?from=${from}` : CONSULTATION_PATH;

/** cmd / ctrl / shift / alt / 非左鍵點擊要留給瀏覽器，不能攔 */
const isPrimaryNavigationClick = (event: MouseEvent) =>
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;

/** 只能在 setup 內呼叫（用到 inject / useRouter） */
export function useOverlayNav() {
  const router = useRouter();
  const routeTransition = inject(routeTransitionKey, null);

  /** 走 App.vue 的覆蓋式轉場；沒有 provider（例如單元測試）就退回一般導覽 */
  const openOverlay = (event: MouseEvent, href: string) => {
    if (!isPrimaryNavigationClick(event)) return;

    event.preventDefault();
    void (routeTransition?.navigateToService(href) ?? router.push(href));
  };

  const openConsultation = (event: MouseEvent, from?: ServiceSlug) =>
    openOverlay(event, consultationHref(from));

  /** hover / focus 時先把下一頁的主視覺抓回來，轉場時才不會開天窗 */
  const preloadImage = (source: string) => {
    routeTransition?.preloadImage(source);
  };

  /** 覆蓋頁的返回：播對稱的退場動畫回首頁最頂端 */
  const returnHome = () => {
    void (routeTransition?.returnToServices() ?? router.push("/"));
  };

  return { openOverlay, openConsultation, preloadImage, returnHome };
}
