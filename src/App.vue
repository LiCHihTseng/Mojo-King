<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, provide, readonly, ref } from "vue";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { waitForCriticalImages } from "./lib/pageReadiness";
import { isNavigationFailure, useRouter } from "vue-router";

import MojoKingLoader from "./components/MojoKingLoader.vue";
import { entranceReadyKey, routeTransitionKey } from "./lib/appShell";
import {
  classifyHistoryDirection,
  classifyRouteTransition,
  createBackNavigationWatchState,
  createRouteTransitionVisualPlan,
  createRouteTransitionState,
  didBackNavigationReachHome,
  getPinnedPageTop,
  ROUTE_TRANSITION_MODE,
  shouldAnimateRouteTransition,
  shouldRememberHomeScrollOnPopstate,
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
let backPopstateAcknowledgement: (() => void) | null = null;
let backNavigationWatchState: ReturnType<
  typeof createBackNavigationWatchState
> | null = null;
let activeEnteringPage: HTMLElement | null = null;
let activeOutgoingPage: HTMLElement | null = null;
let activeOutgoingSnapshot: HTMLElement | null = null;
let transitionGeneration = 0;
let activeEnterDone: (() => void) | null = null;
let activeEnterGeneration = 0;
let completingEnterGeneration: number | null = null;
const pageTransitionGenerations = new WeakMap<HTMLElement, number>();

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

const lockDocument = (preserveLayout = false) => {
  document.documentElement.classList.add(
    preserveLayout
      ? "route-transition-input-locked"
      : "route-transition-locked",
  );
  lenis?.stop();
};

const unlockDocument = () => {
  document.documentElement.classList.remove("route-transition-locked");
  document.documentElement.classList.remove("route-transition-input-locked");
  lenis?.start();
};

const blockTransitionScroll = (event: Event) => {
  if (routeState.active) event.preventDefault();
};

const setOverlayHidden = () => {
  if (transitionOverlay.value) {
    gsap.set(transitionOverlay.value, { autoAlpha: 0 });
  }
};

const clearTransitionPageStyles = (page: HTMLElement | null) => {
  if (!page) return;

  gsap.set(page, {
    clearProps:
      "position,top,right,bottom,left,width,height,overflowY,zIndex,transform,willChange,opacity,visibility,pointerEvents",
  });
};

const resetTransitionPages = () => {
  const pages = new Set([activeEnteringPage, activeOutgoingPage]);
  pages.forEach(clearTransitionPageStyles);
  activeOutgoingSnapshot?.remove();
  activeEnteringPage = null;
  activeOutgoingPage = null;
  activeOutgoingSnapshot = null;
};

const clearBackNoPopstateWatchdog = () => {
  if (backNavigationTimer !== null) {
    window.clearTimeout(backNavigationTimer);
    backNavigationTimer = null;
  }
};

const clearBackPopstateAcknowledgement = () => {
  if (backPopstateAcknowledgement) {
    window.removeEventListener("popstate", backPopstateAcknowledgement);
    backPopstateAcknowledgement = null;
  }
};

const clearBackNavigationWatch = () => {
  clearBackNoPopstateWatchdog();
  clearBackPopstateAcknowledgement();
  removeBackNavigationGuard?.();
  removeBackNavigationGuard = null;
  backNavigationWatchState = null;
};

const finishTransition = () => {
  clearBackNavigationWatch();
  resetTransitionPages();
  setOverlayHidden();
  unlockDocument();
  routeState.finish();
  isTransitioning.value = false;
};

const resolveActiveEnter = () => {
  const done = activeEnterDone;
  const generation = activeEnterGeneration;
  activeEnterDone = null;
  activeEnterGeneration = 0;
  if (!done) return;

  completingEnterGeneration = generation;
  done();
  completingEnterGeneration = null;
};

const cancelTransition = () => {
  routeTimeline?.kill();
  routeTimeline = null;
  finishTransition();
  resolveActiveEnter();
};

const beginRouteTransition = (
  direction: "direct" | "forward" | "back",
) => {
  if (!routeState.begin(direction)) return false;
  transitionGeneration += 1;
  return true;
};

const createRouteTimeline = (vars?: gsap.TimelineVars) => {
  routeTimeline?.kill();

  routeTimeline = routeContext
    ? routeContext.add(() => gsap.timeline(vars))
    : gsap.timeline(vars);
  return routeTimeline;
};

const setWindowScrollTop = () => {
  const { homeScrollY } = createRouteTransitionVisualPlan("back", true);
  window.scrollTo(0, homeScrollY);
  lenis?.scrollTo(homeScrollY, { immediate: true, force: true });
};

const findOtherRoutePage = (page: HTMLElement) =>
  Array.from(
    appRoot.value?.querySelectorAll<HTMLElement>("[data-route-page]") ?? [],
  ).find((candidate) => candidate !== page) ?? null;

const closeOutgoingNavigationLayers = (page: HTMLElement) => {
  const backdrop = page.querySelector<HTMLElement>(
    'button[aria-label="關閉選單"].fixed.inset-0',
  );
  const drawer = page.querySelector<HTMLElement>("#navigation-drawer");
  const targets = [backdrop, drawer].filter(
    (target): target is HTMLElement => Boolean(target),
  );

  if (targets.length) gsap.killTweensOf(targets);
  if (backdrop) {
    gsap.set(backdrop, { opacity: 0, pointerEvents: "none" });
  }
  if (drawer) gsap.set(drawer, { xPercent: 100 });
};

const freezeOutgoingDetailParallax = (page: HTMLElement) => {
  const image = page.querySelector<HTMLElement>("[data-parallax-image]");
  if (!image) return;

  const transform = getComputedStyle(image).transform;
  ScrollTrigger.getAll().forEach((trigger) => {
    const triggerElement = trigger.trigger;
    if (triggerElement instanceof Element && page.contains(triggerElement)) {
      trigger.disable(false, false);
    }
  });
  image.style.transform = transform === "none" ? "" : transform;
  image.style.willChange = "transform";
};

const captureOutgoingServiceStage = () => {
  activeOutgoingSnapshot?.remove();
  activeOutgoingSnapshot = null;

  const source = appRoot.value?.querySelector<HTMLElement>(
    '[data-route-kind="home"] .service-stage',
  );
  if (!source) return;

  const rect = source.getBoundingClientRect();
  if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;

  const snapshot = source.cloneNode(true) as HTMLElement;
  snapshot.dataset.routeTransitionSnapshot = "service-stage";
  snapshot.setAttribute("aria-hidden", "true");
  snapshot.setAttribute("inert", "");
  snapshot.querySelectorAll("[id]").forEach((element) => {
    element.removeAttribute("id");
  });

  appRoot.value?.append(snapshot);
  gsap.set(snapshot, {
    position: "fixed",
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    margin: 0,
    zIndex: 1,
    pointerEvents: "none",
    overflow: "hidden",
    willChange: "opacity",
  });
  activeOutgoingSnapshot = snapshot;
};

const beginImplicitTransition = () => {
  if (routeState.active) return;

  const direction = router.currentRoute.value.name === "service-detail"
    ? "forward"
    : "back";
  beginRouteTransition(direction);
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
  if (!beginRouteTransition("forward")) return;

  if (router.currentRoute.value.name === "home") {
    routeState.rememberHomeScroll(window.scrollY);
  }

  const plan = createRouteTransitionVisualPlan("forward", isReducedMotion());
  if (plan.captureOutgoingServiceStage) captureOutgoingServiceStage();

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
    const failure = await router.push("/");
    if (isNavigationFailure(failure)) cancelTransition();
  } catch {
    cancelTransition();
  }
};

