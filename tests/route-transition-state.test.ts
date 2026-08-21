import assert from "node:assert/strict";
import test from "node:test";
import { createRouteTransitionState } from "../src/lib/routeTransitionState.ts";

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
