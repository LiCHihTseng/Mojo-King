<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, provide, readonly, ref } from "vue";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isNavigationFailure, useRouter } from "vue-router";

import MojoKingLoader from "./components/MojoKingLoader.vue";
import { entranceReadyKey, routeTransitionKey } from "./lib/appShell";
import {
  classifyHistoryDirection,
  createRouteTransitionState,
  didBackNavigationReachHome,
} from "./lib/routeTransitionState";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let routeContext: gsap.Context | null = null;
let routeTimeline: gsap.core.Timeline | null = null;
let refreshFrame = 0;
let focusFrame = 0;
let mounted = false;
let backNavigationTimer: number | null = null;
let removeBackNavigationGuard: (() => void) | null = null;

const router = useRouter();
const routeState = createRouteTransitionState();
const appRoot = ref<HTMLElement | null>(null);
const transitionOverlay = ref<HTMLElement | null>(null);
const isTransitioning = ref(false);
const preloadedImages = new Map<string, HTMLImageElement>();

const readHistoryPosition = (state: unknown) => {
  if (!state || typeof state !== "object" || !("position" in state)) return null;
  const position = state.position;
  return typeof position === "number" ? position : null;
};

let currentHistoryPosition = readHistoryPosition(window.history.state);

// loader 顯示狀態 & 你實際的資料/資源是否還在載入
const showLoader = ref(true);
const isLoading = ref(true);
const entranceReady = ref(false);

provide(entranceReadyKey, readonly(entranceReady));

const isReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const scheduleRefresh = () => {
  cancelAnimationFrame(refreshFrame);
  refreshFrame = requestAnimationFrame(() => {
    if (mounted) ScrollTrigger.refresh();
  });
};

const focusDetailHeading = () => {
  cancelAnimationFrame(focusFrame);
  focusFrame = requestAnimationFrame(() => {
    const heading = document.querySelector<HTMLElement>("[data-detail-heading]");
    heading?.focus({ preventScroll: true });
  });
};

const lockDocument = () => {
  document.documentElement.classList.add("route-transition-locked");
  lenis?.stop();
};

const unlockDocument = () => {
  document.documentElement.classList.remove("route-transition-locked");
  lenis?.start();
};

const setOverlayHidden = () => {
  if (transitionOverlay.value) {
    gsap.set(transitionOverlay.value, { autoAlpha: 0 });
  }
};

const clearBackNavigationWatch = () => {
  if (backNavigationTimer !== null) {
    window.clearTimeout(backNavigationTimer);
    backNavigationTimer = null;
  }
  removeBackNavigationGuard?.();
  removeBackNavigationGuard = null;
};

const finishTransition = () => {
  clearBackNavigationWatch();
  setOverlayHidden();
  unlockDocument();
  routeState.finish();
  isTransitioning.value = false;
};

const cancelTransition = () => {
  routeTimeline?.kill();
  routeTimeline = null;
  finishTransition();
};

const createRouteTimeline = (vars?: gsap.TimelineVars) => {
  routeTimeline?.kill();

  routeTimeline = routeContext
    ? routeContext.add(() => gsap.timeline(vars))
    : gsap.timeline(vars);
  return routeTimeline;
};

const restoreHomeScroll = () => {
  const service = document.querySelector<HTMLElement>("#service");
  const serviceY = service
    ? window.scrollY + service.getBoundingClientRect().top
    : 0;
  const targetY = routeState.homeScrollY ?? serviceY;

  window.scrollTo(0, targetY);
  lenis?.scrollTo(targetY, { immediate: true, force: true });
};

const setDetailScrollTop = () => {
  window.scrollTo(0, 0);
  lenis?.scrollTo(0, { immediate: true, force: true });
};

const beginImplicitTransition = () => {
  if (routeState.active) return;

  const direction = router.currentRoute.value.name === "service-detail"
    ? "forward"
    : "back";
  routeState.begin(direction);
  isTransitioning.value = true;
};

const preloadImage = (src: string) => {
  if (!src || preloadedImages.has(src)) return;

  const image = new Image();
  image.decoding = "async";
  image.src = src;
  preloadedImages.set(src, image);
};

const navigateToService = async (href: string) => {
  if (!routeState.begin("forward")) return;

  if (router.currentRoute.value.name === "home") {
    routeState.rememberHomeScroll(window.scrollY);
  }

  isTransitioning.value = true;

  try {
    const failure = await router.push(href);
    if (isNavigationFailure(failure)) cancelTransition();
  } catch {
    cancelTransition();
  }
};

