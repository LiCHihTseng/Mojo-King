<script setup lang="ts">

import { onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import about1 from "../assets/About_1.avif";
import about2 from "../assets/About_2.avif";
import about3 from "../assets/About_3.avif";

gsap.registerPlugin(ScrollTrigger);

interface Scene {
  id: string;
  title: string;
  /** 每段獨立一個 <p>，第一段會以較深的顏色作為 lead */
  description: string[];
  bullets: string[];
  stat: { value: string; label: string };
  image: string;
}

const scenes: Scene[] = [
  {
    id: "founder",
    title: "20+ 年經驗，讓我看見企業真正的人資問題",
    description: [
      "我是人資顧問郁婷，慕玖股份有限公司執行長，外號「HR 女神」。",
      "擁有超過 20 年上市櫃企業人資經驗，從人資管理到人資長的歷練，讓我深刻體會：人資不只是制度與行政，而是影響人才、組織與企業長期發展的重要力量。",
      "也因為看見許多企業在成長過程中，缺乏成熟的人資策略與經驗支持，我創立了慕玖，希望把多年企業實戰經驗帶進更多組織。",
    ],
    bullets: [
      "20+ 年企業人資實戰經驗",
      "上市櫃科技、半導體、製造與傳統產業歷練",
      "參與企業整併、組織轉型與制度重建",
      "從經營視角思考人才與組織問題",
    ],
    stat: { value: "100+", label: "企業合作案例" },
    image: about1,
  },
  {
    id: "company",
    title: "讓人資，成為企業成長的策略力量",
    description: [
      "慕玖股份有限公司（MoJo King）專注於人力資源管理與組織發展。",
      "我們透過策略型人資顧問與管理培訓，協助企業從人才發展、領導力到組織文化，建立真正符合企業發展階段的管理系統。",
      "我們不只是解決眼前的人資問題，更希望協助企業建立一套未來能夠自己持續運作的管理能力。",
    ],
    bullets: [
      "人才發展｜建立符合企業成長階段的人才策略",
      "領導力培育｜提升主管帶人、溝通與決策能力",
      "組織文化｜建立支持企業長期發展的制度與文化",
      "管理培訓｜讓制度真正被主管理解與運用",
    ],
    stat: { value: "150+", label: "一對一深度諮詢" },
    image: about2,
  },
  {
    id: "why-us",
    title: "我們留下的不只是一套制度",
    description: [
      "慕玖結合企業人資長的實戰經驗、組織顧問能力與管理培訓方法，從問題診斷、制度設計到實際導入，陪企業把改變真正落實。",
    ],
    bullets: [
      "具備經營視角的人資專業",
      "從制度設計到真正落地",
      "顧問 × 培訓雙重能力",
      "跨產業實戰經驗",
      "國際專業認證",
    ],
    stat: { value: "100%", label: "教練顧問陪跑" },
    image: about3,
  },
];

const wrapperRef = ref<HTMLElement | null>(null);
const imageLayerRefs = ref<HTMLElement[]>([]);
const contentLayerRefs = ref<HTMLElement[]>([]);

const setImageLayerRef = (el: unknown, i: number) => {
  if (el) imageLayerRefs.value[i] = el as HTMLElement;
};
const setContentLayerRef = (el: unknown, i: number) => {
  if (el) contentLayerRefs.value[i] = el as HTMLElement;
};

/**
 * 進度指示器放在 article 內，所以三幕各有一份。
 * 用 data 屬性把「同一顆點」的三個分身一次抓出來統一驅動，
 * 就不必為了重複的元素維護巢狀 ref。
 */
const queryProgressFills = (scope: HTMLElement, dotIndex: number) =>
  scope.querySelectorAll<HTMLElement>(`[data-progress-fill="${dotIndex}"]`);

/**
 * 圖片切換：新圖是「完整的一整張」從中心點放大疊在舊圖上面。
 * scale 0 時面積為零、等於看不見，所以完全不需要動 opacity，
 * 舊圖自始至終都不淡出，只是被新的一張蓋住。
 */
const IMAGE_HIDDEN_SCALE = 0;
const IMAGE_FULL_SCALE = 1;

/**
 * 進度指示器。
 *
 * SCENE_BOUNDS 是每一幕在整條 timeline 上的起訖點，切換點抓在兩段轉場的
 * 中間，跟畫面上真正看到的那一幕一致。目前這幕的膠囊會隨著捲動慢慢填滿，
 * 填滿後才跳到下一顆。
 */
const activeScene = ref(0);
const SCENE_BOUNDS = [0, 0.4, 0.75, 1];

const resolveActiveScene = (progress: number) =>
  progress < SCENE_BOUNDS[1] ? 0 : progress < SCENE_BOUNDS[2] ? 1 : 2;

/** 目前這一幕自己走到幾成（0～1） */
const resolveSceneProgress = (progress: number, scene: number) => {
  const start = SCENE_BOUNDS[scene];
  const end = SCENE_BOUNDS[scene + 1];
  return gsap.utils.clamp(0, 1, (progress - start) / (end - start));
};

let mm: ReturnType<typeof gsap.matchMedia> | null = null;

onMounted(() => {
  mm = gsap.matchMedia();

  // ---- Desktop：scroll story ----
  mm.add(
    "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
    () => {
      const wrapper = wrapperRef.value;
      const images = imageLayerRefs.value.filter(Boolean);
      const contents = contentLayerRefs.value.filter(Boolean);
      if (!wrapper) return;

      // 進度條寬度每個 tick 都在變，用 quickSetter 直接寫 DOM，
      // 不透過 Vue 的響應式，避免每一幀都觸發重繪。
      // quickSetter 接受多個目標，一次就把三幕裡同一顆點的分身全部寫好。
      const fillSetters = scenes.map((_, di) =>
        gsap.quickSetter(queryProgressFills(wrapper, di), "width", "%"),
      );

      // 圖片全部都是不透明的，靠 scale 決定「已經放大到多少」，
      // 舊圖不淡出，新圖整張從中心點放大疊在上面。
      gsap.set(images, {
        autoAlpha: 1,
        transformOrigin: "50% 50%",
        force3D: true,
      });
      gsap.set(images[0] ?? [], { scale: IMAGE_FULL_SCALE });
      gsap.set(images.slice(1), { scale: IMAGE_HIDDEN_SCALE });

      gsap.set(contents, { autoAlpha: 0 });
      gsap.set(contents[0] ?? [], { autoAlpha: 1 });

      const timeline = gsap.timeline({
        defaults: { ease: "none", overwrite: "auto" },
        scrollTrigger: {
          trigger: wrapper,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const scene = resolveActiveScene(self.progress);
            // 只有跨過切換點時值才會真的變動，Vue 不會每個 tick 都重繪
            activeScene.value = scene;

            // 已看過的填滿、還沒到的空著、目前這幕跟著捲動慢慢填
            fillSetters.forEach((setFill, i) => {
              if (i < scene) setFill(100);
              else if (i > scene) setFill(0);
              else setFill(resolveSceneProgress(self.progress, scene) * 100);
            });
          },
        },
      });

      // 佔位補間：把 timeline 總長固定成 1，下面的位置參數才會等於捲動百分比
      // （否則總長會被最後一個補間的結束點決定，所有時間點都被拉長）
      timeline.to({}, { duration: 1 }, 0);

      // 0% → 30%：Scene 01 hold
      // 30% → 50%：Image 02 整張從中心放大蓋在 Image 01 上（舊圖不淡出）
      timeline.to(images[1], { scale: IMAGE_FULL_SCALE, duration: 0.14 }, 0.3);
      timeline.to(contents[0], { autoAlpha: 0, duration: 0.1 }, 0.3);
      timeline.to(contents[1], { autoAlpha: 1, duration: 0.1 }, 0.38);

      // 65% → 85%：Image 03 整張從中心放大蓋在 Image 02 上
      timeline.to(images[2], { scale: IMAGE_FULL_SCALE, duration: 0.14 }, 0.65);
      timeline.to(contents[1], { autoAlpha: 0, duration: 0.1 }, 0.65);
      timeline.to(contents[2], { autoAlpha: 1, duration: 0.1 }, 0.73);

      // 85% → 100%：Scene 03 hold
    },
  );

  // ---- Desktop + 使用者要求減少動態：直接顯示最終狀態 ----
  mm.add("(min-width: 1024px) and (prefers-reduced-motion: reduce)", () => {
    gsap.set(imageLayerRefs.value.filter(Boolean), {
      autoAlpha: 1,
      scale: IMAGE_HIDDEN_SCALE,
    });
    gsap.set(imageLayerRefs.value[0] ?? [], { scale: IMAGE_FULL_SCALE });
    gsap.set(contentLayerRefs.value.filter(Boolean), { autoAlpha: 0 });
    gsap.set(contentLayerRefs.value[0] ?? [], { autoAlpha: 1 });
    if (wrapperRef.value) {
      scenes.forEach((_, di) => {
        gsap.set(queryProgressFills(wrapperRef.value!, di), {
          width: di === 0 ? "100%" : "0%",
        });
      });
    }
  });

  // Mobile / Tablet（<1024px）不註冊任何 GSAP／ScrollTrigger，維持純 document flow。
});

