<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import gsap from "gsap";
import HeroCTA from "../components/Hero/HeroCTA.vue";
import { getServiceHref, services, type ServiceSlug } from "../data/services";
import { CONSULTATION_PATH, useOverlayNav } from "../lib/overlayNav";
import { scrollToSection, scrollToTop } from "../lib/scrollToSection";

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

/*
 * Menu 按鈕的配色跟著底色翻。以前它只在捲過淺色底之後才出現，所以
 * 固定深色就夠了；現在服務詳情頁與表單頁一進來就是它，而那兩頁的
 * 頂端是深的 —— 深色按鈕壓在深色底上等於消失。
 */
const menuButtonStyle = computed(() =>
  hasReachedLightSurface.value
    ? { backgroundColor: "#1c1b17", color: "#FFFFFF", boxShadow: DEFAULT_SHADOW }
    : { backgroundColor: "#ffffff", color: "#1c1b17", boxShadow: DEFAULT_SHADOW },
);

/* ----------------------------------
   Refs
---------------------------------- */

const rootRef = ref<HTMLElement | null>(null);
const brandRef = ref<HTMLElement | null>(null);
const centerEntranceRef = ref<HTMLElement | null>(null);
const centerLinksRef = ref<HTMLElement | null>(null);
const rightControlsRef = ref<HTMLElement | null>(null);
const hamburgerRef = ref<HTMLElement | null>(null);
const ctaRef = ref<HTMLElement | null>(null);
const backdropRef = ref<HTMLElement | null>(null);
const drawerRef = ref<HTMLElement | null>(null);
const closeBtnRef = ref<HTMLElement | null>(null);

/* ----------------------------------
   State
---------------------------------- */

const isCompactScreen = ref(false);
const isDrawerOpen = ref(false);
type NavLink = "about" | "service" | "contact";
const hoveredLink = ref<NavLink | null>(null);

/* ----------------------------------
   「服務內容」的 hover 選單

   三個服務頁原本只有一個入口：捲到 Service 區塊、等 sticky 場景切到
   要的那一個、再點「深入了解」。想比較 01 跟 02 得整段重來一次。
   這裡把三個服務直接掛在導覽列下，滑過就能換。

   開關同時綁 hover 與 focus：滑鼠使用者用 hover，鍵盤使用者 Tab 到
   「服務內容」時一樣會展開，接著 Tab 就能走進面板。關閉的那一半交給
   focusout（焦點移到面板內不算離開）與 Escape。
---------------------------------- */

const { openOverlay, openConsultation, preloadImage, returnHome } = useOverlayNav();

/*
 * 同一支導覽列現在也掛在服務詳情頁與表單頁上。那兩頁沒有 #about /
 * #service / #contact 這些區塊，站內錨點得先回首頁；logo 也不再是
 * 「捲到最上面」而是「離開這個覆蓋頁」。
 *
 * navigation-mobile 的單元測試不帶 router 直接掛載這支元件，
 * 所以沒有 route 時一律當成首頁，維持原本的行為。
 */
const route = useRoute();
const isHome = computed(() => !route || route.name === "home");

/** 首頁用純錨點；其他頁得帶上路徑，讓瀏覽器自己導回首頁的該區塊 */
const sectionHref = (hash: string) => (isHome.value ? hash : `/${hash}`);

const isServiceMenuOpen = ref(false);
const serviceMenuRef = ref<HTMLElement | null>(null);

const openServiceMenu = () => {
  isServiceMenuOpen.value = true;
};

const closeServiceMenu = () => {
  isServiceMenuOpen.value = false;
};

const handleServiceMenuFocusOut = (event: FocusEvent) => {
  const next = event.relatedTarget;
  if (next instanceof Node && serviceMenuRef.value?.contains(next)) return;

  closeServiceMenu();
};

const handleServiceMenuSelect = (event: MouseEvent, slug: ServiceSlug) => {
  closeServiceMenu();
  openOverlay(event, getServiceHref(slug));
};

