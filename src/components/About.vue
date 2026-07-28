<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  travelImage?: string;
  travelImage2?: string;
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
  statValue4?: string;
  statLabel4?: string;
  quote3Highlight?: string;
  quote3Rest?: string;
}

withDefaults(defineProps<Props>(), {
  travelImage:
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1200&auto=format&fit=crop",
  travelImage2:
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop",
  statValue1: "100+",
  statLabel1: "企業合作案例",
  quote1Highlight: "每個企業主，都會走到一個時刻——",
  quote1Rest:
    "光靠內部經驗，已經不足以應付人才決策的複雜度。尤其牽涉到組織成長的關鍵決定，你需要一個真正懂你、能陪你一起想清楚的夥伴。",
  statValue2: "150+",
  statLabel2: "一對一深度諮詢",
  quote2Highlight: "說實話，人資議題從來不是最有趣的話題。",
  quote2Rest: "這一點，我們大概也沒辦法改變。",
  statValue3: "100%",
  statLabel3: "真人陪跑",
  statValue4: "24hr",
  statLabel4: "問題回覆時效",
  quote3Highlight: "但我們能做到的，是把整個過程都陪你走過。",
  quote3Rest: "用清楚、可執行的方式，讓你確信人才策略掌握在對的人手上。",
});

/* ----------------------------------
   桌機版 Refs
---------------------------------- */

const wrapperRef = ref<HTMLElement | null>(null);
const travelRef = ref<HTMLElement | null>(null);
const scene2Ref = ref<HTMLElement | null>(null);
const scene3Ref = ref<HTMLElement | null>(null);
const imageSlot1Ref = ref<HTMLElement | null>(null);
const imageSlot2Ref = ref<HTMLElement | null>(null);
const imageSlot3Ref = ref<HTMLElement | null>(null);
const scene1TextRef = ref<HTMLElement | null>(null);
const scene1StatRef = ref<HTMLElement | null>(null);
const scene2TextRef = ref<HTMLElement | null>(null);
const scene2StatRef = ref<HTMLElement | null>(null);
const scene3TextRef = ref<HTMLElement | null>(null);
const scene3StatRef = ref<HTMLElement | null>(null);

/* ----------------------------------
   手機版 Refs
---------------------------------- */

const mWrapperRef = ref<HTMLElement | null>(null);
const mScene2Ref = ref<HTMLElement | null>(null); // 場景二容器（作為 scene1→2 過渡的獨立觸發點）
const mTravel12Ref = ref<HTMLElement | null>(null);
const mSlot1Ref = ref<HTMLElement | null>(null);
const mSlot2Ref = ref<HTMLElement | null>(null);
const mScene1TextRef = ref<HTMLElement | null>(null);
const mScene1StatRef = ref<HTMLElement | null>(null);
const mScene2TextRef = ref<HTMLElement | null>(null);
const mScene2StatRef = ref<HTMLElement | null>(null);

const mScene3WrapRef = ref<HTMLElement | null>(null);
const mTravel3Ref = ref<HTMLElement | null>(null);
const mStatSlot1Ref = ref<HTMLElement | null>(null);
const mStatSlot2Ref = ref<HTMLElement | null>(null);
const mScene3TextRef = ref<HTMLElement | null>(null);

let prefersReducedMotion = false;

/* ----------------------------------
   數據淡入：只觸發一次，永久保留顯示
---------------------------------- */

const showStatOnce = (statEls: (HTMLElement | null)[]) => {
  const targets = statEls.filter(Boolean) as HTMLElement[];
  if (targets.length === 0) return () => { };

  gsap.set(targets, { opacity: 0, y: 16 });
  let hasShown = false;

  return () => {
    if (hasShown) return;
    hasShown = true;
    gsap.to(targets, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out",
      stagger: 0.08,
    });
  };
};

const revealText = (el: HTMLElement | null) => {
  if (!el) return;
  gsap.set(el, { opacity: 0, y: 24 });

  ScrollTrigger.create({
    trigger: el,
    start: "top 82%",
    once: true,
    onEnter: () => {
      gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });
    },
  });
};

/*
 * 共用工具：取得某個 slot 元素，相對於某個 wrapper 的中心點座標。
 * 每次呼叫都即時重新量測，確保座標永遠反映「當下」的實際版面。
 */
const getCenterRelativeTo = (wrapper: HTMLElement, slot: HTMLElement) => {
  const wrapperRect = wrapper.getBoundingClientRect();
  const slotRect = slot.getBoundingClientRect();
  return {
    top: slotRect.top - wrapperRect.top + slotRect.height / 2,
    left: slotRect.left - wrapperRect.left + slotRect.width / 2,
  };
};

