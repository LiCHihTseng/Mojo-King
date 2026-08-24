<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroCTA from "./Hero/HeroCTA.vue";
import walk_img from "../assets/walk.png";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  eyebrow?: string;
  heading?: string;
  intro?: string;
  outro?: string;
  ctaText?: string;
  image?: string;
  imageAlt?: string;
}

withDefaults(defineProps<Props>(), {
  eyebrow: "準備好了嗎",
  heading: "好的，那我們就從這裡開始",
  intro:
    "不管你現在卡在招募、留才、還是主管培力的哪一個環節，先聊聊，讓我了解你真正的困境在哪裡。第一次的對話不收費，也不會有任何推銷。",
  outro:
    "我們會先花時間搞懂你的組織現況與真正的痛點，再談合作方式。比起賣你一套方案，我們更在意這件事情最後有沒有真的被解決。",
  ctaText: "預約諮詢",
  image:
  walk_img,
  imageAlt: "兩個人正在進行一對一諮詢對談",
});

/* ----------------------------------
   Refs
---------------------------------- */

const sectionRef = ref<HTMLElement | null>(null);
const decorRef = ref<HTMLElement | null>(null);
const eyebrowRef = ref<HTMLElement | null>(null);
const headingRef = ref<HTMLElement | null>(null);
const introRef = ref<HTMLElement | null>(null);
const imageWrapRef = ref<HTMLElement | null>(null);
const outroRef = ref<HTMLElement | null>(null);
const ctaRef = ref<HTMLElement | null>(null);

let prefersReducedMotion = false;
let triggers: ScrollTrigger[] = [];

/* ----------------------------------
   通用：由下往上淡入（跟站上其他區塊同一套手感）
---------------------------------- */

const revealUp = (
  el: HTMLElement | null,
  options: { y?: number; delay?: number; start?: string } = {},
) => {
  if (!el) return;

  const { y = 32, delay = 0, start = "top 82%" } = options;

  gsap.set(el, { opacity: 0, y });

  triggers.push(
    ScrollTrigger.create({
      trigger: el,
      start,
      once: true,
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay,
          ease: "power3.out",
        });
      },
    }),
  );
};

/* ----------------------------------
   Lifecycle
---------------------------------- */

onMounted(async () => {
  await nextTick();

  prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion) return;

  revealUp(eyebrowRef.value, { y: 20 });
  revealUp(headingRef.value, { y: 36, delay: 0.05 });
  revealUp(introRef.value, { y: 28, delay: 0.12 });

  // 圖片：淡入 + 輕微放大，讓它比文字更有份量
  if (imageWrapRef.value) {
    const img = imageWrapRef.value.querySelector("img");
    gsap.set(imageWrapRef.value, { opacity: 0, y: 48 });
    if (img) gsap.set(img, { scale: 1.08 });

    triggers.push(
      ScrollTrigger.create({
        trigger: imageWrapRef.value,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.to(imageWrapRef.value, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
          });
          if (img) {
            gsap.to(img, { scale: 1, duration: 1.6, ease: "power2.out" });
          }
        },
      }),
    );
  }

  revealUp(outroRef.value, { y: 28 });
  revealUp(ctaRef.value, { y: 20, delay: 0.1 });

  // 背景裝飾圖形：非常輕微的視差，讓大面積色塊不會太死
  if (decorRef.value && sectionRef.value) {
    const decorTween = gsap.to(decorRef.value, {
      yPercent: -8,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.value,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    if (decorTween.scrollTrigger) triggers.push(decorTween.scrollTrigger);
  }

  requestAnimationFrame(() => ScrollTrigger.refresh());
});

onBeforeUnmount(() => {
  triggers.forEach((t) => t.kill());
  triggers = [];

  [
    decorRef.value,
    eyebrowRef.value,
    headingRef.value,
    introRef.value,
    imageWrapRef.value,
    outroRef.value,
    ctaRef.value,
  ].forEach((el) => el && gsap.killTweensOf(el));
});
</script>

<template>
  <section
    ref="sectionRef"
    class="relative flex min-h-[66svh] items-center overflow-hidden bg-[#F9F8F6] py-14 sm:py-16 md:py-12 xl:py-14"
  >

    <!-- 內容 -->
    <div class="relative z-10 mx-auto w-full max-w-[2000px] px-5 sm:px-8 lg:px-10 xl:px-12">
      <div class="md:grid md:grid-cols-12 ">
        <!-- 左側：小標（桌機才獨立成一欄）-->
        <div class="md:col-span-12 lg:col-span-2">
          <p
            ref="eyebrowRef"
            class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#B55F00] sm:text-sm"
          >
            <span class="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#B55F00]"></span>
            {{ eyebrow }}
          </p>
        </div>

        <!-- 中間：標題 + 引言 + 輔助圖片 -->
        <div class="mt-8 md:col-span-7 md:mt-8 lg:col-span-6 lg:mt-0">
          <h2
            ref="headingRef"
            class="text-3xl font-medium leading-tight text-[#252525] sm:text-4xl lg:text-4xl xl:text-5xl"
          >
            {{ heading }}
          </h2>

          <p
            ref="introRef"
            class="mt-4 max-w-2xl text-base leading-relaxed text-[#555] sm:mt-5 sm:text-lg"
          >
            {{ intro }}
          </p>

          <div
            ref="imageWrapRef"
            class="mt-8 w-full max-w-[34rem] overflow-hidden rounded-sm sm:mt-10 md:mt-8 lg:mt-7"
            style="will-change: transform, opacity;"
          >
            <img
              :src="image"
              :alt="imageAlt"
              class="aspect-4/3 w-full object-cover object-center "
              loading="lazy"
            />
          </div>
        </div>

        <!-- 右側：結語 + CTA（桌機靠下對齊，呼應參考圖的配置）-->
        <div class="mt-8 md:col-span-5 md:mt-8 md:flex md:flex-col md:justify-end md:pb-1 lg:col-span-4 lg:mt-0">
          <p
            ref="outroRef"
            class="max-w-md text-base leading-relaxed text-[#555] sm:text-lg md:text-base xl:text-lg"
          >
            {{ outro }}
          </p>

          <div ref="ctaRef" class="mt-6 sm:mt-8 lg:mt-7">
            <HeroCTA :text="ctaText" href="#consultation-form" bg-color="#252525" text-color="#FFFFFF"/>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
