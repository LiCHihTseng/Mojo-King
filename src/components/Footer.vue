<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  companyName?: string;
  companyId?: string;
  email?: string;
}

withDefaults(defineProps<Props>(), {
  companyName: "慕玖股份有限公司",
  companyId: "統一編號 12345678",
  email: "hello@mojo9.com.tw",
});

const footerWrapRef = ref<HTMLElement | null>(null); // 外層：決定觸發時機的容器
const footerRef = ref<HTMLElement | null>(null); // 整個 footer 本身：做位移動畫

let footerTrigger: ScrollTrigger | null = null;
let prefersReducedMotion = false;

onMounted(async () => {
  await nextTick();

  prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion || !footerWrapRef.value || !footerRef.value) return;

  /*
   * 整個 footer 一開始位置偏低，
   * 隨滾動以比正常速度稍慢的方式「追上」到定位。
   */
  gsap.fromTo(
    footerRef.value,
    { y: 150 },
    {
      y: 0,
      ease: "none",
      scrollTrigger: {
        trigger: footerWrapRef.value,
        start: "top bottom",
        end: "bottom bottom",
        scrub: 0.8,
      },
    },
  );

  footerTrigger = ScrollTrigger.getAll().find(
    (t) => t.trigger === footerWrapRef.value,
  ) ?? null;
});

onBeforeUnmount(() => {
  footerTrigger?.kill();
  if (footerRef.value) gsap.killTweensOf(footerRef.value);
});
</script>

<template>
  <div ref="footerWrapRef" class="relative overflow-hidden">
    <footer ref="footerRef" class="w-full bg-[#1a1a1a] px-6 py-16 text-white sm:py-20" style="will-change: transform;">
      <div class="mx-auto max-w-[1800px]">
        <div class="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-2xl font-bold tracking-wide">慕玖</p>
            <p class="mt-4 max-w-xs text-sm leading-6 text-white/50">
              共享人資長服務，陪你把人才策略做到落地。
            </p>
          </div>

          <div class="flex gap-16">
            <div>
              <p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/40">導覽</p>
              <ul class="flex flex-col gap-2 text-sm text-white/70">
                <li><a href="#about" class="transition-colors hover:text-[#B55F00]">關於慕玖</a></li>
                <li><a href="#service" class="transition-colors hover:text-[#B55F00]">服務內容</a></li>
                <li><a href="#contact" class="transition-colors hover:text-[#B55F00]">聯絡我們</a></li>
              </ul>
            </div>

            <div>
              <p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/40">聯絡</p>
              <ul class="flex flex-col gap-2 text-sm text-white/70">
                <li>{{ email }}</li>
                <li>{{ companyId }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {{ new Date().getFullYear() }} {{ companyName }}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>