<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  eyebrow?: string;
  trustLabel?: string;
  description?: string;
  logos?: string[];
  statValue1?: string;
  statLabel1?: string;
  statValue2?: string;
  statLabel2?: string;
}

const props = withDefaults(defineProps<Props>(), {
  eyebrow: "關於慕玖",
  trustLabel: "深受企業主、主管與成長團隊信賴",
  description:
    "我是一位共享人資長，協助企業主與主管面對艱難的人才決策。我專注於真正理解你的組織困境，並提出直接可行、真正落地的策略。對我來說，成長不只是取得更多資訊，而是在對的時間，用對的方式，做出對的決定。",
  logos: () => ["Convergence", "Cubekit", "Europa", "Interlock", "Epicurious"],
  statValue1: "100+",
  statLabel1: "企業合作案例",
  statValue2: "150+",
  statLabel2: "一對一深度諮詢",
});

const words = props.description.split("");

/* ----------------------------------
   照片拼貼資料
   top/right：桌機絕對定位（inline style）
   baseRotate：預設的凌亂旋轉角度
   baseZ：預設堆疊順序
---------------------------------- */

interface ScatterPhoto {
  src: string;
  top: string;
  right: string;
  width: number;
  height: number;
  baseRotate: number;
  baseZ: number;
}

const scatterPhotos: ScatterPhoto[] = [
  {
    src: "https://picsum.photos/seed/mojo-1/500/360",

    top: "0px",
    right: "8%",
    width: 500,
    height: 300,
    baseRotate: -8,
    baseZ: 10,
  },
  {
    src: "https://picsum.photos/seed/mojo-2/500/360",

    top: "246px",
    right: "4%",
    width: 500,
    height: 300,
    baseRotate: 5,
    baseZ: 20,
  },
  {
    src: "https://picsum.photos/seed/mojo-3/500/360",

    top: "492px",
    right: "10%",
    width: 500,
    height: 300,
    baseRotate: -4,
    baseZ: 30,
  },
  {
    src: "https://picsum.photos/seed/mojo-4/500/360",

    top: "722px",
    right: "6%",
    width: 500,
    height: 300,
    baseRotate: 9,
    baseZ: 15,
  },
];
/* 每張照片進場前的「來源方向」，故意讓垂直起點各不相同，
   營造從右側四面八方匯聚而來的感覺（而非整齊一致地平移進場）。*/
const entranceOffsets = [
  { x: 700, y: -120 },
  { x: 820, y: 80 },
  { x: 750, y: -50 },
  { x: 880, y: 140 },
];
/* ----------------------------------
   Refs
---------------------------------- */

const sectionRef = ref<HTMLElement | null>(null);
const fillTextRef = ref<HTMLElement | null>(null);
const wordRefs = ref<HTMLElement[]>([]);
const scatterWrapRef = ref<HTMLElement | null>(null);
const photoRefs = ref<HTMLElement[]>([]);

const setPhotoRef = (el: Element | null, index: number) => {
  if (el instanceof HTMLElement) {
    photoRefs.value[index] = el;
  }
};

let gsapContext: gsap.Context | null = null;
let fillTween: gsap.core.Tween | null = null;
let prefersReducedMotion = false;


const parseStatValue = (value: string) => {
  const match = value.match(/^(\d+)(.*)$/);
  return {
    number: match ? parseInt(match[1], 10) : 0,
    suffix: match ? match[2] : "",
  };
};

const stat1Parsed = parseStatValue(props.statValue1);
const stat2Parsed = parseStatValue(props.statValue2);

const statDisplay1 = ref(0);
const statDisplay2 = ref(0);

const statsRef = ref<HTMLElement | null>(null);

const setupCountUp = () => {
  if (!statsRef.value) return;

  const counter1 = { value: 0 };
  const counter2 = { value: 0 };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: statsRef.value,
      start: "top 85%",
      once: true,
    },
  });

  tl.to(
    counter1,
    {
      value: stat1Parsed.number,
      duration: 0.8,
      ease: "power2.out",
      onUpdate: () => {
        statDisplay1.value = Math.round(counter1.value);
      },
    },
    0,
  ).to(
    counter2,
    {
      value: stat2Parsed.number,
      duration: 0.8,
      ease: "power2.out",
      onUpdate: () => {
        statDisplay2.value = Math.round(counter2.value);
      },
    },
    0.15, // 第二個數字稍微延遲開始，避免兩個一模一樣的節奏顯得死板
  );
};

