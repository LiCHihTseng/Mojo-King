<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Step {
  label: string;
  title: string;
  body: string;
}

interface Props {
  eyebrow?: string;
  heading?: string;
  steps?: Step[];
}

withDefaults(defineProps<Props>(), {
  eyebrow: "合作流程",
  heading: "我們是這樣陪你走完整個專案",
  steps: () => [
    {
      label: "Step 1",
      title: "初談",
      body: "我們會親自拜訪、坐下來聽你說。先釐清真正的問題出在哪裡，而不是急著給答案。",
    },
    {
      label: "Step 2",
      title: "整體規劃",
      body: "根據初談的結果，量身設計一套可執行的方案，包含時程、範圍與預期成果，讓你清楚知道每一步要往哪走。",
    },
    {
      label: "Step 3",
      title: "專案執行",
      body: "正式進場陪跑。過程中定期回報進度、隨時調整方向，不會讓你在中途失去掌握感。",
    },
    {
      label: "Step 4",
      title: "結案會議",
      body: "完整回顧成果與過程中的關鍵決策，並交付後續可以自行延續的做法，讓改變真的留在組織裡。",
    },
  ],
});

/* ----------------------------------
   Refs
---------------------------------- */

const sectionRef = ref<HTMLElement | null>(null);
const headRef = ref<HTMLElement | null>(null);
const timelineWrapRef = ref<HTMLElement | null>(null);
const trackLineRef = ref<HTMLElement | null>(null);
const progressLineRef = ref<HTMLElement | null>(null);
const stepRefs = ref<HTMLElement[]>([]);
const anchorRefs = ref<HTMLElement[]>([]); // 只用來量測「每個步驟的起點」，本身不顯示
const ballRefs = ref<HTMLElement[]>([]); // 四顆球，一開始就都在畫面上

const setStepRef = (el: Element | null, index: number) => {
  if (el instanceof HTMLElement) stepRefs.value[index] = el;
};

const setAnchorRef = (el: Element | null, index: number) => {
  if (el instanceof HTMLElement) anchorRefs.value[index] = el;
};

const setBallRef = (el: Element | null, index: number) => {
  if (el instanceof HTMLElement) ballRefs.value[index] = el;
};

let prefersReducedMotion = false;
let triggers: ScrollTrigger[] = [];

/* ----------------------------------
   量測

   basePositions[i] : 第 i 顆球「原本的位置」（第 i 個步驟的起點）
   targets[i]       : 第 i 顆球「要滑到的位置」
                      → 下一顆球的正上方，留 GAP 的距離（快碰到但沒碰到）
                      → 最後一顆沒有下一顆，就滑到線的末端
---------------------------------- */

const GAP = 26; // 停在下一顆球上方多少 px（球本身 16px，所以看起來就是快貼上）

let basePositions: number[] = [];
let targets: number[] = [];
let startY = 0;
let travel = 1;

const measure = () => {
  const wrap = timelineWrapRef.value;
  if (!wrap) return;

  const wrapTop = wrap.getBoundingClientRect().top;

  basePositions = anchorRefs.value.map((anchor) => {
    if (!anchor) return 0;
    const rect = anchor.getBoundingClientRect();
    return rect.top - wrapTop + rect.height / 2;
  });

  const count = basePositions.length;
  if (count === 0) return;

  startY = basePositions[0] ?? 0;

  // 線的末端：最後一顆球再往下走一段（跟前面每段的間距感一致）
  const lastGapSample =
    count > 1 ? basePositions[count - 1] - basePositions[count - 2] : 120;
  const lineEndY = (basePositions[count - 1] ?? 0) + lastGapSample * 0.55;

  targets = basePositions.map((_, i) =>
    i < count - 1 ? basePositions[i + 1] - GAP : lineEndY,
  );

  travel = Math.max(lineEndY - startY, 1);

  // 兩條線都只涵蓋「第一顆球的起點 → 線的末端」
  [trackLineRef.value, progressLineRef.value].forEach((el) => {
    if (!el) return;
    el.style.top = `${startY}px`;
    el.style.height = `${travel}px`;
  });

  // 把每顆球擺回自己的起始位置
  ballRefs.value.forEach((ball, i) => {
    if (!ball) return;
    gsap.set(ball, { y: basePositions[i] ?? 0 });
  });
};

