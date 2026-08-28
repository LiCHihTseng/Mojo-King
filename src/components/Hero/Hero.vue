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
  <section ref="sectionRef" class="relative h-full min-h-[100dvh] overflow-hidden">
    <!-- 群組容器：照片 + 所有遮罩，一起被 GSAP 縮放，永遠對齊 -->
    <div ref="visualGroupRef" class="absolute inset-0" style="transform-origin: center center;">
      <img
        data-critical-image
        :src="Portrait"
        alt="王郁婷，慕玖共享人資長"
        class="absolute inset-0 h-full w-full object-cover object-[46%_50%] lg:object-center"
        loading="eager"
        fetchpriority="high"
      />

      <div ref="dimOverlayRef" class="pointer-events-none absolute inset-0 z-[5] bg-[#1f1f1f] opacity-0"></div>
      <!-- 桌機：左→右壓暗。文字在左、人像在右，兩邊互不干擾 -->
      <div class="pointer-events-none absolute inset-0 z-0 hidden bg-gradient-to-r from-black via-black/65 to-transparent lg:block"></div>

      <!--
        手機／平板：畫面太窄，左→右遮罩會整片壓在人像上。
        改成下→上，文字落在下方暗部，臉部留在上方乾淨區。
      -->
      <div class="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[72%] bg-gradient-to-t from-black via-black/80 to-transparent lg:hidden"></div>

      <!-- 桌機底部收邊，接住下方 About 的圓角 -->
      <div class="pointer-events-none absolute inset-x-0 bottom-0 z-0 hidden h-60 bg-gradient-to-t from-black/70 to-transparent lg:block"></div>
    </div>

    <!--
      內容容器：標題、說明文字、CTA 共用同一組水平內距，
      並用 max-w-[2000px] 對齊下方 About 的容器，捲動接縫才不會歪。

      垂直定位分兩種：
      - lg 以上：justify-center，人像在右、文字在左，互不重疊。
      - lg 以下：justify-end。照片是固定 1.5:1，視窗一窄 object-cover
        就往中間裁，人臉會滑到畫面正中央；文字若還置中就會壓在臉上。
        改成靠下對齊，臉留在上方。pb 用 vh 而非固定值，矮螢幕
        （iPhone SE 667px）才不會被文字區把臉吃掉。
    -->
    <div
      ref="contentRef"
      class="relative z-20 mx-auto flex h-full min-h-[100dvh] w-full max-w-[2000px] flex-col justify-end px-8 pb-[5vh] sm:pb-[7vh] lg:justify-center lg:px-16 lg:pb-0"
      style="transform-origin: left center;"
    >
      <div class="flex w-full min-w-0 max-w-full flex-col">
        <!-- 標題區塊（原本 HeroTitle.vue） -->
        <div ref="headingWrapRef" class="flex flex-col gap-6 md:gap-10 lg:gap-14">
          <!--
            外層 span 的 overflow-hidden 是進場遮罩用的，它同時也會把
            超出寬度的字「無聲裁掉」（不會出現捲軸，字就是消失）。
            所以內層不能用 whitespace-nowrap：文案一加長就會少字。
            改由 max-w-[13ch] 控制每行字數，超過就換行；
            text-balance 讓換行後不會掉出一個孤字。
          -->
          <h1 class="max-w-[13ch] text-balance text-5xl font-medium leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl xl:text-8xl">
            <!-- <span :ref="(el) => setHeadingRef(el as Element | null, 0)" class="block">
              {{ headingLine1 }}
            </span> -->
            <span class="block overflow-hidden pb-[0.08em]">
              <span :ref="(el) => setHeadingRef(el as Element | null, 1)" class="block">
                {{ headingLine2 }}
              </span>
            </span>
            <span class="block overflow-hidden pb-[0.08em]">
              <span :ref="(el) => setHeadingRef(el as Element | null, 2)" class="block">
                {{ headingLine3 }}
              </span>
            </span>
          </h1>

          <p
            ref="descriptionRef"
            class="max-w-[52ch] text-base leading-7 text-white/75 sm:text-lg sm:leading-8"
          >
            {{ description }}
          </p>
        </div>

        <div ref="ctaWrapRef" class="mt-6 sm:mt-8">
          <HeroCTA :text="ctaText" href="#contact"  variant="solid" bg-color="#ffffff" radius="4px"
                text-color="#252525"/>
        </div>
      </div>
    </div>
  </section>
</template>
