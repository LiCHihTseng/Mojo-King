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
import FiveDMethod from "../components/service-detail/FiveDMethod.vue";
import ServiceDetailHero from "../components/service-detail/ServiceDetailHero.vue";
import ServiceDetailSection from "../components/service-detail/ServiceDetailSection.vue";

gsap.registerPlugin(ScrollTrigger);

const props = defineProps<{ slug: string }>();
const service = computed(() => getServiceBySlug(props.slug));
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
    class="min-h-screen overflow-x-clip bg-white text-[#1c1b17]"
  >
    <ServiceDetailHero :service="service" />

    <div>
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
      class="bg-[#1c1b17] px-5 py-20 text-white sm:px-8 md:px-12 md:py-28 lg:px-16"
      aria-labelledby="detail-consultation-title"
    >
      <div class="mx-auto grid w-full max-w-8xl items-end gap-10 lg:grid-cols-12 lg:gap-8">
        <div class="lg:col-span-8">
          <h2
            id="detail-consultation-title"
            class="max-w-[12ch] text-[clamp(2.5rem,5.6vw,6.2rem)] font-medium leading-[1.02] tracking-[-0.05em]"
          >
            讓下一步，更貼近企業真正的需要。
          </h2>
        </div>
        <a
          href="/#contact"
          class="group inline-flex w-full items-center justify-between border-b border-white pb-4 text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF891D] focus-visible:ring-offset-4 focus-visible:ring-offset-[#1c1b17] lg:col-span-4 lg:w-auto lg:min-w-64 lg:justify-self-end"
        >
          預約諮詢
          <span aria-hidden="true" class="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </a>
      </div>
    </section>
  </main>

  <main
    v-else
    data-route-page
    data-route-kind="detail"
    class="flex min-h-screen items-center bg-white px-5 py-20 text-[#1c1b17] sm:px-8 md:px-12 lg:px-16"
  >
    <section
      class="mx-auto w-full max-w-8xl border-t border-[#1c1b17]/25 pt-10"
      aria-labelledby="service-not-found-title"
    >
      <h1
        id="service-not-found-title"
        data-detail-heading
        tabindex="-1"
        class="text-[clamp(2.75rem,7vw,7.5rem)] font-medium leading-none tracking-[-0.055em] focus:outline-none"
      >
        找不到這項服務
      </h1>
      <a
        href="/#service"
        class="mt-12 inline-flex border-b border-[#1c1b17] pb-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B55F00] focus-visible:ring-offset-4 focus-visible:ring-offset-white"
      >
        返回服務列表
      </a>
    </section>
  </main>
</template>