const navigateBackWithFallback = () => {
  clearBackNavigationWatch();
  backNavigationWatchState = createBackNavigationWatchState();

  removeBackNavigationGuard = router.afterEach((to, _from, failure) => {
    const reachedHome = didBackNavigationReachHome(to.name, Boolean(failure));
    clearBackNavigationWatch();
    if (!reachedHome) void pushHomeFallback();
  });

  backPopstateAcknowledgement = () => {
    backNavigationWatchState?.acknowledgePopstate();
    clearBackNoPopstateWatchdog();
    clearBackPopstateAcknowledgement();
  };
  window.addEventListener("popstate", backPopstateAcknowledgement, { once: true });

  // Accepted Router navigations resolve their afterEach hook before the GSAP
  // leave finishes. This short watchdog only covers a history back no-op.
  backNavigationTimer = window.setTimeout(() => {
    if (backNavigationWatchState?.shouldFallbackForNoPopstate()) {
      void pushHomeFallback();
    }
  }, 400);

  router.back();
};

const returnToServices = async () => {
  if (!beginRouteTransition("back")) return;

  isTransitioning.value = true;

  try {
    if (routeState.homeScrollY !== null) {
      navigateBackWithFallback();
      return;
    }

    const failure = await router.push("/");
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

  // 只等待首屏關鍵圖片，並保留短暫的品牌動畫時間。字型與折下內容
  // 不再阻塞 Loader；它們完成後會由上方的 fonts.ready 再 refresh。
  await Promise.all([
    waitForCriticalImages(
      document.querySelectorAll<HTMLImageElement>("[data-critical-image]"),
    ),
    new Promise((resolve) => setTimeout(resolve, 650)),
  ]);

  // 讓各區塊的 onMounted / ScrollTrigger 註冊先完成，再開始 Loader 離場。
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

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

const handleBeforeEnter = (element: Element) => {
  const page = element as HTMLElement;
  const outgoingPage = findOtherRoutePage(page);
  if (!shouldAnimateRouteTransition(routeState.active, Boolean(outgoingPage))) {
    activeEnteringPage = null;
    activeOutgoingPage = null;
    return;
  }

  beginImplicitTransition();
  const reducedMotion = isReducedMotion();
  const plan = createRouteTransitionVisualPlan(
    routeState.direction,
    reducedMotion,
  );
  const outgoingScrollY = window.scrollY;
  lockDocument(plan.preserveOutgoingLayout);

  const overlay = transitionOverlay.value;

  activeEnteringPage = page;
  activeOutgoingPage = outgoingPage;
  pageTransitionGenerations.set(page, transitionGeneration);

  if (overlay) gsap.set(overlay, { autoAlpha: 0 });
  if (plan.captureOutgoingServiceStage && !activeOutgoingSnapshot) {
    captureOutgoingServiceStage();
  }
  if (plan.closeOutgoingNavigation && activeOutgoingPage) {
    closeOutgoingNavigationLayers(activeOutgoingPage);
  }
  if (
    plan.hideOutgoingPageBehindSnapshot &&
    activeOutgoingSnapshot &&
    activeOutgoingPage
  ) {
    gsap.set(activeOutgoingPage, {
      autoAlpha: 0,
      pointerEvents: "none",
    });
  }

  if (routeState.direction === "back") {
    if (activeOutgoingPage) {
      freezeOutgoingDetailParallax(activeOutgoingPage);
      gsap.set(activeOutgoingPage, {
        position: "fixed",
        top: getPinnedPageTop(outgoingScrollY),
        right: 0,
        left: 0,
        width: "100%",
        zIndex: 0,
        willChange: reducedMotion ? "auto" : "opacity",
      });
    }
    setWindowScrollTop();
    gsap.set(page, {
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      width: "100%",
      overflowY: "hidden",
      zIndex: 100,
      yPercent: plan.incomingYPercent,
      willChange: reducedMotion ? "auto" : "transform",
    });
    return;
  }

  gsap.set(page, {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    overflowY: "hidden",
    zIndex: 100,
    yPercent: plan.incomingYPercent,
    willChange: reducedMotion ? "auto" : "transform",
  });
};

const handleEnter = (element: Element, done: () => void) => {
  const page = element as HTMLElement;
  if (!shouldAnimateRouteTransition(routeState.active, Boolean(activeOutgoingPage))) {
    done();
    return;
  }

  const overlay = transitionOverlay.value;
  const reducedMotion = isReducedMotion();
  const plan = createRouteTransitionVisualPlan(
    routeState.direction,
    reducedMotion,
  );

  if (reducedMotion) {
    gsap.set(page, { yPercent: 0 });
    done();
    return;
  }

  activeEnterDone = done;
  activeEnterGeneration = transitionGeneration;
  const completeEnter = () => {
    if (activeEnterDone !== done) return;
    resolveActiveEnter();
  };

  const timeline = createRouteTimeline({ onComplete: completeEnter }).to(page, {
    yPercent: 0,
    duration: 0.9,
    ease: "power3.inOut",
  }, 0);

  const outgoingVisual = activeOutgoingSnapshot ?? activeOutgoingPage;
  if (outgoingVisual) {
    timeline.to(outgoingVisual, {
      autoAlpha: plan.outgoingAutoAlpha,
      duration: 0.9,
      ease: "power2.inOut",
    }, 0);
  }

  if (overlay) {
    timeline.to(overlay, {
      autoAlpha: plan.overlayAutoAlpha,
      duration: 0.9,
      ease: "power2.inOut",
    }, 0);
  }
};

const handleBeforeLeave = (element: Element) => {
  const page = element as HTMLElement;
  activeOutgoingPage = page;
  pageTransitionGenerations.set(
    page,
    completingEnterGeneration ?? transitionGeneration,
  );
};

const handleLeave = (_element: Element, done: () => void) => done();

const handleAfterLeave = (element: Element) => {
  const page = element as HTMLElement;
  const generation = pageTransitionGenerations.get(page);
  if (generation !== undefined && generation !== transitionGeneration) {
    clearTransitionPageStyles(page);
    return;
  }

  const enteringPage = activeEnteringPage;
  const returningHome = routeState.direction === "back";

  setWindowScrollTop();
  finishTransition();

  if (returningHome) ScrollTrigger.refresh();
  if (enteringPage?.dataset.routeKind === "detail") focusDetailHeading();
  scheduleRefresh();
};

const handleEnterCancelled = (element: Element) => {
  const page = element as HTMLElement;
  const generation = pageTransitionGenerations.get(page);
  clearTransitionPageStyles(page);
  if (generation === transitionGeneration && routeState.active) {
    cancelTransition();
  }
};

const handleLeaveCancelled = (element: Element) => {
  clearTransitionPageStyles(element as HTMLElement);
};

const handlePopState = (event: PopStateEvent) => {
  const destinationPosition = readHistoryPosition(event.state);
  const direction = classifyHistoryDirection(
    currentHistoryPosition,
    destinationPosition,
  );
  if (
    shouldRememberHomeScrollOnPopstate(
      direction,
      router.currentRoute.value.name,
    )
  ) {
    routeState.rememberHomeScroll(window.scrollY);
  }
  if (destinationPosition !== null) currentHistoryPosition = destinationPosition;
  if (direction === "direct") return;
  if (routeState.active) {
    cancelTransition();
    routeState.replace(direction);
    transitionGeneration += 1;
  } else if (!beginRouteTransition(direction)) {
    return;
  }
  isTransitioning.value = true;
};

const removeHistoryPositionSync = router.afterEach(() => {
  const position = readHistoryPosition(window.history.state);
  if (position !== null) currentHistoryPosition = position;
});

const removeTransitionGuard = router.beforeEach((to, from) => {
  const direction = classifyRouteTransition(to.name, from.name);
  if (direction === "direct") return true;

  if (routeState.active && routeState.direction !== direction) {
    cancelTransition();
    routeState.replace(direction);
    transitionGeneration += 1;
  } else if (!routeState.active) {
    beginRouteTransition(direction);
  }
  isTransitioning.value = true;
  return true;
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
  window.removeEventListener("popstate", handlePopState, true);
  removeHistoryPositionSync();
  removeTransitionGuard();
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
  // Capture history intent before Vue Router tears down the outgoing detail,
  // so its current parallax frame can be frozen without a visual reset.
  window.addEventListener("popstate", handlePopState, { capture: true });
});
</script>

<!-- App.vue -->
<template>
  <div
    ref="appRoot"
    class="relative"
    @wheel="blockTransitionScroll"
    @touchmove="blockTransitionScroll"
  >
    <RouterView v-slot="{ Component, route }">
      <Transition
        :css="false"
        :mode="ROUTE_TRANSITION_MODE"
        @before-leave="handleBeforeLeave"
        @leave="handleLeave"
        @after-leave="handleAfterLeave"
        @leave-cancelled="handleLeaveCancelled"
        @before-enter="handleBeforeEnter"
        @enter="handleEnter"
        @enter-cancelled="handleEnterCancelled"
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