const handleDrawerServiceSelect = (event: MouseEvent, slug: ServiceSlug) => {
  closeDrawer();
  openOverlay(event, getServiceHref(slug));
};

/** 抽屜裡的 CTA：先關抽屜，body 的捲動鎖才不會被帶到下一頁 */
const handleDrawerConsultationClick = (event: MouseEvent) => {
  closeDrawer();
  openConsultation(event);
};

let gsapContext: gsap.Context | null = null;
let entranceTimeline: gsap.core.Timeline | null = null;
let entranceHasPlayed = false;
let animationFrameId: number | null = null;
let desktopMediaQuery: MediaQueryList | null = null;
let prefersReducedMotion = false;


const navRef = ref<HTMLElement | null>(null);
const hasReachedLightSurface = ref(false);

const logoFill = computed(() =>
  // Nav 沒有底色了，深色 logo 只在背景已經變亮（捲到 About 之後）時才用，
  // 否則在深色 Hero 上會看不見。
  hasReachedLightSurface.value ? "#1c1b17" : "#ffffff",
);

const shouldShowHamburger = computed(() => {
  // 手機版：永遠顯示
  // 服務詳情頁 / 表單頁：永遠顯示 —— 那兩頁只要 logo 與 Menu，
  //   中間的區塊連結與 CTA 都收進抽屜裡
  // 首頁桌機版：捲到淺色底才顯示
  return isCompactScreen.value || !isHome.value || hasReachedLightSurface.value;
});
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

  gsap.to(group, {
    y: 0,
    duration: 0.3,
    ease: "power3.out",
    overwrite: "auto",
    onComplete: () => gsap.set(group, { clearProps: "transform" }),
  });
  gsap.to(dot, { scale: 0, opacity: 0, duration: 0.25, ease: "power2.in", overwrite: "auto" });
};

/* ----------------------------------
   桌機連結 ↔ Menu 按鈕 交叉淡入淡出

   右側是 CTA 與 Menu 按鈕疊在同一個 grid 格子裡：
   還沒捲到 About 時顯示 CTA，捲到之後 CTA 淡出、Menu 按鈕淡入。
   （手機版一律顯示 Menu 按鈕。）
---------------------------------- */

const updateNavVisibility = (instant = false) => {
  if (!centerLinksRef.value || !hamburgerRef.value || !ctaRef.value) return;

  const showHamburger = shouldShowHamburger.value;
  const duration = instant || prefersReducedMotion ? 0 : 0.35;

  const method = instant ? gsap.set : gsap.to;

  method(centerLinksRef.value, {
    autoAlpha: showHamburger ? 0 : 1,
    duration,
    ease: "power3.out",
    pointerEvents: showHamburger ? "none" : "auto",
    overwrite: "auto",
  });

  method(hamburgerRef.value, {
    autoAlpha: showHamburger ? 1 : 0,
    duration,
    ease: "power3.out",
    pointerEvents: showHamburger ? "auto" : "none",
    overwrite: "auto",
  });

  method(ctaRef.value, {
    autoAlpha: showHamburger ? 0 : 1,
    duration,
    ease: "power3.out",
    pointerEvents: showHamburger ? "none" : "auto",
    overwrite: "auto",
  });
};

const playEntrance = () => {
  if (entranceHasPlayed || !props.entranceReady) return;

  if (prefersReducedMotion) {
    entranceHasPlayed = true;
    return;
  }

  if (!entranceTimeline) return;

  entranceHasPlayed = true;
  entranceTimeline.play(0);
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

/**
 * Logo：首頁上是「回到最上方」，服務詳情頁與表單頁上是「離開這一頁」——
 * 走 App.vue 那套反向轉場退回首頁（原本兩頁各自的「← 返回」鍵已經
 * 併進這裡）。抽屜開著就先關起來再動作。
 */
const handleBrandClick = (event: MouseEvent) => {
  event.preventDefault();

  const needsUnlock = isDrawerOpen.value;
  if (needsUnlock) closeDrawer();

  const leaveOrScroll = () => {
    if (isHome.value) {
      scrollToTop();
      return;
    }
    returnHome();
  };

  if (!needsUnlock) {
    leaveOrScroll();
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(leaveOrScroll);
  });
};

