import assert from "node:assert/strict";
import test from "node:test";

test("desktop starts on the first scene and stacks the remaining scenes upward", async () => {
  const { createServiceMotionPlan } = await import(
    "../src/components/serviceMotion.ts"
  ).catch(() => ({ createServiceMotionPlan: undefined }));

  const plan = createServiceMotionPlan?.(3, "desktop", true);

  assert.deepEqual(plan, {
    pin: true,
    initialYPercent: [0, 100, 100],
    incomingSceneIndexes: [1, 2],
    firstSceneCopyStartsVisible: false,
    animateFirstSceneCopyWithIntro: true,
  });
});

test("mobile keeps all service scenes in normal document flow", async () => {
  const { createServiceMotionPlan } = await import(
    "../src/components/serviceMotion.ts"
  ).catch(() => ({ createServiceMotionPlan: undefined }));

  const plan = createServiceMotionPlan?.(3, "mobile");

  assert.deepEqual(plan, {
    pin: false,
    initialYPercent: [0, 0, 0],
    incomingSceneIndexes: [],
    firstSceneCopyStartsVisible: true,
    animateFirstSceneCopyWithIntro: false,
  });
});

test("desktop without the intro keeps the first scene copy visible", async () => {
  const { createServiceMotionPlan } = await import(
    "../src/components/serviceMotion.ts"
  );

  const plan = createServiceMotionPlan(3, "desktop", false);

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
  });

  assert.equal(mode, "desktop");
});

// 觸控筆電（Surface Laptop 這類）：主要輸入還是觸控板，該看桌機版翻頁
test("touchscreen laptops still get the desktop story", async () => {
  const { resolveServiceMotionMode } = await import(
    "../src/components/serviceMotion.ts"
  );

  const mode = resolveServiceMotionMode({
    isWideViewport: true,
    canHover: true,
    hasFinePointer: true,
  });

  assert.equal(mode, "desktop");
});

// 平板／手機：主要輸入是手指，hover 與 pointer 都過不了
test("touch-primary devices stay in the mobile static mode", async () => {
  const { resolveServiceMotionMode } = await import(
    "../src/components/serviceMotion.ts"
  );

  const mode = resolveServiceMotionMode({
    isWideViewport: true,
    canHover: false,
    hasFinePointer: false,
  });

  assert.equal(mode, "mobile");
});

test("desktop intro exposes only its visible first-scene copy", async () => {
  const { createServiceAccessibilityPlan } = await import(
    "../src/components/serviceMotion.ts"
  );

  const plan = createServiceAccessibilityPlan(3, "desktop", true, 0);

  assert.deepEqual(plan, {
    introCopyInteractive: true,
    sceneInteractive: [false, false, false],
  });
});

test("desktop stacking exposes only the top completed scene", async () => {
  const { createServiceAccessibilityPlan } = await import(
    "../src/components/serviceMotion.ts"
  );

  const plan = createServiceAccessibilityPlan(3, "desktop", true, 2);

  assert.deepEqual(plan, {
    introCopyInteractive: false,
    sceneInteractive: [false, false, true],
  });
});

test("mobile keeps every inline scene interactive and hides the intro copy", async () => {
  const { createServiceAccessibilityPlan } = await import(
    "../src/components/serviceMotion.ts"
  );

  const plan = createServiceAccessibilityPlan(3, "mobile", false, 0);

  assert.deepEqual(plan, {
    introCopyInteractive: false,
    sceneInteractive: [true, true, true],
  });
});

test("desktop transition gaps make every service CTA unavailable", async () => {
  const { createServiceAccessibilityPlan } = await import(
    "../src/components/serviceMotion.ts"
  );

  const plan = createServiceAccessibilityPlan(3, "desktop", true, null);

  assert.deepEqual(plan, {
    introCopyInteractive: false,
    sceneInteractive: [false, false, false],
  });
});

test("desktop intro keeps the first copy inactive before its fade completes", async () => {
  const { createIntroCopyAccessibilityPlan } = await import(
    "../src/components/serviceMotion.ts"
  ).catch(() => ({ createIntroCopyAccessibilityPlan: undefined }));

  const plan = createIntroCopyAccessibilityPlan?.(3, "initial");

  assert.deepEqual(plan, {
    introCopyInteractive: false,
    sceneInteractive: [false, false, false],
  });
});

test("desktop intro activates the first copy after its fade completes", async () => {
  const { createIntroCopyAccessibilityPlan } = await import(
    "../src/components/serviceMotion.ts"
  ).catch(() => ({ createIntroCopyAccessibilityPlan: undefined }));

  const plan = createIntroCopyAccessibilityPlan?.(3, "forward-complete");

  assert.deepEqual(plan, {
    introCopyInteractive: true,
    sceneInteractive: [false, false, false],
  });
});

test("desktop intro disables the first copy when reverse shrink begins", async () => {
  const { createIntroCopyAccessibilityPlan } = await import(
    "../src/components/serviceMotion.ts"
  ).catch(() => ({ createIntroCopyAccessibilityPlan: undefined }));

  const plan = createIntroCopyAccessibilityPlan?.(3, "reverse-start");

  assert.deepEqual(plan, {
    introCopyInteractive: false,
    sceneInteractive: [false, false, false],
  });
});
