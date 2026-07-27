<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  maskColor?: string;
  maskHeight?: string;
}

withDefaults(defineProps<Props>(), {
  maskColor: "#ffffff",
  maskHeight: "400px",
});

const containerRef = ref<HTMLElement | null>(null);
const maskRef = ref<HTMLElement | null>(null);

let revealTrigger: ScrollTrigger | null = null;
let prefersReducedMotion = false;

onMounted(async () => {
  await nextTick();

  prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion || !containerRef.value || !maskRef.value) return;

  /*
   * 對應原本 Framer Motion 的
   * useScroll({ target: containerRef, offset: ["start end", "end end"] })：
   * 從「容器頂部進入視窗底部」開始，到「容器底部到達視窗底部」結束。
   */
  gsap.to(maskRef.value, {
    yPercent: -100,
    ease: "none",
    scrollTrigger: {
      trigger: containerRef.value,
      start: "top bottom",
      end: "bottom bottom",
      scrub: 0.8, // 用 scrub 的延遲感取代 useSpring 的彈簧手感
    },
  });

  revealTrigger = ScrollTrigger.getAll().find(
    (t) => t.trigger === containerRef.value,
  ) ?? null;
});

onBeforeUnmount(() => {
  revealTrigger?.kill();
  if (maskRef.value) gsap.killTweensOf(maskRef.value);
});
</script>

<template>
  <div ref="containerRef" class="relative">
    <slot />

    <div
      class="pointer-events-none absolute left-0 top-0 z-10 w-full overflow-hidden"
      :style="{ height: maskHeight }"
    >
      <div ref="maskRef" class="relative h-full w-full">
        <div
          class="absolute left-0 top-0 h-full w-full rounded-b-[2.5rem] shadow-md"
          :style="{ backgroundColor: maskColor }"
        />
      </div>
    </div>
  </div>
</template>