<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import TreeIcon from "./Tree.vue";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  introText?: string;
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
  introText: "關於慕玖",
  travelImage2:
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop",
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
  statValue4: "24hr",
  statLabel4: "問題回覆時效",
  quote3Highlight: "我們提供短期的培力課程、工作坊，也提供中長期的教練陪跑。",
  quote3Rest: "針對公司未來３－５年發展方向，提供客製化建議並導入系統。我們的客戶包括中小型企業以及上市櫃公司，涵蓋製造業、科技業、旅遊業、餐飲業、銀行等多元產業。",
});

/* ----------------------------------
   桌機版 Refs
---------------------------------- */

const wrapperRef = ref<HTMLElement | null>(null);
const desktopIntroLayerRef = ref<HTMLElement | null>(null);
const desktopIntroTextRef = ref<HTMLElement | null>(null);
const scene1ContentRef = ref<HTMLElement | null>(null);
const scene1StaticTreeRef = ref<HTMLElement | null>(null);
const travelRef = ref<HTMLElement | null>(null);
const scene1Ref = ref<HTMLElement | null>(null);
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
const mScene1Ref = ref<HTMLElement | null>(null);
const mobileIntroLayerRef = ref<HTMLElement | null>(null);
const mobileIntroTextRef = ref<HTMLElement | null>(null);
const mScene1ContentRef = ref<HTMLElement | null>(null);
const mScene1StaticTreeRef = ref<HTMLElement | null>(null);

const mScene2Ref = ref<HTMLElement | null>(null);
const mTravel12Ref = ref<HTMLElement | null>(null);
const mSlot1Ref = ref<HTMLElement | null>(null);
const mSlot2Ref = ref<HTMLElement | null>(null);
const mScene1TextRef = ref<HTMLElement | null>(null);
const mScene1StatRef = ref<HTMLElement | null>(null);
const mScene2TextRef = ref<HTMLElement | null>(null);
const mScene2StatRef = ref<HTMLElement | null>(null);

const mScene3WrapRef = ref<HTMLElement | null>(null);
const mScene3Ref = ref<HTMLElement | null>(null);

const mScene3SecondRowRef = ref<HTMLElement | null>(null);
const mTravel3Ref = ref<HTMLElement | null>(null);
const mStatSlot1Ref = ref<HTMLElement | null>(null);
const mStatSlot2Ref = ref<HTMLElement | null>(null);
const mScene3StatRef = ref<HTMLElement | null>(null);
const mScene4StatRef = ref<HTMLElement | null>(null);
const mScene3TextRef = ref<HTMLElement | null>(null);

let mediaContext: ReturnType<typeof gsap.matchMedia> | null = null;

/* ----------------------------------
   場景內容 reveal

   每個場景共用一條 scrub timeline，文字與數據在場景進入 viewport 時
   稍微由下往上移動並淡入。進度直接跟隨捲動，因此往回滾也能自然反向。
---------------------------------- */

interface SceneRevealGroup {
  trigger: HTMLElement | null;
  elements: Array<HTMLElement | null>;
  start?: string;
  end?: string;
  y?: number;
  stagger?: number;
  ease?: string;
  duration?: number;
  scrub?: boolean | number;
  toggleActions?: string;
}

const CONTENT_REVEAL_Y = 80;
const STAT_REVEAL_START = "center 68%";
const STAT_REVEAL_DURATION = 0.9;
// 場景一內容本身佔滿一個 viewport：中心 50% + 30% = 畫面約 80% 高度。
const SCENE_ONE_START_Y_PERCENT = 30;

const setupSceneReveals = (groups: SceneRevealGroup[]) => {
  const timelines: gsap.core.Timeline[] = [];

  groups.forEach(({
    trigger,
    elements,
    start = "top 64%",
    end = "top 8%",
    y = CONTENT_REVEAL_Y,
    stagger = 0.12,
    ease = "power1.out",
    duration = 1,
    scrub = true,
    toggleActions,
  }) => {
    const targets = elements.filter(Boolean) as HTMLElement[];
    if (!trigger || targets.length === 0) return;

    gsap.set(targets, { autoAlpha: 0, y });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger,
        start,
        end,
        scrub,
        toggleActions,
        invalidateOnRefresh: true,
      },
    });

    timeline.to(targets, {
      autoAlpha: 1,
      y: 0,
      duration,
      stagger,
      ease,
    });

    timelines.push(timeline);
  });

  return () => {
    timelines.forEach((timeline) => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
    });

    const targets = groups.flatMap(({ elements }) =>
      elements.filter(Boolean),
    ) as HTMLElement[];
    gsap.set(targets, {
      clearProps: "opacity,visibility,transform",
    });
  };
};

