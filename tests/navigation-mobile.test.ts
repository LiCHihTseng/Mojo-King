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

test("the menu control keeps its visible label at every breakpoint", async () => {
  const html = await renderToString(
    createSSRApp(Navigation, { entranceReady: true }),
  );

  assert.match(html, /aria-label="開啟選單"/);
  assert.match(html, /data-menu-icon/);
  // 標籤在所有尺寸都要看得到 —— 只有 icon 的方塊看不出是選單。
  // （舊版曾經是 hidden lg:inline，已於 Navigation.vue 刻意推翻）
  assert.match(html, /data-menu-label/);
  assert.doesNotMatch(html, /data-menu-label[^>]+class="[^"]*hidden/);
});

test("drawer renders the CTA target used by its entrance timeline", async () => {
  const html = await renderToString(createSSRApp(Navigation));

  assert.match(html, /class="[^"]*drawer-cta[^"]*"/);
});