onMounted(async () => {
  await nextTick();

  prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  revealText(scene1TextRef.value);
  revealText(scene2TextRef.value);
  revealText(scene3TextRef.value);
  revealText(mScene1TextRef.value);
  revealText(mScene2TextRef.value);
  revealText(mScene3TextRef.value);

  if (prefersReducedMotion) {
    [
      scene1StatRef.value,
      scene2StatRef.value,
      scene3StatRef.value,
      mScene1StatRef.value,
      mScene2StatRef.value,
      mStatSlot1Ref.value,
      mStatSlot2Ref.value,
    ].forEach((el) => {
      if (el) gsap.set(el, { opacity: 1, y: 0 });
    });
    if (travelRef.value) gsap.set(travelRef.value, { opacity: 0 });
    if (mTravel12Ref.value) gsap.set(mTravel12Ref.value, { opacity: 0 });
    if (mTravel3Ref.value) gsap.set(mTravel3Ref.value, { opacity: 0 });
    return;
  }

  await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(resolve));

  /*
   * ScrollTrigger.matchMedia：依螢幕寬度自動切換桌機/手機邏輯，
   * 每次符合的條件改變時，舊的 ScrollTrigger 會被自動清除。
   */
  ScrollTrigger.matchMedia({
    "(min-width: 1024px)": () => {
      if (
        !wrapperRef.value ||
        !travelRef.value ||
        !scene2Ref.value ||
        !scene3Ref.value ||
        !imageSlot1Ref.value ||
        !imageSlot2Ref.value ||
        !imageSlot3Ref.value
      ) {
        return;
      }

      const showStat1 = showStatOnce([scene1StatRef.value]);
      const showStat2 = showStatOnce([scene2StatRef.value]);
      const showStat3 = showStatOnce([scene3StatRef.value]);

      const moveDur = 1;

      const initialPos = getCenterRelativeTo(wrapperRef.value, imageSlot1Ref.value);

      gsap.set(travelRef.value, {
        top: initialPos.top,
        left: initialPos.left,
        xPercent: -50,
        yPercent: -50,
      });

      showStat1();

      const tl1 = gsap.fromTo(
        travelRef.value,
        {
          top: initialPos.top,
          left: initialPos.left,
        },
        {
          top: () => getCenterRelativeTo(wrapperRef.value!, imageSlot2Ref.value!).top,
          left: () => getCenterRelativeTo(wrapperRef.value!, imageSlot2Ref.value!).left,
          duration: moveDur,
          ease: "sine.inOut",
          immediateRender: false, // 關鍵：不要在建立當下就立即套用 from 狀態
          onComplete: showStat2,
          scrollTrigger: {
            trigger: scene2Ref.value,
            start: "top 95%",
            end: "top 20%",
            scrub: 1.2,
            invalidateOnRefresh: true,
          },
        },
      );

      const tl2 = gsap.fromTo(
        travelRef.value,
        {
          top: () => getCenterRelativeTo(wrapperRef.value!, imageSlot2Ref.value!).top,
          left: () => getCenterRelativeTo(wrapperRef.value!, imageSlot2Ref.value!).left,
        },
        {
          top: () => getCenterRelativeTo(wrapperRef.value!, imageSlot3Ref.value!).top,
          left: () => getCenterRelativeTo(wrapperRef.value!, imageSlot3Ref.value!).left,
          duration: moveDur,
          ease: "sine.inOut",
          immediateRender: false, // 同樣加上，避免建立當下就把圖片拉到場景二的位置
          onComplete: showStat3,
          scrollTrigger: {
            trigger: scene3Ref.value,
            start: "top 95%",
            end: "top 20%",
            scrub: 1.2,
            invalidateOnRefresh: true,
          },
        },
      );

      return () => {
        tl1.kill();
        tl2.kill();
      };
    },

    "(max-width: 1023px)": () => {
      if (
        !mWrapperRef.value ||
        !mScene2Ref.value ||
        !mTravel12Ref.value ||
        !mSlot1Ref.value ||
        !mSlot2Ref.value ||
        !mScene3WrapRef.value ||
        !mTravel3Ref.value ||
        !mStatSlot1Ref.value ||
        !mStatSlot2Ref.value
      ) {
        return;
      }

      const showMStat1 = showStatOnce([mScene1StatRef.value]);
      const showMStat2 = showStatOnce([mScene2StatRef.value]);

      const initialPos12 = getCenterRelativeTo(mWrapperRef.value, mSlot1Ref.value);

      gsap.set(mTravel12Ref.value, {
        top: initialPos12.top,
        left: initialPos12.left,
        xPercent: -50,
        yPercent: -50,
      });

      showMStat1();

      const tl1 = gsap.fromTo(
        mTravel12Ref.value,
        {
          top: initialPos12.top,
          left: initialPos12.left,
        },
        {
          top: () => getCenterRelativeTo(mWrapperRef.value!, mSlot2Ref.value!).top,
          left: () => getCenterRelativeTo(mWrapperRef.value!, mSlot2Ref.value!).left,
          ease: "sine.inOut",
          immediateRender: false,
          onComplete: showMStat2,
          scrollTrigger: {
            trigger: mScene2Ref.value,
            start: "top 90%",
            end: "top 20%",
            scrub: 1.2,
            invalidateOnRefresh: true,
          },
        },
      );

      const initialPos3 = getCenterRelativeTo(mScene3WrapRef.value, mStatSlot1Ref.value);

      gsap.set(mTravel3Ref.value, {
        top: initialPos3.top,
      });

      const tl2 = gsap.fromTo(
        mTravel3Ref.value,
        {
          top: initialPos3.top,
        },
        {
          top: () => getCenterRelativeTo(mScene3WrapRef.value!, mStatSlot2Ref.value!).top,
          ease: "sine.inOut",
          immediateRender: false,
          scrollTrigger: {
            trigger: mScene3WrapRef.value,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.2,
            invalidateOnRefresh: true,
          },
        },
      );

      return () => {
        tl1.kill();
        tl2.kill();
      };
    },
  });

  ScrollTrigger.refresh();
});

