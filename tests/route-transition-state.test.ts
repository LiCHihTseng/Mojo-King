import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyHistoryDirection,
  createBackNavigationWatchState,
  createRouteTransitionState,
  didBackNavigationReachHome,
  shouldAppOwnRouteScroll,
  shouldRememberHomeScrollOnPopstate,
} from "../src/lib/routeTransitionState.ts";

test("transition lock rejects duplicate navigation", () => {
  const state = createRouteTransitionState();

  assert.equal(state.begin("forward"), true);
  assert.equal(state.begin("forward"), false);

  state.finish();

  assert.equal(state.begin("back"), true);
});

test("home scroll is recorded and reset explicitly", () => {
  const state = createRouteTransitionState();

  state.rememberHomeScroll(2840);
  assert.equal(state.homeScrollY, 2840);

  state.clearHomeScroll();
  assert.equal(state.homeScrollY, null);
});

test("home scroll is clamped to the top of the document", () => {
  const state = createRouteTransitionState();

  state.rememberHomeScroll(-120);

  assert.equal(state.homeScrollY, 0);
});

test("service detail transitions delegate scroll ownership to the app shell", () => {
  assert.equal(shouldAppOwnRouteScroll("service-detail", "home"), true);
  assert.equal(shouldAppOwnRouteScroll("home", "service-detail"), true);
  assert.equal(shouldAppOwnRouteScroll("home", "home"), false);
});

test("history position classifies browser Back and Forward independently", () => {
  assert.equal(classifyHistoryDirection(5, 4), "back");
  assert.equal(classifyHistoryDirection(4, 5), "forward");
  assert.equal(classifyHistoryDirection(4, 4), "direct");
  assert.equal(classifyHistoryDirection(null, 5), "direct");
});

test("back navigation reaches home only without failure on the home route", () => {
  assert.equal(didBackNavigationReachHome("home", false), true);
  assert.equal(didBackNavigationReachHome("service-detail", false), false);
  assert.equal(didBackNavigationReachHome("home", true), false);
});

test("browser Forward remembers home scroll only while leaving home", () => {
  assert.equal(shouldRememberHomeScrollOnPopstate("forward", "home"), true);
  assert.equal(
    shouldRememberHomeScrollOnPopstate("forward", "service-detail"),
    false,
  );
  assert.equal(shouldRememberHomeScrollOnPopstate("back", "home"), false);
});

test("a popstate acknowledgement disables only the no-popstate fallback", () => {
  const watch = createBackNavigationWatchState();

  assert.equal(watch.shouldFallbackForNoPopstate(), true);
  watch.acknowledgePopstate();
  assert.equal(watch.shouldFallbackForNoPopstate(), false);
});
