<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import gsap from "gsap";
import HeroCTA from "../components/Hero/HeroCTA.vue";

interface Props {
  entranceReady?: boolean;
  brandName?: string;
  aboutText?: string;
  contactText?: string;
  serviceText?: string;
  ctaText?: string;
  menuText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  entranceReady: false,
  brandName: "慕玖",
  aboutText: "關於慕玖",
  contactText: "聯絡我們",
  serviceText: "服務內容",
  ctaText: "預約諮詢",
  menuText: "Menu",
});

/** 跟 HeroCTA 同一組陰影：外投影 + 四邊內光，做出微微浮起的實體感 */
const DEFAULT_SHADOW =
  "2px 2px 16px 0 #25252533, .75px 0 1px 0 #f8f4ee2e inset, 0 .75px 1px 0 #f8f4ee2e inset, -.25px 0 1px 0 #f8f4ee14 inset, 0 -.25px 1px 0 #f8f4ee14 inset";

const menuButtonStyle = {
  backgroundColor: "#252525",
  color: "#FFFFFF",
  boxShadow: DEFAULT_SHADOW,
};

/* ----------------------------------
   Refs
---------------------------------- */

const rootRef = ref<HTMLElement | null>(null);
const brandRef = ref<HTMLElement | null>(null);
const centerLinksRef = ref<HTMLElement | null>(null);
const hamburgerRef = ref<HTMLElement | null>(null);
const ctaRef = ref<HTMLElement | null>(null);
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
let navIntroTimeline: gsap.core.Timeline | null = null;
let animationFrameId: number | null = null;
let desktopMediaQuery: MediaQueryList | null = null;
let prefersReducedMotion = false;
let introHasPlayed = false;


const navRef = ref<HTMLElement | null>(null);
const hasReachedAbout = ref(false);

const shouldShowHamburger = computed(() => {
  // 手機版：永遠顯示
  // 桌面版：到達 About 才顯示
  return isCompactScreen.value || hasReachedAbout.value;
});

const playNavIntro = () => {
  if (introHasPlayed || !props.entranceReady) return;
  if (!prefersReducedMotion && !navIntroTimeline) return;

  introHasPlayed = true;

  if (prefersReducedMotion) {
    gsap.set(navRef.value, { clearProps: "all" });
    return;
  }

  navIntroTimeline?.play(0);
};

watch(() => props.entranceReady, playNavIntro);
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
   桌機連結 ↔ Menu 按鈕 交叉淡入淡出

   右側是 CTA 與 Menu 按鈕疊在同一個 grid 格子裡：
   還沒捲到 About 時顯示 CTA，捲到之後 CTA 淡出、Menu 按鈕淡入。
   （手機版一律顯示 Menu 按鈕。）

   這兩個只動 opacity，不動 y／scale——因為 hamburgerRef 也是進場
   timeline（navIntroTimeline）的目標之一，兩邊同時控制 transform 會打架。
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
    duration,
    ease: "power3.out",
    pointerEvents: showHamburger ? "auto" : "none",
    overwrite: "auto",
  });

  gsap.to(ctaRef.value, {
    opacity: showHamburger ? 0 : 1,
    duration,
    ease: "power3.out",
    pointerEvents: showHamburger ? "none" : "auto",
    overwrite: "auto",
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
  // 如果其他功能還有用到，可以保留
  isScrolled.value = window.scrollY > 100;

  const aboutSection =
    document.querySelector<HTMLElement>("#about");

  if (aboutSection) {
    const navBottom =
      navRef.value?.getBoundingClientRect().bottom ?? 96;

    /*
     * About 頂端碰到 Nav 底部時為 true。
     * 繼續往 Service、Contact 捲動也會保持 true。
     */
    hasReachedAbout.value =
      aboutSection.getBoundingClientRect().top <= navBottom;
  } else {
    hasReachedAbout.value = false;
  }

  if (
    !isCompactScreen.value &&
    !hasReachedAbout.value &&
    isDrawerOpen.value
  ) {
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
    updateNavVisibility(true);
    gsap.set(backdropRef.value, { opacity: 0, pointerEvents: "none" });
    gsap.set(drawerRef.value, { xPercent: 100 });

    if (!prefersReducedMotion) {
      const entranceTargets = [
        brandRef.value,
        ...(shouldShowHamburger.value
          ? [hamburgerRef.value]
          : Array.from(centerLinksRef.value?.children ?? [])),
      ].filter(Boolean);

      gsap.set(navRef.value, {
        autoAlpha: 0,
        y: -22,
        willChange: "transform,opacity",
      });
      gsap.set(entranceTargets, { y: -8 });

      navIntroTimeline = gsap.timeline({
        paused: true,
        onComplete: () => {
          gsap.set(navRef.value, { clearProps: "willChange" });
        },
      });

      navIntroTimeline
        .to(navRef.value, {
          autoAlpha: 1,
          y: 0,
          duration: 0.78,
          ease: "power3.out",
        }, 0.28)
        .to(entranceTargets, {
          y: 0,
          duration: 0.62,
          stagger: 0.055,
          ease: "power3.out",
        }, 0.38);
    }
  }, rootRef.value);

  playNavIntro();

  desktopMediaQuery.addEventListener("change", updateScreenMode);
  window.addEventListener("keydown", handleKeydown);

  window.addEventListener("scroll", handleScroll, {
    passive: true,
  });

  window.addEventListener("resize", handleScroll, {
    passive: true,
  });
});

