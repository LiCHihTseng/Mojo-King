import assert from "node:assert/strict";
import test from "node:test";

test("critical image readiness waits for decode but never rejects the page startup", async () => {
  const runtime = await import("../src/lib/pageReadiness.ts").catch(
    () => undefined,
  );

  assert.equal(typeof runtime?.waitForCriticalImages, "function");

  let resolveDecode: (() => void) | undefined;
  const pendingDecode = new Promise<void>((resolve) => {
    resolveDecode = resolve;
  });

  let settled = false;
  const waiting = runtime!
    .waitForCriticalImages(
      [
        { decode: () => pendingDecode },
        { decode: () => Promise.reject(new Error("decode failed")) },
      ],
      100,
    )
    .then(() => {
      settled = true;
    });

  await Promise.resolve();
  assert.equal(settled, false);

  resolveDecode?.();
  await waiting;
  assert.equal(settled, true);
});

test("critical image readiness has a bounded timeout", async () => {
  const { waitForCriticalImages } = await import(
    "../src/lib/pageReadiness.ts"
  );

  const startedAt = performance.now();
  await waitForCriticalImages(
    [{ decode: () => new Promise<void>(() => {}) }],
    15,
  );

  const elapsed = performance.now() - startedAt;
  assert.ok(elapsed >= 10, `resolved too early after ${elapsed}ms`);
  assert.ok(elapsed < 150, `timeout was not bounded: ${elapsed}ms`);
});