/* ----------------------------------
   依進度更新

   把整段捲動平均切成 N 份（N = 步驟數）：
     第 0 份 → 第 0 顆球從自己的位置滑到第 1 顆球上方
     第 1 份 → 第 1 顆球開始滑，前一顆已經停住不動
     ...
   同一時間永遠只有一顆球在動，其他的都固定住。
   因為是 scrub，往回捲就是整段倒放。
---------------------------------- */

const applyProgress = (progress: number) => {
  const count = basePositions.length;
  if (count === 0) return;

  const segment = 1 / count;
  for (let i = 0; i < count; i++) {
    const ball = ballRefs.value[i];
    if (!ball) continue;

    // 這顆球在自己的那一份捲動區間內的進度（0~1）
    const localProgress = gsap.utils.clamp(
      0,
      1,
      (progress - i * segment) / segment,
    );

    const from = basePositions[i];
    const to = targets[i];
    const y = from + (to - from) * localProgress;

    gsap.set(ball, { y });

  }

  if (progressLineRef.value) {
    gsap.set(progressLineRef.value, {
      scaleY: gsap.utils.clamp(0, 1, progress),
    });
  }
};

/* ----------------------------------
   Lifecycle
---------------------------------- */

onMounted(async () => {
  await nextTick();

  prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!sectionRef.value || !timelineWrapRef.value) return;

  // 減少動態效果：球各自待在原位，線直接畫滿，文字直接顯示。
  if (prefersReducedMotion) {
    measure();
    if (progressLineRef.value) gsap.set(progressLineRef.value, { scaleY: 1 });
    gsap.set(stepRefs.value, { opacity: 1, y: 0 });
    return;
  }

  /* 1. 標題區：由下往上淡入 */
  if (headRef.value) {
    const children = Array.from(headRef.value.children);
    gsap.set(children, { opacity: 0, y: 28 });

    triggers.push(
      ScrollTrigger.create({
        trigger: headRef.value,
        start: "top 82%",
        once: true,
        onEnter: () => {
          gsap.to(children, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.12,
          });
        },
      }),
    );
  }

  /* 2. 初始狀態：進度線收起（四顆球本來就都在畫面上，不需要隱藏） */
  if (progressLineRef.value) {
    gsap.set(progressLineRef.value, {
      scaleY: 0,
      transformOrigin: "top center",
    });
  }

  gsap.set(ballRefs.value, { xPercent: -50, yPercent: -50 });

  /* 3. 主控：一個 scrub ScrollTrigger 驅動四顆球的接力 + 進度線 */
  const isCompactScreen = window.matchMedia("(max-width: 767px)").matches;

  triggers.push(
    ScrollTrigger.create({
      trigger: timelineWrapRef.value,
      start: isCompactScreen ? "top 74%" : "top 62%",
      end: isCompactScreen ? "bottom 36%" : "bottom 78%",
      scrub: isCompactScreen ? 0.25 : 0.6,
      invalidateOnRefresh: true,
      onRefresh: () => {
        measure();
      },
      onUpdate: (self) => {
        applyProgress(self.progress);
      },
    }),
  );

  /* 4. 每一個步驟的文字：捲到 80% 由下往上淡入 */
  stepRefs.value.forEach((stepEl) => {
    if (!stepEl) return;

    gsap.set(stepEl, { opacity: 0, y: 40 });

    triggers.push(
      ScrollTrigger.create({
        trigger: stepEl,
        start: "top 80%",
        once: true,
        onEnter: () => {
          gsap.to(stepEl, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
          });
        },
      }),
    );
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
});