/**
 * 站內錨點統一走這裡。
 *
 * 原本直接用 <a href="#x"> 會導不過去，有兩個原因：
 * 1. Lenis 接管捲動後，瀏覽器原生的 hash 跳轉會被它吃掉。
 * 2. 抽屜打開時 body 是 overflow:hidden，關閉的解鎖動作在 watcher 裡
 *    非同步執行，比原生跳轉還晚，所以捲動當下還是鎖著的。
 * 因此改成攔截點擊、先關抽屜、等解鎖生效後再用 Lenis 捲。
 */
const handleNavLinkClick = (event: MouseEvent, hash: string) => {
  // 不在首頁時，href 已經是 /#xxx，交給瀏覽器導回首頁的該區塊即可。
  // Lenis 只存在於首頁，這裡攔下來也沒有東西可以捲。
  if (!isHome.value) return;

  event.preventDefault();

  const needsUnlock = isDrawerOpen.value;
  if (needsUnlock) closeDrawer();

  if (!needsUnlock) {
    scrollToSection(hash);
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => scrollToSection(hash));
  });
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
  /*
   * 導覽列沒有底色，白色 logo 與白色連結只有在背景還是深的時候才看得見。
   * 每一頁自己標出「從這裡開始是淺色底」的那個元素（首頁是 About、
   * 服務詳情頁是 hero 之後的內文），碰到導覽列底部就換成深色 logo。
   *
   * 原本這裡寫死查 #about —— 那是首頁才有的 id，掛到其他頁上就永遠
   * 是 false，白色 logo 會直接消失在白色內文上。
   */
  const lightSurface = document.querySelector<HTMLElement>(
    "[data-nav-light-surface]",
  );

  if (lightSurface) {
    const navBottom =
      navRef.value?.getBoundingClientRect().bottom ?? 96;

    /*
     * 淺色區塊頂端碰到 Nav 底部時為 true。
     * 繼續往下捲也會保持 true。
     */
    hasReachedLightSurface.value =
      lightSurface.getBoundingClientRect().top <= navBottom;
  } else {
    hasReachedLightSurface.value = false;
  }

  /*
   * Menu 按鈕消失時（首頁桌機捲回深色 Hero）順手把抽屜收掉，
   * 否則會留下一個沒有開關的抽屜。
   *
   * 原本這裡直接判斷 !hasReachedLightSurface —— 在服務詳情頁桌機版
   * 一進來就成立，抽屜會在下一個 scroll 事件被立刻關掉，等於打不開。
   */
  if (!shouldShowHamburger.value && isDrawerOpen.value) {
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
  if (event.key !== "Escape") return;

  if (isDrawerOpen.value) closeDrawer();
  if (isServiceMenuOpen.value) closeServiceMenu();
};

/* ----------------------------------
   Lifecycle
---------------------------------- */

