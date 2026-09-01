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
  assert.match(html, /我們從釐清經營問題開始/);
  assert.match(html, /服務領域/);
  assert.equal(html.match(/Define &amp; Agree/g)?.length, 1);
  assert.equal(html.match(/Disengage &amp; Review/g)?.length, 1);
  // 頁首與頁尾兩顆「預約諮詢」都直接開表單，並帶著這一頁的服務 slug。
  // 原本指向 /#contact —— 讀完整頁的人反而被送回首頁再點一次才碰得到表單。
  assert.equal(
    html.match(/href="\/consultation\?from=hr-consulting"/g)?.length,
    2,
  );
  // 全站導覽列取代了 hero 裡那條自製的「MOJO KING ／ ← 返回服務」。
  // 它的「聯絡我們」在非首頁上會是 /#contact，所以不能再用整頁比對來
  // 檢查舊的 CTA —— 改成確認兩顆 CTA 都指向表單（上面那條）＋導覽列有掛上。
  assert.match(html, /id="navigation-drawer"/);
  assert.ok(!html.includes("返回服務 "), "hero 裡的自製返回鍵沒清乾淨");

  // 站內錨點在非首頁上必須帶路徑。少了那個 /，點下去只會在這一頁找
  // 一個不存在的 #about，等於三個連結全是死的。
  for (const hash of ["#about", "#service", "#contact"]) {
    assert.ok(
      html.includes(`href="/${hash}"`),
      `導覽列的 ${hash} 沒有帶回首頁的路徑`,
    );
  }
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

  // 區塊本身不再是分欄格線：標題直接堆在內容上方，
  // 多欄只出現在「內容本身真的有兩個維度」的地方，而且一律等到 lg 才展開。
  assert.doesNotMatch(html, /data-detail-section[^>]+class="[^"]*grid-cols-12/);
  assert.match(html, /data-detail-card-list[^>]+class="[^"]*lg:grid-cols-2/);
  assert.match(html, /data-detail-numbered-row[^>]+class="[^"]*lg:grid-cols-/);
  // 連續內文是單欄並限制行長，不是被擠進半個版面的兩欄格線
  assert.match(html, /data-detail-prose[^>]+class="[^"]*max-w-\[40em\]/);
  assert.doesNotMatch(html, /data-detail-prose[^>]+class="[^"]*grid-cols-2/);
  assert.doesNotMatch(html, /data-detail-card-list[^>]+class="[^"]*md:grid-cols-2/);
  assert.doesNotMatch(html, /data-detail-numbered-row[^>]+class="[^"]*md:grid-cols-\[/);
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
  // hero CTA 現在是共用的 HeroCTA，版面 class 靠 fallthrough 合併到它的
  // 根 <a> 上 —— 屬性順序由 Vue 決定，所以比對整個標籤而不是固定順序。
  const heroCta = html.match(/<a[^>]*data-detail-hero-cta[^>]*>/)?.[0];
  assert.ok(heroCta, "hero CTA 不見了");
  assert.match(heroCta, /lg:col-span-2/);
  assert.match(
    html,
    /data-detail-numbered-row[^>]+class="[^"]*lg:grid-cols-/,
  );
});

test("each approved slug renders its own service-specific editorial content", async () => {
  const fractional = await renderDetail("fractional-chro");
  const training = await renderDetail("custom-training");

  assert.match(fractional, /推薦企業/);
  assert.match(fractional, /支持範疇/);
  assert.doesNotMatch(fractional, /課程設計流程/);
  assert.match(training, /課程設計流程/);
  assert.match(training, /課程主題/);
  assert.doesNotMatch(training, /推薦企業/);
});

test("unknown slugs render a stable not-found state without service fallback", async () => {
  const html = await renderDetail("not-real");

  assert.match(html, /找不到這項服務/);
  assert.match(html, /href="\/#service"/);
  assert.doesNotMatch(html, /data-detail-hero/);
  assert.doesNotMatch(html, /我們從釐清經營問題開始/);
});
