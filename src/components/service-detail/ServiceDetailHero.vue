<script setup lang="ts">
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ServiceDefinition } from "../../data/services";
import HeroCTA from "../Hero/HeroCTA.vue";
import { routeTransitionKey } from "../../lib/appShell";
import { consultationHref, useOverlayNav } from "../../lib/overlayNav";

gsap.registerPlugin(ScrollTrigger);

const props = defineProps<{ service: ServiceDefinition }>();

const transition = inject(routeTransitionKey, null);

/** hero 的「預約諮詢」跟頁尾那顆一樣直接開表單，並帶上這一頁的服務 slug */
const { openConsultation } = useOverlayNav();
const heroRoot = ref<HTMLElement | null>(null);
const parallaxImage = ref<HTMLImageElement | null>(null);

let mounted = false;
let initializationFrame = 0;
let refreshFrame = 0;
let initializationGeneration = 0;
let parallaxMedia: ReturnType<typeof gsap.matchMedia> | null = null;

const isRouteTransitioning = () => transition?.isTransitioning.value ?? false;

const setStableParallaxStart = () => {
  const image = parallaxImage.value;
  if (!image) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const desktop = window.matchMedia("(min-width: 768px)").matches;

  gsap.set(image, {
    yPercent: reduceMotion ? 0 : desktop ? -4 : -2,
    scale: reduceMotion ? 1.08 : desktop ? 1.18 : 1.12,
    willChange: reduceMotion ? "auto" : "transform",
  });
};

const freezeParallax = () => {
  const image = parallaxImage.value;
  if (!image || !parallaxMedia) return;

  const transform = getComputedStyle(image).transform;

  initializationGeneration += 1;
  cancelAnimationFrame(initializationFrame);
  cancelAnimationFrame(refreshFrame);
  initializationFrame = 0;
  refreshFrame = 0;
  parallaxMedia.revert();
  parallaxMedia = null;

  image.style.transform = transform === "none" ? "" : transform;
  image.style.willChange = "transform";
};

const revertParallax = () => {
  initializationGeneration += 1;
  cancelAnimationFrame(initializationFrame);
  cancelAnimationFrame(refreshFrame);
  initializationFrame = 0;
  refreshFrame = 0;
  parallaxMedia?.revert();
  parallaxMedia = null;

  if (parallaxImage.value) {
    gsap.set(parallaxImage.value, {
      clearProps: "transform,willChange",
    });
  }
};

