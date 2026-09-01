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
}

/*
 * hover 與 pointer 問的是「主要」輸入裝置，手機與平板本來就過不了這兩關，
 * 所以這裡不再多看 (any-pointer: coarse)。那條件問的是「有沒有任何一種粗
 * 指標」，觸控筆電（Surface Laptop 這類，現在 Windows 筆電多半有觸控螢幕）
 * 即使實際上是用觸控板操作也會命中，等於把一整類真正的桌機使用者踢去看
 * 靜態版，看不到釘住捲動的翻頁。
 */
export function resolveServiceMotionMode({
  isWideViewport,
  canHover,
  hasFinePointer,
}: ServiceDeviceCapabilities): ServiceMotionMode {
  return isWideViewport && canHover && hasFinePointer ? "desktop" : "mobile";
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