onBeforeUnmount(() => {
  mm?.revert();
  mm = null;
});
</script>

<template>
  <section class="w-full bg-white text-[#1a1a1a]">
    <!-- ================= Desktop ：sticky scroll story ================= -->
    <div
      ref="wrapperRef"
      class="relative hidden min-h-[340vh] lg:block"
    >
      <div
        class="sticky top-0 flex h-[100dvh] w-full items-center overflow-hidden px-8 lg:px-16"
      >
        <div class="mx-auto w-full max-w-[2000px]">
          <!-- 區塊標籤：固定顯示，不參與場景切換 -->


          <!-- 左圖右文：位置從 Scene 01 到 Scene 03 完全不變 -->
          <div class="grid grid-cols-[minmax(0,44fr)_minmax(0,44fr)] gap-[12%]">
            <!-- Image Stage：三張圖疊在完全相同的位置 -->
            <div
              class="relative aspect-[3/4] h-[76vh] max-h-[76vh] w-auto max-w-full justify-self-start overflow-hidden rounded-lg shadow-2xl shadow-black/10"
            >
              <img
                v-for="(scene, i) in scenes"
                :key="scene.id"
                :ref="(el) => setImageLayerRef(el, i)"
                :src="scene.image"
                alt=""
                class="absolute inset-0 h-full w-full object-cover will-change-transform [transform:scale(0)] first:[transform:scale(1)]"
                :fetchpriority="i === 0 ? 'high' : 'low'"
                decoding="async"
              />
            </div>

            <!-- Content Stage：三組文字疊在完全相同的位置 -->
            <div class="relative h-[76vh]">
              <p
            class="mb-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#B55F00]"
          >
            <span class="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF891D]"></span>
            關於慕玖
          </p>
              <article
                v-for="(scene, i) in scenes"
                :key="scene.id"
                :ref="(el) => setContentLayerRef(el, i)"
                class="absolute inset-0 flex flex-col justify-center opacity-0 will-change-[opacity]"
              >
                <h2
                  class="text-[clamp(1.5rem,2.2vw,2.25rem)] font-semibold leading-tight tracking-tight"
                >
                  {{ scene.title }}
                </h2>

                <div class="mt-5 flex flex-col gap-3">
                  <p
                    v-for="(paragraph, pi) in scene.description"
                    :key="pi"
                    class="text-[clamp(.95rem,1.05vw,1.1rem)] leading-[1.85]"
                    :class="pi === 0 ? 'font-semibold text-[#1a1a1a]' : 'text-[#1a1a1a]/65'"
                  >
                    {{ paragraph }}
                  </p>
                </div>

                <ul class="mt-7 flex flex-col gap-3">
                  <li
                    v-for="(bullet, bi) in scene.bullets"
                    :key="bi"
                    class="flex gap-3"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      class="mt-0.5 h-5 w-5 shrink-0 text-[#FF891D]"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" fill="currentColor" />
                      <path
                        d="M7.5 12.5l3 3 6-6.5"
                        stroke="white"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <span class="text-[clamp(.9rem,1vw,1rem)] leading-relaxed text-[#1a1a1a]/70">
                      {{ bullet }}
                    </span>
                  </li>
                </ul>

                <div class="mt-8 flex items-baseline gap-3">
                  <span
                    class="text-[clamp(2rem,3vw,2.75rem)] font-bold leading-none tracking-wide text-[#FF891D]"
                  >
                    {{ scene.stat.value }}
                  </span>
                  <span class="text-sm text-[#1a1a1a]/50">{{ scene.stat.label }}</span>
                </div>

                <!-- 捲動進度：釘在 article 底部、水平置中。
                     用絕對定位而不是 mt-auto，才不會影響文案本身的垂直置中。
                     三幕各有一份，但隱藏的那幾層是 visibility:hidden，
                     不會被螢幕閱讀器讀到，也不會互相干擾。 -->
                <div
                  class="absolute bottom-0 left-1/2 flex w-fit -translate-x-1/2 items-center gap-2.5 rounded-full bg-[#F1F0EE] px-4 py-3"
                  role="status"
                  :aria-label="`關於慕玖：第 ${activeScene + 1} 幕，共 ${scenes.length} 幕`"
                >
                  <span
                    v-for="(dot, di) in scenes"
                    :key="dot.id"
                    class="block h-2 overflow-hidden rounded-full bg-[#D6D3CE] transition-[width] duration-500 ease-out"
                    :class="di === activeScene ? 'w-8' : 'w-2'"
                  >
                    <span
                      :data-progress-fill="di"
                      class="block h-full rounded-full bg-[#1a1a1a]"
                      style="width: 0%"
                    ></span>
                  </span>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= Mobile：純 document flow，零動畫 ================= -->
    <div class="px-5 py-16 lg:hidden">
      <p
        class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#B55F00]"
      >
        <span class="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF891D]"></span>
        關於慕玖
      </p>

      <article
        v-for="scene in scenes"
        :key="scene.id"
        class="mt-12 flex flex-col gap-5 first:mt-8"
      >
        <img
          :src="scene.image"
          alt=""
          class="block aspect-square w-full rounded-lg object-cover shadow-lg"
          loading="lazy"
          decoding="async"
        />

        <h2 class="text-[1.5rem] font-semibold leading-tight tracking-tight">
          {{ scene.title }}
        </h2>

        <div class="flex flex-col gap-3">
          <p
            v-for="(paragraph, pi) in scene.description"
            :key="pi"
            class="text-base leading-[1.85]"
            :class="pi === 0 ? 'font-semibold text-[#1a1a1a]' : 'text-[#1a1a1a]/65'"
          >
            {{ paragraph }}
          </p>
        </div>

        <ul class="flex flex-col gap-3">
          <li
            v-for="(bullet, bi) in scene.bullets"
            :key="bi"
            class="flex gap-3"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              class="mt-0.5 h-5 w-5 shrink-0 text-[#FF891D]"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" fill="currentColor" />
              <path
                d="M7.5 12.5l3 3 6-6.5"
                stroke="white"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span class="text-[.95rem] leading-relaxed text-[#1a1a1a]/70">
              {{ bullet }}
            </span>
          </li>
        </ul>

        <div class="flex items-baseline gap-3">
          <span class="text-[2rem] font-bold leading-none tracking-wide text-[#FF891D]">
            {{ scene.stat.value }}
          </span>
          <span class="text-sm text-[#1a1a1a]/50">{{ scene.stat.label }}</span>
        </div>
      </article>
    </div>
  </section>
</template>
