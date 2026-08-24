import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createSSRApp } from "vue";
import { renderToString } from "@vue/server-renderer";
import { createServer } from "vite";

const vite = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

after(async () => {
  await vite.close();
});

const { default: Navigation } = await vite.ssrLoadModule(
  "/src/components/Navigation.vue",
);

test("compact navigation exposes an icon-only menu control without losing its accessible name", async () => {
  const html = await renderToString(
    createSSRApp(Navigation, { entranceReady: true }),
  );

  assert.match(html, /aria-label="開啟選單"/);
  assert.match(html, /data-menu-icon/);
  assert.match(html, /data-menu-label[^>]+class="[^"]*hidden[^"]*lg:inline/);
});

test("drawer renders the CTA target used by its entrance timeline", async () => {
  const html = await renderToString(createSSRApp(Navigation));

  assert.match(html, /class="[^"]*drawer-cta[^"]*"/);
});
