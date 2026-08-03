<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroCTA from "../components/Hero/HeroCTA.vue";

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
}

withDefaults(defineProps<Props>(), {
  backgroundImage: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2000&auto=format&fit=crop",
  cards: () => [
    {
      tag: "組織設計",
      titleLine1: "制度清楚透明，",
      titleLine2: "員工才願意留下來。",
      body: "從薪酬結構到工作規則，協助你把人事制度從零到一建立起來，不再依賴個人經驗運作。",
      visualBg: "#F9F8F6",
      image: "https://picsum.photos/seed/svc-1/720/560",
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

const setCardRef = (el: Element | null, index: number) => {
  if (el instanceof HTMLElement) {
    cardRefs.value[index] = el;
  }
};

let pinTrigger: ScrollTrigger | null = null;
let prefersReducedMotion = false;

onMounted(async () => {
  await nextTick();

  prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const cards = cardRefs.value;
  const total = cards.length;

  if (total === 0 || !sectionRef.value) return;

  cards.forEach((card, i) => {
    gsap.set(card, {
      y: "100vh",
      scale: i === 0 ? 1 : 1.1,
      rotate: 0,
      zIndex: i + 1,
    });
  });

  if (prefersReducedMotion) {
    gsap.set(cards[0], { y: "0vh" });
    return;
  }

  const holdDur = 0.5;
  const moveDur = 1;
  const TILT_ANGLE = 3;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: sectionRef.value,
      start: "top top",
      end: () => {
        const totalUnits = total * holdDur + total * moveDur;
        return `+=${window.innerHeight * totalUnits * 0.9}`;
      },
      pin: true,
      scrub: 1.2,
      anticipatePin: 1,
    },
  });

  tl.to({}, { duration: holdDur });

  tl.to(cards[0], {
    y: "0vh",
    duration: moveDur,
    ease: "none",
  });

  for (let i = 0; i < total; i++) {
    tl.to({}, { duration: holdDur });

    if (i < total - 1) {
      const current = cards[i];
      const next = cards[i + 1];

      tl.to(
        current,
        {
          scale: 0.94,
          rotate: TILT_ANGLE,
          duration: moveDur,
          ease: "none",
        },
        ">",
      ).to(
        next,
        {
          y: "0vh",
          scale: 1,
          duration: moveDur,
          ease: "none",
        },
        "<",
      );
    }
  }

  pinTrigger = tl.scrollTrigger ?? null;

  requestAnimationFrame(() => ScrollTrigger.refresh());
});

onBeforeUnmount(() => {
  pinTrigger?.kill();
});
</script>

<template>
  <section ref="sectionRef"
    class="relative flex h-screen w-full items-center justify-center overflow-hidden bg-cover bg-center">

    <div class="absolute inset-0 scale-[1.02] bg-cover bg-center" :style="{
      backgroundImage: `url(${backgroundImage})`,
      filter: 'saturate(0.8) contrast(0.9) brightness(0.85)'
    }"></div>

    <!-- Dark overlay -->
    <div class="pointer-events-none absolute inset-0 bg-black/10"></div>

    <!-- Film Grain -->
    <div class="noise-overlay pointer-events-none absolute inset-0"></div>

    <div class="relative w-[94%]" style="height: clamp(480px, 62vw, 720px); max-width: clamp(900px, 78vw, 1600px);">
      <div v-for="(card, index) in cards" :key="index" :ref="(el) => setCardRef(el as Element | null, index)"
        class="absolute inset-0 grid grid-cols-1 overflow-hidden rounded-2xl bg-[#F9F8F6] shadow-2xl sm:grid-cols-2"
        style="will-change: transform; backface-visibility: hidden;">
        <!-- 左欄：深色底，文字資訊 -->
        <div class="flex flex-col justify-center bg-[#F9F8F6]" style="padding: clamp(2.5rem, 4vw, 4.5rem);">
          <span class="mb-5 inline-flex w-fit items-center rounded-sm  font-medium rounded-md bg-[#FF891D2E] px-3 py-1.5 text-xs font-medium text-[#FF891D] sm:text-sm"
            style="padding: clamp(0.4rem, 0.6vw, 0.6rem) clamp(1rem, 1.4vw, 1.5rem); font-size: clamp(0.85rem, 1vw, 1.05rem);">
            {{ card.tag }}
          </span>

          <h3 class="font-medium font-base leading-tight tracking-tight text-[#252525]"
            style="font-size: clamp(1.75rem, 3.2vw, 3.25rem);">
            {{ card.titleLine1 }}
            <br />
            {{ card.titleLine2 }}
          </h3>

          <p class="mt-5 max-w-lg leading-7 text-[#252525]/60"
            style="font-size: clamp(0.95rem, 1.3vw, 1.375rem); line-height: 1.7;">
            {{ card.body }}
          </p>

          <div style="margin-top: clamp(1.5rem, 2.5vw, 2.5rem);">
            <HeroCTA text="了解服務" variant="ghost" text-color="#252525"/>
          </div>
        </div>

        <!-- 右欄：真實圖片 -->
        <div class="relative hidden items-center justify-center overflow-hidden sm:flex" :style="{
          backgroundColor: card.visualBg,
          padding: 'clamp(1.5rem, 3vw, 3.5rem)'
        }">
          <div class="aspect-[4/3] w-full max-h-full overflow-hidden rounded-lg shadow-xl">
            <img :src="card.image" :alt="card.tag" class="h-full w-full object-cover" loading="lazy" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.noise-overlay {
  opacity: 0.16;
  mix-blend-mode: soft-light;

  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
}
</style>