<script setup lang="ts">
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import type { ServiceDefinition } from "../../data/services";
import { routeTransitionKey } from "../../lib/appShell";

gsap.registerPlugin(ScrollTrigger);

const props = defineProps<{ service: ServiceDefinition }>();

const router = useRouter();
const transition = inject(routeTransitionKey, null);
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

const returnToServices = () => {
  if (transition) {
    void transition.returnToServices();
    return;
  }

  void router.push("/#service");
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
      class="mx-auto flex h-full w-full max-w-8xl flex-col px-5 pb-6 pt-5 sm:px-8 md:px-12 md:pb-7 md:pt-6 lg:px-16"
    >
      <nav
        aria-label="服務詳情導覽"
        class="flex items-center justify-between border-b border-white/35 pb-4 text-eyebrow drop-shadow-md"
      >
        <span class="uppercase">
          MOJO KING
        </span>
        <button
          type="button"
          class="inline-flex items-center gap-3 py-2 text-white transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
          @click="returnToServices"
        >
          <span aria-hidden="true">←</span>
          返回服務
        </button>
      </nav>

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

        <a
          href="/#contact"
          data-detail-hero-cta
          class="group inline-flex w-fit items-center justify-between gap-8 border-b border-white pb-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-transparent md:text-base lg:col-span-2 lg:justify-self-end"
        >
          預約諮詢
          <span aria-hidden="true" class="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </a>
      </div>
    </div>
  </header>
</template>
