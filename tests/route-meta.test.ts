import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { createServer } from "vite";

// routeMeta 會 import services 資料，走 vite 解析才吃得到副檔名省略的路徑
const vite = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

after(async () => {
  await vite.close();
});

const { CONSULTATION_META, HOME_META, resolveRouteMeta, SITE_ORIGIN } =
  await vite.ssrLoadModule("/src/lib/routeMeta.ts");
const { services } = await vite.ssrLoadModule("/src/data/services.ts");

test("each route resolves its own title, description, and canonical", () => {
  assert.deepEqual(resolveRouteMeta("home", {}), HOME_META);
  assert.deepEqual(resolveRouteMeta("consultation", {}), CONSULTATION_META);

  const [service] = services;
  const detail = resolveRouteMeta("service-detail", { slug: service.slug });

  assert.match(detail.title, new RegExp(service.tag));
  assert.equal(detail.description, service.summary);
  assert.equal(detail.canonical, `${SITE_ORIGIN}/services/${service.slug}`);
});

test("the home social preview keeps the short title index.html was tuned with", () => {
  const indexHtml = readFileSync("index.html", "utf8");

  assert.ok(HOME_META.socialTitle);
  assert.ok(HOME_META.socialDescription);
  assert.ok(
    indexHtml.includes(`content="${HOME_META.socialTitle}"`),
    "og:title drifted from index.html",
  );
  assert.notEqual(HOME_META.socialTitle, HOME_META.title);
});

test("every route canonical is a distinct absolute url", () => {
  const canonicals = [
    resolveRouteMeta("home", {}),
    resolveRouteMeta("consultation", {}),
    ...services.map((service) =>
      resolveRouteMeta("service-detail", { slug: service.slug }),
    ),
  ].map((meta) => meta.canonical);

  canonicals.forEach((canonical) => {
    assert.ok(canonical.startsWith(`${SITE_ORIGIN}/`), canonical);
  });
  assert.equal(new Set(canonicals).size, canonicals.length);
});

test("unknown slugs and unknown routes fall back to the home meta", () => {
  assert.deepEqual(resolveRouteMeta("service-detail", { slug: "nope" }), HOME_META);
  assert.deepEqual(resolveRouteMeta("service-detail", {}), HOME_META);
  assert.deepEqual(resolveRouteMeta(undefined, {}), HOME_META);
});

test("the sitemap lists every canonical the router can produce", () => {
  const sitemap = readFileSync("public/sitemap.xml", "utf8");

  [
    HOME_META.canonical,
    CONSULTATION_META.canonical,
    ...services.map(
      (service) => `${SITE_ORIGIN}/services/${service.slug}`,
    ),
  ].forEach((canonical) => {
    assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), canonical);
  });
});
