<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import TreeIcon from "./Tree.vue";

gsap.registerPlugin(ScrollTrigger);

interface Props {
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

const mScene2Ref = ref<HTMLElement | null>(null);
const mTravel12Ref = ref<HTMLElement | null>(null);
const mSlot1Ref = ref<HTMLElement | null>(null);
const mSlot2Ref = ref<HTMLElement | null>(null);
const mScene1TextRef = ref<HTMLElement | null>(null);
const mScene1StatRef = ref<HTMLElement | null>(null);
const mScene2TextRef = ref<HTMLElement | null>(null);
const mScene2StatRef = ref<HTMLElement | null>(null);

const mScene3WrapRef = ref<HTMLElement | null>(null);

const mScene3SecondRowRef = ref<HTMLElement | null>(null);
const mTravel3Ref = ref<HTMLElement | null>(null);
const mStatSlot1Ref = ref<HTMLElement | null>(null);
const mStatSlot2Ref = ref<HTMLElement | null>(null);
const mScene3StatRef = ref<HTMLElement | null>(null);
const mScene4StatRef = ref<HTMLElement | null>(null);
const mScene3TextRef = ref<HTMLElement | null>(null);

type SceneGroup = Array<HTMLElement | null>;
type Direction = "forward" | "backward";

let mediaContext: ReturnType<typeof gsap.matchMedia> | null = null;

/* ----------------------------------
   每個場景交界一個 ScrollTrigger

   onEnter：往下切換
   onLeaveBack：往回切換

   同一組元素只會被目前的 crossfade timeline 控制；
   開始新交接前會先終止尚未完成的舊 tween。
---------------------------------- */

const setupBoundaryCrossfades = (
  sceneTriggers: Array<HTMLElement | null>,
  sceneGroups: SceneGroup[],
) => {
  const triggers = sceneTriggers.filter(Boolean) as HTMLElement[];
  const groups = sceneGroups.map(
    (group) => group.filter(Boolean) as HTMLElement[],
  );

  if (
    triggers.length !== sceneTriggers.length ||
    triggers.length < 2 ||
    groups.length !== triggers.length ||
    groups.some((group) => group.length === 0)
  ) {
    return () => {};
  }

  const allTargets = groups.flat();
  const boundaryTriggers: ScrollTrigger[] = [];
  let activeTimeline: gsap.core.Timeline | null = null;

  const setActiveScene = (activeIndex: number) => {
    activeTimeline?.kill();
    activeTimeline = null;
    gsap.killTweensOf(allTargets);

    groups.forEach((group, index) => {
      gsap.set(group, {
        autoAlpha: index === activeIndex ? 1 : 0,
        y:
          index === activeIndex
            ? 0
            : index < activeIndex
              ? -24
              : 24,
      });
    });
  };

  const crossfade = (
    outgoing: HTMLElement[],
    incoming: HTMLElement[],
    direction: Direction,
  ) => {
    activeTimeline?.kill();
    gsap.killTweensOf([...outgoing, ...incoming]);

    const outgoingY = direction === "forward" ? -24 : 24;

    activeTimeline = gsap.timeline({
      defaults: {
        duration: 0.58,
        ease: "power2.out",
        overwrite: "auto",
      },
      onComplete: () => {
        activeTimeline = null;
      },
    });

    activeTimeline.to(
      outgoing,
      {
        autoAlpha: 0,
        y: outgoingY,
      },
      0,
    );

    // 使用當下狀態作為起點；快速反向時不會被 fromTo 強制跳回固定值。
    activeTimeline.to(
      incoming,
      {
        autoAlpha: 1,
        y: 0,
      },
      0,
    );
  };

  const syncSceneToScroll = () => {
    const threshold = window.innerHeight * 0.72;
    let activeIndex = 0;

    for (let index = 1; index < triggers.length; index += 1) {
      if (triggers[index].getBoundingClientRect().top <= threshold) {
        activeIndex = index;
      }
    }

    setActiveScene(activeIndex);
  };

  for (let index = 1; index < triggers.length; index += 1) {
    const boundary = ScrollTrigger.create({
      trigger: triggers[index],
      start: "top 72%",
      invalidateOnRefresh: true,
      onEnter: () => {
        crossfade(groups[index - 1], groups[index], "forward");
      },
      onLeaveBack: () => {
        crossfade(groups[index], groups[index - 1], "backward");
      },
    });

    boundaryTriggers.push(boundary);
  }

  ScrollTrigger.addEventListener("refresh", syncSceneToScroll);
  syncSceneToScroll();

  return () => {
    ScrollTrigger.removeEventListener("refresh", syncSceneToScroll);
    boundaryTriggers.forEach((trigger) => trigger.kill());
    activeTimeline?.kill();
    gsap.killTweensOf(allTargets);
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
    [
      scene1StatRef.value,
      scene1TextRef.value,
      scene2StatRef.value,
      scene2TextRef.value,
      scene3StatRef.value,
      scene3TextRef.value,
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

    const cleanupCrossfades = setupBoundaryCrossfades(
      [
        scene1Ref.value,
        scene2Ref.value,
        scene3Ref.value,
      ],
      [
        [
          scene1StatRef.value,
          scene1TextRef.value,
        ],
        [
          scene2StatRef.value,
          scene2TextRef.value,
        ],
        [
          scene3StatRef.value,
          scene3TextRef.value,
        ],
      ],
    );

    const initialPosition = getCenterRelativeTo(
      wrapperRef.value,
      imageSlot1Ref.value,
    );

    gsap.set(travelRef.value, {
      top: initialPosition.top,
      left: initialPosition.left,
      xPercent: -50,
      yPercent: -50,
    });

    const moveToScene2 = gsap.fromTo(
      travelRef.value,
      {
        top: initialPosition.top,
        left: initialPosition.left,
      },
      {
        top: () =>
          getCenterRelativeTo(
            wrapperRef.value!,
            imageSlot2Ref.value!,
          ).top,
        left: () =>
          getCenterRelativeTo(
            wrapperRef.value!,
            imageSlot2Ref.value!,
          ).left,
        ease: "sine.inOut",
        immediateRender: false,
        scrollTrigger: {
          trigger: scene2Ref.value,
          start: "top 95%",
          end: "top 20%",
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      },
    );

    const moveToScene3 = gsap.fromTo(
      travelRef.value,
      {
        top: () =>
          getCenterRelativeTo(
            wrapperRef.value!,
            imageSlot2Ref.value!,
          ).top,
        left: () =>
          getCenterRelativeTo(
            wrapperRef.value!,
            imageSlot2Ref.value!,
          ).left,
      },
      {
        top: () =>
          getCenterRelativeTo(
            wrapperRef.value!,
            imageSlot3Ref.value!,
          ).top,
        left: () =>
          getCenterRelativeTo(
            wrapperRef.value!,
            imageSlot3Ref.value!,
          ).left,
        ease: "sine.inOut",
        immediateRender: false,
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
      cleanupCrossfades();
      moveToScene2.scrollTrigger?.kill();
      moveToScene2.kill();
      moveToScene3.scrollTrigger?.kill();
      moveToScene3.kill();
    };
  });

  mediaContext.add("(max-width: 1023px)", () => {


    const mobileTweens: gsap.core.Tween[] = [];

    if (
      mWrapperRef.value &&
      mScene2Ref.value &&
      mTravel12Ref.value &&
      mSlot1Ref.value &&
      mSlot2Ref.value
    ) {
      const wrapper = mWrapperRef.value;
      const scene2 = mScene2Ref.value;
      const traveler = mTravel12Ref.value;
      const slot1 = mSlot1Ref.value;
      const slot2 = mSlot2Ref.value;

      const resetTreePosition = () => {
        placeTravelerAtSlot(wrapper, traveler, slot1);
      };

      resetTreePosition();

      // 手機版 Tree 僅改變 Y，X 永遠維持 0。
      const treeTween = gsap.to(traveler, {
        x: 0,
        y: () =>
          getVerticalSlotDelta(wrapper, slot1, slot2),
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: scene2,
          start: "top 88%",
          end: "top 32%",
          scrub: 1.4,
          invalidateOnRefresh: true,
          onRefreshInit: resetTreePosition,
        },
      });

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

    return () => {
      
      mobileTweens.forEach((tween) => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
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
      class="pointer-events-none absolute z-20 h-[clamp(300px,62vh,560px)] w-[clamp(300px,62vh,560px)]"
    >
      <TreeIcon
        size="100%"
        color="#5D5D5D"
        class="block h-full w-full"
      />
    </div>

    <div
      ref="scene1Ref"
      class="grid min-h-screen w-full grid-cols-2 items-center "
    >
      <div class="grid h-full grid-cols-[22%_78%] items-center px-[2.75vw]">
        <div ref="scene1StatRef" class="min-w-0">
          <p class="text-[clamp(2.5rem,3vw,3.5rem)] font-bold leading-none tracking-wide text-[#FF891D]">
            {{ statValue1 }}
          </p>
          <p class="mt-2 text-[clamp(.875rem,1vw,1.125rem)] leading-tight text-[#1a1a1a]/50">
            {{ statLabel1 }}
          </p>
        </div>

        <div
          ref="imageSlot1Ref"
          class="h-[clamp(300px,62vh,560px)] w-[clamp(300px,62vh,560px)] justify-self-center"
        ></div>
      </div>

      <div ref="scene1TextRef" class="px-[5.5vw]">
        <p class="max-w-full text-[clamp(1.05rem,1.25vw,1.45rem)] leading-relaxed text-[#1a1a1a]/60">
          <span class="font-semibold text-[#1a1a1a]">
            {{ quote1Highlight }}
          </span>
          {{ quote1Rest }}
        </p>
      </div>
    </div>

    <div
      ref="scene2Ref"
      class="grid min-h-screen w-full grid-cols-2 items-center "
    >
      <div ref="scene2TextRef" class="px-[5.5vw]">
        <p class="max-w-full text-[clamp(1.05rem,1.25vw,1.45rem)] leading-relaxed text-[#1a1a1a]/60">
          <span class="font-semibold text-[#1a1a1a]">
            {{ quote2Highlight }}
          </span>
          {{ quote2Rest }}
        </p>
      </div>

      <div class="grid h-full grid-cols-[78%_22%] items-center px-[2.75vw]">
        <div
          ref="imageSlot2Ref"
          class="h-[clamp(300px,62vh,560px)] w-[clamp(300px,62vh,560px)] justify-self-center"
        ></div>

        <div ref="scene2StatRef" class="min-w-0">
          <p class="text-[clamp(2.5rem,3vw,3.5rem)] font-bold leading-none tracking-wide text-[#FF891D]">
            {{ statValue2 }}
          </p>
          <p class="mt-2 text-[clamp(.875rem,1vw,1.125rem)] leading-tight text-[#1a1a1a]/50">
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
          <p class="mt-2 text-[clamp(.875rem,1vw,1.125rem)] leading-tight text-[#1a1a1a]/50">
            {{ statLabel3 }}
          </p>
        </div>

        <div
          ref="imageSlot3Ref"
          class="h-[clamp(300px,62vh,560px)] w-[clamp(300px,62vh,560px)] justify-self-center"
        ></div>
      </div>

      <div ref="scene3TextRef" class="px-[5.5vw]">
        <p class="max-w-full text-[clamp(1.05rem,1.25vw,1.45rem)] leading-relaxed text-[#1a1a1a]/60">
          <span class="font-semibold text-[#1a1a1a]">
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
      class="pointer-events-none absolute z-20 h-[clamp(132px,36vw,260px)] w-[clamp(132px,36vw,260px)] will-change-transform"
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
      class="flex min-h-[50svh] flex-col justify-center gap-12 px-5 pb-16 pt-24 sm:px-8"
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
          class="h-[clamp(132px,36vw,260px)] w-[clamp(132px,36vw,260px)] justify-self-end"
          aria-hidden="true"
        ></div>
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
          class="h-[clamp(132px,36vw,260px)] w-[clamp(132px,36vw,260px)] justify-self-end"
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
