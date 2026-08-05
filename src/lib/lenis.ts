/**
 * src/lib/lenis.ts
 * App.vue 建立 Lenis 實例後會把它塞進這裡，
 * 讓其他元件（例如 HeroCTA）可以共用同一個平滑捲動實例，
 * 而不用各自重新初始化一份。
 *
 * prefers-reduced-motion 開啟時 App.vue 不會建立 Lenis，
 * current 會維持 null，用到的地方要自己 fallback 成原生捲動。
 */
import type Lenis from "lenis";

export const lenisInstance: { current: Lenis | null } = {
  current: null,
};
