import assert from "node:assert/strict";
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
    /data-parallax-image[^>]+class="[^"]*scale-\[1\.08\][^"]*"/,
  );
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