/* ----------------------------------
   About intro：與第一幕共用同一個 viewport

   pin 的只有第一幕，動畫也只作用在它的子元素。
   第一幕用靜態圖形淡入，pin 結束後再交棒給原本的跨場景移動圖形，
   因此額外的捲動距離始終有內容，不會出現空白 spacer。
---------------------------------- */

const setupIntroTransition = (
  stage: HTMLElement,
  introLayer: HTMLElement,
  introText: HTMLElement,
  contentTarget: HTMLElement,
  staticVisual: HTMLElement,
  travelVisual: HTMLElement,
  scrollDistance: number,
) => {
  gsap.set(introLayer, { autoAlpha: 1 });
  gsap.set(introText, {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    transformOrigin: "50% 50%",
  });
  gsap.set(contentTarget, {
    autoAlpha: 0,
    y: 0,
    yPercent: SCENE_ONE_START_Y_PERCENT,
  });
  gsap.set(staticVisual, { autoAlpha: 1 });
  gsap.set(travelVisual, { autoAlpha: 0 });

  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: stage,
      start: "top top",
      end: () => `+=${Math.round(window.innerHeight * scrollDistance)}`,
      scrub: true,
      pin: stage,
      pinSpacing: true,
      invalidateOnRefresh: true,
    },
  });

  timeline
    .to(introText, {
      autoAlpha: 0,
      y: 0,
      scale: 0.68,
      duration: 0.28,
    })
    // 文字完全透明後才切掉遮罩層，避免父子 opacity 相乘造成變速感。
    .set(introLayer, { autoAlpha: 0 })
    .to(
      contentTarget,
      {
        autoAlpha: 1,
        y: 0,
        yPercent: 0,
        duration: 0.4,
      },
    );

  return () => {
    timeline.scrollTrigger?.kill();
    timeline.kill();
    gsap.set(
      [introLayer, introText, contentTarget, staticVisual, travelVisual],
      {
        clearProps: "opacity,visibility,transform",
      },
    );
  };
};

/*
 * Intro pin 結束後，先讓靜態樹與移動樹在相同位置交叉淡化，
 * 完成交棒後才開始往場景二移動。這段同樣採 1:1 scrub，
 * 避免 numeric scrub 在往回滾時追趕進度而產生吸附感。
 */
const setupTreeHandoff = (
  trigger: HTMLElement,
  staticVisual: HTMLElement,
  travelVisual: HTMLElement,
  end: string,
  syncTravelPosition: () => void,
) => {
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger,
      start: "top 100%",
      end,
      scrub: true,
      invalidateOnRefresh: true,
      onEnter: syncTravelPosition,
    },
  });

  timeline
    .to(staticVisual, { autoAlpha: 0, duration: 1, ease: "none" }, 0)
    .to(travelVisual, { autoAlpha: 1, duration: 1, ease: "none" }, 0);

  return () => {
    timeline.scrollTrigger?.kill();
    timeline.kill();
    gsap.set([staticVisual, travelVisual], {
      clearProps: "opacity,visibility",
    });
  };
};

/* ----------------------------------
   移動物件定位
---------------------------------- */

const getCenterRelativeTo = (
  wrapper: HTMLElement,
  slot: HTMLElement,
) => {
  const wrapperRect = wrapper.getBoundingClientRect();
  const slotRect = slot.getBoundingClientRect();

  return {
    top:
      slotRect.top -
      wrapperRect.top +
      slotRect.height / 2,
    left:
      slotRect.left -
      wrapperRect.left +
      slotRect.width / 2,
  };
};

/*
 * 平板的場景一會被 ScrollTrigger pin 住。此時 getBoundingClientRect()
 * 會包含 pin 產生的 transform，若在捲動途中 refresh，Tree 的起點就可能
 * 被算到畫面外。offset 座標只反映 DOM 的固定版面位置，因此適合用來建立
 * 「數據一右側 → 數據二右側」這條垂直移動軌道。
 */
