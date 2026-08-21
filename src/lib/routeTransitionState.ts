export type RouteTransitionDirection = "direct" | "forward" | "back";

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
