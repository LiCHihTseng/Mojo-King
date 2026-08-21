import assert from "node:assert/strict";
import test from "node:test";

test("desktop starts on the first scene and stacks the remaining scenes upward", async () => {
  const { createServiceMotionPlan } = await import(
    "../src/components/serviceMotion.ts"
  ).catch(() => ({ createServiceMotionPlan: undefined }));

  const plan = createServiceMotionPlan?.(4, "desktop", true);

  assert.deepEqual(plan, {
    pin: true,
    initialYPercent: [0, 100, 100, 100],
    incomingSceneIndexes: [1, 2, 3],
    firstSceneCopyStartsVisible: false,
    animateFirstSceneCopyWithIntro: true,
  });
});

test("mobile keeps all service scenes in normal document flow", async () => {
  const { createServiceMotionPlan } = await import(
    "../src/components/serviceMotion.ts"
  ).catch(() => ({ createServiceMotionPlan: undefined }));

  const plan = createServiceMotionPlan?.(4, "mobile");

  assert.deepEqual(plan, {
    pin: false,
    initialYPercent: [0, 0, 0, 0],
    incomingSceneIndexes: [],
    firstSceneCopyStartsVisible: true,
    animateFirstSceneCopyWithIntro: false,
  });
});

test("desktop without the intro keeps the first scene copy visible", async () => {
  const { createServiceMotionPlan } = await import(
    "../src/components/serviceMotion.ts"
  );

  const plan = createServiceMotionPlan(4, "desktop", false);

  assert.equal(plan.firstSceneCopyStartsVisible, true);
  assert.equal(plan.animateFirstSceneCopyWithIntro, false);
});

test("wide touch devices stay in the mobile static mode", async () => {
  const { resolveServiceMotionMode } = await import(
    "../src/components/serviceMotion.ts"
  );

  const mode = resolveServiceMotionMode?.({
    isWideViewport: true,
    canHover: false,
    hasFinePointer: false,
    hasCoarsePointer: true,
  });

  assert.equal(mode, "mobile");
});

test("wide devices with a precise pointer use the desktop story", async () => {
  const { resolveServiceMotionMode } = await import(
    "../src/components/serviceMotion.ts"
  );

  const mode = resolveServiceMotionMode?.({
    isWideViewport: true,
    canHover: true,
    hasFinePointer: true,
    hasCoarsePointer: false,
  });

  assert.equal(mode, "desktop");
});

test("hybrid touch devices stay in the mobile static mode", async () => {
  const { resolveServiceMotionMode } = await import(
    "../src/components/serviceMotion.ts"
  );

  const mode = resolveServiceMotionMode({
    isWideViewport: true,
    canHover: true,
    hasFinePointer: true,
    hasCoarsePointer: true,
  });

  assert.equal(mode, "mobile");
});

test("desktop intro exposes only its visible first-scene copy", async () => {
  const { createServiceAccessibilityPlan } = await import(
    "../src/components/serviceMotion.ts"
  );

  const plan = createServiceAccessibilityPlan(4, "desktop", true, 0);

  assert.deepEqual(plan, {
    introCopyInteractive: true,
    sceneInteractive: [false, false, false, false],
  });
});

test("desktop stacking exposes only the top completed scene", async () => {
  const { createServiceAccessibilityPlan } = await import(
    "../src/components/serviceMotion.ts"
  );

  const plan = createServiceAccessibilityPlan(4, "desktop", true, 2);

  assert.deepEqual(plan, {
    introCopyInteractive: false,
    sceneInteractive: [false, false, true, false],
  });
});

test("mobile keeps every inline scene interactive and hides the intro copy", async () => {
  const { createServiceAccessibilityPlan } = await import(
    "../src/components/serviceMotion.ts"
  );

  const plan = createServiceAccessibilityPlan(4, "mobile", false, 0);

  assert.deepEqual(plan, {
    introCopyInteractive: false,
    sceneInteractive: [true, true, true, true],
  });
});