/* ----------------------------------
   文字逐字填色
---------------------------------- */

const setupCharByCharFill = () => {
  if (!fillTextRef.value || wordRefs.value.length === 0) return;

  fillTween?.scrollTrigger?.kill();
  fillTween?.kill();

  fillTween = gsap.to(wordRefs.value, {
    opacity: 1,
    duration: 1,
    stagger: 1,
    ease: "none",
    scrollTrigger: {
      trigger: fillTextRef.value,
      start: "top 75%",
      end: "bottom 35%",
      scrub: 0.6,
    },
  });
};

/* ----------------------------------
   照片拼貼：進場動畫（從右側各方向飛入）
---------------------------------- */

const setupScatterEntrance = () => {
  if (!scatterWrapRef.value || photoRefs.value.length === 0) return;

  photoRefs.value.forEach((el, i) => {
    const photo = scatterPhotos[i];
    const offset = entranceOffsets[i] ?? { x: 400, y: 0 };

    gsap.set(el, {
      x: offset.x,
      y: offset.y,
      rotate: photo.baseRotate + (i % 2 === 0 ? 50 : -50),
      opacity: 0,
      scale: 0.9,
    });
  });

  gsap.to(photoRefs.value, {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
    rotate: (i: number) => scatterPhotos[i].baseRotate,
    duration: 1.1,
    stagger: 0.15,
    ease: "power3.out",
    scrollTrigger: {
      trigger: scatterWrapRef.value,
      start: "top 82%",
      once: true,
    },
  });
};

/* ----------------------------------
   照片拼貼：Hover 轉正 + 推開鄰居
---------------------------------- */

const PUSH_AMOUNT = 65;

const handlePhotoEnter = (index: number) => {
  if (prefersReducedMotion) return;

  photoRefs.value.forEach((el, i) => {
    if (i === index) {
      gsap.to(el, {
        rotate: 0,
        scale: 1.1,
        zIndex: 50,
        boxShadow: "0 24px 55px -12px rgba(0,0,0,0.4)",
        duration: 0.5,
        ease: "power3.out",
        overwrite: "auto",
      });
      return;
    }

    const diff = i - index;
    const dir = diff === 0 ? 0 : diff / Math.abs(diff);

    gsap.to(el, {
      x: dir * PUSH_AMOUNT,
      y: dir * (PUSH_AMOUNT * 1.4),
      scale: 0.92,
      duration: 0.5,
      ease: "power3.out",
      overwrite: "auto",
    });
  });
};

const handlePhotoLeave = () => {
  photoRefs.value.forEach((el, i) => {
    const photo = scatterPhotos[i];

    gsap.to(el, {
      x: 0,
      y: 0,
      rotate: photo.baseRotate,
      scale: 1,
      zIndex: photo.baseZ,
      boxShadow: "0 8px 24px -8px rgba(0,0,0,0.2)",
      duration: 0.45,
      ease: "power3.out",
      overwrite: "auto",
    });
  });
};

/* ----------------------------------
   Lifecycle
---------------------------------- */

onMounted(async () => {
  await nextTick();

  prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  gsapContext = gsap.context(() => {
    setupCharByCharFill();

    if (!prefersReducedMotion) {
      setupScatterEntrance();
      setupCountUp();
    } else {
      photoRefs.value.forEach((el, i) => {
        gsap.set(el, { x: 0, y: 0, opacity: 1, rotate: scatterPhotos[i].baseRotate, scale: 1 });
      });
      // 減少動態效果時，直接顯示最終數字，不做計數動畫
      statDisplay1.value = stat1Parsed.number;
      statDisplay2.value = stat2Parsed.number;
    }
  }, sectionRef.value ?? undefined);

  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });
});

onBeforeUnmount(() => {
  fillTween?.scrollTrigger?.kill();
  fillTween?.kill();
  gsapContext?.revert();
});
</script>

