<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, provide, readonly, ref } from "vue";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import MojoKingLoader from "./components/MojoKingLoader.vue";
import { entranceReadyKey } from "./lib/appShell";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

// loader 顯示狀態 & 你實際的資料/資源是否還在載入
const showLoader = ref(true);
const isLoading = ref(true);
const entranceReady = ref(false);

provide(entranceReadyKey, readonly(entranceReady));

const updateLenis = (time: number) => {
  lenis?.raf(time * 1000);
};

const refreshAfterLayout = () => {
  requestAnimationFrame(() => ScrollTrigger.refresh());
};

function initSmoothScroll() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion) return;

  lenis = new Lenis({
  duration: 0.95,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 1,
  syncTouch: false,
});
  // 讓 Lenis 每次更新捲動位置時，通知 ScrollTrigger 重新計算
  lenis.on("scroll", ScrollTrigger.update);

  // 用 GSAP 的 ticker 驅動 Lenis，比 requestAnimationFrame 更穩定
  gsap.ticker.add(updateLenis);

  gsap.ticker.lagSmoothing(0);
}

onMounted(async () => {
  if (document.readyState === "complete") {
    refreshAfterLayout();
  } else {
    window.addEventListener("load", refreshAfterLayout, { once: true });
  }

  document.fonts?.ready.then(refreshAfterLayout);

  // loader 蓋著的期間，先把捲動位置歸零，避免瀏覽器記憶上次的 scroll position
  window.scrollTo(0, 0);
  // loading 期間鎖住背景捲動，避免使用者在 loader 蓋著時偷滑到底層內容
  document.documentElement.style.overflow = "hidden";

  // TODO: 換成你實際的初始化流程（等字型、圖片、API 資料等準備好）
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // 通知 loader：資料/資源準備好了，可以開始 complete → reveal → swipe
  isLoading.value = false;
});

// MojoKingLoader 的 curve swipe 動畫「完全結束」後才會 emit 這個事件
async function handleLoaderDone() {
  showLoader.value = false;
  await nextTick();

  // Loader 已經完全離場後，才允許 Hero 與 Navigation 播放進場。
  entranceReady.value = true;
  document.documentElement.style.overflow = "";

  initSmoothScroll();

  // 這時候版面（字型、圖片、loader 移除後的 layout）才是最終穩定狀態
  // 重新量測一次 ScrollTrigger，避免 pin/trigger 位置跟實際版面對不上
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

onBeforeUnmount(() => {
  window.removeEventListener("load", refreshAfterLayout);
  gsap.ticker.remove(updateLenis);
  lenis?.destroy();
});
</script>

<!-- App.vue -->
<template>
  <main class="relative">
    <RouterView />
    <MojoKingLoader v-if="showLoader" :loading="isLoading" @done="handleLoaderDone" />
  </main>
</template>