watch(shouldShowHamburger, (showHamburger) => {
  // 中央連結淡出時選單還開著的話，它會孤零零地留在畫面上
  if (showHamburger) closeServiceMenu();
  updateNavVisibility();
});
watch(() => props.entranceReady, playEntrance);

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
    gsap.set(drawerRef.value, { xPercent: 100, visibility: "visible" });

    if (!prefersReducedMotion) {
      /*
       * 入場動畫只控制穩定的外層容器；CTA、Menu 與中央連結的互斥狀態
       * 完全交給 updateNavVisibility，避免直接載入 hash 時兩套動畫搶 opacity。
       */
      const entranceTargets = [
        centerEntranceRef.value,
        rightControlsRef.value,
      ].filter(Boolean);

      gsap.set(brandRef.value, { autoAlpha: 0, y: -16 });
      gsap.set(entranceTargets, { autoAlpha: 0, y: -14 });

      entranceTimeline = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out" },
        onComplete: () => {
          gsap.set([brandRef.value, ...entranceTargets], {
            clearProps: "transform,opacity,visibility,willChange",
          });
        },
      });

      entranceTimeline
        .to(brandRef.value, {
          autoAlpha: 1,
          y: 0,
          duration: 0.72,
          willChange: "transform,opacity",
        }, 0)
        .to(entranceTargets, {
          autoAlpha: 1,
          y: 0,
          duration: 0.62,
          stagger: 0.065,
          willChange: "transform,opacity",
        }, 0.1);
    }
  }, rootRef.value);

  playEntrance();

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
  entranceTimeline?.kill();
  gsapContext?.revert();
  entranceTimeline = null;

});
</script>

