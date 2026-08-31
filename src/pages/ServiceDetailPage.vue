<script setup lang="ts">
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import type { ServiceDetailSection as ServiceDetailSectionDefinition } from "../data/services";
import { getServiceBySlug } from "../data/services";
import { consultationHref, useOverlayNav } from "../lib/overlayNav";
import HeroCTA from "../components/Hero/HeroCTA.vue";
import Navigation from "../components/Navigation.vue";
import FiveDMethod from "../components/service-detail/FiveDMethod.vue";
import ServiceDetailHero from "../components/service-detail/ServiceDetailHero.vue";
import ServiceDetailSection from "../components/service-detail/ServiceDetailSection.vue";

gsap.registerPlugin(ScrollTrigger);

const props = defineProps<{ slug: string }>();
const service = computed(() => getServiceBySlug(props.slug));

/*
 * 頁尾 CTA 直接開表單，並把目前的服務 slug 帶過去。
 * 原本指向 /#contact —— 讀完整頁、意願最高的那一刻反而被送回首頁再點一次。
 */
const { openConsultation } = useOverlayNav();
const detailPageRoot = ref<HTMLElement | null>(null);

let mounted = false;
let initializationFrame = 0;
let initializationGeneration = 0;
let detailMedia: ReturnType<typeof gsap.matchMedia> | null = null;

const revertDetailMotion = () => {
  initializationGeneration += 1;
  cancelAnimationFrame(initializationFrame);
  initializationFrame = 0;
  detailMedia?.revert();
  detailMedia = null;

  const sections = detailPageRoot.value?.querySelectorAll<HTMLElement>(
    "[data-detail-section]",
  );
  if (sections?.length) {
    gsap.set(sections, {
      clearProps: "opacity,visibility,transform,willChange",
    });
  }
};

const createDetailMotion = (generation: number) => {
  const root = detailPageRoot.value;
  if (!mounted || generation !== initializationGeneration || !root || !service.value) {
    return;
  }

  const sections = gsap.utils.toArray<HTMLElement>(
    "[data-detail-section]",
    root,
  );
  detailMedia = gsap.matchMedia();
  detailMedia.add(
    {
      motionOK: "(prefers-reduced-motion: no-preference)",
      reduceMotion: "(prefers-reduced-motion: reduce)",
    },
    (context) => {
      const { reduceMotion } = context.conditions as {
        motionOK: boolean;
        reduceMotion: boolean;
      };

      if (reduceMotion) {
        gsap.set(sections, {
          autoAlpha: 1,
          y: 0,
          willChange: "auto",
        });
        return;
      }

      sections.forEach((section) => {
        gsap.fromTo(
          section,
          {
            autoAlpha: 0,
            y: 20,
            willChange: "transform,opacity",
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            ease: "power2.out",
            onComplete: () => {
              gsap.set(section, { clearProps: "willChange" });
            },
            scrollTrigger: {
              trigger: section,
              start: "top 84%",
              once: true,
              invalidateOnRefresh: true,
            },
          },
        );
      });
    },
    root,
  );

  ScrollTrigger.refresh();
};

const rebuildDetailMotion = async () => {
  revertDetailMotion();
  const generation = initializationGeneration;
  await nextTick();

  if (!mounted || generation !== initializationGeneration) return;

  initializationFrame = requestAnimationFrame(() => {
    initializationFrame = 0;
    createDetailMotion(generation);
  });
};
const introSection = computed<ServiceDetailSectionDefinition | null>(() => {
  if (!service.value) return null;

  return {
    type: "prose",
    label: "ABOUT THE SERVICE",
    title: `關於${service.value.tag}`,
    columns: [service.value.detailIntro],
  };
});

onMounted(() => {
  mounted = true;
  void rebuildDetailMotion();
});

watch(
  () => service.value?.slug ?? null,
  () => {
    if (mounted) void rebuildDetailMotion();
  },
  { flush: "post" },
);

onBeforeUnmount(() => {
  mounted = false;
  revertDetailMotion();
});
</script>

<template>
  <main
    v-if="service && introSection"
    ref="detailPageRoot"
    data-route-page
    data-route-kind="detail"
    class="min-h-screen overflow-x-clip bg-white text-ink"
  >
    <!--
      全站導覽列。這一頁沒有 loader 擋在前面，所以進場動畫直接放行。
      原本 hero 裡那條「MOJO KING ／ ← 返回服務」已經併進這裡：
      logo 就是返回鍵（走 App.vue 的反向轉場），服務內容的 hover 選單
      讓人不必回首頁就能切到另外兩個服務。
    -->
    <Navigation entrance-ready />

    <ServiceDetailHero :service="service" />

    <div data-nav-light-surface>
      <ServiceDetailSection :section="introSection" />
      <ServiceDetailSection
        v-for="section in service.sections"
        :key="`${service.slug}-${section.label}`"
        :section="section"
      />
      <FiveDMethod />
    </div>

    <section
      data-detail-section
      class="bg-ink px-5 py-20 text-white sm:px-8 md:px-12 md:py-28 lg:px-16"
      aria-labelledby="detail-consultation-title"
    >
      <div class="mx-auto grid w-full max-w-8xl items-end gap-10 lg:grid-cols-12 lg:gap-8">
        <div class="lg:col-span-8">
          <h2
            id="detail-consultation-title"
            class="max-w-[12ch] text-display"
          >
            讓下一步，更貼近企業真正的需要。
          </h2>
        </div>
        <!-- 跟 hero 那顆同一個元件；這裡原本也是手抄的死箭頭 markup -->
        <HeroCTA
          text="預約諮詢"
          :href="consultationHref(service.slug)"
          variant="solid"
          bg-color="#ffffff"
          text-color="#1c1b17"
          radius="4px"
          class="w-fit lg:col-span-4 lg:justify-self-end"
          @click="openConsultation($event, service.slug)"
        />
      </div>
    </section>
  </main>

  <main
    v-else
    data-route-page
    data-route-kind="detail"
    class="flex min-h-screen items-center bg-white px-5 py-20 text-ink sm:px-8 md:px-12 lg:px-16"
  >
    <Navigation entrance-ready />

    <section
      data-nav-light-surface
      class="mx-auto w-full max-w-8xl border-t border-ink/25 pt-10"
      aria-labelledby="service-not-found-title"
    >
      <h1
        id="service-not-found-title"
        data-detail-heading
        tabindex="-1"
        class="text-h1 focus:outline-none"
      >
        找不到這項服務
      </h1>
      <a
        href="/#service"
        class="mt-12 inline-flex border-b border-ink pb-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-4 focus-visible:ring-offset-white"
      >
        返回服務列表
      </a>
    </section>
  </main>
</template>