const pushHomeFallback = async () => {
  clearBackNavigationWatch();

  try {
    const failure = await router.push("/#service");
    if (isNavigationFailure(failure)) cancelTransition();
  } catch {
    cancelTransition();
  }
};

const navigateBackWithFallback = () => {
  clearBackNavigationWatch();

  removeBackNavigationGuard = router.afterEach((to, _from, failure) => {
    const reachedHome = didBackNavigationReachHome(to.name, Boolean(failure));
    clearBackNavigationWatch();
    if (!reachedHome) void pushHomeFallback();
  });

  // Accepted Router navigations resolve their afterEach hook before the GSAP
  // leave finishes. This short watchdog only covers a history back no-op.
  backNavigationTimer = window.setTimeout(() => {
    void pushHomeFallback();
  }, 400);

  router.back();
};

const returnToServices = async () => {
  if (!routeState.begin("back")) return;

  isTransitioning.value = true;

  try {
    if (routeState.homeScrollY !== null) {
      navigateBackWithFallback();
      return;
    }

    const failure = await router.push("/#service");
    if (isNavigationFailure(failure)) cancelTransition();
  } catch {
    cancelTransition();
  }
};

provide(routeTransitionKey, {
  isTransitioning: readonly(isTransitioning),
  navigateToService,
  returnToServices,
  preloadImage,
});

const updateLenis = (time: number) => {
  lenis?.raf(time * 1000);
};

const refreshAfterLayout = () => scheduleRefresh();

function initSmoothScroll() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion) return;

  lenis = new Lenis({
  duration: 0.95,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 1,
  syncTouch: false,
});
  // 讓 Lenis 每次更新捲動位置時，通知 ScrollTrigger 重新計算
  lenis.on("scroll", ScrollTrigger.update);

  // 用 GSAP 的 ticker 驅動 Lenis，比 requestAnimationFrame 更穩定
  gsap.ticker.add(updateLenis);

  gsap.ticker.lagSmoothing(0);
}

onMounted(async () => {
  mounted = true;
  if (appRoot.value) routeContext = gsap.context(() => {}, appRoot.value);

  if (document.readyState === "complete") {
    refreshAfterLayout();
  } else {
    window.addEventListener("load", refreshAfterLayout, { once: true });
  }

  document.fonts?.ready.then(refreshAfterLayout);

  // loader 蓋著的期間，先把捲動位置歸零，避免瀏覽器記憶上次的 scroll position
  window.scrollTo(0, 0);
  // loading 期間鎖住背景捲動，避免使用者在 loader 蓋著時偷滑到底層內容
  document.documentElement.style.overflow = "hidden";

  // TODO: 換成你實際的初始化流程（等字型、圖片、API 資料等準備好）
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // 通知 loader：資料/資源準備好了，可以開始 complete → reveal → swipe
  isLoading.value = false;
});

// MojoKingLoader 的 curve swipe 動畫「完全結束」後才會 emit 這個事件
async function handleLoaderDone() {
  showLoader.value = false;
  await nextTick();

  // Loader 已經完全離場後，才允許 Hero 與 Navigation 播放進場。
  entranceReady.value = true;
  document.documentElement.style.overflow = "";

  initSmoothScroll();

  // 這時候版面（字型、圖片、loader 移除後的 layout）才是最終穩定狀態
  // 重新量測一次 ScrollTrigger，避免 pin/trigger 位置跟實際版面對不上
  scheduleRefresh();

  if (router.currentRoute.value.name === "service-detail") {
    focusDetailHeading();
  }
}

const handleBeforeLeave = (element: Element) => {
  beginImplicitTransition();
  lockDocument();

  const page = element as HTMLElement;
  const overlay = transitionOverlay.value;
  if (!overlay) return;

  if (routeState.direction === "back") {
    gsap.set(overlay, { autoAlpha: 1 });
    gsap.set(page, {
      position: "relative",
      zIndex: 100,
      willChange: isReducedMotion() ? "auto" : "transform",
    });
    return;
  }

  gsap.set(overlay, { autoAlpha: 0 });
};

const handleLeave = (element: Element, done: () => void) => {
  const page = element as HTMLElement;
  const overlay = transitionOverlay.value;

  if (!overlay) {
    done();
    return;
  }

  if (routeState.direction === "back") {
    if (isReducedMotion()) {
      done();
      return;
    }

    createRouteTimeline({ onComplete: done }).to(page, {
      yPercent: 100,
      duration: 0.72,
      ease: "power3.inOut",
    });
    return;
  }

  createRouteTimeline({ onComplete: done }).to(overlay, {
    autoAlpha: 1,
    duration: isReducedMotion() ? 0.12 : 0.28,
    ease: "power2.out",
  });
};