const createParallax = async (generation: number) => {
  const hero = heroRoot.value;
  const image = parallaxImage.value;
  if (
    !mounted ||
    isRouteTransitioning() ||
    generation !== initializationGeneration ||
    !hero ||
    !image
  ) {
    return;
  }

  try {
    await image.decode();
  } catch {
    // A failed decode must not prevent the readable fallback hero from mounting.
  }

  if (
    !mounted ||
    isRouteTransitioning() ||
    generation !== initializationGeneration ||
    hero !== heroRoot.value ||
    image !== parallaxImage.value
  ) {
    return;
  }

  parallaxMedia = gsap.matchMedia();
  parallaxMedia.add(
    {
      desktop: "(min-width: 768px)",
      mobile: "(max-width: 767px)",
      reduceMotion: "(prefers-reduced-motion: reduce)",
    },
    (context) => {
      const { desktop, reduceMotion } = context.conditions as {
        desktop: boolean;
        mobile: boolean;
        reduceMotion: boolean;
      };

      if (reduceMotion) {
        gsap.set(image, {
          yPercent: 0,
          scale: 1.08,
          willChange: "auto",
        });
        return;
      }

      gsap.fromTo(
        image,
        {
          yPercent: desktop ? -4 : -2,
          scale: desktop ? 1.18 : 1.12,
          willChange: "transform",
        },
        {
          yPercent: desktop ? 8 : 4,
          scale: desktop ? 1.18 : 1.12,
          ease: "none",
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    },
    hero,
  );

  refreshFrame = requestAnimationFrame(() => {
    refreshFrame = 0;
    if (mounted && generation === initializationGeneration) {
      ScrollTrigger.refresh();
    }
  });
};

const rebuildParallax = async () => {
  revertParallax();
  setStableParallaxStart();
  const generation = initializationGeneration;
  await nextTick();

  if (!mounted || generation !== initializationGeneration) return;

  initializationFrame = requestAnimationFrame(() => {
    initializationFrame = 0;
    void createParallax(generation);
  });
};

onMounted(() => {
  mounted = true;
  setStableParallaxStart();
  if (!isRouteTransitioning()) void rebuildParallax();
});

watch(
  () => transition?.isTransitioning.value ?? false,
  (isTransitioning) => {
    if (!mounted) return;
    if (isTransitioning) freezeParallax();
    else void rebuildParallax();
  },
  { flush: "sync" },
);

watch(
  () => props.service.slug,
  () => {
    if (!mounted) return;
    if (!isRouteTransitioning()) void rebuildParallax();
  },
  { flush: "post" },
);

onBeforeUnmount(() => {
  const preserveTransitionFrame = isRouteTransitioning();
  if (preserveTransitionFrame) freezeParallax();
  mounted = false;
  if (preserveTransitionFrame) {
    initializationGeneration += 1;
    cancelAnimationFrame(initializationFrame);
    cancelAnimationFrame(refreshFrame);
    return;
  }
  revertParallax();
});
</script>

<template>
  <header
    ref="heroRoot"
    data-detail-hero
    class="relative isolate h-[clamp(360px,44svh,440px)] overflow-hidden bg-white text-white sm:h-[clamp(380px,32svh,420px)] lg:h-[42svh] lg:max-h-[520px]"
  >
    <img
      ref="parallaxImage"
      data-parallax-image
      :src="service.image"
      alt=""
      loading="eager"
      fetchpriority="high"
      class="absolute inset-0 -z-20 h-full w-full scale-[1.18] object-cover"
    />
    <div
      aria-hidden="true"
      class="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(15,13,10,0.3)_0%,rgba(15,13,10,0.02)_38%,rgba(15,13,10,0.76)_100%)]"
    />


    <div
      data-detail-hero-content
      class="mx-auto flex h-full w-full max-w-8xl flex-col justify-end px-5 pb-6 pt-[76px] sm:px-8 sm:pt-[88px] md:px-12 md:pb-7 lg:px-16 lg:pt-[108px]"
    >
      <div
        data-detail-title-layout
        class="mt-auto grid items-end gap-5 pt-6 lg:grid-cols-12 lg:gap-8"
      >
        <div class="lg:col-span-10">
          <h1
            :id="`service-${service.slug}-title`"
            data-detail-heading
            tabindex="-1"
            class="text-h1 text-balance focus:outline-none"
          >
            <span data-detail-title-line class="block lg:whitespace-nowrap">{{ service.titleLine1 }}</span>
          </h1>
          <p
            class="mt-3 w-full text-body text-white/90 sm:mt-4 lg:max-w-5xl"
          >
            {{ service.summary }}
          </p>
        </div>

        <!--
          用共用的 HeroCTA，跟首頁 Hero、導覽列、Contact 是同一顆按鈕。
          原本這裡是手抄一份 HeroCTA 的箭頭 markup，連 ref="arrowCurrentRef"
          都照抄了 —— 但這支元件的 script 根本沒有那兩個 ref，等於兩張
          SVG 疊著、沒有任何動畫在跑。
        -->
        <HeroCTA
          text="預約諮詢"
          :href="consultationHref(service.slug)"
          variant="solid"
          bg-color="#ffffff"
          text-color="#1c1b17"
          radius="4px"
          data-detail-hero-cta
          class="w-fit lg:col-span-2 lg:justify-self-end"
          @click="openConsultation($event, service.slug)"
        />
      </div>
    </div>
  </header>
</template>
