export type RouteTransitionDirection = "direct" | "forward" | "back";

export const ROUTE_TRANSITION_MODE = "in-out" as const;

export function getPinnedPageTop(scrollY: number) {
  return scrollY > 0 ? -scrollY : 0;
}

export function shouldAnimateRouteTransition(
  transitionActive: boolean,
  hasOutgoingPage: boolean,
) {
  return transitionActive || hasOutgoingPage;
}

export function createRouteTransitionVisualPlan(
  direction: RouteTransitionDirection,
  reducedMotion: boolean,
) {
  const forward = direction === "forward" && !reducedMotion;
  const back = direction === "back" && !reducedMotion;
  const movingIncomingPage = forward || back;

  return {
    incomingYPercent: movingIncomingPage ? 100 : 0,
    outgoingAutoAlpha: forward ? 0.72 : back ? 0.82 : 1,
    overlayAutoAlpha: forward ? 0.34 : back ? 0.18 : 0,
    closeOutgoingNavigation: direction === "forward",
    preserveOutgoingLayout: direction === "forward",
    captureOutgoingServiceStage: forward,
    hideOutgoingPageBehindSnapshot: forward,
    backExitViewportFactor: 0,
    homeScrollY: 0,
  };
}

export function shouldAppOwnRouteScroll(toName: unknown, fromName: unknown) {
  return toName === "service-detail" || fromName === "service-detail";
}

export function classifyHistoryDirection(
  previousPosition: number | null,
  destinationPosition: number | null,
): RouteTransitionDirection {
  if (previousPosition === null || destinationPosition === null) return "direct";
  if (destinationPosition > previousPosition) return "forward";
  if (destinationPosition < previousPosition) return "back";
  return "direct";
}

export function classifyRouteTransition(toName: unknown, fromName: unknown) {
  if (toName === "service-detail" && fromName === "home") return "forward";
  if (toName === "home" && fromName === "service-detail") return "back";
  return "direct";
}

export function didBackNavigationReachHome(
  destinationName: unknown,
  failed: boolean,
) {
  return !failed && destinationName === "home";
}

export function shouldRememberHomeScrollOnPopstate(
  direction: RouteTransitionDirection,
  currentRouteName: unknown,
) {
  return direction === "forward" && currentRouteName === "home";
}

export function createBackNavigationWatchState() {
  let popstateAcknowledged = false;

  return {
    acknowledgePopstate() {
      popstateAcknowledged = true;
    },
    shouldFallbackForNoPopstate() {
      return !popstateAcknowledged;
    },
  };
}

export function createRouteTransitionState() {
  let active = false;
  let direction: RouteTransitionDirection = "direct";
  let homeScrollY: number | null = null;

  return {
    get active() {
      return active;
    },
    get direction() {
      return direction;
    },
    get homeScrollY() {
      return homeScrollY;
    },
    begin(next: RouteTransitionDirection) {
      if (active) return false;

      active = true;
      direction = next;
      return true;
    },
    replace(next: RouteTransitionDirection) {
      active = true;
      direction = next;
    },
    finish() {
      active = false;
      direction = "direct";
    },
    rememberHomeScroll(value: number) {
      homeScrollY = Math.max(0, value);
    },
    clearHomeScroll() {
      homeScrollY = null;
    },
  };
}
