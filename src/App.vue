<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Hero from "./components/Hero/Hero.vue";
import About from "./components/About.vue";
import Service from "./components/Service.vue";
import Testimonials from "./components/Testimonials.vue";
import Navigation from "./components/Navigation.vue";
import Contact from "./components/Contact.vue";
import Footer from "./components/Footer.vue";
import MojoKingLoader from "./components/MojoKingLoader.vue";
import Process from "./components/Process.vue";


gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

// loader 顯示狀態 & 你實際的資料/資源是否還在載入
const showLoader = ref(true);
const isLoading = ref(true);

function initSmoothScroll() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion) return;

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  // 讓 Lenis 每次更新捲動位置時，通知 ScrollTrigger 重新計算
  lenis.on("scroll", ScrollTrigger.update);

  // 用 GSAP 的 ticker 驅動 Lenis，比 requestAnimationFrame 更穩定
  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

onMounted(async () => {
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
function handleLoaderDone() {
  showLoader.value = false;
  document.documentElement.style.overflow = "";

  initSmoothScroll();

  // 這時候版面（字型、圖片、loader 移除後的 layout）才是最終穩定狀態
  // 重新量測一次 ScrollTrigger，避免 pin/trigger 位置跟實際版面對不上
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

onBeforeUnmount(() => {
  lenis?.destroy();
});
</script>

<!-- App.vue -->
<template>
  <main class="relative">
    <Navigation />

    <div class="relative">
  <section class="sticky top-0 z-0 h-screen w-full">
    <Hero />
  </section>



  <section id="about" class="relative z-10 rounded-t-[2.5rem] bg-white shadow-[0_-30px_60px_-15px_rgba(0,0,0,0.25)]">
    <About />
  </section>
</div>


    <Service id="service" />
    <Testimonials />
    <Process />
    <Contact id="contact" />
    <Footer />

    <MojoKingLoader v-if="showLoader" :loading="isLoading" @done="handleLoaderDone" />
  </main>
</template>