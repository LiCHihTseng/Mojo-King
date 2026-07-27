<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";

interface Props {
  text?: string;
  href?: string;
}

withDefaults(defineProps<Props>(), {
  text: "預約諮詢",
  href: "#contact",
});

const linkRef = ref<HTMLElement | null>(null);
const pillRef = ref<HTMLElement | null>(null);
const iconWrapRef = ref<HTMLElement | null>(null);
const arrowRef = ref<HTMLElement | null>(null);

let prefersReducedMotion = false;
let gsapContext: gsap.Context | null = null;

onMounted(async () => {
  await nextTick();

  prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  gsapContext = gsap.context(() => {
    // 初始狀態：箭頭旋轉 30 度（跟 handleLeave 的還原角度一致）
    gsap.set(arrowRef.value, { rotate: 5 });
  }, linkRef.value ?? undefined);
});

onBeforeUnmount(() => {
  gsapContext?.revert();
});

const handleEnter = () => {
  if (prefersReducedMotion) return;

  gsap.to(linkRef.value, {
    scale: 1.03,
    duration: 0.3,
    ease: "power2.out",
    overwrite: "auto",
  });

  gsap.to(pillRef.value, {
    backgroundColor: "#B55F00",
    color: "#FFFFFF",
    duration: 0.35,
    ease: "power2.out",
    overwrite: "auto",
  });

  gsap.to(arrowRef.value, {
    rotate: 45,
    duration: 0.4,
    ease: "back.out(1.6)",
    overwrite: "auto",
  });


};

const handleLeave = () => {
  gsap.to(linkRef.value, {
    scale: 1,
    duration: 0.35,
    ease: "power3.out",
    overwrite: "auto",
  });

  gsap.to(pillRef.value, {
    backgroundColor: "#FFFFFF",
    color: "#1a1a1a",
    duration: 0.35,
    ease: "power2.out",
    overwrite: "auto",
  });

  gsap.to(arrowRef.value, {
    rotate: 5,
    duration: 0.4,
    ease: "power3.inOut",
    overwrite: "auto",
  });


};
</script>

<template>
  <a
    ref="linkRef"
    :href="href"
    class="inline-flex origin-center items-center focus-visible:outline-none"
    @mouseenter="handleEnter"
    @mouseleave="handleLeave"
  >
    <!-- 按鈕本體：文字 pill，預設白底，hover 變香檳金 -->
    <span
      ref="pillRef"
      class="inline-flex items-center rounded-full bg-white px-8 py-3.5 text-lg font-medium text-[#1a1a1a] shadow-lg"
    >
      {{ text }}
    </span>

    <!-- 圓形箭頭圖示：緊貼在按鈕旁，背景固定香檳金 -->
    <span
      ref="iconWrapRef"
      class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#B55F00] shadow-lg ring-2 ring-transparent transition-shadow focus-visible:ring-white"
      aria-hidden="true"
    >
      <svg
        ref="arrowRef"
        viewBox="0 0 20 20"
        fill="none"
        class="h-6 w-6 text-white"
      >
        <path
          d="M5 15L15 5M15 5H7M15 5V13"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
  </a>
</template>