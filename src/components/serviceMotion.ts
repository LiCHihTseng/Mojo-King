export type ServiceMotionMode = "desktop" | "mobile";

export interface ServiceMotionPlan {
  pin: boolean;
  initialYPercent: number[];
  incomingSceneIndexes: number[];
  firstSceneCopyStartsVisible: boolean;
  animateFirstSceneCopyWithIntro: boolean;
}

export interface ServiceAccessibilityPlan {
  introCopyInteractive: boolean;
  sceneInteractive: boolean[];
}

export type IntroCopyTransitionState =
  | "initial"
  | "forward-complete"
  | "reverse-start";

interface ServiceDeviceCapabilities {
  isWideViewport: boolean;
  canHover: boolean;
  hasFinePointer: boolean;
  hasCoarsePointer: boolean;
}

export function resolveServiceMotionMode({
  isWideViewport,
  canHover,
  hasFinePointer,
  hasCoarsePointer,
}: ServiceDeviceCapabilities): ServiceMotionMode {
  return isWideViewport && canHover && hasFinePointer && !hasCoarsePointer
    ? "desktop"
    : "mobile";
}

export function createServiceMotionPlan(
  sceneCount: number,
  mode: ServiceMotionMode,
  introEnabled = false,
): ServiceMotionPlan {
  const sceneIndexes = Array.from({ length: sceneCount }, (_, index) => index);
  const isDesktop = mode === "desktop";
  const animateFirstSceneCopyWithIntro = isDesktop && introEnabled;

  return {
    pin: isDesktop,
    initialYPercent: sceneIndexes.map((index) =>
      isDesktop && index > 0 ? 100 : 0,
    ),
    incomingSceneIndexes: isDesktop ? sceneIndexes.slice(1) : [],
    firstSceneCopyStartsVisible: !animateFirstSceneCopyWithIntro,
    animateFirstSceneCopyWithIntro,
  };
}

export function createServiceAccessibilityPlan(
  sceneCount: number,
  mode: ServiceMotionMode,
  introEnabled: boolean,
  activeSceneIndex: number | null,
): ServiceAccessibilityPlan {
  const count = Math.max(0, sceneCount);

  if (mode === "mobile") {
    return {
      introCopyInteractive: false,
      sceneInteractive: Array.from({ length: count }, () => true),
    };
  }

  if (activeSceneIndex === null) {
    return {
      introCopyInteractive: false,
      sceneInteractive: Array.from({ length: count }, () => false),
    };
  }

  const safeActiveIndex = Math.min(
    Math.max(activeSceneIndex, 0),
    Math.max(0, count - 1),
  );
  const introCopyInteractive = introEnabled && count > 0 && safeActiveIndex === 0;

  return {
    introCopyInteractive,
    sceneInteractive: Array.from(
      { length: count },
      (_, index) => !introCopyInteractive && index === safeActiveIndex,
    ),
  };
}

export function createIntroCopyAccessibilityPlan(
  sceneCount: number,
  state: IntroCopyTransitionState,
): ServiceAccessibilityPlan {
  return createServiceAccessibilityPlan(
    sceneCount,
    "desktop",
    true,
    state === "forward-complete" ? 0 : null,
  );
}
