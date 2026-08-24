/**
 * src/lib/scrollToSection.ts
 *
 * 捲動到頁面上的某個 section。
 *
 * 這個專案用 Lenis 接管了整頁捲動，瀏覽器原生的 hash 跳轉（<a href="#x">）
 * 會跟 Lenis 打架——不是完全沒反應，就是跳過去又被拉回來。
 * 所以所有站內錨點一律走 Lenis；沒有 Lenis 實例時（使用者開啟
 * prefers-reduced-motion，App.vue 就不會建立）退回原生捲動。
 */
import { lenisInstance } from "./lenis";

export const scrollToSection = (hash: string) => {
  const target = document.querySelector<HTMLElement>(hash);
  if (!target) return;

  if (lenisInstance.current) {
    lenisInstance.current.scrollTo(target, { offset: 0 });
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
};

/** 回到頁面最頂端，同樣走 Lenis 才不會跟平滑捲動打架 */
export const scrollToTop = () => {
  if (lenisInstance.current) {
    lenisInstance.current.scrollTo(0, { offset: 0 });
    return;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
};
