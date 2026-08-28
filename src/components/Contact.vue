<script setup lang="ts">
/**
 * Contact.vue
 *
 * 版面：左邊大標題 + 一句邀請 + 聯絡人資訊，右邊圓形底的人像。
 *
 * 深色卡片是全站唯一的深色區塊，作為收尾把視線收住，也和 Footer 接得起來。
 *
 * 人像照是白底、人物偏畫面右側，所以：
 *   - object-position 往右取景，圓形裁切才會對到人
 *   - 白底被圓形裁切後，在深色卡片上直接讀成一個白色圓盤，
 *     不能用 mix-blend-multiply：在深色底上它會把人物本身也一起壓暗。
 */
import { inject, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroCTA from "./Hero/HeroCTA.vue";
import { routeTransitionKey } from "../lib/appShell";
import contactImg from "../assets/Contact.avif";

gsap.registerPlugin(ScrollTrigger);

const CONSULTATION_PATH = "/consultation";

interface Props {
  heading?: string;
  intro?: string;
  personName?: string;
  personRole?: string;
  email?: string;
  /** 顯示用的電話，例如 "+886 932 178 741" */
  phone?: string;
  /** 選填，留空就不顯示這一行 */
  linkedinUrl?: string;
  linkedinLabel?: string;
  ctaText?: string;
  image?: string;
  imageAlt?: string;
}

const props = withDefaults(defineProps<Props>(), {
  heading: "我們期待與你展開長期的合作",
  intro: "先聊聊也好，喝杯咖啡也可以。",
  personName: "郁婷",
  personRole: "慕玖執行長｜人資顧問",
  email: "services@mojo-king.com",
  phone: "+886 932 178 741",
  linkedinUrl: "",
  linkedinLabel: "Connect via LinkedIn",
  ctaText: "填寫表單",
  image: contactImg,
  imageAlt: "慕玖執行長郁婷",
});

/** tel: 連結不能有空格 */
const phoneHref = () => `tel:${props.phone.replace(/\s+/g, "")}`;

/* ----------------------------------
   「填寫表單」：走 App.vue 的覆蓋式轉場把 /consultation 由下往上推出來，
   跟 Service 卡片進入服務詳情頁是同一套（含 cmd/ctrl 點擊開新分頁）。
---------------------------------- */

const router = useRouter();
const routeTransition = inject(routeTransitionKey, null);

const isPrimaryNavigationClick = (event: MouseEvent) =>
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;

const handleConsultationClick = (event: MouseEvent) => {
  if (!isPrimaryNavigationClick(event)) return;

  event.preventDefault();
  void (
    routeTransition?.navigateToService(CONSULTATION_PATH) ??
    router.push(CONSULTATION_PATH)
  );
};

/* ----------------------------------
   Refs
---------------------------------- */

const sectionRef = ref<HTMLElement | null>(null);
const decorRef = ref<HTMLElement | null>(null);
const headingRef = ref<HTMLElement | null>(null);
const introRef = ref<HTMLElement | null>(null);
const detailsRef = ref<HTMLElement | null>(null);
const ctaRef = ref<HTMLElement | null>(null);
const imageWrapRef = ref<HTMLElement | null>(null);

let prefersReducedMotion = false;
let triggers: ScrollTrigger[] = [];

/* ----------------------------------
   通用：由下往上淡入（跟站上其他區塊同一套手感）
---------------------------------- */

const revealUp = (
  el: HTMLElement | null,
  options: { y?: number; delay?: number; start?: string } = {},
) => {
  if (!el) return;

  const { y = 32, delay = 0, start = "top 82%" } = options;

  gsap.set(el, { opacity: 0, y });

  triggers.push(
    ScrollTrigger.create({
      trigger: el,
      start,
      once: true,
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay,
          ease: "power3.out",
        });
      },
    }),
  );
};

/* ----------------------------------
   Lifecycle
---------------------------------- */

onMounted(async () => {
  await nextTick();

  prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion) return;

  revealUp(headingRef.value, { y: 36 });
  revealUp(introRef.value, { y: 28, delay: 0.08 });
  revealUp(detailsRef.value, { y: 28, delay: 0.14 });
  revealUp(ctaRef.value, { y: 20, delay: 0.2 });

  // 人像：圓形底淡入 + 照片輕微放大，比文字更有份量
  if (imageWrapRef.value) {
    const img = imageWrapRef.value.querySelector("img");
    gsap.set(imageWrapRef.value, { opacity: 0, scale: 0.94 });
    if (img) gsap.set(img, { scale: 1.06 });

    triggers.push(
      ScrollTrigger.create({
        trigger: imageWrapRef.value,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.to(imageWrapRef.value, {
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: "power3.out",
          });
          if (img) {
            gsap.to(img, { scale: 1, duration: 1.6, ease: "power2.out" });
          }
        },
      }),
    );
  }

  // 裝飾圓點：非常輕微的視差
  if (decorRef.value && sectionRef.value) {
    const decorTween = gsap.to(decorRef.value, {
      yPercent: -30,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.value,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    if (decorTween.scrollTrigger) triggers.push(decorTween.scrollTrigger);
  }

  requestAnimationFrame(() => ScrollTrigger.refresh());
});

