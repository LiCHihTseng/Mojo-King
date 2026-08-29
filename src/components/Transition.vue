<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  bgColor?: string;
  end?: string;
  media?: string | null;
}
const props = withDefaults(defineProps<Props>(), {
  bgColor: "#F9F8F6",
  end: "+=80%",
  media: "(min-width: 1024px)",
});

const coverRef = ref<HTMLElement | null>(null);
const textRef = ref<HTMLElement | null>(null);

let mm: ReturnType<typeof gsap.matchMedia> | null = null;

onMounted(async () => {
  await nextTick();
  if (!coverRef.value) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  mm = gsap.matchMedia();

  mm.add(props.media ?? "all", () => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: coverRef.value!,
        start: "top top",
        end: props.end,
        scrub: 0.4,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    tl.to({}, { duration: 0.35 })
      .to(textRef.value, { scale: 0.5, duration: 0.65, ease: "power2.in" })
      .to(coverRef.value, { opacity: 0, duration: 0.45 }, "-=0.35");

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      gsap.set([coverRef.value, textRef.value], { clearProps: "all" });
    };
  });
});

onBeforeUnmount(() => {
  mm?.revert();
  mm = null;
});
</script>

<template>
  <div
    ref="coverRef"
    class="relative z-40 flex h-screen w-full items-center justify-center overflow-hidden px-6 text-center"
    :style="{ backgroundColor: bgColor }"
  >
    <div ref="textRef">
      <slot>
        <h2 class="text-h2 text-ink">標題文字</h2>
      </slot>
    </div>
  </div>
</template>