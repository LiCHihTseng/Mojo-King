<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import HeroCTA from "./HeroCTA.vue";
import Portrait from "../../assets/Test.png";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  headingLine1?: string;
  headingLine2?: string;
  headingLine3?: string;
  description?: string;
  ctaText?: string;
}

withDefaults(defineProps<Props>(), {
  headingLine1: "為你的企業",
  headingLine2: "打造清晰的",
  headingLine3: "人才策略",
  description:
    "我與企業主、主管與團隊合作，帶來清楚的方向與實際可行的策略，讓組織能穩健成長，不再對人才管理感到困惑。",
  ctaText: "預約諮詢",
});

/* ----------------------------------
   Refs
---------------------------------- */

const sectionRef = ref<HTMLElement | null>(null);
const visualGroupRef = ref<HTMLElement | null>(null);
const dimOverlayRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);

const headingWrapRef = ref<HTMLElement | null>(null);
const headingRefs = ref<HTMLElement[]>([]);
const descriptionRef = ref<HTMLElement | null>(null);

const setHeadingRef = (el: Element | null, index: number) => {
  if (el instanceof HTMLElement) {
    headingRefs.value[index] = el;
  }
};

let parallaxTrigger: ScrollTrigger | null = null;
let headingContext: gsap.Context | null = null;
let prefersReducedMotion = false;

onMounted(async () => {
  await nextTick();

  prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /*
   * 標題進場動畫（原本 HeroTitle.vue 的邏輯，合併進來）
   */
  if (headingWrapRef.value && !prefersReducedMotion) {
    headingContext = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      timeline
        .from(headingRefs.value, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          stagger: 0.12,
        })
        .from(
          descriptionRef.value,
          { opacity: 0, y: 20, duration: 0.6 },
          "-=0.4",
        );
    }, headingWrapRef.value);
  }

  /*
   * 背景視差（原本就有的邏輯，維持不變）
   */
  if (prefersReducedMotion || !sectionRef.value) return;

  const stickyContainer = sectionRef.value.parentElement;
  if (!stickyContainer) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: stickyContainer,
      start: "top top",
      end: "bottom top",
      scrub: 0.6,
    },
  });

  tl.to(contentRef.value, { y: -200, opacity: 0, ease: "none" }, 0);
  tl.to(visualGroupRef.value, { scale: 1, opacity: 1, ease: "none" }, 0);
  tl.to(dimOverlayRef.value, { opacity: 0.75, ease: "none" }, 0);

  parallaxTrigger = tl.scrollTrigger ?? null;
});

onBeforeUnmount(() => {
  parallaxTrigger?.kill();
  headingContext?.revert();
});
</script>

<template>
  <section ref="sectionRef" class="relative min-h-screen overflow-hidden">
    <!-- 群組容器：照片 + 所有遮罩，一起被 GSAP 縮放，永遠對齊 -->
    <div ref="visualGroupRef" class="absolute inset-0" style="transform-origin: center center;">
      <img
        :src="Portrait"
        alt="王郁婷，慕玖共享人資長"
        class="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        fetchpriority="high"
      />

      <div ref="dimOverlayRef" class="pointer-events-none absolute inset-0 z-[5] bg-[#1f1f1f] opacity-0"></div>
      <div class="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-black via-black/65 to-transparent"></div>
      <div class="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-60 bg-gradient-to-t from-black/70 to-transparent"></div>
    </div>

    <!--
      內容容器：統一用同一組水平內距（px-6 md:px-10），
      標題、說明文字、CTA 按鈕全部共用這一個基準，
      不再各自疊加額外的 margin，確保任何尺寸下水平位置一致。
    -->
    <div
      ref="contentRef"
      class="relative z-20 mx-auto flex min-h-screen w-full max-w-8xl flex-col px-6 md:px-10"
      style="transform-origin: left center;"
    >
      <div class="flex flex-1 items-center">
        <div class="flex w-full min-w-0 max-w-xl flex-col">
          <!-- 標題區塊（原本 HeroTitle.vue） -->
          <div ref="headingWrapRef" class="flex flex-col gap-6 md:gap-10 lg:gap-14">
            <h1 class="max-w-[13ch] text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-medium leading-[0.98] tracking-[-0.045em] text-white leading-8">
              <span :ref="(el) => setHeadingRef(el as Element | null, 0)" class="block whitespace-nowrap">
                {{ headingLine1 }}
              </span>
              <span :ref="(el) => setHeadingRef(el as Element | null, 1)" class="block whitespace-nowrap">
                {{ headingLine2 }}
              </span>
              <span :ref="(el) => setHeadingRef(el as Element | null, 2)" class="block whitespace-nowrap">
                {{ headingLine3 }}
              </span>
            </h1>

            <p
              ref="descriptionRef"
              class="max-w-[52ch] border-l-2 border-white/30 pl-4 text-sm leading-7 text-white/70 sm:text-lg sm:leading-8"
            >
              {{ description }}
            </p>
          </div>

          <div class="mt-6 sm:mt-8">
            <HeroCTA :text="ctaText" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>