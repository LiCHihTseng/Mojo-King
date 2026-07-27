<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import gsap from "gsap";
import HeroCTA from "../components/Hero/HeroCTA.vue";

interface Props {
  brandName?: string;
  aboutText?: string;
  contactText?: string;
  serviceText?: string;
  ctaText?: string;
}

withDefaults(defineProps<Props>(), {
  brandName: "慕玖",
  aboutText: "關於慕玖",
  contactText: "聯絡我們",
  serviceText: "服務內容",
  ctaText: "預約諮詢",
});

/* ----------------------------------
   Refs
---------------------------------- */

const rootRef = ref<HTMLElement | null>(null);
const brandRef = ref<HTMLElement | null>(null);
const centerLinksRef = ref<HTMLElement | null>(null);
const hamburgerRef = ref<HTMLElement | null>(null);
const lineTopRef = ref<HTMLElement | null>(null);
const lineMidRef = ref<HTMLElement | null>(null);
const lineBottomRef = ref<HTMLElement | null>(null);
const backdropRef = ref<HTMLElement | null>(null);
const drawerRef = ref<HTMLElement | null>(null);
const closeBtnRef = ref<HTMLElement | null>(null);

/* ----------------------------------
   State
---------------------------------- */

const isScrolled = ref(false);
const isCompactScreen = ref(false);
const isDrawerOpen = ref(false);
type NavLink = "about" | "service" | "contact";
const hoveredLink = ref<NavLink | null>(null);

let gsapContext: gsap.Context | null = null;
let animationFrameId: number | null = null;
let desktopMediaQuery: MediaQueryList | null = null;
let prefersReducedMotion = false;

const shouldShowHamburger = computed(
  () => isCompactScreen.value || isScrolled.value,
);

/* ----------------------------------
   Nav 連結 hover：文字下移 + 底下的點
---------------------------------- */

const handleLinkEnter = (key: NavLink, event: MouseEvent) => {
  if (prefersReducedMotion) return;

  hoveredLink.value = key;

  const link = event.currentTarget as HTMLElement;
  const group = link.querySelector(".nav-group");
  const dot = link.querySelector(".nav-dot");

  gsap.to(group, { y: 14, duration: 0.3, ease: "power3.out", overwrite: "auto" });
  gsap.to(dot, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)", overwrite: "auto" });
};

const handleLinkLeave = (event: MouseEvent) => {
  hoveredLink.value = null;

  const link = event.currentTarget as HTMLElement;
  const group = link.querySelector(".nav-group");
  const dot = link.querySelector(".nav-dot");

  gsap.to(group, { y: 0, duration: 0.3, ease: "power3.out", overwrite: "auto" });
  gsap.to(dot, { scale: 0, opacity: 0, duration: 0.25, ease: "power2.in", overwrite: "auto" });
};

/* ----------------------------------
   桌機連結 ↔ 漢堡 交叉淡入淡出
---------------------------------- */

const updateNavVisibility = (instant = false) => {
  if (!centerLinksRef.value || !hamburgerRef.value) return;

  const showHamburger = shouldShowHamburger.value;
  const duration = instant || prefersReducedMotion ? 0 : 0.35;

  gsap.to(centerLinksRef.value, {
    opacity: showHamburger ? 0 : 1,
    y: showHamburger ? -8 : 0,
    duration,
    ease: "power3.out",
    pointerEvents: showHamburger ? "none" : "auto",
    overwrite: "auto",
  });

  gsap.to(hamburgerRef.value, {
    opacity: showHamburger ? 1 : 0,
    scale: showHamburger ? 1 : 0.8,
    duration,
    ease: "power3.out",
    pointerEvents: showHamburger ? "auto" : "none",
    overwrite: "auto",
  });
};

/* ----------------------------------
   漢堡圖示 ↔ X 的線條 morph
---------------------------------- */

const morphHamburgerLines = (toClose: boolean) => {
  const duration = prefersReducedMotion ? 0 : 0.3;

  gsap.to(lineTopRef.value, {
    y: toClose ? 0 : -7,
    rotate: toClose ? 45 : 0,
    duration,
    ease: "power3.inOut",
  });

  gsap.to(lineMidRef.value, {
    opacity: toClose ? 0 : 1,
    scaleX: toClose ? 0 : 1,
    duration: duration * 0.7,
    ease: "power3.inOut",
  });

  gsap.to(lineBottomRef.value, {
    y: toClose ? 0 : 7,
    rotate: toClose ? -45 : 0,
    duration,
    ease: "power3.inOut",
  });
};

/* ----------------------------------
   抽屜開關
---------------------------------- */

const toggleDrawer = () => {
  isDrawerOpen.value = !isDrawerOpen.value;
};

const closeDrawer = () => {
  isDrawerOpen.value = false;
};

const handleDrawerLinkClick = () => {
  closeDrawer();
};

