<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import HeroTitle from "./HeroTitle.vue";
import HeroCTA from "./HeroCTA.vue";
import Portrait from "../../assets/test.png";

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

const sectionRef = ref<HTMLElement | null>(null);
const visualGroupRef = ref<HTMLElement | null>(null); // 新增：照片+遮罩的共同容器
const dimOverlayRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);

let parallaxTrigger: ScrollTrigger | null = null;
let prefersReducedMotion = false;

onMounted(async () => {
  await nextTick();

  prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

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

  tl.to(
    contentRef.value,
    { y: -200, opacity: 0, ease: "none" },
    0,
  );

  // 照片 + 遮罩，作為同一個群組一起縮放、一起淡出（霧化消失）
  tl.to(
    visualGroupRef.value,
    { scale: 1, opacity: 1, ease: "none" },
    0,
  );

  // 額外的灰霧化遮罩，隨滾動變不透明，疊加在群組內部
  tl.to(
    dimOverlayRef.value,
    { opacity: 0.75, ease: "none" },
    0,
  );

  parallaxTrigger = tl.scrollTrigger ?? null;
});

onBeforeUnmount(() => {
  parallaxTrigger?.kill();
});
</script>

<template>
  <section ref="sectionRef" class="relative min-h-screen overflow-hidden ">
    <!-- 群組容器：照片 + 所有遮罩，一起被 GSAP 縮放，永遠對齊 -->
    <div ref="visualGroupRef" class="absolute inset-0" style="transform-origin: center center;">
      <img
        :src="Portrait"
        alt="王郁婷，慕玖共享人資長"
        class="absolute inset-0 h-full w-full  object-cover "
        loading="eager"
        fetchpriority="high"
      />

      <!-- 灰暗遮罩：深灰色，非純黑 -->
      <div ref="dimOverlayRef" class="pointer-events-none absolute inset-0 z-[5]  bg-[#1f1f1f] opacity-0"></div>

      <div class="pointer-events-none absolute inset-0 z-0  bg-gradient-to-r from-black via-black/65 to-transparent"></div>

      <div class="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-60  bg-gradient-to-t from-black/70 to-transparent"></div>
    </div>

    <div
      ref="contentRef"
      class="relative z-20 mx-auto flex min-h-screen w-full max-w-[1800px] flex-col"
      style="transform-origin: left center;"
    >
      <div class="flex flex-1 items-center">
        <div class="flex w-full min-w-0 max-w-xl flex-col px-5 md:px-10">
          <HeroTitle :line1="headingLine1" :line2="headingLine2" :line3="headingLine3" :description="description" />

          <div class="mt-6 sm:mt-8 ml-5 md:ml-0">
            <HeroCTA :text="ctaText" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>