<template>
  <section ref="sectionRef" class="min-h-screen w-full bg-white py-20 sm:py-28">
    <div class="flex flex-col gap-20 md:gap-40 justify-between">


      <!-- 文字段落 + 照片拼貼：桌機兩欄，手機單欄 -->
      <div class="mx-auto max-w-[2000px] px-6">
        <div class="grid gap-16 lg:grid-cols-2 lg:items-center lg:gap-10">
          <!-- 左：填色文字 + 數據 -->
          <div>
            <p ref="fillTextRef" class="text-2xl font-medium leading-relaxed sm:text-4xl sm:leading-[1.7]">
              <span v-for="(char, index) in words" :key="index"
                :ref="(el) => { if (el) wordRefs[index] = el as HTMLElement }" class="text-[#5A5A5A] opacity-30"
                style="display: inline-block; white-space: pre;">{{ char }}</span>
            </p>

            <div ref="statsRef" class="mt-14 flex items-center justify-start gap-8 sm:gap-12">
              <div class="flex flex-wrap items-center justify-center gap-2 text-left">
                <p class="text-4xl font-bold tracking-wide text-[#1a1a1a] sm:text-5xl">
                  {{ statDisplay1 }}{{ stat1Parsed.suffix }}
                </p>
                <p class="mt-1 text-xl font-medium tracking-wide text-[#5A5A5A]">{{ statLabel1 }}</p>
              </div>

              <div class="h-12 w-px bg-gray-200"></div>

              <div class="flex flex-wrap items-center justify-center gap-2 text-left">
                <p class="text-4xl font-bold tracking-wide text-[#1a1a1a] sm:text-5xl">
                  {{ statDisplay2 }}{{ stat2Parsed.suffix }}
                </p>
                <p class="mt-1 text-xl font-medium tracking-wide text-[#5A5A5A]">{{ statLabel2 }}</p>
              </div>
            </div>
          </div>

          <!-- 右：凌亂拼貼照片（僅桌機顯示） -->
          <div ref="scatterWrapRef" class="relative hidden h-[1024px] lg:block">
            <div v-for="(photo, index) in scatterPhotos" :key="index"
              :ref="(el) => setPhotoRef(el as Element | null, index)"
              class="absolute cursor-pointer overflow-hidden rounded-2xl shadow-[0_8px_24px_-8px_rgba(0,0,0,0.2)]" :style="{
                top: photo.top,
                right: photo.right,
                width: `${photo.width}px`,
                height: `${photo.height}px`,
              }" @mouseenter="handlePhotoEnter(index)" @mouseleave="handlePhotoLeave">
              <img :src="photo.src" alt="" class="h-full w-full select-none object-cover" draggable="false"
                loading="lazy" />
            </div>
          </div>

          <!-- 手機/平板 fallback：一般 grid -->
          <div class="grid grid-cols-4 gap-4 lg:hidden">
            <div v-for="(photo, index) in scatterPhotos" :key="`mobile-${index}`"
              class="aspect-square overflow-hidden rounded-xl">
              <img :src="photo.src" alt="" class="h-full w-full object-cover" loading="lazy" />
            </div>
          </div>
        </div>
      </div>

      <!-- Trusted by + Marquee -->
      <div class="mt-8 lg:mt-16">
        <p class="mb-10 text-center text-lg font-base tracking-wide text-gray">
          {{ trustLabel }}
        </p>

        <div class="relative mx-auto max-w-[2000px] overflow-hidden">
          <div class="pointer-events-none absolute inset-y-0 left-0 z-20 w-48 bg-gradient-to-r from-white to-transparent">
          </div>
          <div
            class="pointer-events-none absolute inset-y-0 right-0 z-20 w-48 bg-gradient-to-l from-white to-transparent">
          </div>

          <div class="marquee-wrapper flex justify-center">
            <div class="marquee-track flex w-max items-center gap-24">
              <div v-for="(logo, index) in [...logos, ...logos]" :key="index"
                class="logo shrink-0 whitespace-nowrap text-2xl font-semibold text-gray-400 transition-colors duration-300 hover:text-[#BF5500]">
                {{ logo }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


  </section>
</template>

<style scoped>
.marquee-track {
  animation: marquee 22s linear infinite;
}

@keyframes marquee {
  0% {
    transform: translateX(12%);
  }

  100% {
    transform: translateX(calc(-50% + 12%));
  }
}

@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none;
  }
}
</style>