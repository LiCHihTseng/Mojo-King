import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { createSSRApp } from "vue";
import { renderToString } from "@vue/server-renderer";
import { createMemoryHistory, createRouter } from "vue-router";
import { createServer } from "vite";

const vite = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

after(async () => {
  await vite.close();
});

const { default: ServiceDetailPage } = await vite.ssrLoadModule(
  "/src/pages/ServiceDetailPage.vue",
);

async function renderDetail(slug: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/:pathMatch(.*)*", component: { template: "<div />" } }],
  });
  const app = createSSRApp(ServiceDetailPage, { slug });
  app.use(router);
  await router.push(`/services/${slug}`);
  await router.isReady();
  return renderToString(app);
}

test("valid detail output exposes the hero, editorial sections, and one shared 5D sequence", async () => {
  const html = await renderDetail("hr-consulting");

  assert.match(html, /data-detail-hero/);
  assert.match(html, /data-parallax-image/);
  assert.match(html, /data-detail-heading/);
  assert.match(html, /從經營問題出發，/);
  assert.match(html, /六項顧問服務範疇/);
  assert.equal(html.match(/Define &amp; Agree/g)?.length, 1);
  assert.equal(html.match(/Disengage &amp; Review/g)?.length, 1);
  assert.match(html, /href="\/#consultation-form"/);
});

test("the server-rendered hero is edge-safe before client parallax initializes", async () => {
  const html = await renderDetail("hr-consulting");

  assert.match(
    html,
    /data-parallax-image[^>]+class="[^"]*scale-\[1\.18\][^"]*"/,
  );
});

test("hero parallax waits for the route transition and keeps the same start transform", () => {
  const heroSource = readFileSync(
    "src/components/service-detail/ServiceDetailHero.vue",
    "utf8",
  );

  assert.match(heroSource, /setStableParallaxStart/);
  assert.match(heroSource, /transition\?\.isTransitioning\.value/);
  assert.match(heroSource, /if \(!isRouteTransitioning\(\)\)\s*void rebuildParallax\(\)/);
  assert.match(heroSource, /freezeParallax/);
  assert.match(heroSource, /getComputedStyle\(image\)\.transform/);
  assert.match(heroSource, /if \(isTransitioning\)\s*freezeParallax\(\)/);
  assert.match(heroSource, /\{ flush: "sync" \}/);
  assert.match(
    heroSource,
    /onBeforeUnmount\(\(\) => \{[\s\S]*isRouteTransitioning\(\)[\s\S]*freezeParallax\(\)/,
  );
});

test("detail hero uses the compact reference height on desktop", async () => {
  const html = await renderDetail("hr-consulting");

  assert.match(
    html,
    /data-detail-hero[^>]+class="[^"]*h-\[clamp\(360px,44svh,440px\)\][^"]*"/,
  );
  assert.match(html, /sm:h-\[clamp\(380px,32svh,420px\)\]/);
  assert.match(html, /lg:h-\[42svh\]/);
  assert.match(html, /lg:max-h-\[520px\]/);
  assert.doesNotMatch(html, /lg:h-\[clamp\(360px,42svh,520px\)\]/);
  assert.doesNotMatch(html, /md:min-h-\[96svh\]/);
});

test("service detail stays single-column through tablet widths", async () => {
  const html = [
    await renderDetail("hr-consulting"),
    await renderDetail("fractional-chro"),
    await renderDetail("custom-training"),
  ].join("");

  assert.match(html, /data-detail-section[^>]+class="[^"]*lg:grid-cols-12/);
  assert.match(html, /data-detail-prose[^>]+class="[^"]*lg:grid-cols-2/);
  assert.match(html, /data-detail-card-list[^>]+class="[^"]*lg:grid-cols-2/);
  assert.doesNotMatch(html, /data-detail-section[^>]+class="[^"]*md:grid-cols-12/);
  assert.doesNotMatch(html, /data-detail-prose[^>]+class="[^"]*md:grid-cols-2/);
  assert.doesNotMatch(html, /data-detail-card-list[^>]+class="[^"]*md:grid-cols-2/);
});

test("detail copy uses the shared near-full-width container", async () => {
  const html = await renderDetail("hr-consulting");

  assert.match(html, /data-detail-hero-content[^>]+class="[^"]*max-w-8xl/);
  assert.match(html, /data-detail-section[^>]+class="[^"]*max-w-8xl/);
  assert.match(html, /data-five-d-method[^>]+class="[^"]*max-w-8xl/);
});

test("detail layout defers wide title and numbered-row grids until large screens", async () => {
  const html = await renderDetail("hr-consulting");

  assert.match(
    html,
    /data-detail-title-layout[^>]+class="[^"]*lg:grid-cols-12/,
  );
  assert.match(
    html,
    /data-detail-title-line[^>]+class="[^"]*lg:whitespace-nowrap/,
  );
  assert.match(
    html,
    /data-detail-hero-cta[^>]+class="[^"]*lg:col-span-2/,
  );
  assert.match(
    html,
    /data-detail-numbered-row[^>]+class="[^"]*lg:grid-cols-/,
  );
  assert.match(html, /data-detail-nav-contrast/);
});

test("each approved slug renders its own service-specific editorial content", async () => {
  const fractional = await renderDetail("fractional-chro");
  const training = await renderDetail("custom-training");

  assert.match(fractional, /適合合作的企業/);
  assert.match(fractional, /支持範疇/);
  assert.doesNotMatch(fractional, /課程設計流程/);
  assert.match(training, /課程設計流程/);
  assert.match(training, /課程主題/);
  assert.doesNotMatch(training, /適合合作的企業/);
});

test("unknown slugs render a stable not-found state without service fallback", async () => {
  const html = await renderDetail("not-real");

  assert.match(html, /找不到這項服務/);
  assert.match(html, /href="\/#service"/);
  assert.doesNotMatch(html, /data-detail-hero/);
  assert.doesNotMatch(html, /從經營問題出發，/);
});
