export type RouteTransitionDirection = "direct" | "forward" | "back";

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
