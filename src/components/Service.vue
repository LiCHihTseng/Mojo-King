<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroCTA from "../components/Hero/HeroCTA.vue";
import About_img from "../assets/About_img1.png";

gsap.registerPlugin(ScrollTrigger);

interface CardData {
  tag: string;
  titleLine1: string;
  titleLine2: string;
  body: string;
  visualBg: string;
  image: string;
}

interface Props {
  cards?: CardData[];
  backgroundImage?: string;
  introLead?: string;
  introMiddle?: string;
  introEnd?: string;
}

withDefaults(defineProps<Props>(), {
  backgroundImage:
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2000&auto=format&fit=crop",
  introLead: "人才",
  introMiddle: "有策略。",
  introEnd: "組織有未來。",
  cards: () => [
    {
      tag: "組織設計",
      titleLine1: "制度清楚透明，",
      titleLine2: "員工才願意留下來。",
      body: "從薪酬結構到工作規則，協助你把人事制度從零到一建立起來，不再依賴個人經驗運作。",
      visualBg: "#F9F8F6",
      image: About_img,
    },
    {
      tag: "招募策略",
      titleLine1: "解決的不是沒人投履歷，",
      titleLine2: "而是找不到對的人。",
      body: "重新定位職缺、設計面試流程，讓面試官不再各自為政，錄取的人也真的留得下來。",
      visualBg: "#F9F8F6",
      image: "https://picsum.photos/seed/svc-2/720/560",
    },
    {
      tag: "主管培力",
      titleLine1: "讓主管不只會做事，",
      titleLine2: "更懂得帶人。",
      body: "透過一對一教練與績效面談訓練，讓主管真的敢開口談期望、給回饋。",
      visualBg: "#F9F8F6",
      image: "https://picsum.photos/seed/svc-3/720/560",
    },
    {
      tag: "法遵風險",
      titleLine1: "在問題發生前，",
      titleLine2: "先把地雷排掉。",
      body: "勞動法規健檢、資遣與爭議處理陪跑，讓你做每個決定時，心裡都有底。",
      visualBg: "#F9F8F6",
      image: "https://picsum.photos/seed/svc-4/720/560",
    },
  ],
});

const sectionRef = ref<HTMLElement | null>(null);
const cardRefs = ref<HTMLElement[]>([]);
const introLayerRef = ref<HTMLElement | null>(null);
const introImageRef = ref<HTMLElement | null>(null);
const introLeftRef = ref<HTMLElement | null>(null);
const introRightRef = ref<HTMLElement | null>(null);

const setCardRef = (el: Element | null, index: number) => {
  if (el instanceof HTMLElement) {
    cardRefs.value[index] = el;
  }
};

let serviceMedia: gsap.MatchMedia | null = null;

const INTRO_HOLD_DURATION = 0.28;
const INTRO_EXPAND_DURATION = 2.4;
const INTRO_FULL_HOLD_DURATION = 0.4;
const DESKTOP_CARD_HOLD_DURATION = 0.35;
const BASE_CARD_HOLD_DURATION = 0.5;
const MOVE_DURATION = 1;
const DESKTOP_SCROLL_DISTANCE_FACTOR = 0.56;
const BASE_SCROLL_DISTANCE_FACTOR = 0.9;

onMounted(async () => {
  await nextTick();

  const section = sectionRef.value;
  const introLayer = introLayerRef.value;
  const introImage = introImageRef.value;
  const introLeft = introLeftRef.value;
  const introRight = introRightRef.value;
  const cards = cardRefs.value;
  const total = cards.length;

  if (
    !section ||
    !introLayer ||
    !introImage ||
    !introLeft ||
    !introRight ||
    total === 0
  ) {
    return;
  }

  serviceMedia = gsap.matchMedia();
  serviceMedia.add(
    {
      introEnabled:
        "(min-width: 1200px) and (hover: hover) and (pointer: fine)",
      reduceMotion: "(prefers-reduced-motion: reduce)",
    },
    (mediaContext) => {
      const { introEnabled, reduceMotion } = mediaContext.conditions as {
        introEnabled: boolean;
        reduceMotion: boolean;
      };

      cards.forEach((card, index) => {
        gsap.set(card, {
          y:
            reduceMotion && index === 0
              ? "0vh"
              : introEnabled
                ? "105vh"
                : "100vh",
          scale: index === 0 ? 1 : introEnabled ? 1.08 : 1.1,
          rotation: 0,
          zIndex: index + 1,
        });
      });

      if (reduceMotion) {
        section.style.height = "100svh";
        gsap.set(introLayer, { display: "none" });
        return () => section.style.removeProperty("height");
      }

      const introUnits = introEnabled
        ? INTRO_HOLD_DURATION +
          INTRO_EXPAND_DURATION +
          INTRO_FULL_HOLD_DURATION
        : 0;
      const cardHoldDuration = introEnabled
        ? DESKTOP_CARD_HOLD_DURATION
        : BASE_CARD_HOLD_DURATION;
      const scrollDistanceFactor = introEnabled
        ? DESKTOP_SCROLL_DISTANCE_FACTOR
        : BASE_SCROLL_DISTANCE_FACTOR;
      const totalUnits =
        introUnits +
        total * cardHoldDuration +
        total * MOVE_DURATION;

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
          force3D: true,
        });
      } else {
        gsap.set(introLayer, { display: "none" });
      }

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          id: "service-story",
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: introEnabled ? 0.85 : 1.2,
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
          .to({}, { duration: INTRO_FULL_HOLD_DURATION })
          .addLabel("featureCards");
      } else {
        timeline.addLabel("featureCards");
      }

      timeline
        .to({}, { duration: cardHoldDuration })
        .to(cards[0], { y: "0vh", duration: MOVE_DURATION });

      for (let index = 0; index < total; index += 1) {
        timeline.to({}, { duration: cardHoldDuration });

        if (index < total - 1) {
          timeline
            .to(cards[index], {
              scale: 0.94,
              rotation: 3,
              duration: MOVE_DURATION,
            })
            .to(
              cards[index + 1],
              {
                y: "0vh",
                scale: 1,
                duration: MOVE_DURATION,
              },
              "<",
            );
        }
      }

      return () => section.style.removeProperty("height");
    },
    section,
  );

  requestAnimationFrame(() => ScrollTrigger.refresh());
});