onBeforeUnmount(() => {
  ScrollTrigger.getAll().forEach((t) => t.kill());
});
</script>

<template>
  <!-- ============ 桌機版 ============ -->
  <section ref="wrapperRef" class="relative hidden w-full overflow-hidden bg-white text-[#1a1a1a] lg:block"
    style="min-height: 300vh;">
    <!-- 桌機版真正會移動、顯示的旅行圖片 -->
    <div ref="travelRef" class="pointer-events-none absolute z-20 h-[420px] w-[420px] xl:h-[480px] xl:w-[480px]">
      <img :src="travelImage" alt="" class="h-full w-full rounded-2xl object-cover shadow-2xl" loading="lazy"
        aria-hidden="true" />
    </div>

    <!-- 場景一：（數據+圖片為一組，靠近）+ 文案 -->
    <div ref="scene1Ref" class="mx-auto grid min-h-screen w-full max-w-[1800px] items-center gap-16 px-6"
      style="grid-template-columns: 1fr 1fr;">
      <div class="flex items-center gap-6">
        <div ref="scene1StatRef">
          <p class="text-5xl font-bold tracking-wide sm:text-6xl">{{ statValue1 }}</p>
          <p class="mt-2 text-lg text-[#1a1a1a]/50">{{ statLabel1 }}</p>
        </div>

        <div ref="imageSlot1Ref" class="h-[420px] w-[420px] shrink-0 xl:h-[480px] xl:w-[480px]"></div>
      </div>

      <div ref="scene1TextRef">
        <p class="max-w-lg text-xl leading-relaxed text-[#1a1a1a]/60 sm:text-2xl">
          <span class="font-semibold text-[#1a1a1a]">{{ quote1Highlight }}</span>
          {{ quote1Rest }}
        </p>
      </div>
    </div>

    <!-- 場景二：文案 + （圖片+數據為一組，靠近） -->
    <div ref="scene2Ref" class="mx-auto grid min-h-screen w-full max-w-[1800px] items-center gap-16 px-6"
      style="grid-template-columns: 1fr 1fr;">
      <div ref="scene2TextRef">
        <p class="max-w-lg text-xl leading-relaxed text-[#1a1a1a]/60 sm:text-2xl">
          <span class="font-semibold text-[#1a1a1a]">{{ quote2Highlight }}</span>
          {{ quote2Rest }}
        </p>
      </div>

      <div class="flex items-center justify-end gap-6">
        <div ref="imageSlot2Ref" class="h-[420px] w-[420px] shrink-0 xl:h-[480px] xl:w-[480px]"></div>

        <div ref="scene2StatRef">
          <p class="text-5xl font-bold tracking-wide sm:text-6xl">{{ statValue2 }}</p>
          <p class="mt-2 text-lg text-[#1a1a1a]/50">{{ statLabel2 }}</p>
        </div>
      </div>
    </div>

    <!-- 場景三：跟場景一相同結構 -->
    <div ref="scene3Ref" class="mx-auto grid min-h-screen w-full max-w-[1800px] items-center gap-16 px-6"
      style="grid-template-columns: 1fr 1fr;">
      <div class="flex items-center gap-6">
        <div ref="scene3StatRef">
          <p class="text-5xl font-bold tracking-wide sm:text-6xl">{{ statValue3 }}</p>
          <p class="mt-2 text-lg text-[#1a1a1a]/50">{{ statLabel3 }}</p>
        </div>

        <div ref="imageSlot3Ref" class="h-[420px] w-[420px] shrink-0 xl:h-[480px] xl:w-[480px]"></div>
      </div>

      <div ref="scene3TextRef">
        <p class="max-w-lg text-xl leading-relaxed text-[#1a1a1a]/60 sm:text-2xl">
          <span class="font-semibold text-[#1a1a1a]">{{ quote3Highlight }}</span>
          {{ quote3Rest }}
        </p>
      </div>
    </div>
  </section>

  <!-- ============ 手機版 ============ -->
  <section ref="mWrapperRef" class="relative w-full overflow-hidden bg-white text-[#1a1a1a] lg:hidden"
    style="min-height: 220vh;">
    <div ref="mTravel12Ref" class="pointer-events-none absolute right-6 z-20 aspect-square">
      <img :src="travelImage" alt="" class="h-full w-full rounded-2xl object-cover shadow-xl" loading="lazy" />
    </div>

    <!-- 場景一：數據在左，圖片格在右 -->
    <div class="grid min-h-screen items-center gap-6 px-6">
      <div class="grid grid-cols-2 items-center gap-4">
        <div ref="mScene1StatRef">
          <p class="text-4xl font-bold tracking-wide">{{ statValue1 }}</p>
          <p class="mt-2 text-base text-[#1a1a1a]/50">{{ statLabel1 }}</p>
        </div>
        <div ref="mSlot1Ref" class="h-[460px] w-[460px] justify-self-end"></div>
      </div>

      <div ref="mScene1TextRef">
        <p class="text-xl leading-relaxed text-[#1a1a1a]/60">
          <span class="font-semibold text-[#1a1a1a]">{{ quote1Highlight }}</span>
          {{ quote1Rest }}
        </p>
      </div>
    </div>

    <!-- 場景二：跟場景一完全相同的排版 -->
    <div ref="mScene2Ref" class="grid min-h-screen items-center gap-6 px-6">
      <div class="grid grid-cols-2 items-center gap-4">
        <div ref="mScene2StatRef">
          <p class="text-4xl font-bold tracking-wide">{{ statValue2 }}</p>
          <p class="mt-2 text-base text-[#1a1a1a]/50">{{ statLabel2 }}</p>
        </div>
        <div ref="mSlot2Ref" class="h-[460px] w-[460px] justify-self-end"></div>
      </div>

      <div ref="mScene2TextRef">
        <p class="text-xl leading-relaxed text-[#1a1a1a]/60">
          <span class="font-semibold text-[#1a1a1a]">{{ quote2Highlight }}</span>
          {{ quote2Rest }}
        </p>
      </div>
    </div>
  </section>

  <!-- 手機版場景三 -->
  <section class="relative w-full overflow-hidden bg-white text-[#1a1a1a] lg:hidden">
    <div ref="mScene3WrapRef" class="relative" style="min-height: 200vh;">
      <div ref="mTravel3Ref" class="pointer-events-none absolute right-6 z-20 h-[160px] w-[160px]">
        <img :src="travelImage2" alt="" class="h-full w-full rounded-2xl object-cover shadow-xl" loading="lazy" />
      </div>

      <div ref="mStatSlot1Ref" class="grid min-h-screen grid-cols-2 items-center px-6">
        <div>
          <p class="text-4xl font-bold tracking-wide">{{ statValue3 }}</p>
          <p class="mt-2 text-base text-[#1a1a1a]/50">{{ statLabel3 }}</p>
        </div>
      </div>

      <div ref="mStatSlot2Ref" class="grid min-h-screen grid-cols-2 items-center px-6">
        <div>
          <p class="text-4xl font-bold tracking-wide">{{ statValue4 }}</p>
          <p class="mt-2 text-base text-[#1a1a1a]/50">{{ statLabel4 }}</p>
        </div>
      </div>
    </div>

    <div class="flex min-h-screen flex-col justify-center px-6 py-16">
      <div ref="mScene3TextRef">
        <p class="text-xl leading-relaxed text-[#1a1a1a]/60">
          <span class="font-semibold text-[#1a1a1a]">{{ quote3Highlight }}</span>
          {{ quote3Rest }}
        </p>
      </div>
    </div>
  </section>
</template>