import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";

// services.ts 會 import 服務照片（.avif），node 自己解析不了副檔名，
// 交給 vite 載入才拿得到打包後的圖片路徑。
const vite = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

after(async () => {
  await vite.close();
});

const { getServiceBySlug, getServiceHref, fiveDSteps, services } =
  await vite.ssrLoadModule("/src/data/services.ts");

test("catalog exposes exactly the three approved services", () => {
  assert.deepEqual(
    services.map(({ slug }) => slug),
    ["hr-consulting", "fractional-chro", "custom-training"],
  );
});

test("each service has a unique route and complete detail content", () => {
  const hrefs = services.map(({ slug }) => getServiceHref(slug));
  assert.equal(new Set(hrefs).size, 3);
  assert.deepEqual(hrefs, [
    "/services/hr-consulting",
    "/services/fractional-chro",
    "/services/custom-training",
  ]);
  services.forEach((service: (typeof services)[number]) => {
    assert.ok(service.tag.length > 0);
    assert.ok(service.titleLine1.length > 0);
    assert.ok(service.summary.length > 0);
    assert.ok(service.detailIntro.length > 0);
    assert.ok(service.sections.length > 0);
  });
});

test("unknown slugs never fall back to another service", () => {
  assert.equal(getServiceBySlug("missing-service"), undefined);
});

test("the shared method contains the five approved ordered steps", () => {
  assert.deepEqual(fiveDSteps.map(({ english }) => english), [
    "Define & Agree",
    "Discover & Analyze",
    "Deliver & Decide",
    "Design & Implement",
    "Disengage & Review",
  ]);
});
