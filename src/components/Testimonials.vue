<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";

interface Review {
  name: string;
  company: string;
  role: string;
  avatar: string;
  quote: string;
}

interface Props {
  eyebrow?: string;
  reviews?: Review[];
}

const props = withDefaults(defineProps<Props>(), {
  eyebrow: "別只聽我們說⋯",
  reviews: () => [
    {
      name: "陳文彥",
      company: "晨曦餐飲集團",
      role: "人資協理",
      avatar: "https://i.pravatar.cc/120?img=12",
      quote:
        "整體合作過程非常順暢，先付一部分訂金，隨著里程碑逐步完成再付款，這讓我們感到很安心也很有信心。",
    },
    {
      name: "林韋捷",
      company: "科定科技",
      role: "共同創辦人",
      avatar: "https://i.pravatar.cc/120?img=33",
      quote:
        "團隊回應速度非常快，任何問題都能在幾小時內得到清楚的答覆，這種被重視的感覺讓合作變得很輕鬆。",
    },
    {
      name: "黃靜宜",
      company: "永泰精密工業",
      role: "總經理",
      avatar: "https://i.pravatar.cc/120?img=47",
      quote:
        "從一開始的溝通到最後交付，每個階段都清楚透明，讓我們對整個專案的掌握度非常高。",
    },
    {
      name: "許家豪",
      company: "翔宇連鎖零售",
      role: "營運長",
      avatar: "https://i.pravatar.cc/120?img=51",
      quote:
        "專業度超出預期，很多我們自己都沒想到的細節，都被主動提出來討論並解決。",
    },
  ],
});

/* ----------------------------------
   State
---------------------------------- */

const activeIndex = ref(0);
const quoteRef = ref<HTMLElement | null>(null);
const avatarRef = ref<HTMLElement | null>(null);
const nameRef = ref<HTMLElement | null>(null);
const counterRef = ref<HTMLElement | null>(null);
const quoteIconRef = ref<HTMLElement | null>(null);

let prefersReducedMotion = false;
let isUnmounted = false;
let isAnimating = false;
let switchTimeline: gsap.core.Timeline | null = null;

/* ----------------------------------
   數字格式化：01/05
---------------------------------- */

const formatCounter = (index: number, total: number) =>
  `${String(index + 1).padStart(2, "0")}/${String(total).padStart(2, "0")}`;

/* ----------------------------------
   切換：文案先顯現 → 數字接著顯現
---------------------------------- */

const switchTo = (newIndex: number) => {
  if (isAnimating || newIndex === activeIndex.value) return;

  if (prefersReducedMotion) {
    activeIndex.value = newIndex;
    return;
  }

  isAnimating = true;
  switchTimeline?.kill();

  switchTimeline = gsap.timeline({
    onComplete: () => {
      isAnimating = false;
    },
  });

  switchTimeline
    // Exit：圖示 + 文案 + 姓名 + 數字 一起快速淡出
    .to(
      [quoteIconRef.value, quoteRef.value, nameRef.value, counterRef.value],
      {
        opacity: 0,
        y: -16,
        duration: 0.35,
        ease: "power2.in",
        stagger: 0.03,
      },
      0,
    )
    .to(
      avatarRef.value,
      { opacity: 0, duration: 0.3, ease: "power2.in" },
      0,
    )
    .call(() => {
      if (isUnmounted) return;
      activeIndex.value = newIndex;
    })
    // Enter：圖示 + 文案 一起先出現（用 stagger 讓兩者有些微時間差，圖示先、文字接著）
    .fromTo(
      [quoteIconRef.value, quoteRef.value],
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: "power3.out",
        stagger: 0.08,
      },
      "+=0",
    )
    // 頭像從中心擴散
    .fromTo(
      avatarRef.value,
      { opacity: 1, clipPath: "circle(0% at center)" },
      { clipPath: "circle(75% at center)", duration: 0.6, ease: "power2.out" },
      "<0.2",
    )
    // 姓名 + 公司
    .fromTo(
      nameRef.value,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" },
      "<0.15",
    )
    // 數字最後才顯現
    .fromTo(
      counterRef.value,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" },
      ">-0.1",
    );
};

/* ----------------------------------
   箭頭切換
---------------------------------- */

const handlePrev = () => {
  const total = props.reviews.length;
  const targetIndex = (activeIndex.value - 1 + total) % total;
  switchTo(targetIndex);
};

const handleNext = () => {
  const total = props.reviews.length;
  const targetIndex = (activeIndex.value + 1) % total;
  switchTo(targetIndex);
};

/* ----------------------------------
   Magnetic Hover：箭頭按鈕
---------------------------------- */