const getLayoutCenterRelativeTo = (
  wrapper: HTMLElement,
  slot: HTMLElement,
) => {
  let top = slot.offsetHeight / 2;
  let left = slot.offsetWidth / 2;
  let current: HTMLElement | null = slot;

  while (current && current !== wrapper) {
    top += current.offsetTop;
    left += current.offsetLeft;
    current = current.offsetParent as HTMLElement | null;
  }

  return current === wrapper
    ? { top, left }
    : getCenterRelativeTo(wrapper, slot);
};

const getPinSpacingOffset = (stage: HTMLElement) => {
  const spacer = stage.parentElement;
  if (!spacer?.classList.contains("pin-spacer")) return 0;

  return Number.parseFloat(getComputedStyle(spacer).paddingBottom) || 0;
};

const placeTravelerAtSlot = (
  wrapper: HTMLElement,
  traveler: HTMLElement,
  slot: HTMLElement,
) => {
  const position = getCenterRelativeTo(wrapper, slot);

  gsap.set(traveler, {
    top: position.top,
    left: position.left,
    xPercent: -50,
    yPercent: -50,
    x: 0,
    y: 0,
    opacity: 1,
    force3D: true,
  });
};

const getVerticalSlotDelta = (
  wrapper: HTMLElement,
  fromSlot: HTMLElement,
  toSlot: HTMLElement,
) => {
  const from = getCenterRelativeTo(wrapper, fromSlot);
  const to = getCenterRelativeTo(wrapper, toSlot);

  return to.top - from.top;
};