onBeforeUnmount(() => {
  triggers.forEach((t) => t.kill());
  triggers = [];

  if (progressLineRef.value) gsap.killTweensOf(progressLineRef.value);
  stepRefs.value.forEach((el) => el && gsap.killTweensOf(el));
  ballRefs.value.forEach((el) => el && gsap.killTweensOf(el));
});
</script>

<template>
  <section ref="sectionRef" class="relative min-h-dvh overflow-hidden bg-[#F9F8F6] py-20 sm:py-28 lg:py-36">


    <div class="relative mx-auto w-full max-w-[1400px] px-5 sm:px-8">
      <!-- 標題區 -->
      <div ref="headRef" class="mb-14 text-left sm:mb-20 md:text-center lg:mb-28">
        <p class="text-sm font-medium tracking-[0.2em] text-[#B55F00] sm:text-base">
          {{ eyebrow }}
        </p>
        <h2 class="mt-4 text-[1.75rem] font-medium leading-[1.25] tracking-[-0.01em] text-[#1a1a1a] sm:text-3xl sm:tracking-normal md:text-4xl lg:text-5xl">
          {{ heading }}
        </h2>
      </div>

      <!-- 時間軸 -->
      <div ref="timelineWrapRef" class="relative">
        <!-- 底線（還沒走到的部分）：top / height 由 JS 量測後填入 -->
        <!-- 底線 -->
        <div ref="trackLineRef" class="absolute left-2 w-px bg-[#D9873A]/20 md:left-[calc(50%-0.5px)]" aria-hidden="true">
        </div>

        <!-- 進度線 -->
        <div ref="progressLineRef"
          class="absolute left-2 w-px bg-gradient-to-b from-[#B55F00] to-[#D9873A] md:left-[calc(50%-0.5px)]"
          style="transform: scaleY(0); transform-origin: top center;" aria-hidden="true">
        </div>

        <!-- 四顆球：一開始就全部在畫面上，各自停在自己步驟的起點 -->
        <div v-for="ballIndex in steps.length" :key="`ball-${ballIndex}`"
          :ref="(el) => setBallRef(el as Element | null, ballIndex - 1)"
          class="pointer-events-none absolute left-2 top-0 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-[#F9F8F6] ring-4 ring-[#F9F8F6] md:left-1/2"
          style="will-change: transform;" aria-hidden="true">
          <span class="h-2.5 w-2.5 rounded-full bg-[#B55F00]"></span>
        </div>

        <ol class="relative space-y-16 sm:space-y-32 lg:space-y-48">
          <li v-for="(step, index) in steps" :key="index" class="relative md:grid md:grid-cols-2 md:gap-x-16 lg:gap-x-24">
            <!-- 量測用的錨點：不顯示，只負責告訴 JS 這個步驟的起點在哪。
                 位置必須跟球完全一致（left-2 / md:left-1/2），否則球會停錯位置 -->
            <span :ref="(el) => setAnchorRef(el as Element | null, index)"
              class="pointer-events-none absolute left-2 top-1 h-4 w-4 -translate-x-1/2 opacity-0 md:left-1/2"
              aria-hidden="true"></span>

            <!-- 內容：手機一律靠右排、md 以上才左右交錯 -->
            <div :ref="(el) => setStepRef(el as Element | null, index)" class="pl-9 sm:pl-10 md:pl-0" :class="index % 2 === 0
                ? 'md:col-start-2 md:pl-4'
                : 'md:col-start-1 md:row-start-1 md:pr-4'
              " style="will-change: transform, opacity;">
              <span
                class="inline-flex items-center rounded-md bg-[#B55F00]/10 px-3 py-1.5 text-xs font-medium text-[#B55F00] sm:text-sm">
                {{ step.label }}
              </span>

              <h3 class="mt-4 text-xl font-medium leading-snug text-[#1a1a1a] sm:mt-5 sm:text-2xl lg:text-3xl">
                {{ step.title }}
              </h3>

              <p class="mt-3 max-w-xl text-base leading-[1.75] text-[#1a1a1a]/70 sm:mt-4 lg:text-lg">
                {{ step.body }}
              </p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>

