<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from "vue";
import gsap from "gsap";
import { lenisInstance } from "../../lib/lenis";

/** 預設陰影：外投影 + 四邊內光，做出微微浮起的實體感 */
const DEFAULT_SHADOW =
  "2px 2px 16px 0 #2525251a, .75px 0 1px 0 #f8f4eea6 inset, 0 .75px 1px 0 #f8f4eea6 inset, -.25px 0 1px 0 #f8f4ee80 inset, 0 -.25px 1px 0 #f8f4ee80 inset";

interface Props {
  text?: string;
  href?: string;
  /** solid：有背景色；ghost：無背景，只有文字與箭頭 */
  variant?: "solid" | "ghost";
  /** 背景色，僅在 variant="solid" 時生效。可用 rgba() 做半透明毛玻璃 */
  bgColor?: string;
  /** 文字與箭頭顏色 */
  textColor?: string;
  /**
   * 陰影設定，僅在 variant="solid" 時生效：
   * true → 預設陰影；false → 無陰影；string → 自訂 box-shadow
   */
  shadow?: boolean | string;
  /** 圓角，可傳任何合法的 border-radius 值 */
  radius?: string;
  /**
   * 背景模糊（毛玻璃效果），單位 px。
   * 0 或不傳表示不套用。需搭配半透明的 bgColor 才看得出效果。
   */
  blur?: number;
}

const props = withDefaults(defineProps<Props>(), {
  text: "Book a Consultation",
  href: "#contact",
  variant: "solid",
  bgColor: "#F9F8F6",
  textColor: "#1c1b17",
  shadow: true,
  radius: "2px",
  blur: 0,
});

const linkRef = ref<HTMLAnchorElement | null>(null);
const arrowCurrentRef = ref<SVGElement | null>(null);
const arrowNextRef = ref<SVGElement | null>(null);

const characters = computed(() =>
  Array.from(props.text).map((character) =>
    character === " " ? "\u00A0" : character,
  ),
);

const buttonStyle = computed(() => {
  const style: Record<string, string> = {
    color: props.textColor,
    borderRadius: props.radius,
  };

  if (props.variant === "solid") {
    style.backgroundColor = props.bgColor;

    if (props.shadow === true) {
      style.boxShadow = DEFAULT_SHADOW;
    } else if (typeof props.shadow === "string") {
      style.boxShadow = props.shadow;
    }
  }

  if (props.blur > 0) {
    style.backdropFilter = `blur(${props.blur}px)`;
    // Safari 需要前綴才會生效
    style.webkitBackdropFilter = `blur(${props.blur}px)`;
  }

  return style;
});

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

  if (!link || !currentArrow || !nextArrow) return;

  const characterStacks = Array.from(
    link.querySelectorAll<HTMLElement>(".cta-character-stack"),
  );

  gsapContext = gsap.context(() => {
    gsap.set(characterStacks, { yPercent: 0 });
    gsap.set(currentArrow, { x: 0, opacity: 1 });
    gsap.set(nextArrow, { x: -24, opacity: 0 });

    if (prefersReducedMotion) return;

    hoverTimeline = gsap.timeline({
      paused: true,
      defaults: { overwrite: "auto" },
    });

    hoverTimeline.to(
      characterStacks,
      {
        yPercent: -50,
        duration: 0.5,
        stagger: { each: 0.025, from: "start" },
        ease: "power3.inOut",
      },
      0,
    );

    hoverTimeline.to(
      currentArrow,
      { x: 24, opacity: 0, duration: 0.28, ease: "power2.in" },
      0.08,
    );

    hoverTimeline.fromTo(
      nextArrow,
      { x: -24, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.38, ease: "power3.out" },
      0.16,
    );
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

/**
 * 錨點連結（#xxx）改用 Lenis 平滑捲動過去，而不是瀏覽器原生的「直接跳過去」。
 * 有 Lenis 實例時用它（跟全站其他捲動手感一致）；沒有的話（例如
 * prefers-reduced-motion 開啟，App.vue 根本沒建立 Lenis）就退回原生
 * scrollIntoView，並尊重使用者的減少動態設定。
 */
const handleClick = (event: MouseEvent) => {
  if (!props.href.startsWith("#")) return;

  const target = document.querySelector<HTMLElement>(props.href);
  if (!target) return;

  event.preventDefault();

  if (lenisInstance.current) {
    lenisInstance.current.scrollTo(target, { offset: 0 });
    return;
  }

  target.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
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
    class="inline-flex origin-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2"
    @click="handleClick"
    @mouseenter="handleEnter"
    @mouseleave="handleLeave"
    @focus="handleEnter"
    @blur="handleLeave"
  >
    <span
      class="inline-flex items-center gap-3"
      :class="variant === 'solid' ? 'px-4 py-3' : 'py-1'"
      :style="buttonStyle"
    >
      <!-- 真正提供給螢幕閱讀器的文字 -->
      <span class="sr-only">
        {{ props.text }}
      </span>

      <!-- 波浪文字 -->
      <span
        aria-hidden="true"
        class="inline-flex h-[1em] items-start overflow-hidden whitespace-nowrap text-sm font-medium leading-none"
      >
        <span
          v-for="(character, index) in characters"
          :key="`${character}-${index}`"
          class="inline-block h-[1em] overflow-hidden"
        >
          <span class="cta-character-stack flex flex-col will-change-transform">
            <span class="block h-[1em] leading-none">{{ character }}</span>
            <span class="block h-[1em] leading-none">{{ character }}</span>
          </span>
        </span>
      </span>

      <!-- 箭頭裁切圓框 -->
      <span
        aria-hidden="true"
        class="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-current"
      >
        <svg
          ref="arrowCurrentRef"
          viewBox="0 0 20 20"
          fill="none"
          class="absolute h-4 w-4 will-change-transform"
        >
          <path
            d="M4 10H16M12 6L16 10L12 14"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <svg
          ref="arrowNextRef"
          viewBox="0 0 20 20"
          fill="none"
          class="absolute h-4 w-4 will-change-transform"
        >
          <path
            d="M4 10H16M12 6L16 10L12 14"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </span>
  </a>
</template>