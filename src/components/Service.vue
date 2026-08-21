<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRouter } from "vue-router";
import HeroCTA from "../components/Hero/HeroCTA.vue";
import { getServiceHref, services, type ServiceSlug } from "../data/services";
import { routeTransitionKey } from "../lib/appShell";
import {
  createServiceAccessibilityPlan,
  createServiceMotionPlan,
  resolveServiceMotionMode,
} from "./serviceMotion";

gsap.registerPlugin(ScrollTrigger);

interface CardData {
  slug: ServiceSlug;
  tag: string;
  titleLine1: string;
  titleLine2: string;
  summary: string;
  image: string;
}

interface Props {
  cards?: CardData[];
  backgroundImage?: string;
  introLead?: string;
  introMiddle?: string;
  introEnd?: string;
}

const props = withDefaults(defineProps<Props>(), {
  backgroundImage:
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2000&auto=format&fit=crop",
  introLead: "人才",
  introMiddle: "有策略。",
  introEnd: "組織有未來。",
  cards: () => services,
});

const firstCard = computed(() => props.cards[0] ?? null);
const router = useRouter();
const routeTransition = inject(routeTransitionKey, null);

const sectionRef = ref<HTMLElement | null>(null);
const sceneRefs = ref<HTMLElement[]>([]);
const sceneCopyRefs = ref<HTMLElement[]>([]);
const introLayerRef = ref<HTMLElement | null>(null);
const introImageRef = ref<HTMLElement | null>(null);
const introLeftRef = ref<HTMLElement | null>(null);
const introRightRef = ref<HTMLElement | null>(null);
const firstIntroCopyRef = ref<HTMLElement | null>(null);

const setSceneRef = (el: Element | null, index: number) => {
  if (el instanceof HTMLElement) {
    sceneRefs.value[index] = el;
  }
};

const setSceneCopyRef = (el: Element | null, index: number) => {
  if (el instanceof HTMLElement) {
    sceneCopyRefs.value[index] = el;
  }
};

const isPrimaryNavigationClick = (event: MouseEvent) =>
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;

const handleServiceCtaClick = (event: MouseEvent, href: string) => {
  if (!isPrimaryNavigationClick(event)) return;

  event.preventDefault();
  void (routeTransition?.navigateToService(href) ?? router.push(href));
};

const preloadServiceHero = (source: string) => {
  routeTransition?.preloadImage(source);
};

let serviceMedia: gsap.MatchMedia | null = null;
let refreshFrameId: number | null = null;

const INTRO_HOLD_DURATION = 0.28;
const INTRO_EXPAND_DURATION = 2.4;
const INTRO_COPY_FADE_DURATION = 0.36;
const INTRO_FULL_HOLD_DURATION = 0.4;
const FIRST_SCENE_HOLD_DURATION = 0.55;
const SCENE_HOLD_DURATION = 0.48;
const SCENE_MOVE_DURATION = 1;
const SCENE_COPY_DURATION = 0.36;
const INTRO_SCROLL_DISTANCE_FACTOR = 0.62;
const BASE_SCROLL_DISTANCE_FACTOR = 0.84;

