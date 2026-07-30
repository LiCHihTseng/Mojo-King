<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from "vue";
import gsap from "gsap";

interface Props {
  text?: string;
  href?: string;
}

const props = withDefaults(defineProps<Props>(), {
  text: "Book a Consultation",
  href: "#contact",
});

const linkRef = ref<HTMLAnchorElement | null>(null);
// const buttonRef = ref<HTMLElement | null>(null);
const arrowCurrentRef = ref<SVGElement | null>(null);
const arrowNextRef = ref<SVGElement | null>(null);

const characters = computed(() =>
  Array.from(props.text).map((character) =>
    character === " " ? "\u00A0" : character,
  ),
);

let prefersReducedMotion = false;
let gsapContext: gsap.Context | null = null;
let hoverTimeline: gsap.core.Timeline | null = null;

onMounted(async () => {
  await nextTick();

  prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const link = linkRef.value;
  const currentArrow = arrowCurrentRef.value;
  const nextArrow = arrowNextRef.value;

  // 通過這裡之後，TypeScript 就知道它們不會是 null
  if (!link || !currentArrow || !nextArrow) return;

  const characterStacks = Array.from(
    link.querySelectorAll<HTMLElement>(
      ".cta-character-stack",
    ),
  );

  gsapContext = gsap.context(() => {
    gsap.set(characterStacks, {
      yPercent: 0,
    });

    gsap.set(currentArrow, {
      x: 0,
      opacity: 1,
    });

    gsap.set(nextArrow, {
      x: -24,
      opacity: 0,
    });

    if (prefersReducedMotion) return;

    hoverTimeline = gsap.timeline({
      paused: true,
      defaults: {
        overwrite: "auto",
      },
    });

    // 文字波浪向上
    hoverTimeline.to(
      characterStacks,
      {
        yPercent: -50,
        duration: 0.5,
        stagger: {
          each: 0.025,
          from: "start",
        },
        ease: "power3.inOut",
      },
      0,
    );

    // 原本箭頭向右飛出
    hoverTimeline.to(
      currentArrow,
      {
        x: 24,
        opacity: 0,
        duration: 0.28,
        ease: "power2.in",
      },
      0.08,
    );

    // 新箭頭從左側飛入
    hoverTimeline.fromTo(
      nextArrow,
      {
        x: -24,
        opacity: 0,
      },
      {
        x: 0,
        opacity: 1,
        duration: 0.38,
        ease: "power3.out",
      },
      0.16,
    );

    // 整顆按鈕輕微向上
    // hoverTimeline.to(
    //   link,
    //   {
    //     y: -2,
    //     duration: 0.35,
    //     ease: "power3.out",
    //   },
    //   0,
    // );
  }, link);
});

const handleEnter = () => {
  if (prefersReducedMotion) return;

  hoverTimeline?.play();
};

const handleLeave = () => {
  if (prefersReducedMotion) return;

  hoverTimeline?.reverse();
};

onBeforeUnmount(() => {
  hoverTimeline?.kill();
  gsapContext?.revert();

  hoverTimeline = null;
  gsapContext = null;
});
</script>

<template>
  <a
    ref="linkRef"
    :href="props.href"
    class="
      inline-flex origin-center
      focus-visible:outline-none
      focus-visible:ring-2
      focus-visible:ring-[#B55F00]
      focus-visible:ring-offset-2
    "
    @mouseenter="handleEnter"
    @mouseleave="handleLeave"
    @focus="handleEnter"
    @blur="handleLeave"
  >
    <span
      ref="buttonRef"
      class="
        inline-flex min-h-[52px] items-center gap-3
        rounded-[2px] bg-[#F2F2EF] px-4
        text-[#171717]
        shadow-[0_1px_4px_rgba(0,0,0,0.12)]
      "
    >
      <!-- 真正提供給螢幕閱讀器的文字 -->
      <span class="sr-only">
        {{ props.text }}
      </span>

      <!-- 波浪文字 -->
      <span
        aria-hidden="true"
        class="
          inline-flex h-[1em] items-start overflow-hidden
          whitespace-nowrap text-[14px] font-medium leading-none
        "
      >
        <span
          v-for="(character, index) in characters"
          :key="`${character}-${index}`"
          class="inline-block h-[1em] overflow-hidden"
        >
          <span
            class="
              cta-character-stack
              flex flex-col
              will-change-transform
            "
          >
            <!-- 第一份文字 -->
            <span class="block h-[1em] leading-none">
              {{ character }}
            </span>

            <!-- 第二份相同文字 -->
            <span class="block h-[1em] leading-none">
              {{ character }}
            </span>
          </span>
        </span>
      </span>

      <!-- 箭頭裁切圓框 -->
      <span
        aria-hidden="true"
        class="
          relative flex h-6 w-6 shrink-0 items-center
          justify-center overflow-hidden rounded-full
          border border-current
        "
      >
        <!-- 原本箭頭 -->
        <svg
          ref="arrowCurrentRef"
          viewBox="0 0 20 20"
          fill="none"
          class="absolute h-4 w-4 will-change-transform"
        >
          <path
            d="M4 10H16M12 6L16 10L12 14"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <!-- 從左邊進來的新箭頭 -->
        <svg
          ref="arrowNextRef"
          viewBox="0 0 20 20"
          fill="none"
          class="absolute h-4 w-4 will-change-transform"
        >
          <path
            d="M4 10H16M12 6L16 10L12 14"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </span>
  </a>
</template>