onMounted(async () => {
  await nextTick();

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion) {
    [desktopIntroLayerRef.value, mobileIntroLayerRef.value].forEach(
      (element) => {
        if (element) gsap.set(element, { autoAlpha: 0 });
      },
    );
    if (scene1StaticTreeRef.value) {
      gsap.set(scene1StaticTreeRef.value, { autoAlpha: 1 });
    }
    if (mScene1StaticTreeRef.value) {
      gsap.set(mScene1StaticTreeRef.value, { autoAlpha: 0 });
    }

    [
      scene1ContentRef.value,
      scene1StatRef.value,
      scene1TextRef.value,
      scene2StatRef.value,
      scene2TextRef.value,
      scene3StatRef.value,
      scene3TextRef.value,
      mScene1ContentRef.value,
      mScene1StatRef.value,
      mScene1TextRef.value,
      mScene2StatRef.value,
      mScene2TextRef.value,
      mScene3StatRef.value,
      mScene4StatRef.value,
      mScene3TextRef.value,
    ].forEach((element) => {
      if (element) {
        gsap.set(element, {
          autoAlpha: 1,
          y: 0,
        });
      }
    });

    if (travelRef.value) {
      gsap.set(travelRef.value, { opacity: 0 });
    }

    if (
      mWrapperRef.value &&
      mTravel12Ref.value &&
      mSlot1Ref.value
    ) {
      placeTravelerAtSlot(
        mWrapperRef.value,
        mTravel12Ref.value,
        mSlot1Ref.value,
      );
    }

    if (
      mScene3WrapRef.value &&
      mTravel3Ref.value &&
      mStatSlot1Ref.value
    ) {
      placeTravelerAtSlot(
        mScene3WrapRef.value,
        mTravel3Ref.value,
        mStatSlot1Ref.value,
      );
    }

    return;
  }

  await document.fonts.ready;
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

  mediaContext = gsap.matchMedia();

  mediaContext.add("(min-width: 1024px)", () => {
    if (
      !wrapperRef.value ||
      !desktopIntroLayerRef.value ||
      !desktopIntroTextRef.value ||
      !scene1ContentRef.value ||
      !scene1StaticTreeRef.value ||
      !travelRef.value ||
      !scene1Ref.value ||
      !scene2Ref.value ||
      !scene3Ref.value ||
      !imageSlot1Ref.value ||
      !imageSlot2Ref.value ||
      !imageSlot3Ref.value
    ) {
      return;
    }

    const initialPosition = getCenterRelativeTo(
      wrapperRef.value,
      imageSlot1Ref.value,
    );

    gsap.set(travelRef.value, {
      top: 0,
      left: 0,
      x: initialPosition.left,
      y: initialPosition.top,
      xPercent: -50,
      yPercent: -50,
      force3D: true,
    });

    const cleanupIntro = setupIntroTransition(
      scene1Ref.value,
      desktopIntroLayerRef.value,
      desktopIntroTextRef.value,
      scene1ContentRef.value,
      scene1StaticTreeRef.value,
      travelRef.value,
      0.9,
    );

    const cleanupHandoff = setupTreeHandoff(
      scene2Ref.value,
      scene1StaticTreeRef.value,
      travelRef.value,
      "top 80%",
      () => {
        const position = getCenterRelativeTo(
          wrapperRef.value!,
          imageSlot1Ref.value!,
        );

        gsap.set(travelRef.value!, {
          top: 0,
          left: 0,
          x: position.left,
          y: position.top,
          xPercent: -50,
          yPercent: -50,
          force3D: true,
        });
      },
    );

    const moveToScene2 = gsap.fromTo(
      travelRef.value,
      {
        x: () =>
          getCenterRelativeTo(
            wrapperRef.value!,
            imageSlot1Ref.value!,
          ).left,
        y: () =>
          getCenterRelativeTo(
            wrapperRef.value!,
            imageSlot1Ref.value!,
          ).top,
      },
      {
        x: () =>
          getCenterRelativeTo(
            wrapperRef.value!,
            imageSlot2Ref.value!,
          ).left,
        y: () =>
          getCenterRelativeTo(
            wrapperRef.value!,
            imageSlot2Ref.value!,
          ).top,
        ease: "none",
        force3D: true,
        immediateRender: false,
        scrollTrigger: {
          trigger: scene2Ref.value,
          start: "top 80%",
          end: "top 20%",
          scrub: true,
          invalidateOnRefresh: true,
        },
      },
    );

    const moveToScene3 = gsap.fromTo(
      travelRef.value,
      {
        x: () =>
          getCenterRelativeTo(
            wrapperRef.value!,
            imageSlot2Ref.value!,
          ).left,
        y: () =>
          getCenterRelativeTo(
            wrapperRef.value!,
            imageSlot2Ref.value!,
          ).top,
      },
      {
        x: () =>
          getCenterRelativeTo(
            wrapperRef.value!,
            imageSlot3Ref.value!,
          ).left,
        y: () =>
          getCenterRelativeTo(
            wrapperRef.value!,
            imageSlot3Ref.value!,
          ).top,
        ease: "none",
        force3D: true,
        immediateRender: false,
        scrollTrigger: {
          trigger: scene3Ref.value,
          start: "top 95%",
          end: "top 20%",
          scrub: true,
          invalidateOnRefresh: true,
        },
      },
    );

    const cleanupReveals = setupSceneReveals([
      {
        trigger: scene2Ref.value,
        elements: [scene2TextRef.value],
      },
      {
        trigger: scene2StatRef.value,
        elements: [scene2StatRef.value],
        start: STAT_REVEAL_START,
        y: 30,
        stagger: 0,
        ease: "power2.out",
        duration: STAT_REVEAL_DURATION,
        scrub: false,
        toggleActions: "play none none reverse",
      },
      {
        trigger: scene3Ref.value,
        elements: [scene3TextRef.value],
      },
      {
        trigger: scene3StatRef.value,
        elements: [scene3StatRef.value],
        start: STAT_REVEAL_START,
        y: 30,
        stagger: 0,
        ease: "power2.out",
        duration: STAT_REVEAL_DURATION,
        scrub: false,
        toggleActions: "play none none reverse",
      },
    ]);

    return () => {
      cleanupReveals();
      cleanupHandoff();
      moveToScene2.scrollTrigger?.kill();
      moveToScene2.kill();
      moveToScene3.scrollTrigger?.kill();
      moveToScene3.kill();
      cleanupIntro();
    };
  });

  mediaContext.add({
    isTablet: "(min-width: 768px) and (max-width: 1023px)",
    isMobile: "(max-width: 767px)",
  }, (context) => {
    const isTablet = Boolean(context.conditions?.isTablet);
    const mobileTweens: gsap.core.Tween[] = [];
    let cleanupIntro = () => {};
    let cleanupHandoff = () => {};

    if (
      mWrapperRef.value &&
      mScene1Ref.value &&
      mobileIntroLayerRef.value &&
      mobileIntroTextRef.value &&
      mScene1ContentRef.value &&
      mScene1StaticTreeRef.value &&
      mTravel12Ref.value &&
      mSlot1Ref.value
    ) {
      placeTravelerAtSlot(
        mWrapperRef.value,
        mTravel12Ref.value,
        mSlot1Ref.value,
      );

      cleanupIntro = setupIntroTransition(
        mScene1Ref.value,
        mobileIntroLayerRef.value,
        mobileIntroTextRef.value,
        mScene1ContentRef.value,
        mScene1StaticTreeRef.value,
        mTravel12Ref.value,
        0.75,
      );
    }

    if (
      mWrapperRef.value &&
      mScene1Ref.value &&
      mScene2Ref.value &&
      mTravel12Ref.value &&
      mSlot1Ref.value &&
      mSlot2Ref.value
    ) {
      const wrapper = mWrapperRef.value;
      const scene1 = mScene1Ref.value;
      const scene2 = mScene2Ref.value;
      const traveler = mTravel12Ref.value;
      const slot1 = mSlot1Ref.value;
      const slot2 = mSlot2Ref.value;

      const getTreeAnchor = (slot: HTMLElement) => {
        if (!isTablet) return getCenterRelativeTo(wrapper, slot);

        const anchor = getLayoutCenterRelativeTo(wrapper, slot);

        // 場景一離開 pin 後會保留 spacer 的位移，補回後才是數據一
        // 真正在頁面上的右側中心；場景二不在 pin 內，不需要補償。
        if (slot === slot1) {
          anchor.top += getPinSpacingOffset(scene1);
        }

        return anchor;
      };

      const resetTreePosition = () => {
        const start = getTreeAnchor(slot1);

        gsap.set(traveler, {
          top: 0,
          left: 0,
          x: start.left,
          y: start.top,
          xPercent: -50,
          yPercent: -50,
          force3D: true,
        });
      };

      resetTreePosition();

      if (mScene1StaticTreeRef.value) {
        cleanupHandoff = setupTreeHandoff(
          scene2,
          mScene1StaticTreeRef.value,
          traveler,
          "top 90%",
          resetTreePosition,
        );
      }

      // 平板固定在兩筆數據右側的同一條軌道，只沿 Y 軸垂直往下。
      const treeTween = gsap.fromTo(
        traveler,
        {
          x: () => getTreeAnchor(slot1).left,
          y: () => getTreeAnchor(slot1).top,
        },
        {
          x: () =>
            isTablet
              ? getTreeAnchor(slot1).left
              : getTreeAnchor(slot2).left,
          y: () => getTreeAnchor(slot2).top,
          ease: "none",
          force3D: true,
          immediateRender: false,
          scrollTrigger: {
            trigger: scene2,
            start: "top 90%",
            end: "top 32%",
            scrub: true,
            invalidateOnRefresh: true,
            onRefreshInit: resetTreePosition,
          },
        },
      );

      mobileTweens.push(treeTween);
    }

    if (
      mScene3WrapRef.value &&
      mScene3SecondRowRef.value &&
      mTravel3Ref.value &&
      mStatSlot1Ref.value &&
      mStatSlot2Ref.value
    ) {
      const wrapper = mScene3WrapRef.value;
      const secondRow = mScene3SecondRowRef.value;
      const traveler = mTravel3Ref.value;
      const slot1 = mStatSlot1Ref.value;
      const slot2 = mStatSlot2Ref.value;

      const resetPhotoPosition = () => {
        placeTravelerAtSlot(wrapper, traveler, slot1);
      };

      resetPhotoPosition();

      // 手機版照片僅由第一列往第二列移動，沒有 X 軸位移。
      const photoTween = gsap.to(traveler, {
        x: 0,
        y: () =>
          getVerticalSlotDelta(wrapper, slot1, slot2),
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: secondRow,
          start: "top 88%",
          end: "top 35%",
          scrub: 1.4,
          invalidateOnRefresh: true,
          onRefreshInit: resetPhotoPosition,
        },
      });

      mobileTweens.push(photoTween);
    }

    const cleanupReveals = setupSceneReveals([
      {
        trigger: mScene2Ref.value,
        elements: [mScene2TextRef.value],
      },
      {
        trigger: mScene2StatRef.value,
        elements: [mScene2StatRef.value],
        start: STAT_REVEAL_START,
        y: 30,
        stagger: 0,
        ease: "power2.out",
        duration: STAT_REVEAL_DURATION,
        scrub: false,
        toggleActions: "play none none reverse",
      },
      {
        trigger: mScene3Ref.value,
        elements: [mScene3TextRef.value],
      },
      {
        trigger: mScene3StatRef.value,
        elements: [
          mScene3StatRef.value,
          mScene4StatRef.value,
        ],
        start: STAT_REVEAL_START,
        y: 30,
        stagger: 0.08,
        ease: "power2.out",
        duration: STAT_REVEAL_DURATION,
        scrub: false,
        toggleActions: "play none none reverse",
      },
    ]);

    return () => {
      cleanupReveals();
      cleanupHandoff();

      mobileTweens.forEach((tween) => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });

      cleanupIntro();
    };
  });

  ScrollTrigger.refresh();
});