onBeforeUnmount(() => {
  serviceMedia?.revert();
  serviceMedia = null;
  sectionRef.value?.style.removeProperty("height");
});
</script>

<template>
  <section ref="sectionRef" class="relative isolate w-full bg-black">
    <div
      class="sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden bg-cover bg-center"
    >
      <div
        class="absolute inset-0 scale-[1.02] bg-cover bg-center"
        :style="{
          backgroundImage: `url(${backgroundImage})`,
          filter: 'saturate(0.8) contrast(0.9) brightness(0.85)',
        }"
      ></div>

      <div class="pointer-events-none absolute inset-0 bg-black/10"></div>
      <div class="noise-overlay pointer-events-none absolute inset-0"></div>

      <div
        ref="introLayerRef"
        class="service-intro pointer-events-none absolute inset-0 z-20 items-center justify-center overflow-hidden"
      >
        <h2 class="sr-only">專業人資顧問服務</h2>

        <div
          ref="introLeftRef"
          class="service-intro__copy service-intro__copy--left"
          aria-hidden="true"
        >
          <span class="service-intro__lead">{{ introLead }}</span><span>{{ introMiddle }}</span>
        </div>

        <div
          ref="introImageRef"
          class="service-intro__image absolute inset-0"
          aria-hidden="true"
        >
          <img
            :src="backgroundImage"
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
          {{ introEnd }}
        </div>
      </div>

      <div
        class="relative z-30 w-[94%]"
        style="height: clamp(480px, 62vw, 720px); max-width: clamp(900px, 78vw, 1600px)"
      >
        <div
          v-for="(card, index) in cards"
          :key="index"
          :ref="(el) => setCardRef(el as Element | null, index)"
          class="absolute inset-0 grid grid-cols-1 overflow-hidden rounded-2xl bg-[#F9F8F6] shadow-2xl sm:grid-cols-2"
          style="will-change: transform; backface-visibility: hidden"
        >
          <div
            class="flex flex-col justify-center bg-[#F9F8F6]"
            style="padding: clamp(2.5rem, 4vw, 4.5rem)"
          >
            <span
              class="mb-5 inline-flex w-fit items-center rounded-md bg-[#FF891D2E] px-3 py-1.5 text-xs font-medium text-[#FF891D] sm:text-sm"
              style="padding: clamp(0.4rem, 0.6vw, 0.6rem) clamp(1rem, 1.4vw, 1.5rem); font-size: clamp(0.85rem, 1vw, 1.05rem)"
            >
              {{ card.tag }}
            </span>

            <h3
              class="font-base font-medium leading-tight tracking-tight text-[#252525]"
              style="font-size: clamp(1.75rem, 3.2vw, 3.25rem)"
            >
              {{ card.titleLine1 }}
              <br />
              {{ card.titleLine2 }}
            </h3>

            <p
              class="mt-5 max-w-lg leading-7 text-[#252525]/60"
              style="font-size: clamp(0.95rem, 1.3vw, 1.375rem); line-height: 1.7"
            >
              {{ card.body }}
            </p>

            <div style="margin-top: clamp(1.5rem, 2.5vw, 2.5rem)">
              <HeroCTA text="了解服務" variant="ghost" text-color="#252525" />
            </div>
          </div>

          <div
            class="relative hidden items-center justify-center overflow-hidden sm:flex"
            :style="{
              backgroundColor: card.visualBg,
              padding: 'clamp(1.5rem, 3vw, 3.5rem)',
            }"
          >
            <div class="aspect-[4/3] max-h-full w-full overflow-hidden rounded-lg">
              <img
                :src="card.image"
                :alt="card.tag"
                class="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
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
  color: #FFFFFF;
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
  color: #FF891D;
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

.service-intro__image img {
  filter: saturate(0.8) contrast(0.9) brightness(0.85);
}

.noise-overlay {
  opacity: 0.16;
  mix-blend-mode: soft-light;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
}

@media (min-width: 1200px) and (hover: hover) and (pointer: fine) {
  .service-intro {
    display: flex;
  }
}
</style>
