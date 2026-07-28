<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";

interface Props {
  line1?: string;
  line2?: string;
  line3?: string;
  description?: string;
}

withDefaults(defineProps<Props>(), {
  line1: "為你的企業",
  line2: "打造清晰的",
  line3: "人才策略",
  description:
    "我與企業主、主管與團隊合作，帶來清楚的方向與實際可行的策略，讓組織能穩健成長，不再對人才管理感到困惑。",
});

const rootRef = ref<HTMLElement | null>(null);
const headingRefs = ref<HTMLElement[]>([]);
const descriptionRef = ref<HTMLElement | null>(null);

let gsapContext: gsap.Context | null = null;



onMounted(async () => {
  await nextTick();

  if (!rootRef.value) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion) return;

  gsapContext = gsap.context(() => {
    const timeline = gsap.timeline({
      defaults: {
        ease: "power3.out",
      },
    });

    timeline
      .from(headingRefs.value, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.12,
      })
      .from(
        descriptionRef.value,
        {
          opacity: 0,
          y: 20,
          duration: 0.6,
        },
        "-=0.4",
      );
  }, rootRef.value);
});

onBeforeUnmount(() => {
  gsapContext?.revert();
});
</script>

<template>
  <div ref="rootRef"  class="flex flex-col gap-6 md:gap-10 lg:gap-14 ml-5 md:ml-2">
    <h1 class="max-w-[13ch] text-[clamp(1.5rem,6vw,6.5rem)] font-medium leading-[0.98] tracking-[-0.045em] text-white">
      <span ref="setHeadingRef" class="block whitespace-nowrap">
        {{ line1 }}
      </span>

      <span ref="setHeadingRef" class="block whitespace-nowrap">
        {{ line2 }}
      </span>

      <span ref="setHeadingRef" class="block whitespace-nowrap ">
        {{ line3 }}
      </span>
    </h1>

    <p ref="descriptionRef" class="mt-8 max-w-[52ch] border-l-2 border-white/30 pl-4 text-sm leading-7 text-white/70 sm:mt-10 sm:text-lg sm:leading-8 lg:mt-30">
      {{ description }}
    </p>
  </div>
</template>