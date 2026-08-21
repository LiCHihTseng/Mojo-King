import assert from "node:assert/strict";
import test from "node:test";

test("app shell exposes stable injection keys", async () => {
  const appShell = await import("../src/lib/appShell.ts").catch(() => undefined);

  assert.equal(typeof appShell?.entranceReadyKey, "symbol");
  assert.equal(typeof appShell?.routeTransitionKey, "symbol");
  assert.notEqual(appShell?.entranceReadyKey, appShell?.routeTransitionKey);
});
