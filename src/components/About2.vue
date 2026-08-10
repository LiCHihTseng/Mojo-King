<script setup lang="ts">
/**
 * About.vue
 * 三筆「數據 / 圖片 / 文案」橫列，之間用細線分隔。
 *
 * 版面：桌機為三欄（數據靠上、圖片置中、文案靠下對齊），手機自動堆疊。
 * 動畫：滾到畫面 80% 時，用 clip-path 由上往下揭開，三個區塊各自獨立觸發，
 *      沒有任何位移。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import img from "../assets/About_img1.png";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  statValue1?: string;
  statLabel1?: string;
  quote1Highlight?: string;
  quote1Rest?: string;
  statValue2?: string;
  statLabel2?: string;
  quote2Highlight?: string;
  quote2Rest?: string;
  statValue3?: string;
  statLabel3?: string;
  quote3Highlight?: string;
  quote3Rest?: string;
}

const props = withDefaults(defineProps<Props>(), {
  statValue1: "100+",
  statLabel1: "企業合作案例",
  quote1Highlight: "我是人資顧問郁婷，慕玖的執行長，外號「HR女神」。",
  quote1Rest:
    "擁有２０年的上市櫃公司人資經驗，人資長的經驗讓我發現人資專業對於組織長期發展至關重要，而許多企業卻因缺乏經驗豐富的人資長導致企業發展停滯不前，因此創立慕玖股份有限公司。",
  statValue2: "150+",
  statLabel2: "一對一深度諮詢",
  quote2Highlight: "慕玖股份有限公司（MoJo King）是一家專注於人力資源管理與組織發展的顧問公司。",
  quote2Rest: "我們致力於透過策略型人力資源顧問與管理培訓服務，協助企業建立人才發展、領導力培育與組織文化系統，讓人資從行政功能升級為企業策略的重要力量。。",
  statValue3: "100%",
  statLabel3: "真人陪跑",
  quote3Highlight: "我們提供短期的培力課程、工作坊，也提供中長期的教練陪跑。",
  quote3Rest: "針對公司未來３－５年發展方向，提供客製化建議並導入系統。我們的客戶包括中小型企業以及上市櫃公司，涵蓋製造業、科技業、旅遊業、餐飲業、銀行等多元產業。",
});

/** 三筆橫列的內容，統一從 props 組出來，版面只寫一份 */
const rows = computed(() => [
  {
    statValue: props.statValue1,
    statLabel: props.statLabel1,
    highlight: props.quote1Highlight,
    rest: props.quote1Rest,
    image: img,
    accent: false,
  },
  {
    statValue: props.statValue2,
    statLabel: props.statLabel2,
    highlight: props.quote2Highlight,
    rest: props.quote2Rest,
    image: img,
    accent: false,
  },
  {
    statValue: props.statValue3,
    statLabel: props.statLabel3,
    highlight: props.quote3Highlight,
    rest: props.quote3Rest,
    image: img,
    accent: true,
  },
]);

/* ----------------------------------
   滾動 reveal

   帶有 data-reveal 的區塊各自綁一個 ScrollTrigger，
   當它的頂端進到畫面 80% 的位置（還在下方、快要進入視線）時觸發，只播一次。

   效果是遮罩式的：用 clip-path 把下緣往下拉開，由上往下「被揭開」，
   元素本身完全不做 x / y 位移。
---------------------------------- */

const REVEAL_START = "top 80%";

/** 收合狀態：下緣裁掉 100%，等於整塊被蓋住 */
const CLIP_HIDDEN = "inset(0% 0% 100% 0%)";
/** 展開狀態：完全不裁切 */
const CLIP_VISIBLE = "inset(0% 0% 0% 0%)";

const rootRef = ref<HTMLElement | null>(null);

let revealTriggers: ScrollTrigger[] = [];
let revealTargets: HTMLElement[] = [];

onMounted(async () => {
  await nextTick();

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // 使用者偏好減少動態時什麼都不做——元素本來就是完整顯示的狀態
  if (prefersReducedMotion) return;

  await document.fonts.ready;
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

  const root = rootRef.value;
  if (!root) return;

  revealTargets = Array.from(
    root.querySelectorAll<HTMLElement>("[data-reveal]"),
  );

  revealTargets.forEach((element) => {
    gsap.set(element, { clipPath: CLIP_HIDDEN });

    revealTriggers.push(
      ScrollTrigger.create({
        trigger: element,
        start: REVEAL_START,
        once: true,
        invalidateOnRefresh: true,
        onEnter: () => {
          gsap.to(element, {
            clipPath: CLIP_VISIBLE,
            duration: 0.5,
            ease: "power3.out",
            overwrite: "auto",
          });
        },
      }),
    );
  });

  ScrollTrigger.refresh();
});

onBeforeUnmount(() => {
  revealTriggers.forEach((trigger) => trigger.kill());
  revealTriggers = [];
  gsap.killTweensOf(revealTargets);
  revealTargets = [];
});
</script>

<template>
  <section
    ref="rootRef"
    class="w-full bg-[#F9F8F6] py-14 text-[#1a1a1a] lg:py-16"
  >
    <div class="mx-auto w-full max-w-[2000px] px-5 sm:px-8 lg:px-10">
      <div class="lg:grid lg:grid-cols-[minmax(0,150px)_minmax(0,1fr)] lg:gap-10">
        <!-- 左側小標 -->
        <p
          data-reveal
          class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#B55F00] lg:self-start lg:pt-1"
        >
          <span class="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF891D]"></span>
          關於慕玖
        </p>

        <!-- 標題 + 三筆橫列 -->
        <div class="mt-8 border-b border-[#1a1a1a]/12 lg:mt-0">
          <h2
            data-reveal
            class="text-[clamp(1.5rem,2.2vw,2rem)] font-medium leading-tight tracking-tight"
          >
            關於慕玖 MoJo
          </h2>

          <div class="mt-8 lg:mt-10">
            <article
        v-for="(row, index) in rows"
        :key="index"
        class="grid gap-6 border-t border-[#1a1a1a]/12 py-10 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2.4fr)] lg:gap-12 lg:py-12"
      >
        <!-- 數據 -->
        <div data-reveal class="min-w-0 lg:self-start">
          <p
            class="text-[clamp(1.375rem,1.5vw,1.875rem)] font-bold leading-none tracking-wide"
            :class="row.accent ? 'text-[#FF891D]' : 'text-[#1a1a1a]'"
          >
            {{ row.statValue }}
          </p>
          <p
            class="mt-2 text-[clamp(.75rem,.8vw,.875rem)] leading-tight text-[#1a1a1a]/60"
          >
            {{ row.statLabel }}
          </p>
        </div>

        <!-- 圖片 -->
        <div
          data-reveal
          class="w-full overflow-hidden "
        >
          <img
            :src="row.image"
            alt=""
            class="block aspect-[3/2] w-full object-cover"
            loading="lazy"
            aria-hidden="true"
          />
        </div>

        <!-- 文案 -->
        <div data-reveal class="min-w-0 lg:self-end">
          <p
            class="text-[clamp(.875rem,.95vw,1rem)] leading-[1.8] text-[#1a1a1a]/70"
          >
            <span class="font-semibold text-[#1a1a1a]">
              {{ row.highlight }}
            </span>
            {{ row.rest }}
          </p>
        </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>