onMounted(async () => {
  await nextTick();

  const section = sectionRef.value;
  const introLayer = introLayerRef.value;
  const introImage = introImageRef.value;
  const introLeft = introLeftRef.value;
  const introRight = introRightRef.value;
  const firstIntroCopy = firstIntroCopyRef.value;
  const scenes = sceneRefs.value;
  const sceneCopies = sceneCopyRefs.value;

  if (
    !section ||
    !introLayer ||
    !introImage ||
    !introLeft ||
    !introRight ||
    !firstIntroCopy ||
    scenes.length === 0 ||
    sceneCopies.length !== scenes.length
  ) {
    return;
  }

  section.classList.add("service-story--ready");

  const setInteractive = (element: HTMLElement, interactive: boolean) => {
    element.toggleAttribute("inert", !interactive);
    if (interactive) {
      element.removeAttribute("aria-hidden");
    } else {
      element.setAttribute("aria-hidden", "true");
    }
  };

  const applyAccessibility = (
    mode: "desktop" | "mobile",
    activeSceneIndex: number | null = 0,
    hasIntro = false,
  ) => {
    const plan = createServiceAccessibilityPlan(
      scenes.length,
      mode,
      hasIntro,
      activeSceneIndex,
    );

    setInteractive(firstIntroCopy, plan.introCopyInteractive);
    scenes.forEach((scene, index) => {
      setInteractive(scene, plan.sceneInteractive[index] ?? false);
    });
  };

  serviceMedia = gsap.matchMedia();
  serviceMedia.add(
    {
      isWideViewport: "(min-width: 768px)",
      canHover: "(hover: hover)",
      hasFinePointer: "(pointer: fine)",
      hasCoarsePointer: "(any-pointer: coarse)",
      introEnabled:
        "(min-width: 1200px) and (hover: hover) and (pointer: fine)",
      reduceMotion: "(prefers-reduced-motion: reduce)",
    },
    (mediaContext) => {
      const {
        isWideViewport,
        canHover,
        hasFinePointer,
        hasCoarsePointer,
        introEnabled,
        reduceMotion,
      } =
        mediaContext.conditions as {
          isWideViewport: boolean;
          canHover: boolean;
          hasFinePointer: boolean;
          hasCoarsePointer: boolean;
          introEnabled: boolean;
          reduceMotion: boolean;
        };
      const motionMode = resolveServiceMotionMode({
        isWideViewport,
        canHover,
        hasFinePointer,
        hasCoarsePointer,
      });
      const useDesktopStory = motionMode === "desktop" && !reduceMotion;
      const motionPlan = createServiceMotionPlan(
        scenes.length,
        useDesktopStory ? "desktop" : "mobile",
        useDesktopStory && introEnabled,
      );

      section.classList.toggle("service-story--static", !motionPlan.pin);
      section.style.removeProperty("height");

      scenes.forEach((scene, index) => {
        gsap.set(scene, {
          yPercent: motionPlan.initialYPercent[index],
          zIndex: index === 0 ? 30 : 40 + index,
        });
      });
      gsap.set(sceneCopies, { autoAlpha: 1, y: 0 });
      motionPlan.incomingSceneIndexes.forEach((sceneIndex) => {
        const copy = sceneCopies[sceneIndex];
        if (copy) gsap.set(copy, { autoAlpha: 0, y: 20 });
      });
      gsap.set(firstIntroCopy, {
        autoAlpha: motionPlan.firstSceneCopyStartsVisible ? 1 : 0,
        y: motionPlan.firstSceneCopyStartsVisible ? 0 : 20,
      });

      if (!motionPlan.pin) {
        applyAccessibility("mobile");
        gsap.set(introLayer, { display: "none" });

        return () => {
          applyAccessibility("mobile");
          section.classList.remove("service-story--static");
          section.style.removeProperty("height");
        };
      }

      applyAccessibility("desktop", 0, introEnabled);

      const introUnits = introEnabled
        ? INTRO_HOLD_DURATION +
          INTRO_EXPAND_DURATION +
          INTRO_FULL_HOLD_DURATION
        : 0;
      const totalUnits =
        introUnits +
        FIRST_SCENE_HOLD_DURATION +
        motionPlan.incomingSceneIndexes.length *
          (SCENE_MOVE_DURATION + SCENE_COPY_DURATION + SCENE_HOLD_DURATION);
      const scrollDistanceFactor = introEnabled
        ? INTRO_SCROLL_DISTANCE_FACTOR
        : BASE_SCROLL_DISTANCE_FACTOR;

      const syncTrackHeight = () => {
        const scrollDistance =
          window.innerHeight * totalUnits * scrollDistanceFactor;
        section.style.height =
          `${Math.round(window.innerHeight + scrollDistance)}px`;
      };

      syncTrackHeight();

      if (introEnabled) {
        gsap.set(introLayer, { display: "flex", autoAlpha: 1 });
        gsap.set([introLeft, introRight], { x: 0, autoAlpha: 1 });
        gsap.set(introImage, {
          autoAlpha: 1,
          scale: 0,
          transformOrigin: "50% 50%",
        });
      } else {
        gsap.set(introLayer, { display: "none" });
      }

      const introCopyFade = introEnabled
        ? gsap.to(firstIntroCopy, {
            autoAlpha: 1,
            y: 0,
            duration: INTRO_COPY_FADE_DURATION,
            ease: "power2.out",
            paused: true,
          })
        : null;

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          id: "service-story",
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: introEnabled ? 0.85 : 1,
          invalidateOnRefresh: true,
          refreshPriority: -10,
          onRefreshInit: syncTrackHeight,
        },
      });

      if (introEnabled) {
        timeline
          .addLabel("intro")
          .to({}, { duration: INTRO_HOLD_DURATION })
          .addLabel("imageExpand")
          .to(introImage, {
            scale: 1.04,
            duration: INTRO_EXPAND_DURATION,
          })
          .to(
            introLeft,
            {
              x: () => -window.innerWidth * 0.62,
              duration: INTRO_EXPAND_DURATION * 0.86,
            },
            "imageExpand",
          )
          .to(
            introRight,
            {
              x: () => window.innerWidth * 0.62,
              duration: INTRO_EXPAND_DURATION * 0.86,
            },
            "imageExpand",
          )
          .to(
            [introLeft, introRight],
            {
              autoAlpha: 0,
              duration: INTRO_EXPAND_DURATION * 0.42,
            },
            "imageExpand+=0.82",
          )
          .addLabel("imageFull")
          .call(() => {
            const direction = timeline.scrollTrigger?.direction ?? 1;
            if (direction >= 0) {
              introCopyFade?.play();
            } else {
              introCopyFade?.reverse();
            }
          }, undefined, "imageFull")
          .to({}, { duration: INTRO_FULL_HOLD_DURATION }, "imageFull")
          .addLabel("serviceScenes");
      } else {
        timeline.addLabel("serviceScenes");
      }

      timeline.to({}, { duration: FIRST_SCENE_HOLD_DURATION });

      motionPlan.incomingSceneIndexes.forEach((sceneIndex) => {
        const scene = scenes[sceneIndex];
        const copy = sceneCopies[sceneIndex];
        if (!scene || !copy) return;

        timeline
          .to(scene, {
            yPercent: 0,
            duration: SCENE_MOVE_DURATION,
            onComplete: () => {
              applyAccessibility("desktop", null, introEnabled);
            },
            onReverseComplete: () => {
              applyAccessibility("desktop", sceneIndex - 1, introEnabled);
            },
          })
          .to(copy, {
            autoAlpha: 1,
            y: 0,
            duration: SCENE_COPY_DURATION,
            ease: "power2.out",
            onComplete: () => {
              applyAccessibility("desktop", sceneIndex, introEnabled);
            },
            onReverseComplete: () => {
              applyAccessibility("desktop", null, introEnabled);
            },
          })
          .to({}, { duration: SCENE_HOLD_DURATION });
      });

      return () => {
        introCopyFade?.kill();
        applyAccessibility("mobile");
        section.classList.remove("service-story--static");
        section.style.removeProperty("height");
      };
    },
    section,
  );

  refreshFrameId = requestAnimationFrame(() => {
    refreshFrameId = null;
    ScrollTrigger.refresh();
  });
});