<template>
  <div ref="rootRef">
    <!-- Navigation -->
    <nav ref="navRef" class="fixed inset-x-0 top-0 z-[70] mt-3 px-3 sm:mt-4 sm:px-6 lg:mt-5 lg:px-12 xl:px-16">
      <div
        class="relative mx-auto flex h-14 w-full max-w-full items-center justify-between rounded-[4px] bg-transparent px-2 sm:h-16 sm:px-3 lg:h-20 lg:px-0"
      >
        <!-- 左：Logo -->
        <div ref="brandRef" class="group flex items-center gap-3">
          <a
            href="/"
            class="flex shrink-0 items-center justify-center rounded-[4px] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2"
            aria-label="回到首頁最上方"
            @click="handleBrandClick"
          >
            <svg width="327" height="140" class="h-auto w-[82px] sm:w-[96px] lg:w-[116px]" viewBox="0 0 327 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M53.248 103.68L15.104 4.608V94.592L27.392 99.712V102.4H0V99.712L12.032 94.592V4.608L0.256 2.816V0H28.544L60.672 82.176L93.44 0H119.296V2.816L107.52 4.608V97.792L119.296 99.712V102.4H81.664V99.712L93.44 97.792V8.448L55.552 103.68H53.248ZM163.036 103.68C156.892 103.68 151.303 102.272 146.268 99.456C141.233 96.5547 137.223 92.5014 134.236 87.296C131.335 82.0054 129.884 75.9894 129.884 69.248C129.884 62.5067 131.335 56.5334 134.236 51.328C137.223 46.1227 141.233 42.112 146.268 39.296C151.303 36.3947 156.892 34.944 163.036 34.944C169.18 34.944 174.769 36.3947 179.804 39.296C184.839 42.112 188.807 46.1227 191.708 51.328C194.695 56.5334 196.188 62.5067 196.188 69.248C196.188 75.9894 194.695 82.0054 191.708 87.296C188.807 92.5014 184.839 96.5547 179.804 99.456C174.769 102.272 169.18 103.68 163.036 103.68ZM163.036 100.864C169.351 100.864 174.087 98.56 177.244 93.952C180.487 89.344 182.108 83.2427 182.108 75.648V62.848C182.108 55.2534 180.487 49.1947 177.244 44.672C174.087 40.064 169.351 37.76 163.036 37.76C156.721 37.76 151.943 40.064 148.7 44.672C145.543 49.1947 143.964 55.2534 143.964 62.848V75.648C143.964 83.2427 145.543 89.344 148.7 93.952C151.943 98.56 156.721 100.864 163.036 100.864ZM216.792 139.904C211.672 139.904 207.405 138.795 203.992 136.576C200.664 134.357 199 131.115 199 126.848C199 124.032 199.768 121.771 201.304 120.064C202.925 118.272 205.016 117.376 207.576 117.376C209.624 117.376 211.245 117.931 212.44 119.04C213.635 120.149 214.445 121.344 214.872 122.624C215.384 123.819 215.64 124.587 215.64 124.928C213.165 126.72 211.928 128.811 211.928 131.2C211.928 132.821 212.44 134.187 213.464 135.296C214.488 136.405 215.896 136.96 217.688 136.96C220.419 136.96 222.552 135.125 224.088 131.456C225.709 127.701 226.52 121.259 226.52 112.128V39.552L214.744 37.76V34.944H251.864V37.76L240.088 39.552V112.128C240.088 118.101 239.491 123.093 238.296 127.104C237.187 131.029 234.925 134.144 231.512 136.448C228.099 138.752 223.192 139.904 216.792 139.904ZM293.786 103.68C287.642 103.68 282.053 102.272 277.018 99.456C271.983 96.5547 267.973 92.5014 264.986 87.296C262.085 82.0054 260.634 75.9894 260.634 69.248C260.634 62.5067 262.085 56.5334 264.986 51.328C267.973 46.1227 271.983 42.112 277.018 39.296C282.053 36.3947 287.642 34.944 293.786 34.944C299.93 34.944 305.519 36.3947 310.554 39.296C315.589 42.112 319.557 46.1227 322.458 51.328C325.445 56.5334 326.938 62.5067 326.938 69.248C326.938 75.9894 325.445 82.0054 322.458 87.296C319.557 92.5014 315.589 96.5547 310.554 99.456C305.519 102.272 299.93 103.68 293.786 103.68ZM293.786 100.864C300.101 100.864 304.837 98.56 307.994 93.952C311.237 89.344 312.858 83.2427 312.858 75.648V62.848C312.858 55.2534 311.237 49.1947 307.994 44.672C304.837 40.064 300.101 37.76 293.786 37.76C287.471 37.76 282.693 40.064 279.45 44.672C276.293 49.1947 274.714 55.2534 274.714 62.848V75.648C274.714 83.2427 276.293 89.344 279.45 93.952C282.693 98.56 287.471 100.864 293.786 100.864Z"
                :fill="logoFill" />
            </svg>
          </a>
        </div>

        <!--
          中：連結（桌機未滾動時顯示）
          外層只負責「絕對定位置中」，完全不被 GSAP 碰到；
          centerEntranceRef 負責入場，centerLinksRef 只負責捲動顯隱。
          各層職責分開，避免 transform 與 opacity 互相覆蓋。
        -->
        <div class="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:flex">
          <div ref="centerEntranceRef">
            <div ref="centerLinksRef" class="flex items-center gap-1">
              <a :href="sectionHref('#about')" class="relative inline-flex min-h-12 items-center justify-center px-4 py-2"
                @click="handleNavLinkClick($event, '#about')"
                @mouseenter="handleLinkEnter('about', $event)" @mouseleave="handleLinkLeave">
                <span class="nav-group inline-flex flex-col items-center">
                  <span class="nav-label whitespace-nowrap text-lg font-medium tracking-[0.08em] text-white">
                    {{ aboutText }}
                  </span>
                  <span class="nav-dot mt-2 h-1.5 w-1.5 scale-0 rounded-full bg-brand-ink opacity-0"></span>
                </span>
              </a>

              <!--
                服務內容：hover / focus 展開三個服務，可以直接跳頁切換。
                外層 div 同時是 hover 區與定位參考點；面板用 pt-4 當作
                連結與面板之間的「橋」，滑鼠移過去時不會先離開 hover 區。
              -->
              <div ref="serviceMenuRef" class="relative" @mouseenter="openServiceMenu"
                @mouseleave="closeServiceMenu" @focusin="openServiceMenu" @focusout="handleServiceMenuFocusOut">
                <a :href="sectionHref('#service')" class="relative inline-flex min-h-12 items-center justify-center px-4 py-2"
                  :aria-expanded="isServiceMenuOpen" aria-controls="nav-service-menu"
                  @click="handleNavLinkClick($event, '#service')"
                  @mouseenter="handleLinkEnter('service', $event)" @mouseleave="handleLinkLeave">
                  <span class="nav-group inline-flex flex-col items-center">
                    <span class="nav-label whitespace-nowrap text-lg font-medium tracking-[0.08em] text-white">
                      {{ serviceText }}
                    </span>
                    <span class="nav-dot mt-2 h-1.5 w-1.5 scale-0 rounded-full bg-brand-ink opacity-0"></span>
                  </span>
                </a>

                <div id="nav-service-menu" class="absolute left-1/2 top-full z-10 -translate-x-1/2 pt-4"
                  :inert="!isServiceMenuOpen">
                  <div
                    class="w-[min(88vw,30rem)] rounded-[4px] bg-white p-2 shadow-[0_24px_48px_-16px_rgba(28,27,23,0.35)] transition duration-200 ease-out motion-reduce:transition-none"
                    :class="isServiceMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'">
                    <a v-for="service in services" :key="service.slug" :href="getServiceHref(service.slug)"
                      class="group flex items-start gap-4 rounded-[3px] px-4 py-3 transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink"
                      @click="handleServiceMenuSelect($event, service.slug)"
                      @focus="preloadImage(service.image)" @pointerenter="preloadImage(service.image)">
                      <span class="mt-1 text-eyebrow text-brand-ink">{{ service.index }}</span>
                      <span class="min-w-0">
                        <span class="block text-base font-medium text-ink">{{ service.tag }}</span>
                        <span class="mt-1 block line-clamp-2 text-caption text-ink-muted">
                          {{ service.summary }}
                        </span>
                      </span>
                    </a>
                  </div>
                </div>
              </div>

              <a :href="sectionHref('#contact')" class="relative inline-flex min-h-12 items-center justify-center px-4 py-2"
                @click="handleNavLinkClick($event, '#contact')"
                @mouseenter="handleLinkEnter('contact', $event)" @mouseleave="handleLinkLeave">
                <span class="nav-group inline-flex flex-col items-center">
                  <span class="nav-label whitespace-nowrap text-lg font-medium tracking-[0.08em] text-white">
                    {{ contactText }}
                  </span>
                  <span class="nav-dot mt-2 h-1.5 w-1.5 scale-0 rounded-full bg-brand-ink opacity-0"></span>
                </span>
              </a>
            </div>
          </div>
        </div>

        <!--
          右側：CTA 與 Menu 按鈕疊在同一個 grid 格子裡。
          兩者都靠右對齊、佔用同一格，所以互相淡入淡出時不會造成版面位移。
        -->
        <div ref="rightControlsRef" class="grid place-items-center">
          <!-- CTA：尚未捲到 About 時顯示 -->
          <div ref="ctaRef" class="col-start-1 row-start-1 justify-self-end">
            <HeroCTA :text="ctaText" :href="CONSULTATION_PATH" variant="solid" bg-color="#ffffff" radius="4px"
              text-color="#1c1b17" @click="openConsultation" />
          </div>

          <!-- Menu 按鈕：捲到 About 之後（手機版則一律）顯示 -->
          <button ref="hamburgerRef" type="button" :style="menuButtonStyle"
            class="col-start-1 row-start-1 flex h-11 items-center justify-center gap-2 rounded-[4px] px-3 outline-none justify-self-end focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2 lg:w-[200px] lg:justify-between lg:px-4"
            :aria-expanded="isDrawerOpen" aria-controls="navigation-drawer"
            :aria-label="isDrawerOpen ? '關閉選單' : '開啟選單'" @click="toggleDrawer">
            <!-- Menu icon ↔ X -->
            <span class="relative flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden="true">
              <svg data-menu-icon viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                class="absolute h-5 w-5 transition-all duration-300"
                :class="isDrawerOpen ? 'scale-75 rotate-45 opacity-0' : 'scale-100 rotate-0 opacity-100'">
                <line x1="5" y1="6" x2="19" y2="6" />
                <line x1="5" y1="12" x2="19" y2="12" />
                <line x1="5" y1="18" x2="19" y2="18" />
              </svg>

              <svg viewBox="0 0 24 24" fill="none" class="absolute h-5 w-5 transition-all duration-300"
                :class="isDrawerOpen ? 'scale-100 rotate-0 opacity-100' : 'scale-75 -rotate-45 opacity-0'">
                <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </span>

            <!-- 文字所有尺寸都留著：只有 icon 的方塊看不出是選單 -->
            <span data-menu-label class="text-sm font-medium tracking-wide">
              {{ menuText }}
            </span>
          </button>
        </div>
      </div>
    </nav>

    <!-- 背景遮罩 -->
    <button ref="backdropRef" type="button"
      class="pointer-events-none fixed inset-0 z-[75] cursor-default bg-black/45 opacity-0" aria-label="關閉選單"
      @click="closeDrawer"></button>

    <!-- 抽屜（收起狀態見下方 style 的 #navigation-drawer） -->
    <aside id="navigation-drawer" ref="drawerRef"
      class="fixed inset-y-0 right-0 z-[80] flex w-[min(88vw,380px)] flex-col justify-center overflow-hidden bg-ink px-8 shadow-2xl sm:px-10"
      aria-label="網站選單">
      <div class="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-brand/10 blur-3xl"></div>

      <button ref="closeBtnRef" type="button"
        class="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="關閉選單" @click="closeDrawer">
        <span class="relative block h-4 w-4">
          <span class="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 rotate-45 rounded-full bg-white"></span>
          <span class="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 -rotate-45 rounded-full bg-white"></span>
        </span>
      </button>

      <div class="relative z-10 flex flex-col gap-8">
        <a :href="sectionHref('#about')"
          class="drawer-link text-2xl font-semibold tracking-wide text-white transition-colors hover:text-brand sm:text-3xl"
          @click="handleNavLinkClick($event, '#about')">
          {{ aboutText }}
        </a>

        <div class="drawer-link">
          <a :href="sectionHref('#service')"
            class="text-2xl font-semibold tracking-wide text-white transition-colors hover:text-brand sm:text-3xl"
            @click="handleNavLinkClick($event, '#service')">
            {{ serviceText }}
          </a>

          <!-- 捲過 About 之後桌機也只剩這個抽屜，三個服務在這裡一樣要進得去 -->
          <div class="mt-4 flex flex-col gap-3 border-l border-white/15 pl-4">
            <a v-for="service in services" :key="service.slug" :href="getServiceHref(service.slug)"
              class="text-base text-white/70 transition-colors hover:text-brand"
              @click="handleDrawerServiceSelect($event, service.slug)">
              {{ service.tag }}
            </a>
          </div>
        </div>

        <a :href="sectionHref('#contact')"
          class="drawer-link text-2xl font-semibold tracking-wide text-white transition-colors hover:text-brand sm:text-3xl"
          @click="handleNavLinkClick($event, '#contact')">
          {{ contactText }}
        </a>

        <div class="drawer-cta">
          <HeroCTA :text="ctaText" :href="CONSULTATION_PATH" @click="handleDrawerConsultationClick" />
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
/*
 * 抽屜與遮罩的收起狀態必須寫在樣式裡，不能只靠 onMounted 的 gsap.set。
 * 每個路由頁各自掛一份 Navigation（key 是 route.fullPath），所以從服務詳情頁
 * 返回首頁是一次全新掛載；gsap.set 前面還 await 了一個 nextTick，量到的空窗
 * 大約 20ms —— 足夠畫出一格「抽屜整個展開＋遮罩全黑」的畫面，看起來就像它
 * 自己打開了。
 *
 * 用 visibility 而不是 transform / translate：GSAP 會把元素既有的位移疊進自己
 * 的基準值（實測變成 translate(100%) translate(380px)），抽屜就再也推不開。
 * visibility 沒有人碰，onMounted 那次 gsap.set 直接用 inline 蓋掉。
 */
#navigation-drawer {
  visibility: hidden;
}

nav,
nav * {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
