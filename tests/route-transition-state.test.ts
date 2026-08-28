import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyRouteTransition,
  classifyHistoryDirection,
  createBackNavigationWatchState,
  createRouteTransitionVisualPlan,
  createRouteTransitionState,
  getPinnedPageTop,
  didBackNavigationReachHome,
  ROUTE_TRANSITION_MODE,
  shouldAppOwnRouteScroll,
  shouldAnimateRouteTransition,
  shouldRememberHomeScrollOnPopstate,
} from "../src/lib/routeTransitionState.ts";

test("transition lock rejects duplicate navigation", () => {
  const state = createRouteTransitionState();

  assert.equal(state.begin("forward"), true);
  assert.equal(state.begin("forward"), false);

  state.finish();

  assert.equal(state.begin("back"), true);
});

test("an in-flight history navigation can replace the active direction", () => {
  const state = createRouteTransitionState();

  assert.equal(state.begin("forward"), true);
  state.replace("back");

  assert.equal(state.active, true);
  assert.equal(state.direction, "back");
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

test("service route names classify navigation before components unmount", () => {
  assert.equal(classifyRouteTransition("service-detail", "home"), "forward");
  assert.equal(classifyRouteTransition("home", "service-detail"), "back");
  assert.equal(classifyRouteTransition("home", "home"), "direct");
});

test("forward navigation keeps the homepage visible while detail rises over it", () => {
  const plan = createRouteTransitionVisualPlan("forward", false);

  assert.equal(ROUTE_TRANSITION_MODE, "in-out");
  assert.deepEqual(plan, {
    incomingYPercent: 100,
    outgoingAutoAlpha: 0.72,
    overlayAutoAlpha: 0.34,
    closeOutgoingNavigation: true,
    preserveOutgoingLayout: true,
    captureOutgoingServiceStage: true,
    hideOutgoingPageBehindSnapshot: true,
    backExitViewportFactor: 0,
    homeScrollY: 0,
  });
});

test("back transition offsets the outgoing detail without moving above the viewport", () => {
  assert.equal(getPinnedPageTop(6000), -6000);
  assert.equal(getPinnedPageTop(-40), 0);
});

test("back navigation stacks the homepage upward from the bottom", () => {
  const plan = createRouteTransitionVisualPlan("back", false);

  assert.equal(plan.incomingYPercent, 100);
  assert.equal(plan.outgoingAutoAlpha, 0.82);
  assert.equal(plan.overlayAutoAlpha, 0.18);
  assert.equal(plan.backExitViewportFactor, 0);
  assert.equal(plan.homeScrollY, 0);
  assert.equal(plan.closeOutgoingNavigation, false);
  assert.equal(plan.preserveOutgoingLayout, false);
  assert.equal(plan.captureOutgoingServiceStage, false);
  assert.equal(plan.hideOutgoingPageBehindSnapshot, false);
});

test("reduced motion removes route translation and dimming", () => {
  assert.deepEqual(createRouteTransitionVisualPlan("forward", true), {
    incomingYPercent: 0,
    outgoingAutoAlpha: 1,
    overlayAutoAlpha: 0,
    closeOutgoingNavigation: true,
    preserveOutgoingLayout: true,
    captureOutgoingServiceStage: false,
    hideOutgoingPageBehindSnapshot: false,
    backExitViewportFactor: 0,
    homeScrollY: 0,
  });
});

test("initial route mount does not start an orphaned transition", () => {
  assert.equal(shouldAnimateRouteTransition(false, false), false);
  assert.equal(shouldAnimateRouteTransition(false, true), true);
  assert.equal(shouldAnimateRouteTransition(true, false), true);
});

test("the consultation page uses the same overlay transition as service detail", () => {
  assert.equal(shouldAppOwnRouteScroll("consultation", "home"), true);
  assert.equal(shouldAppOwnRouteScroll("home", "consultation"), true);
  assert.equal(classifyRouteTransition("consultation", "home"), "forward");
  assert.equal(classifyRouteTransition("home", "consultation"), "back");
  assert.equal(
    classifyRouteTransition("consultation", "service-detail"),
    "direct",
  );
});
