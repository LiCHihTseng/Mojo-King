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
    class="relative flex min-h-screen items-center overflow-hidden bg-[#FF891D] py-20 sm:py-28 lg:py-36"
  >
    <!-- 背景裝飾圖形：置中、比容器大很多，用比底色更深的同色系疊上去 -->
    <div
      ref="decorRef"
      class="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
      aria-hidden="true"
    >
      <svg
        class="h-[130%] w-auto min-w-[620px] sm:h-[145%] lg:h-[165%]"
        viewBox="0 0 3622 5110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clip-path="url(#contact-decor-clip)">
          <path
            d="M2823.17 3126.72C2924.6 3029.34 3054.85 2949.36 3198.16 2936.32C3467.51 2911.85 3678.18 3005.75 3608.58 3309.17C3529.78 3652.47 2965.36 4138.97 2706.34 4394.95C2313.58 4783.08 1846.49 5336.03 1244.41 5012.48C956.926 4857.97 248.584 4371.35 94.4617 4099.84C-218.631 3548.51 604.681 3263.22 895.152 3672.34C959.039 3762.26 989.49 3875.78 1061.08 3966.08C1277.23 4238.7 1346.71 4010.54 1327.69 3774.18C1319.11 3667.74 1255.72 3486.66 1190.47 3402.07C1077.86 3255.76 916.282 3254.77 759.55 3186.83C234.415 2959.17 -120.564 2468.07 38.1572 1877.87C183.828 1336.1 625.811 1766.46 785.527 2042.93C924.361 2283.26 1134.42 2812.11 1134.42 2812.11C1134.42 2812.11 1550.17 2958.67 1526.56 2631.4C1504.68 2328.97 1101.35 1727.33 1101.35 1727.33C1101.35 1727.33 699.889 761.163 889.932 331.92C1088.3 -115.953 1776.76 -82.9151 2066.86 265.721C2565.02 864.251 1927.4 2126.39 1927.4 2126.39C1927.4 2126.39 1953.25 2575.63 2191.27 2352.81C2476.77 2085.53 2677.63 1175.75 3112.03 1124.21C3361.36 1094.65 3443.39 1288.53 3463.28 1503.27C3529.53 2218.68 2495.79 2855.83 2495.79 2855.83C2495.79 2855.83 2124.9 3449.4 2202.83 3669.48C2252.92 3811.07 2356.08 3661.23 2445.33 3625.14C2671.68 3533.6 2672.03 3271.66 2822.93 3126.84L2823.17 3126.72Z"
            fill="#2F2F2F4D"
            fill-opacity="0.55"
          />
        </g>
        <defs>
          <clipPath id="contact-decor-clip">
            <rect width="3622" height="5110" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </div>

    <!-- 內容 -->
    <div class="relative z-10 mx-auto w-full max-w-[2000px] px-5 sm:px-8 lg:px-12">
      <div class="lg:grid lg:grid-cols-12 lg:gap-x-10">
        <!-- 左側：小標（桌機才獨立成一欄）-->
        <div class="lg:col-span-2">
          <p
            ref="eyebrowRef"
            class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white sm:text-sm"
          >
            <span class="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-white"></span>
            {{ eyebrow }}
          </p>
        </div>

        <!-- 中間：標題 + 引言 + 大圖 -->
        <div class="mt-10 lg:col-span-6 lg:mt-0">
          <h2
            ref="headingRef"
            class="text-3xl font-medium leading-tight text-white sm:text-4xl lg:text-5xl"
          >
            {{ heading }}
          </h2>

          <p
            ref="introRef"
            class="mt-6 max-w-2xl text-base leading-relaxed text-white sm:text-lg"
          >
            {{ intro }}
          </p>

          <div
            ref="imageWrapRef"
            class="mt-10 overflow-hidden rounded-sm sm:mt-14"
            style="will-change: transform, opacity;"
          >
            <img
              :src="image"
              :alt="imageAlt"
              class="aspect-[4/3] w-full object-cover sm:aspect-[3/2]"
              loading="lazy"
            />
          </div>
        </div>

        <!-- 右側：結語 + CTA（桌機靠下對齊，呼應參考圖的配置）-->
        <div class="mt-10 lg:col-span-4 lg:mt-0 lg:flex lg:flex-col lg:justify-end lg:pb-2">
          <p
            ref="outroRef"
            class="max-w-md text-base leading-relaxed text-white sm:text-lg"
          >
            {{ outro }}
          </p>

          <div ref="ctaRef" class="mt-8 sm:mt-10">
            <HeroCTA :text="ctaText" href="#consultation-form" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>