onBeforeUnmount(() => {
  desktopMediaQuery?.removeEventListener("change", updateScreenMode);
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("resize", handleScroll);
  window.removeEventListener("keydown", handleKeydown);

  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId);
  }

  document.body.style.overflow = "";
  gsapContext?.revert();
  navIntroTimeline = null;

});
</script>

<template>
  <div ref="rootRef">
    <!-- Navigation -->
    <nav ref="navRef" class="fixed inset-x-0 top-0 z-[70] px-5 ">
      <div class="relative mx-auto flex max-w-8xl items-center justify-between">
        <!-- 左：Logo -->
        <div ref="brandRef" class="group flex items-center gap-3">
          <div class="flex h-1/3 w-1/3 shrink-0 items-center justify-center rounded-xl p-2">
            <svg width="327" height="140" viewBox="0 0 327 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M53.248 103.68L15.104 4.608V94.592L27.392 99.712V102.4H0V99.712L12.032 94.592V4.608L0.256 2.816V0H28.544L60.672 82.176L93.44 0H119.296V2.816L107.52 4.608V97.792L119.296 99.712V102.4H81.664V99.712L93.44 97.792V8.448L55.552 103.68H53.248ZM163.036 103.68C156.892 103.68 151.303 102.272 146.268 99.456C141.233 96.5547 137.223 92.5014 134.236 87.296C131.335 82.0054 129.884 75.9894 129.884 69.248C129.884 62.5067 131.335 56.5334 134.236 51.328C137.223 46.1227 141.233 42.112 146.268 39.296C151.303 36.3947 156.892 34.944 163.036 34.944C169.18 34.944 174.769 36.3947 179.804 39.296C184.839 42.112 188.807 46.1227 191.708 51.328C194.695 56.5334 196.188 62.5067 196.188 69.248C196.188 75.9894 194.695 82.0054 191.708 87.296C188.807 92.5014 184.839 96.5547 179.804 99.456C174.769 102.272 169.18 103.68 163.036 103.68ZM163.036 100.864C169.351 100.864 174.087 98.56 177.244 93.952C180.487 89.344 182.108 83.2427 182.108 75.648V62.848C182.108 55.2534 180.487 49.1947 177.244 44.672C174.087 40.064 169.351 37.76 163.036 37.76C156.721 37.76 151.943 40.064 148.7 44.672C145.543 49.1947 143.964 55.2534 143.964 62.848V75.648C143.964 83.2427 145.543 89.344 148.7 93.952C151.943 98.56 156.721 100.864 163.036 100.864ZM216.792 139.904C211.672 139.904 207.405 138.795 203.992 136.576C200.664 134.357 199 131.115 199 126.848C199 124.032 199.768 121.771 201.304 120.064C202.925 118.272 205.016 117.376 207.576 117.376C209.624 117.376 211.245 117.931 212.44 119.04C213.635 120.149 214.445 121.344 214.872 122.624C215.384 123.819 215.64 124.587 215.64 124.928C213.165 126.72 211.928 128.811 211.928 131.2C211.928 132.821 212.44 134.187 213.464 135.296C214.488 136.405 215.896 136.96 217.688 136.96C220.419 136.96 222.552 135.125 224.088 131.456C225.709 127.701 226.52 121.259 226.52 112.128V39.552L214.744 37.76V34.944H251.864V37.76L240.088 39.552V112.128C240.088 118.101 239.491 123.093 238.296 127.104C237.187 131.029 234.925 134.144 231.512 136.448C228.099 138.752 223.192 139.904 216.792 139.904ZM293.786 103.68C287.642 103.68 282.053 102.272 277.018 99.456C271.983 96.5547 267.973 92.5014 264.986 87.296C262.085 82.0054 260.634 75.9894 260.634 69.248C260.634 62.5067 262.085 56.5334 264.986 51.328C267.973 46.1227 271.983 42.112 277.018 39.296C282.053 36.3947 287.642 34.944 293.786 34.944C299.93 34.944 305.519 36.3947 310.554 39.296C315.589 42.112 319.557 46.1227 322.458 51.328C325.445 56.5334 326.938 62.5067 326.938 69.248C326.938 75.9894 325.445 82.0054 322.458 87.296C319.557 92.5014 315.589 96.5547 310.554 99.456C305.519 102.272 299.93 103.68 293.786 103.68ZM293.786 100.864C300.101 100.864 304.837 98.56 307.994 93.952C311.237 89.344 312.858 83.2427 312.858 75.648V62.848C312.858 55.2534 311.237 49.1947 307.994 44.672C304.837 40.064 300.101 37.76 293.786 37.76C287.471 37.76 282.693 40.064 279.45 44.672C276.293 49.1947 274.714 55.2534 274.714 62.848V75.648C274.714 83.2427 276.293 89.344 279.45 93.952C282.693 98.56 287.471 100.864 293.786 100.864Z"
                :fill="hasReachedAbout ? '#171717' : '#ffffff'" />
            </svg>

          </div>

        </div>

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
                  {{ props.aboutText }}
                </span>
                <span class="nav-dot mt-2 h-1.5 w-1.5 scale-0 rounded-full bg-[#B55F00] opacity-0"></span>
              </span>
            </a>

            <a href="#service" class="relative inline-flex min-h-[64px] items-center justify-center px-3 py-2"
              @mouseenter="handleLinkEnter('service', $event)" @mouseleave="handleLinkLeave">
              <span class="nav-group inline-flex flex-col items-center">
                <span class="nav-label whitespace-nowrap text-xl font-medium tracking-wider text-white">
                  {{ props.serviceText }}
                </span>
                <span class="nav-dot mt-2 h-1.5 w-1.5 scale-0 rounded-full bg-[#B55F00] opacity-0"></span>
              </span>
            </a>

            <a href="#contact" class="relative inline-flex min-h-[64px] items-center justify-center px-3 py-2"
              @mouseenter="handleLinkEnter('contact', $event)" @mouseleave="handleLinkLeave">
              <span class="nav-group inline-flex flex-col items-center">
                <span class="nav-label whitespace-nowrap text-xl font-medium tracking-wider text-white">
                  {{ props.contactText }}
                </span>
                <span class="nav-dot mt-2 h-1.5 w-1.5 scale-0 rounded-full bg-[#B55F00] opacity-0"></span>
              </span>
            </a>
          </div>
        </div>

        <!--
          右側：CTA 與 Menu 按鈕疊在同一個 grid 格子裡。
          兩者都靠右對齊、佔用同一格，所以互相淡入淡出時不會造成版面位移。
        -->
        <div class="grid place-items-center">
          <!-- CTA：尚未捲到 About 時顯示 -->
          <div ref="ctaRef" class="col-start-1 row-start-1 justify-self-end">
            <HeroCTA :text="props.ctaText" href="#consultation-form" bg-color="#f8f4eecc" text-color="#252525"
              :blur="6" radius="4px" />
          </div>

          <!-- Menu 按鈕：捲到 About 之後（手機版則一律）顯示 -->
          <button ref="hamburgerRef" type="button" :style="menuButtonStyle"
            class="col-start-1 row-start-1 flex h-11 w-[170px] items-center justify-between rounded-lg px-4 outline-none justify-self-end focus-visible:ring-2 focus-visible:ring-[#B55F00] focus-visible:ring-offset-2 sm:w-[200px]"
            :aria-expanded="isDrawerOpen" aria-controls="navigation-drawer"
            :aria-label="isDrawerOpen ? '關閉選單' : '開啟選單'" @click="toggleDrawer">
            <!-- 左：+ ↔ X -->
            <span class="relative flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                class="absolute h-5 w-5 transition-all duration-300"
                :class="isDrawerOpen ? 'scale-75 rotate-45 opacity-0' : 'scale-100 rotate-0 opacity-100'">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>

              <svg viewBox="0 0 24 24" fill="none" class="absolute h-5 w-5 transition-all duration-300"
                :class="isDrawerOpen ? 'scale-100 rotate-0 opacity-100' : 'scale-75 -rotate-45 opacity-0'">
                <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </span>

            <!-- 右：Menu -->
            <span class="text-sm font-medium tracking-wide">
              {{ props.menuText }}
            </span>
          </button>
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
          {{ props.aboutText }}
        </a>

        <a href="#contact"
          class="drawer-link text-2xl font-semibold tracking-wide text-white transition-colors hover:text-[#B55F00] sm:text-3xl"
          @click="handleDrawerLinkClick">
          {{ props.contactText }}
        </a>


        <HeroCTA :text="props.ctaText" href="#consultation-form" />
      </div>
    </aside>
  </div>
</template>

<style scoped>
nav,
nav * {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
