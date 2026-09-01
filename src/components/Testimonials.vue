<script setup lang="ts">
/**
 * Testimonials.vue
 *
 * 匿名案例輪播（Anonymous Case Highlights）。
 *
 * 顧問業的客戶名單多半不能公開，所以這裡不寫公司名、不放人像，
 * 只呈現「產業｜主題 ／ 當時的問題 ／ 最後的結果」三段。
 * 讀者要的是「這種狀況你們處理過嗎」，那不需要公司名也答得出來。
 *
 * ⚠️ 下方 cases 預設值是版型用的示意內容，敘述全是編的。
 *    上線前務必換成真實案例。
 */
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface CaseHighlight {
  /** 產業，例如「上市櫃科技公司」 */
  industry: string;
  /** 處理的主題，例如「組織制度重整」 */
  topic: string;
  /** 當時遇到的問題，一句話 */
  challenge: string;
  /** 合作後的結果，這是版面上最大的那段字 */
  outcome: string;
  /**
   * 產業 icon：24×24 線條稿的單一 <path> d 字串（可含多段 M...）。
   * 只存 d 而不是整個 <svg>，換圖示時改這一行就好，不用動版面。
   * 沒給就不顯示左邊那顆圓形圖示。
   */
  iconPath?: string;
}

interface Props {
  heading?: string;
  intro?: string;
  /** 自動切換的秒數；設 0 就只剩手動切換 */
  autoplaySeconds?: number;
  cases?: CaseHighlight[];
}

const props = withDefaults(defineProps<Props>(), {
  heading: "我們一起解決過的問題",
  intro:
    "基於保密，以下案例不具名呈現。只說明產業、當時遇到的狀況，以及最後真正改變了什麼。",
  autoplaySeconds: 7,
  cases: () => [
    {
      industry: "上市櫃科技公司",
      topic: "組織制度重整",
      // 辦公大樓
      iconPath:
        "M4 21V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v15M12 21V10a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v11M3 21h18M7 9h1.5M7 13h1.5M15.5 13H17M15.5 17H17",
      challenge: "跨部門權責重疊，決策卡在中層動彈不得。",
      outcome:
        "重新盤點組織架構與決策層級，把「誰可以決定什麼」寫進制度裡。三個事業處完成權責重劃後，過去要開三次會才推得動的事，現在一次會議就能定案。",
    },
    {
      industry: "半導體企業",
      topic: "主管培訓與人才發展",
      // 晶片
      iconPath:
        "M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM9 9h6v6H9zM9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3",
      challenge: "新任主管比例過半，帶人方式各行其是。",
      outcome:
        "依照主管的任期與職責設計分階段的培育路徑，把面談、回饋與績效對話變成可以練習的具體動作。半年後，第一線主管開始自己處理團隊問題，而不是全部往上丟。",
    },
    {
      industry: "傳統製造業",
      topic: "人資制度建立",
      // 工廠
      iconPath:
        "M3 21h18M5 21V12l5 3V12l5 3V8a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v13M8 18h1.5M13 18h1.5",
      challenge: "沒有職級與薪酬標準，加薪升遷全憑印象。",
      outcome:
        "從職務盤點做起，建立職級架構與薪酬帶寬。第一次，調薪與升遷有了能對員工說明、也能對經營層交代的依據，人事爭議明顯減少。",
    },
    {
      industry: "連鎖服務業",
      topic: "招募與雇用流程",
      // 店面
      iconPath:
        "M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M3 9l1.5-5h15L21 9M3 9h18M9.5 21v-6h5v6",
      challenge: "門市長期開缺補不滿，面談品質因人而異。",
      outcome:
        "重寫職缺說明、導入結構化面談與到職後的追蹤機制。補缺速度變快之外，更重要的是新人留得住——不再是招進來又走。",
    },
  ],
});

/* ----------------------------------
   Refs & state
---------------------------------- */

const sectionRef = ref<HTMLElement | null>(null);
const headingRef = ref<HTMLElement | null>(null);
const introRef = ref<HTMLElement | null>(null);
const counterRef = ref<HTMLElement | null>(null);
const outcomeRef = ref<HTMLElement | null>(null);
const attributionRef = ref<HTMLElement | null>(null);
const btnGroupRef = ref<HTMLElement | null>(null);
const progressRingRef = ref<SVGCircleElement | null>(null);

const activeIndex = ref(0);
/** 決定進度環要不要存在：關掉自動輪播時整個環就不該出現在畫面上 */
const autoplayEnabled = ref(false);

let prefersReducedMotion = false;
let isUnmounted = false;
let isAnimating = false;
let isPaused = false;
let switchTimeline: gsap.core.Timeline | null = null;
let autoplayTween: gsap.core.Tween | null = null;
let entranceTrigger: ScrollTrigger | null = null;

