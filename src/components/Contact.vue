<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroCTA from "./Hero/HeroCTA.vue";
import Portrait from "../assets/Contact.png";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  eyebrow?: string;
  headingLine1?: string;
  headingLine2?: string;
  description?: string;
  ctaText?: string;
}

withDefaults(defineProps<Props>(), {
  eyebrow: "準備好了嗎",
  headingLine1: "好的，那我們",
  headingLine2: "就從這裡開始。",
  description:
    "不管你現在卡在招募、留才、還是主管培力的哪一個環節，先聊聊，讓我了解你真正的困境在哪裡。",
  ctaText: "預約諮詢",
});

const lineShapeRef = ref<HTMLElement | null>(null);
const linePathRef = ref<SVGPathElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const photoRef = ref<HTMLElement | null>(null);

let lineTrigger: ScrollTrigger | null = null;
let prefersReducedMotion = false;

const setupLineDrawAnimation = () => {
  if (!lineShapeRef.value || !linePathRef.value) return;

  const pathLength = linePathRef.value.getTotalLength();

  gsap.set(linePathRef.value, {
    strokeDasharray: pathLength,
    strokeDashoffset: pathLength,
  });

  // 初始：頂部裁掉 100%，文字完全埋在下方看不見（像種子還在土裡）
  if (contentRef.value) {
    gsap.set(contentRef.value, { clipPath: "inset(100% 0 0% 0)" });
  }
  if (photoRef.value) {
    gsap.set(photoRef.value, { opacity: 0 });
  }

  if (prefersReducedMotion) {
    gsap.set(linePathRef.value, { strokeDashoffset: 0 });
    if (contentRef.value) gsap.set(contentRef.value, { clipPath: "inset(0% 0 0% 0)" });
    if (photoRef.value) gsap.set(photoRef.value, { opacity: 1 });
    return;
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: lineShapeRef.value,
      start: "top 80%",
      once: true,
    },
  });

  // 第一階段：SVG 畫線
  tl.to(linePathRef.value, {
    strokeDashoffset: 0,
    duration: 1.8,
    ease: "power2.inOut",
  });

  // 第二階段：SVG 畫完後，文字由下往上「長出來」+ 照片 fade 同時進行
  if (contentRef.value) {
    tl.to(
      contentRef.value,
      {
        clipPath: "inset(0% 0 0% 0)",
        duration: 0.9,
        ease: "power3.out",
      },
      ">",
    );
  }

  if (photoRef.value) {
    tl.to(
      photoRef.value,
      {
        opacity: 1,
        duration: 1.1,
        ease: "power2.out",
      },
      "<",
    );
  }

  lineTrigger = tl.scrollTrigger ?? null;
};

onMounted(async () => {
  await nextTick();

  prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  setupLineDrawAnimation();
});

onBeforeUnmount(() => {
  lineTrigger?.kill();
  if (linePathRef.value) gsap.killTweensOf(linePathRef.value);
  if (contentRef.value) gsap.killTweensOf(contentRef.value);
  if (photoRef.value) gsap.killTweensOf(photoRef.value);
});
</script>

<template>
  <section class="w-full bg-white py-20 sm:py-28">
    <div class="mx-auto max-w-[1800px] px-6">
      <div class="relative">
        <div class="relative overflow-hidden rounded-[2.5rem] bg-[#FBDCC8] px-8 py-16 sm:px-16 sm:py-24">
          <div class="pointer-events-none absolute inset-0 z-0 flex items-center justify-center text-[#B55F00]">
            <svg
              ref="lineShapeRef"
              class="h-[130%] w-auto opacity-40 sm:h-[150%] lg:h-[170%]"
              viewBox="0 0 546 856"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                ref="linePathRef"
                d="M270.425 38.4964C372.561 73.8224 537.802 220.611 496.984 324.015C441.229 465.261 9.73912 396.702 44.3848 265.283C79.0577 133.76 425.118 324.547 377.84 502.949C356.856 582.133 266.953 611.185 195.833 613.198C192.14 613.303 190.85 619.406 194.16 621.038C260.632 653.804 332.782 733.603 323.697 852.43"
                stroke="currentColor"
                stroke-width="83.2"
                stroke-linejoin="bevel"
              />
            </svg>
          </div>

          <div class="relative z-10 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div ref="contentRef" class="flex flex-col">
              <p class="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#B55F00]">
                { {{ eyebrow }} }
              </p>

              <h2 class="text-4xl font-black leading-tight tracking-tight text-[#3A2318] sm:text-5xl lg:text-6xl">
                {{ headingLine1 }}
                <br />
                {{ headingLine2 }}
              </h2>

              <p class="mt-6 max-w-md text-base leading-7 text-[#5C4534] sm:text-lg">
                {{ description }}
              </p>

              <div class="mt-10">
                <HeroCTA :text="ctaText" href="#contact" />
              </div>
            </div>

            <div class="hidden lg:block"></div>
          </div>
        </div>

        <div
          ref="photoRef"
          class="pointer-events-none absolute bottom-0 right-[4%] z-20 hidden h-full items-end lg:flex"
        >
          <img
            :src="Portrait"
            alt="王郁婷，慕玖共享人資長"
            class="h-full w-auto object-contain object-bottom"
          />
        </div>
      </div>
    </div>
  </section>
</template>