const openDrawerAnimation = () => {
  if (prefersReducedMotion) {
    gsap.set(backdropRef.value, { opacity: 1, pointerEvents: "auto" });
    gsap.set(drawerRef.value, { xPercent: 0 });
    return;
  }

  const tl = gsap.timeline();

  tl.set(backdropRef.value, { pointerEvents: "auto" })
    .to(backdropRef.value, { opacity: 1, duration: 0.25, ease: "power2.out" }, 0)
    .to(drawerRef.value, { xPercent: 0, duration: 0.5, ease: "power3.out" }, 0)
    .from(closeBtnRef.value, { opacity: 0, scale: 0.7, duration: 0.3, ease: "back.out(2)" }, 0.15)
    .from(".drawer-link", { opacity: 0, x: 30, stagger: 0.08, duration: 0.4, ease: "power3.out" }, 0.2)
    .from(".drawer-cta", { opacity: 0, y: 20, duration: 0.4, ease: "power3.out" }, 0.4);
};

const closeDrawerAnimation = () => {
  if (prefersReducedMotion) {
    gsap.set(backdropRef.value, { opacity: 0, pointerEvents: "none" });
    gsap.set(drawerRef.value, { xPercent: 100 });
    return;
  }

  const tl = gsap.timeline();

  tl.to(drawerRef.value, { xPercent: 100, duration: 0.4, ease: "power2.in" }).to(
    backdropRef.value,
    {
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        gsap.set(backdropRef.value, { pointerEvents: "none" });
      },
    },
    "-=0.25",
  );
};

watch(isDrawerOpen, (isOpen) => {
  morphHamburgerLines(isOpen);

  if (isOpen) {
    openDrawerAnimation();
  } else {
    closeDrawerAnimation();
  }

  document.body.style.overflow = isOpen ? "hidden" : "";
});

/* ----------------------------------
   螢幕尺寸
---------------------------------- */

const updateScreenMode = (event?: MediaQueryListEvent) => {
  const isDesktop = event?.matches ?? desktopMediaQuery?.matches ?? false;
  isCompactScreen.value = !isDesktop;

  if (isDrawerOpen.value) {
    isDrawerOpen.value = false;
  }
};

/* ----------------------------------
   滾動
---------------------------------- */

const updateScrollState = () => {
  isScrolled.value = window.scrollY > 100;

  if (!isCompactScreen.value && !isScrolled.value && isDrawerOpen.value) {
    isDrawerOpen.value = false;
  }

  animationFrameId = null;
};

const handleScroll = () => {
  if (animationFrameId !== null) return;
  animationFrameId = window.requestAnimationFrame(updateScrollState);
};

/* ----------------------------------
   鍵盤
---------------------------------- */

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && isDrawerOpen.value) {
    closeDrawer();
  }
};

/* ----------------------------------
   Lifecycle
---------------------------------- */

watch(shouldShowHamburger, () => updateNavVisibility());

onMounted(async () => {
  await nextTick();

  if (!rootRef.value) return;

  prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  desktopMediaQuery = window.matchMedia("(min-width: 1024px)");

  updateScreenMode();
  updateScrollState();

  gsapContext = gsap.context(() => {
    /*
     * 修正 bug 的關鍵：
     * 頁面載入時就明確設定三條線的分離位置，
     * 不再等到使用者第一次點擊才「校正」。
     */
    gsap.set(lineTopRef.value, { y: -7, rotate: 0 });
    gsap.set(lineMidRef.value, { opacity: 1, scaleX: 1 });
    gsap.set(lineBottomRef.value, { y: 7, rotate: 0 });

    updateNavVisibility(true);
    gsap.set(backdropRef.value, { opacity: 0, pointerEvents: "none" });
    gsap.set(drawerRef.value, { xPercent: 100 });

    if (!prefersReducedMotion) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(brandRef.value, { opacity: 0, y: -20, duration: 0.8 }).from(
        shouldShowHamburger.value
          ? hamburgerRef.value
          : centerLinksRef.value?.children ?? [],
        { opacity: 0, y: -20, duration: 0.7, stagger: 0.1 },
        "-=0.5",
      );
    }
  }, rootRef.value);

  desktopMediaQuery.addEventListener("change", updateScreenMode);
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  desktopMediaQuery?.removeEventListener("change", updateScreenMode);
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("keydown", handleKeydown);

  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId);
  }

  document.body.style.overflow = "";
  gsapContext?.revert();
});
</script>