onBeforeUnmount(() => {
  triggers.forEach((t) => t.kill());
  triggers = [];

  [
    decorRef.value,
    headingRef.value,
    introRef.value,
    detailsRef.value,
    ctaRef.value,
    imageWrapRef.value,
  ].forEach((el) => el && gsap.killTweensOf(el));
});
</script>

<template>
  <section
    ref="sectionRef"
    class="flex min-h-screen w-full items-center bg-white px-5 py-12 sm:px-8 lg:px-10 lg:py-16"
  >
    <div
      class="mx-auto flex w-full max-w-[1600px] flex-col-reverse gap-8 rounded-[2rem] bg-[#252525] px-6 py-14 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.45)] sm:px-10 sm:py-16 lg:flex-row lg:items-center lg:gap-20 lg:px-20 lg:py-20"
    >
      <!-- 左：標題 + 邀請 + 聯絡資訊 -->
      <div class="lg:flex-1">
        <h2
          ref="headingRef"
          class="max-w-xl text-[clamp(1.875rem,3.4vw,3.25rem)] font-bold leading-[1.15] tracking-tight text-white"
        >
          {{ heading }}<span class="text-[#FF891D]">.</span>
        </h2>

        <p
          ref="introRef"
          class="mt-5 max-w-md text-base leading-relaxed text-white/60 sm:text-lg"
        >
          {{ intro }}
        </p>

        <div ref="detailsRef" class="mt-10 border-t border-white/10 pt-8">
          <p class="text-lg font-bold text-white">{{ personName }}</p>
          <p class="mt-1 text-white/55">{{ personRole }}</p>

          <div class="mt-6 flex flex-col gap-3 text-white/70">
            <a
              :href="`mailto:${email}`"
              class="flex w-fit items-center gap-3 transition-colors hover:text-[#FF891D]"
            >
              <svg viewBox="0 0 24 24" fill="none" class="h-[18px] w-[18px] shrink-0" aria-hidden="true">
                <rect x="2.75" y="5.25" width="18.5" height="13.5" rx="2" stroke="currentColor" stroke-width="1.65" />
                <path d="M3.5 7l8.5 6 8.5-6" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              {{ email }}
            </a>
            <a
              :href="phoneHref()"
              class="flex w-fit items-center gap-3 transition-colors hover:text-[#FF891D]"
            >
              <svg viewBox="0 0 24 24" fill="none" class="h-[18px] w-[18px] shrink-0" aria-hidden="true">
                <path
                  d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z"
                  stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"
                />
              </svg>
              {{ phone }}
            </a>
            <a
              v-if="linkedinUrl"
              :href="linkedinUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex w-fit items-center gap-3 transition-colors hover:text-[#FF891D]"
            >
              <svg viewBox="0 0 24 24" fill="none" class="h-[18px] w-[18px] shrink-0" aria-hidden="true">
                <circle cx="18" cy="5.5" r="2.5" stroke="currentColor" stroke-width="1.65" />
                <circle cx="6" cy="12" r="2.5" stroke="currentColor" stroke-width="1.65" />
                <circle cx="18" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.65" />
                <path d="M8.3 10.8 15.7 6.8M8.3 13.2l7.4 4" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" />
              </svg>
              {{ linkedinLabel }}
            </a>
          </div>
        </div>

        <div ref="ctaRef" class="mt-10">
          <HeroCTA
            :text="ctaText"
            :href="CONSULTATION_PATH"
            variant="solid" bg-color="#ffffff" radius="4px" text-color="#252525"
            @click="handleConsultationClick"
          />
        </div>
      </div>

      <!-- 右：人像。照片本身是白底，圓形裁切後邊緣直接就是白色，
           在深色卡片上會讀成一個乾淨的白色圓盤，不需要任何混色技巧。 -->
      <div class="relative flex shrink-0 justify-start lg:justify-end">
        <div
          ref="imageWrapRef"
          class="relative aspect-square w-24 overflow-hidden rounded-full sm:w-28 lg:w-[30rem]"
          style="will-change: transform, opacity;"
        >
          <img
            :src="image"
            :alt="imageAlt"
            class="h-full w-full object-cover object-[72%_center]"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </div>
  </section>
</template>
