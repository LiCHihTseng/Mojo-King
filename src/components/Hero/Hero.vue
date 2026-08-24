<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import HeroCTA from "./HeroCTA.vue";
import Portrait from "../../assets/Test.png";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  entranceReady?: boolean;
  // headingLine1?: string;
  headingLine2?: string;
  headingLine3?: string;
  description?: string;
  ctaText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  entranceReady: false,
  // headingLine1: "為你的企業",
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
const ctaWrapRef = ref<HTMLElement | null>(null);

const setHeadingRef = (el: Element | null, index: number) => {
  if (el instanceof HTMLElement) {
    headingRefs.value[index] = el;
  }
};

let parallaxTrigger: ScrollTrigger | null = null;
let headingContext: gsap.Context | null = null;
let introTimeline: gsap.core.Timeline | null = null;
let prefersReducedMotion = false;
let introHasPlayed = false;

const setupScrollMotion = () => {
  if (prefersReducedMotion || parallaxTrigger || !sectionRef.value) return;

  const stickyContainer = sectionRef.value.parentElement;
  if (!stickyContainer) return;

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: stickyContainer,
      start: "top top",
      end: "bottom top",
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });

  timeline.to(contentRef.value, { y: -120, autoAlpha: 0, ease: "none" }, 0);
  timeline.to(visualGroupRef.value, { scale: 1.035, ease: "none" }, 0);
  timeline.to(dimOverlayRef.value, { opacity: 0.18, ease: "none" }, 0);

  parallaxTrigger = timeline.scrollTrigger ?? null;
  requestAnimationFrame(() => ScrollTrigger.refresh());
};

const playIntro = () => {
  if (introHasPlayed || !props.entranceReady) return;

  // entranceReady may arrive before fonts finish loading.
  if (!prefersReducedMotion && !introTimeline) return;

  introHasPlayed = true;

  if (prefersReducedMotion) {
    gsap.set(
      [visualGroupRef.value, ...headingRefs.value, descriptionRef.value, ctaWrapRef.value],
      { clearProps: "all" },
    );
    return;
  }

  introTimeline?.play(0);
};

watch(() => props.entranceReady, playIntro);

onMounted(async () => {
  await nextTick();

  prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /*
   * 標題進場動畫（原本 HeroTitle.vue 的邏輯，合併進來）
   */
  if (sectionRef.value && headingWrapRef.value && !prefersReducedMotion) {
    headingContext = gsap.context(() => {
      const headingTargets = headingRefs.value.filter(Boolean);

      gsap.set(visualGroupRef.value, {
        scale: 1.075,
        transformOrigin: "center center",
        willChange: "transform",
      });
      gsap.set(headingTargets, {
        autoAlpha: 0,
        yPercent: 115,
        rotation: 1.5,
        transformOrigin: "left bottom",
        willChange: "transform,opacity",
      });
      gsap.set([descriptionRef.value, ctaWrapRef.value], {
        autoAlpha: 0,
        y: 22,
        willChange: "transform,opacity",
      });

      introTimeline = gsap.timeline({
        paused: true,
        defaults: { overwrite: "auto" },
        onComplete: () => {
          gsap.set(
            [visualGroupRef.value, ...headingTargets, descriptionRef.value, ctaWrapRef.value],
            { clearProps: "willChange" },
          );
          setupScrollMotion();
        },
      });

      introTimeline
        .to(visualGroupRef.value, {
          scale: 1,
          duration: 1.65,
          ease: "power3.out",
        }, 0)
        .to(headingTargets, {
          autoAlpha: 1,
          yPercent: 0,
          rotation: 0,
          duration: 0.92,
          stagger: 0.09,
          ease: "power4.out",
        }, 0.12)
        .to(descriptionRef.value, {
          autoAlpha: 1,
          y: 0,
          duration: 0.72,
          ease: "power3.out",
        }, 0.48)
        .to(ctaWrapRef.value, {
          autoAlpha: 1,
          y: 0,
          duration: 0.68,
          ease: "power3.out",
        }, 0.62);
    }, sectionRef.value);
  }

  playIntro();

  /*
   * 背景視差（原本就有的邏輯，維持不變）
   */
});

onBeforeUnmount(() => {
  parallaxTrigger?.kill();
  headingContext?.revert();
  introTimeline = null;
});
</script>

<template>
  <section ref="sectionRef" class="relative min-h-[100svh] overflow-hidden">
    <!-- 群組容器：照片 + 所有遮罩，一起被 GSAP 縮放，永遠對齊 -->
    <div ref="visualGroupRef" class="absolute inset-0" style="transform-origin: center center;">
      <img
        data-critical-image
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
      標題、說明文字、CTA 按鈕全部共用這一個基準。
      justify-center 直接負責垂直置中，不再靠內層 flex-1 撐開，
      避免 CTA 的高度把標題往上擠。
    -->
    <div
      ref="contentRef"
      class="relative z-20 mx-auto flex min-h-[100svh] w-full max-w-full flex-col justify-center px-6 md:px-10"
      style="transform-origin: left center;"
    >
      <div class="flex w-full min-w-0 max-w-full flex-col">
        <!-- 標題區塊（原本 HeroTitle.vue） -->
        <div ref="headingWrapRef" class="flex flex-col gap-6 md:gap-10 lg:gap-14">
          <h1 class="max-w-[13ch] text-5xl font-medium leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl xl:text-8xl">
            <!-- <span :ref="(el) => setHeadingRef(el as Element | null, 0)" class="block whitespace-nowrap">
              {{ headingLine1 }}
            </span> -->
            <span class="block overflow-hidden pb-[0.08em]">
              <span :ref="(el) => setHeadingRef(el as Element | null, 1)" class="block whitespace-nowrap">
                {{ headingLine2 }}
              </span>
            </span>
            <span class="block overflow-hidden pb-[0.08em]">
              <span :ref="(el) => setHeadingRef(el as Element | null, 2)" class="block whitespace-nowrap">
                {{ headingLine3 }}
              </span>
            </span>
          </h1>

          <p
            ref="descriptionRef"
            class="max-w-[52ch] border-l-2 border-white/30 pl-4 text-sm leading-7 text-white/70 sm:text-lg sm:leading-8"
          >
            {{ description }}
          </p>
        </div>

        <div ref="ctaWrapRef" class="mt-6 sm:mt-8">
          <HeroCTA :text="ctaText" href="#consultation-form"   bg-color="#f8f4eecc"  text-color="#252525" :blur="6" radius="4px"/>
        </div>
      </div>
    </div>
  </section>
</template>