onBeforeUnmount(() => {
  mediaContext?.revert();
  mediaContext = null;
});
</script>

<template>
  <!-- ============ 桌機版 ============ -->
  <section
    ref="wrapperRef"
    class="relative hidden min-h-[300vh] w-full overflow-hidden text-[#1a1a1a] lg:block bg-[#F9F8F6]"
  >
    <div
      ref="travelRef"
      class="pointer-events-none absolute left-0 top-0 z-20 h-[clamp(300px,38vw,560px)] max-h-[60vh] w-[clamp(300px,38vw,560px)] max-w-[60vh] will-change-transform [contain:layout_paint]"
    >
      <TreeIcon
        size="100%"
        color="#5D5D5D"
        class="block h-full w-full"
      />
    </div>

    <div
      ref="scene1Ref"
      class="relative min-h-screen w-full"
    >
      <div
        ref="desktopIntroLayerRef"
        class="pointer-events-none absolute inset-0 z-30 flex min-h-screen items-center justify-center bg-[#F9F8F6] px-6 text-center"
        aria-hidden="true"
      >
        <h2
          ref="desktopIntroTextRef"
          class="will-change-transform text-[clamp(2.75rem,6vw,6.5rem)] font-semibold tracking-[-0.04em] text-[#1a1a1a]"
        >
          {{ introText }}
        </h2>
      </div>

      <div
        ref="scene1ContentRef"
        class="relative z-10 grid min-h-screen w-full grid-cols-2 items-center will-change-[opacity]"
      >
        <div class="grid h-full grid-cols-[22%_78%] items-center px-[2.75vw]">
          <div ref="scene1StatRef" class="min-w-0">
            <p class="text-[clamp(2.5rem,3vw,3.5rem)] font-bold leading-none tracking-wide text-[#FF891D]">
              {{ statValue1 }}
            </p>
            <p class="mt-2 text-[clamp(.875rem,1vw,1.125rem)] leading-tight text-[#252525]/50">
              {{ statLabel1 }}
            </p>
          </div>

          <div
            ref="imageSlot1Ref"
            class="h-[clamp(300px,38vw,560px)] max-h-[60vh] w-[clamp(300px,38vw,560px)] max-w-[60vh] justify-self-center"
          >
            <div ref="scene1StaticTreeRef" class="h-full w-full">
              <TreeIcon
                size="100%"
                color="#5D5D5D"
                class="block h-full w-full"
              />
            </div>
          </div>
        </div>

        <div ref="scene1TextRef" class="px-[5.5vw]">
          <p class="max-w-full text-[clamp(1.05rem,1.05vw,1.35rem)] text-[#252525]/60">
            <span class="font-semibold text-[#252525]">
              {{ quote1Highlight }}
            </span>
            {{ quote1Rest }}
          </p>
        </div>
      </div>
    </div>

    <div
      ref="scene2Ref"
      class="grid min-h-screen w-full grid-cols-2 items-center"
    >
      <div ref="scene2TextRef" class="px-[5.5vw]">
        <p class="max-w-full text-[clamp(1.05rem,1.25vw,1.45rem)] leading-relaxed text-[#252525]/60">
          <span class="font-semibold text-[#252525]">
            {{ quote2Highlight }}
          </span>
          {{ quote2Rest }}
        </p>
      </div>

      <div class="grid h-full grid-cols-[78%_22%] items-center px-[2.75vw]">
        <div
          ref="imageSlot2Ref"
          class="h-[clamp(300px,38vw,560px)] max-h-[60vh] w-[clamp(300px,38vw,560px)] max-w-[60vh] justify-self-center"
        ></div>

        <div ref="scene2StatRef" class="min-w-0">
          <p class="text-[clamp(2.5rem,3vw,3.5rem)] font-bold leading-none tracking-wide text-[#FF891D]">
            {{ statValue2 }}
          </p>
          <p class="mt-2 text-[clamp(.875rem,1vw,1.125rem)] leading-tight text-[#252525]/50">
            {{ statLabel2 }}
          </p>
        </div>
      </div>
    </div>

    <div
      ref="scene3Ref"
      class="grid min-h-screen w-full grid-cols-2 items-center"
    >
      <div class="grid h-full grid-cols-[22%_78%] items-center px-[2.75vw]">
        <div ref="scene3StatRef" class="min-w-0">
          <p class="text-[clamp(2.5rem,3vw,3.5rem)] font-bold leading-none tracking-wide text-[#FF891D]">
            {{ statValue3 }}
          </p>
          <p class="mt-2 text-[clamp(.875rem,1vw,1.125rem)] leading-tight text-[#252525]/50">
            {{ statLabel3 }}
          </p>
        </div>

        <div
          ref="imageSlot3Ref"
          class="h-[clamp(300px,38vw,560px)] max-h-[60vh] w-[clamp(300px,38vw,560px)] max-w-[60vh] justify-self-center"
        ></div>
      </div>

      <div ref="scene3TextRef" class="px-[5.5vw]">
        <p class="max-w-full text-[clamp(1.05rem,1.25vw,1.45rem)] leading-relaxed text-[#252525]/60">
          <span class="font-semibold text-[#252525]">
            {{ quote3Highlight }}
          </span>
          {{ quote3Rest }}
        </p>
      </div>
    </div>
  </section>

  <!-- ============ 手機版：場景一、二 ============ -->
  <section
    ref="mWrapperRef"
    class="relative w-full overflow-hidden bg-white text-[#1a1a1a] lg:hidden"
  >
    <div
      ref="mTravel12Ref"
      class="pointer-events-none absolute left-0 top-0 z-20 h-[clamp(112px,30vw,180px)] w-[clamp(112px,30vw,180px)] will-change-transform [contain:layout_paint] md:h-[clamp(180px,24vw,240px)] md:w-[clamp(180px,24vw,240px)]"
    >
      <TreeIcon
        size="100%"
        color="#5D5D5D"
        class="block h-full w-full"
      />
    </div>

    <!-- 場景一：文案在上，數據與 Tree 在下 -->
    <article
      ref="mScene1Ref"
      class="relative min-h-[100svh]"
    >
      <div
        ref="mobileIntroLayerRef"
        class="pointer-events-none absolute inset-0 z-30 flex min-h-[100svh] items-center justify-center bg-white px-5 text-center"
        aria-hidden="true"
      >
        <h2
          ref="mobileIntroTextRef"
          class="will-change-transform text-[clamp(2.5rem,13vw,5rem)] font-semibold tracking-[-0.04em] text-[#1a1a1a]"
        >
          {{ introText }}
        </h2>
      </div>

      <div
        ref="mScene1ContentRef"
        class="relative z-10 flex min-h-[100svh] flex-col justify-center gap-12 px-5 pb-16 pt-24 will-change-[opacity] sm:px-8"
      >
        <div ref="mScene1TextRef">
          <p class="max-w-3xl text-lg leading-[1.8] text-[#1a1a1a]/60 sm:text-xl">
            <span class="font-semibold text-[#1a1a1a]">
              {{ quote1Highlight }}
            </span>
            {{ quote1Rest }}
          </p>
        </div>

        <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div ref="mScene1StatRef" class="min-w-0">
            <p class="text-[clamp(2.25rem,10vw,3.5rem)] font-bold leading-none tracking-wide">
              {{ statValue1 }}
            </p>
            <p class="mt-3 max-w-[12rem] text-sm leading-relaxed text-[#1a1a1a]/50 sm:text-base">
              {{ statLabel1 }}
            </p>
          </div>

          <div
            ref="mSlot1Ref"
            class="h-[clamp(112px,30vw,180px)] w-[clamp(112px,30vw,180px)] justify-self-end md:h-[clamp(180px,24vw,240px)] md:w-[clamp(180px,24vw,240px)]"
            aria-hidden="true"
          >
            <div ref="mScene1StaticTreeRef" class="h-full w-full">
              <TreeIcon
                size="100%"
                color="#5D5D5D"
                class="block h-full w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </article>

    <!-- 場景二：數據與 Tree 在上，文案在下 -->
    <article
      ref="mScene2Ref"
      class="flex min-h-[50svh] flex-col justify-center gap-12 px-5 pb-16 pt-24 sm:px-8"
    >
      <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div ref="mScene2StatRef" class="min-w-0">
          <p class="text-[clamp(2.25rem,10vw,3.5rem)] font-bold leading-none tracking-wide">
            {{ statValue2 }}
          </p>
          <p class="mt-3 max-w-[12rem] text-sm leading-relaxed text-[#1a1a1a]/50 sm:text-base">
            {{ statLabel2 }}
          </p>
        </div>

        <div
          ref="mSlot2Ref"
          class="h-[clamp(112px,30vw,180px)] w-[clamp(112px,30vw,180px)] justify-self-end md:h-[clamp(180px,24vw,240px)] md:w-[clamp(180px,24vw,240px)]"
          aria-hidden="true"
        ></div>
      </div>

      <div ref="mScene2TextRef">
        <p class="max-w-3xl text-lg leading-[1.8] text-[#1a1a1a]/60 sm:text-xl">
          <span class="font-semibold text-[#1a1a1a]">
            {{ quote2Highlight }}
          </span>
          {{ quote2Rest }}
        </p>
      </div>
    </article>
  </section>

  <!-- ============ 手機版：場景三 ============ -->
  <section
    class="relative w-full overflow-hidden bg-white text-[#1a1a1a] lg:hidden"
  >
    <div ref="mScene3WrapRef" class="relative">
      <div
        ref="mTravel3Ref"
        class="pointer-events-none absolute z-20 h-[clamp(132px,36vw,260px)] w-[clamp(132px,36vw,260px)] overflow-hidden rounded-2xl shadow-xl will-change-transform"
      >
        <img
          :src="travelImage2"
          alt=""
          class="h-full w-full object-cover"
          loading="eager"
          aria-hidden="true"
        />
      </div>

      <article
        ref="mScene3Ref"
        class="px-5 pb-20 pt-16 sm:px-8"
      >
        <!-- 數據三與照片 -->
        <div class="grid  grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div ref="mScene3StatRef" class="min-w-0">
            <p class="text-[clamp(2.25rem,10vw,3.5rem)] font-bold leading-none tracking-wide">
              {{ statValue3 }}
            </p>
            <p class="mt-3 max-w-[12rem] text-sm leading-relaxed text-[#1a1a1a]/50 sm:text-base">
              {{ statLabel3 }}
            </p>
          </div>

          <div
            ref="mStatSlot1Ref"
            class="h-[clamp(132px,36vw,260px)] w-[clamp(132px,36vw,260px)] justify-self-end"
            aria-hidden="true"
          ></div>
        </div>

        <!-- 數據四與同一張往下移動的照片 -->
        <div
          ref="mScene3SecondRowRef"
          class="grid  grid-cols-[minmax(0,1fr)_auto] items-center gap-4"
        >
          <div ref="mScene4StatRef" class="min-w-0">
            <p class="text-[clamp(2.25rem,10vw,3.5rem)] font-bold leading-none tracking-wide">
              {{ statValue4 }}
            </p>
            <p class="mt-3 max-w-[12rem] text-sm leading-relaxed text-[#1a1a1a]/50 sm:text-base">
              {{ statLabel4 }}
            </p>
          </div>

          <div
            ref="mStatSlot2Ref"
            class="h-[clamp(132px,36vw,260px)] w-[clamp(132px,36vw,260px)] justify-self-end"
            aria-hidden="true"
          ></div>
        </div>

        <!-- 場景三最後才出現的文案位置 -->
        <div
          ref="mScene3TextRef"
          class="flex min-h-[45svh] items-center"
        >
          <p class="max-w-3xl text-lg leading-[1.8] text-[#1a1a1a]/60 sm:text-xl">
            <span class="font-semibold text-[#1a1a1a]">
              {{ quote3Highlight }}
            </span>
            {{ quote3Rest }}
          </p>
        </div>
      </article>
    </div>
  </section>
</template>