onBeforeUnmount(() => {
  if (refreshFrameId !== null) {
    cancelAnimationFrame(refreshFrameId);
    refreshFrameId = null;
  }
  serviceMedia?.revert();
  serviceMedia = null;
  sectionRef.value?.classList.remove("service-story--ready");
  sectionRef.value?.classList.remove("service-story--static");
  sectionRef.value?.style.removeProperty("height");
});
</script>

<template>
  <section
    ref="sectionRef"
    class="service-story relative isolate w-full bg-[#11110f]"
    aria-labelledby="service-section-title"
  >
    <h2 id="service-section-title" class="sr-only">專業人資顧問服務</h2>

    <div class="service-stage relative w-full overflow-hidden md:sticky md:top-0 md:h-[100svh]">
      <div
        ref="introLayerRef"
        class="service-intro pointer-events-none absolute inset-0 z-40 items-center justify-center overflow-hidden"
      >
        <div
          ref="introLeftRef"
          class="service-intro__copy service-intro__copy--left"
          aria-hidden="true"
        >
          <span class="service-intro__lead">{{ props.introLead }}</span><span>{{ props.introMiddle }}</span>
        </div>

        <div
          ref="introImageRef"
          class="service-intro__image absolute inset-0"
          aria-hidden="true"
        >
          <img
            :src="props.backgroundImage"
            alt=""
            class="h-full w-full object-cover"
            fetchpriority="high"
          />
        </div>

        <div
          ref="introRightRef"
          class="service-intro__copy service-intro__copy--right"
          aria-hidden="true"
        >
          {{ props.introEnd }}
        </div>

        <div
          v-if="firstCard"
          ref="firstIntroCopyRef"
          class="service-intro__scene-copy absolute inset-0 z-30 flex items-center px-6 py-16 sm:px-10 md:px-[clamp(3rem,7vw,8.5rem)]"
          aria-hidden="true"
          inert
        >
          <div class="service-copy-grid mx-auto grid w-full max-w-[90rem] items-center gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.7fr)] md:gap-[clamp(4rem,10vw,12rem)]">
            <div>
              <div class="mb-5 flex items-center gap-3 text-sm font-medium tracking-[0.16em] text-[#ff9a3d] md:mb-7 md:text-base">
                <span aria-hidden="true" class="h-px w-9 bg-current"></span>
                <span>{{ firstCard.tag }}</span>
              </div>

              <h3 class="max-w-[15ch] text-balance text-[clamp(2.15rem,8.4vw,4.5rem)] font-semibold leading-[1.08] tracking-[-0.055em] text-white md:text-[clamp(3rem,5.2vw,6rem)]">
                {{ firstCard.titleLine1 }}<br />{{ firstCard.titleLine2 }}
              </h3>
            </div>

            <div class="md:pt-14">
              <p class="max-w-[34rem] text-pretty text-[clamp(1rem,2.4vw,1.25rem)] leading-[1.75] text-white md:text-[clamp(1rem,1.3vw,1.3rem)]">
                {{ firstCard.summary }}
              </p>

              <div class="mt-7 md:mt-9">
                <HeroCTA
                  text="了解服務"
                  :href="getServiceHref(firstCard.slug)"
                  variant="ghost"
                  text-color="#ffffff"
                  @click="handleServiceCtaClick($event, getServiceHref(firstCard.slug))"
                  @focus="preloadServiceHero(props.backgroundImage)"
                  @pointerenter="preloadServiceHero(props.backgroundImage)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="service-scenes relative flex w-full flex-col md:absolute md:inset-0 md:block">
        <article
          v-for="(card, index) in props.cards"
          :key="`${card.tag}-${index}`"
          :ref="(el) => setSceneRef(el as Element | null, index)"
          class="service-scene relative isolate flex min-h-[100svh] w-full items-center overflow-hidden md:absolute md:inset-0 md:min-h-0"
          :aria-labelledby="`service-scene-title-${index}`"
        >
          <img
            :src="index === 0 ? props.backgroundImage : card.image"
            alt=""
            class="service-scene__image absolute inset-0 h-full w-full object-cover"
            :loading="index === 0 ? 'eager' : 'lazy'"
          />

          <div
            :ref="(el) => setSceneCopyRef(el as Element | null, index)"
            class="service-scene__content relative z-10 w-full px-6 py-16 sm:px-10 md:px-[clamp(3rem,7vw,8.5rem)]"
          >
            <div class="service-copy-grid mx-auto grid w-full max-w-[90rem] items-center gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.7fr)] md:gap-[clamp(4rem,10vw,12rem)]">
              <div>
                <div class="mb-5 flex items-center gap-3 text-sm font-medium tracking-[0.16em] text-[#ff9a3d] md:mb-7 md:text-base">
                  <span aria-hidden="true" class="h-px w-9 bg-current"></span>
                  <span>{{ card.tag }}</span>
                </div>

                <h3
                  :id="`service-scene-title-${index}`"
                  class="max-w-[15ch] text-balance text-[clamp(2.15rem,8.4vw,4.5rem)] font-semibold leading-[1.08] tracking-[-0.055em] text-white md:text-[clamp(3rem,5.2vw,6rem)]"
                >
                  {{ card.titleLine1 }}<br />{{ card.titleLine2 }}
                </h3>
              </div>

              <div class="md:pt-14">
                <p class="max-w-[34rem] text-pretty text-[clamp(1rem,2.4vw,1.25rem)] leading-[1.75] text-white md:text-[clamp(1rem,1.3vw,1.3rem)]">
                  {{ card.summary }}
                </p>

                <div class="mt-7 md:mt-9">
                  <HeroCTA
                    text="了解服務"
                    :href="getServiceHref(card.slug)"
                    variant="ghost"
                    text-color="#ffffff"
                    @click="handleServiceCtaClick($event, getServiceHref(card.slug))"
                    @focus="preloadServiceHero(index === 0 ? props.backgroundImage : card.image)"
                    @pointerenter="preloadServiceHero(index === 0 ? props.backgroundImage : card.image)"
                  />
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.service-intro {
  display: none;
  background: #252525;
  isolation: isolate;
}