const handleMagneticMove = (event: MouseEvent) => {
  if (prefersReducedMotion) return;

  const button = event.currentTarget as HTMLElement;
  const rect = button.getBoundingClientRect();

  const relX = event.clientX - (rect.left + rect.width / 2);
  const relY = event.clientY - (rect.top + rect.height / 2);

  gsap.to(button, {
    x: relX * 0.5,
    y: relY * 0.5,
    duration: 0.3,
    ease: "power2.out",
    overwrite: true,
  });
};

const handleMagneticLeave = (event: MouseEvent) => {
  gsap.to(event.currentTarget as HTMLElement, {
    x: 0,
    y: 0,
    duration: 0.4,
    ease: "power2.out",
    overwrite: true,
  });
};

/* ----------------------------------
   Lifecycle
---------------------------------- */

onMounted(async () => {
  await nextTick();

  prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
});

onBeforeUnmount(() => {
  isUnmounted = true;
  switchTimeline?.kill();

  if (quoteIconRef.value) gsap.killTweensOf(quoteIconRef.value);
  if (quoteRef.value) gsap.killTweensOf(quoteRef.value);
  if (avatarRef.value) gsap.killTweensOf(avatarRef.value);
  if (nameRef.value) gsap.killTweensOf(nameRef.value);
  if (counterRef.value) gsap.killTweensOf(counterRef.value);
});
</script>

<template>
  <section class="min-h-screen w-full bg-white py-20 sm:py-28 flex items-center">
    <div class="mx-auto max-w-[1800px] px-6">
      <div class="rounded-3xl border border-gray-200 px-8 py-10 sm:px-14 sm:py-14">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-6">
          <!-- 手機版：按鈕 + 數字/標題 同一行；桌機版：按鈕獨立一欄 -->
          <div class="flex items-center justify-between gap-4 lg:col-span-1 lg:block">
            <!-- 按鈕 -->
            <div class="flex gap-3">
              <button type="button"
                class="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-[#1a1a1a] transition-colors hover:border-[#B55F00] hover:text-[#B55F00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B55F00]"
                aria-label="上一則評價" @click="handlePrev" @mousemove="handleMagneticMove" @mouseleave="handleMagneticLeave">
                <svg viewBox="0 0 20 20" fill="none" class="h-4 w-4">
                  <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </button>

              <button type="button"
                class="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-[#1a1a1a] transition-colors hover:border-[#B55F00] hover:text-[#B55F00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B55F00]"
                aria-label="下一則評價" @click="handleNext" @mousemove="handleMagneticMove" @mouseleave="handleMagneticLeave">
                <svg viewBox="0 0 20 20" fill="none" class="h-4 w-4">
                  <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </button>
            </div>

            <!-- 數字/標題：只在手機版顯示在這裡（跟按鈕同一行），桌機版隱藏（會在右欄重複顯示一次） -->
            <div class="flex items-baseline gap-3 lg:hidden">
              <span class="text-lg font-medium text-gray-400">
                {{ formatCounter(activeIndex, reviews.length) }}
              </span>
              <h2 class="text-lg font-bold text-[#1a1a1a]">
                {{ eyebrow }}
              </h2>
            </div>
          </div>

          <!-- 右欄：桌機版顯示完整的數字/標題 + 引言 + 姓名頭像 -->
          <div class="lg:col-span-2">
            <!-- 數字/標題：只在桌機版顯示在這裡 -->
            <div class="hidden items-baseline gap-4 lg:flex">
              <span ref="counterRef" class="text-lg font-medium text-gray-400">
                {{ formatCounter(activeIndex, reviews.length) }}
              </span>
              <h2 class="text-xl font-bold text-[#1a1a1a] sm:text-2xl">
                {{ eyebrow }}
              </h2>
            </div>
            <div class="sm:mt-16  lg:mt-16">
              <img src="../assets/quote.svg" alt="" ref="quoteIconRef" class="mb-4 h-8 w-8" aria-hidden="true" />
              <p ref="quoteRef" class="mt-6 text-2xl font-medium leading-snug text-[#1a1a1a] sm:text-5xl">
                「{{ reviews[activeIndex].quote }}」
              </p>
            </div>


            <div class="mt-8 flex items-center gap-4 sm:mt-12">
              <img ref="avatarRef" :src="reviews[activeIndex].avatar" :alt="reviews[activeIndex].name"
                class="h-18 w-18 shrink-0 rounded-full object-cover" style="transform-origin: center center;"
                loading="lazy" />
              <div ref="nameRef">
                <p class="font-semibold text-[#1a1a1a] text-xl">{{ reviews[activeIndex].name }}</p>
                <p class="text-sm text-gray-500">{{ reviews[activeIndex].company }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>