<template>
  <div ref="rootRef">
    <!-- Navigation -->
    <nav class="fixed inset-x-0 top-0 z-[70] px-5 py-5 sm:px-8 sm:py-6 m-5">
      <div class="relative mx-auto flex max-w-[1800px] items-center justify-between">
        <!-- 左：Logo -->
        <a ref="brandRef" href="#" class="font-medium tracking-wide text-2xl text-white transition-colors hover:text-[#B55F00]">
          {{ brandName }}
        </a>

        <!--
          中：連結（桌機未滾動時顯示）
          外層只負責「絕對定位置中」，完全不被 GSAP 碰到；
          內層（centerLinksRef）才是 GSAP 控制 opacity / y 的對象。
          兩者職責分開，避免 transform 互相覆蓋造成次像素模糊。
        -->
        <div class="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:flex">
          <div ref="centerLinksRef" class="flex items-center gap-3">
            <a href="#about" class="relative inline-flex min-h-[64px] items-center justify-center px-3 py-2"
              @mouseenter="handleLinkEnter('about', $event)" @mouseleave="handleLinkLeave">
              <span class="nav-group inline-flex flex-col items-center">
                <span class="nav-label whitespace-nowrap text-xl font-medium tracking-wider text-white">
                  {{ aboutText }}
                </span>
                <span class="nav-dot mt-2 h-1.5 w-1.5 scale-0 rounded-full bg-[#B55F00] opacity-0"></span>
              </span>
            </a>

            <a href="#service" class="relative inline-flex min-h-[64px] items-center justify-center px-3 py-2"
              @mouseenter="handleLinkEnter('service', $event)" @mouseleave="handleLinkLeave">
              <span class="nav-group inline-flex flex-col items-center">
                <span class="nav-label whitespace-nowrap text-xl font-medium tracking-wider text-white">
                  {{ serviceText }}
                </span>
                <span class="nav-dot mt-2 h-1.5 w-1.5 scale-0 rounded-full bg-[#B55F00] opacity-0"></span>
              </span>
            </a>

            <a href="#contact" class="relative inline-flex min-h-[64px] items-center justify-center px-3 py-2"
              @mouseenter="handleLinkEnter('contact', $event)" @mouseleave="handleLinkLeave">
              <span class="nav-group inline-flex flex-col items-center">
                <span class="nav-label whitespace-nowrap text-xl font-medium tracking-wider text-white">
                  {{ contactText }}
                </span>
                <span class="nav-dot mt-2 h-1.5 w-1.5 scale-0 rounded-full bg-[#B55F00] opacity-0"></span>
              </span>
            </a>
          </div>
        </div>

        <!-- 右：漢堡（手機／滾動後顯示） + CTA（永遠顯示） -->
        <div class="flex items-center gap-3">
          <div class="relative h-11 w-11">
            <button ref="hamburgerRef" type="button"
              class="absolute inset-0 flex items-center justify-center rounded-xl bg-[#B55F00] shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-white p-5"
              :aria-expanded="isDrawerOpen" aria-controls="navigation-drawer" :aria-label="isDrawerOpen ? '關閉選單' : '開啟選單'"
              @click="toggleDrawer">
              <span ref="lineTopRef" class="absolute h-[2px] w-5 rounded-full bg-white"></span>
              <span ref="lineMidRef" class="absolute h-[2px] w-5 rounded-full bg-white"></span>
              <span ref="lineBottomRef" class="absolute h-[2px] w-5 rounded-full bg-white"></span>
            </button>
          </div>

          <HeroCTA :text="ctaText" href="#contact" />
        </div>
      </div>
    </nav>

    <!-- 背景遮罩 -->
    <button ref="backdropRef" type="button" class="fixed inset-0 z-[75] cursor-default bg-black/45" aria-label="關閉選單"
      @click="closeDrawer"></button>

    <!-- 抽屜 -->
    <aside id="navigation-drawer" ref="drawerRef"
      class="fixed inset-y-0 right-0 z-[80] flex w-[min(88vw,380px)] flex-col justify-center overflow-hidden bg-[#262626] px-8 shadow-2xl sm:px-10"
      aria-label="網站選單">
      <div class="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-[#D4A574]/10 blur-3xl"></div>

      <button ref="closeBtnRef" type="button"
        class="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="關閉選單" @click="closeDrawer">
        <span class="relative block h-4 w-4">
          <span class="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 rotate-45 rounded-full bg-white"></span>
          <span class="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 -rotate-45 rounded-full bg-white"></span>
        </span>
      </button>

      <div class="relative z-10 flex flex-col gap-8">
        <a href="#about"
          class="drawer-link text-2xl font-semibold tracking-wide text-white transition-colors hover:text-[#B55F00] sm:text-3xl"
          @click="handleDrawerLinkClick">
          {{ aboutText }}
        </a>

        <a href="#contact"
          class="drawer-link text-2xl font-semibold tracking-wide text-white transition-colors hover:text-[#B55F00] sm:text-3xl"
          @click="handleDrawerLinkClick">
          {{ contactText }}
        </a>


        <HeroCTA :text="ctaText" href="#contact" />
      </div>
    </aside>
  </div>
</template>

<style scoped>
nav, nav * {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>