const formatCounter = (index: number, total: number) =>
  `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

/* ----------------------------------
   自動切換：進度環繞著「下一則」按鈕跑一圈就換頁

   環是 pathLength="1" 的圓，所以 dashoffset 直接就是「還剩幾成」，
   跟半徑無關 —— 按鈕尺寸之後怎麼調都不用重算。
---------------------------------- */

/**
 * 用 getTotalLength() 量實際周長，而不是寫死或用 pathLength="1"。
 * pathLength="1" 的話 dashoffset 只在 0～1 之間跑，GSAP 會把 px 值
 * 四捨五入成整數，環就變成「跳一格」而不是掃過去。量真實周長
 * （約 138px）才有足夠的解析度，按鈕尺寸改了也不用重算。
 */
const resetRing = () => {
  const ring = progressRingRef.value;
  if (!ring) return;

  const length = ring.getTotalLength();
  gsap.set(ring, { strokeDasharray: length, strokeDashoffset: length });
};

const startAutoplay = () => {
  autoplayTween?.kill();
  autoplayTween = null;

  const ring = progressRingRef.value;
  if (!ring || !autoplayEnabled.value) return;

  const length = ring.getTotalLength();

  autoplayTween = gsap.fromTo(
    ring,
    { strokeDasharray: length, strokeDashoffset: length },
    {
      strokeDashoffset: 0,
      duration: props.autoplaySeconds,
      ease: "none",
      // 跑滿一圈就換下一則
      onComplete: () => {
        if (!isUnmounted) handleNext();
      },
    },
  );

  // 游標還停在區塊上時按了箭頭：新的計時要接著暫停，
  // 否則會在使用者眼前自己跳走
  if (isPaused) autoplayTween.pause();
};

/** 游標停在案例內文上時暫停，讓人有時間讀完 */
const pauseAutoplay = () => {
  isPaused = true;
  autoplayTween?.pause();
};

const resumeAutoplay = () => {
  isPaused = false;
  autoplayTween?.resume();
};

/**
 * 只有鍵盤 focus 才暫停。
 *
 * 滑鼠點箭頭同樣會觸發 focusin，但 focus 會一直留在那顆按鈕上，
 * focusout 不會來 —— 那會讓進度條在點完「下一則」之後直接卡死，
 * 得點畫面別的地方才解開。:focus-visible 正好只在鍵盤操作時成立。
 */
const handleFocusIn = (event: FocusEvent) => {
  const target = event.target as HTMLElement | null;
  if (target?.matches?.(":focus-visible")) pauseAutoplay();
};

/* ----------------------------------
   切換
---------------------------------- */

const switchTo = (newIndex: number) => {
  if (newIndex === activeIndex.value) return;

  if (prefersReducedMotion) {
    activeIndex.value = newIndex;
    return;
  }

  if (isAnimating) return;

  isAnimating = true;
  switchTimeline?.kill();

  const targets = [
    counterRef.value,
    outcomeRef.value,
    attributionRef.value,
  ].filter((target): target is HTMLElement => Boolean(target));

  switchTimeline = gsap
    .timeline({
      onComplete: () => {
        isAnimating = false;
      },
    })
    .to(targets, {
      opacity: 0,
      y: -14,
      duration: 0.3,
      ease: "power2.in",
      stagger: 0.04,
    })
    .call(() => {
      if (!isUnmounted) activeIndex.value = newIndex;
    })
    .fromTo(
      targets,
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: "power3.out",
        stagger: 0.07,
      },
    );
};

/**
 * 手動與自動都走這裡，進度環一律重新計時。
 * 前一次切換還在播時 switchTo 會擋掉，但環照樣重跑，
 * 輪播就不會因為一次被擋掉而停在原地。
 */
const goToOffset = (offset: number) => {
  const total = props.cases.length;
  // 按下箭頭是明確的「我要看下一則」，就算游標還停在內文上也要立刻重新開始跑
  isPaused = false;
  startAutoplay();
  switchTo((activeIndex.value + offset + total) % total);
};

const handlePrev = () => goToOffset(-1);
const handleNext = () => goToOffset(1);

/* ----------------------------------
   進場動畫
---------------------------------- */

const setupEntrance = () => {
  if (!sectionRef.value) return;

  // 取 children 而不是 button：「下一則」外面包了一層放進度環的 div，
  // 縮放要套在那一層，環才會跟著按鈕一起放大，不會先掛在半縮小的按鈕外圍。
  const buttons = btnGroupRef.value
    ? Array.from(btnGroupRef.value.children)
    : [];
  const copy = [
    headingRef.value,
    introRef.value,
    counterRef.value,
    outcomeRef.value,
    attributionRef.value,
  ].filter((target): target is HTMLElement => Boolean(target));

  gsap.set(copy, { opacity: 0, y: 28 });
  gsap.set(buttons, { opacity: 0, scale: 0.6 });
  resetRing();

  entranceTrigger = ScrollTrigger.create({
    trigger: sectionRef.value,
    start: "top 78%",
    once: true,
    onEnter: () => {
      gsap
        .timeline({ onComplete: startAutoplay })
        .to(copy, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.09,
        })
        .to(
          buttons,
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            ease: "back.out(1.8)",
            stagger: 0.08,
          },
          "-=0.5",
        );
    },
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

  // 減少動態時不自動輪播：內容自己跳動對這些使用者是干擾，留箭頭手動切換就好
  if (prefersReducedMotion) return;

  autoplayEnabled.value = props.autoplaySeconds > 0;
  // 等 v-if 把進度環掛上來，才有辦法量周長、把它設成「空的」
  await nextTick();

  setupEntrance();

  requestAnimationFrame(() => ScrollTrigger.refresh());
});

onBeforeUnmount(() => {
  isUnmounted = true;
  switchTimeline?.kill();
  autoplayTween?.kill();
  entranceTrigger?.kill();

  [
    headingRef.value,
    introRef.value,
    counterRef.value,
    outcomeRef.value,
    attributionRef.value,
    progressRingRef.value,
  ].forEach((target) => target && gsap.killTweensOf(target));
});
</script>

<template>
  <section
    ref="sectionRef"
    class="flex min-h-screen w-full items-center bg-white px-5 py-20 sm:px-8 lg:px-10 lg:py-28"
    aria-labelledby="case-highlights-heading"
    @focusin="handleFocusIn"
    @focusout="resumeAutoplay"
  >
    <div
      class="mx-auto grid w-full max-w-8xl gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20"
    >
      <!-- 左：標題與說明。按鈕全部收在右邊，這一欄只負責定調 -->
      <div>
        <h2
          id="case-highlights-heading"
          ref="headingRef"
          class="text-h2 text-ink"
        >
          {{ heading }}<span class="text-brand">.</span>
        </h2>
        <!-- <p
          ref="introRef"
          class="mt-5 max-w-md text-body-lg text-ink-muted"
        >
          {{ intro }}
        </p> -->
      </div>

      <!-- 右：案例本身 -->
      <div class="flex flex-col">
        <p
          ref="counterRef"
          class="text-eyebrow text-brand-ink"
        >
          {{ formatCounter(activeIndex, cases.length) }}
        </p>

        <!--
          hover 暫停只掛在這段內文上。掛在整個 section 上的話，
          section 是滿版高度，游標幾乎永遠在裡面，等於自動輪播全程停擺。
        -->
        <p
          ref="outcomeRef"
          class="mt-6 text-h3 text-ink"
          @mouseenter="pauseAutoplay"
          @mouseleave="resumeAutoplay"
        >
          {{ cases[activeIndex].outcome }}
        </p>

        <div
          class="mt-10 flex items-end justify-between gap-6 border-t border-ink/12 pt-6 sm:mt-14"
        >
          <!-- items-end：讓左邊的產業圖示與右邊的箭頭按鈕落在同一條底線上 -->
          <div ref="attributionRef" class="flex items-end gap-4">
            <!-- 產業圖示：尺寸與右邊的箭頭按鈕一致，兩端才對得起來 -->
            <span
              v-if="cases[activeIndex].iconPath"
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/12 text-brand-ink"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-5 w-5"
              >
                <path :d="cases[activeIndex].iconPath" />
              </svg>
            </span>

            <div>
              <p class="text-h4 text-ink">
                {{ cases[activeIndex].industry }}｜{{ cases[activeIndex].topic }}
              </p>
              <p class="mt-1 text-caption text-ink-muted">
                {{ cases[activeIndex].challenge }}
              </p>
            </div>
          </div>

          <div ref="btnGroupRef" class="flex shrink-0 gap-3">
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:border-brand-ink hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2"
              aria-label="上一則案例"
              @click="handlePrev"
            >
              <svg viewBox="0 0 20 20" fill="none" class="h-4 w-4" aria-hidden="true">
                <path
                  d="M12.5 5L7.5 10L12.5 15"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>

            <!--
              下一則：自動切換的進度直接沿著按鈕邊框跑。
              r=22 讓筆畫中心線正好落在 44px 按鈕的外緣，蓋住原本那圈 border；
              -rotate-90 把 <circle> 的起點從 3 點鐘轉到 12 點鐘，
              dashoffset 遞減時筆畫沿著路徑方向長出來，也就是順時針。
            -->
            <div class="relative">
              <svg
                v-if="autoplayEnabled"
                viewBox="0 0 46 46"
                class="pointer-events-none absolute -inset-px h-[46px] w-[46px] -rotate-90 text-brand"
                aria-hidden="true"
              >
                <circle
                  ref="progressRingRef"
                  cx="23"
                  cy="23"
                  r="22"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
              <button
                type="button"
                class="relative flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:border-brand-ink hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2"
                aria-label="下一則案例"
                @click="handleNext"
              >
                <svg viewBox="0 0 20 20" fill="none" class="h-4 w-4" aria-hidden="true">
                  <path
                    d="M7.5 5L12.5 10L7.5 15"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