.service-intro__copy {
  position: absolute;
  top: 50%;
  z-index: 1;
  color: #ffffff;
  font-size: clamp(2.5rem, 4.15vw, 5rem);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.075em;
  white-space: nowrap;
  transform: translateY(-50%);
  will-change: transform, opacity;
}

.service-intro__copy--left {
  right: calc(50% + clamp(0.18rem, 0.4vw, 0.5rem));
  text-align: right;
}

.service-intro__copy--right {
  left: calc(50% + clamp(0.18rem, 0.4vw, 0.5rem));
}

.service-intro__lead {
  display: inline-block;
  color: #ff891d;
  font-size: 1.08em;
  font-weight: 500;
  letter-spacing: 0.08em;
  transform: skewX(-20deg);
}

.service-intro__image {
  z-index: 2;
  overflow: hidden;
  backface-visibility: hidden;
  will-change: transform, opacity;
}

.service-intro__scene-copy {
  pointer-events: auto;
  will-change: opacity;
}

.service-intro__image img,
.service-scene__image {
  filter: saturate(0.8) contrast(0.92) brightness(0.82);
}

.service-scene {
  backface-visibility: hidden;
}

.service-scene__image {
  transform: scale(1.015);
}

.service-copy-grid {
  text-shadow: 0 2px 24px rgb(0 0 0 / 42%);
}

@media (min-width: 768px) {
  .service-scene {
    will-change: transform;
  }

  .service-story:not(.service-story--ready) .service-scene:not(:first-child) {
    transform: translateY(100%);
  }
}

@media (min-width: 1200px) and (hover: hover) and (pointer: fine) {
  .service-intro {
    display: flex;
  }
}

.service-story--static .service-stage {
  height: auto;
  overflow: visible;
  position: relative;
}

.service-story--static .service-scenes {
  display: flex;
  position: relative;
  inset: auto;
  flex-direction: column;
}

.service-story--static .service-scene {
  position: relative;
  inset: auto;
  min-height: 100svh;
  transform: none;
  will-change: auto;
}
</style>