const handleBeforeEnter = (element: Element) => {
  lockDocument();

  const page = element as HTMLElement;
  const overlay = transitionOverlay.value;
  if (!overlay) return;

  if (routeState.direction === "back") {
    restoreHomeScroll();
    gsap.set(page, { position: "relative", zIndex: 0 });
    gsap.set(overlay, { autoAlpha: 1 });
    return;
  }

  setDetailScrollTop();
  gsap.set(overlay, { autoAlpha: 1 });
  gsap.set(page, {
    position: "relative",
    zIndex: 100,
    yPercent: isReducedMotion() ? 0 : 100,
    willChange: isReducedMotion() ? "auto" : "transform",
  });
};

const handleEnter = (element: Element, done: () => void) => {
  const page = element as HTMLElement;
  const overlay = transitionOverlay.value;

  const complete = () => {
    const returningHome = routeState.direction === "back";
    gsap.set(page, { clearProps: "transform,willChange,zIndex,position" });
    finishTransition();
    if (returningHome) {
      ScrollTrigger.refresh();
      restoreHomeScroll();
      routeState.clearHomeScroll();
    }
    if (page.dataset.routeKind === "detail") focusDetailHeading();
    scheduleRefresh();
    done();
  };

  if (!overlay) {
    complete();
    return;
  }

  if (routeState.direction === "back") {
    createRouteTimeline({ onComplete: complete }).to(overlay, {
      autoAlpha: 0,
      duration: isReducedMotion() ? 0.12 : 0.28,
      ease: "power2.out",
    });
    return;
  }

  if (isReducedMotion()) {
    createRouteTimeline({ onComplete: complete }).to(overlay, {
      autoAlpha: 0,
      duration: 0.12,
      ease: "power2.out",
    });
    return;
  }

  createRouteTimeline({ onComplete: complete }).to(page, {
    yPercent: 0,
    duration: 0.85,
    ease: "power3.inOut",
  });
};

const handlePopState = (event: PopStateEvent) => {
  const destinationPosition = readHistoryPosition(event.state);
  const direction = classifyHistoryDirection(
    currentHistoryPosition,
    destinationPosition,
  );
  if (destinationPosition !== null) currentHistoryPosition = destinationPosition;
  if (direction === "direct" || !routeState.begin(direction)) return;
  isTransitioning.value = true;
};

const removeHistoryPositionSync = router.afterEach(() => {
  const position = readHistoryPosition(window.history.state);
  if (position !== null) currentHistoryPosition = position;
});

const removeRouterErrorHandler = router.onError(() => {
  if (backNavigationTimer !== null || removeBackNavigationGuard) {
    void pushHomeFallback();
    return;
  }
  cancelTransition();
});

onBeforeUnmount(() => {
  mounted = false;
  window.removeEventListener("load", refreshAfterLayout);
  window.removeEventListener("popstate", handlePopState);
  removeHistoryPositionSync();
  removeRouterErrorHandler();
  clearBackNavigationWatch();
  cancelAnimationFrame(refreshFrame);
  cancelAnimationFrame(focusFrame);
  routeTimeline?.kill();
  routeContext?.revert();
  routeTimeline = null;
  routeContext = null;
  finishTransition();
  preloadedImages.clear();
  gsap.ticker.remove(updateLenis);
  lenis?.destroy();
  lenis = null;
});

onMounted(() => {
  window.addEventListener("popstate", handlePopState);
});
</script>

<!-- App.vue -->
<template>
  <div ref="appRoot" class="relative">
    <RouterView v-slot="{ Component, route }">
      <Transition
        :css="false"
        mode="out-in"
        @before-leave="handleBeforeLeave"
        @leave="handleLeave"
        @before-enter="handleBeforeEnter"
        @enter="handleEnter"
      >
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>

    <div
      ref="transitionOverlay"
      aria-hidden="true"
      class="fixed inset-0 z-[90] bg-black opacity-0 invisible"
      :class="isTransitioning ? 'pointer-events-auto' : 'pointer-events-none'"
    ></div>

    <MojoKingLoader v-if="showLoader" :loading="isLoading" @done="handleLoaderDone" />
  </div>
</template>
