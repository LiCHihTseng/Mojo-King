<script setup lang="ts">
import { computed } from "vue";
import type { ServiceDetailSection as ServiceDetailSectionDefinition } from "../data/services";
import { getServiceBySlug } from "../data/services";
import FiveDMethod from "../components/service-detail/FiveDMethod.vue";
import ServiceDetailHero from "../components/service-detail/ServiceDetailHero.vue";
import ServiceDetailSection from "../components/service-detail/ServiceDetailSection.vue";

const props = defineProps<{ slug: string }>();
const service = computed(() => getServiceBySlug(props.slug));
const introSection = computed<ServiceDetailSectionDefinition | null>(() => {
  if (!service.value) return null;

  return {
    type: "prose",
    label: "ABOUT THE SERVICE",
    title: `關於${service.value.tag}`,
    columns: [service.value.detailIntro],
  };
});
</script>

<template>
  <main
    v-if="service && introSection"
    data-route-page
    data-route-kind="detail"
    class="min-h-screen overflow-x-clip bg-[#f4f0e8] text-[#1c1b17]"
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
      <div class="mx-auto grid max-w-[1472px] items-end gap-10 md:grid-cols-12 md:gap-8">
        <div class="md:col-span-8">
          <p class="text-[10px] font-semibold tracking-[0.16em] text-[#d87820]">
            START A CONVERSATION
          </p>
          <h2
            id="detail-consultation-title"
            class="mt-5 max-w-[12ch] text-[clamp(2.5rem,5.6vw,6.2rem)] font-medium leading-[1.02] tracking-[-0.05em]"
          >
            讓下一步，更貼近企業真正的需要。
          </h2>
        </div>
        <a
          href="/#consultation-form"
          class="group inline-flex w-full items-center justify-between border-b border-white pb-4 text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d87820] focus-visible:ring-offset-4 focus-visible:ring-offset-[#1c1b17] md:col-span-4 md:w-auto md:min-w-64 md:justify-self-end"
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
    class="flex min-h-screen items-center bg-[#f4f0e8] px-5 py-20 text-[#1c1b17] sm:px-8 md:px-12 lg:px-16"
  >
    <section
      class="mx-auto w-full max-w-[1472px] border-t border-[#1c1b17]/25 pt-10"
      aria-labelledby="service-not-found-title"
    >
      <p class="text-[10px] font-semibold tracking-[0.16em] text-[#a05213]">
        SERVICE NOT FOUND
      </p>
      <h1
        id="service-not-found-title"
        data-detail-heading
        tabindex="-1"
        class="mt-5 text-[clamp(2.75rem,7vw,7.5rem)] font-medium leading-none tracking-[-0.055em] focus:outline-none"
      >
        找不到這項服務
      </h1>
      <a
        href="/#service"
        class="mt-12 inline-flex border-b border-[#1c1b17] pb-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d87820] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f4f0e8]"
      >
        返回服務列表
      </a>
    </section>
  </main>
</template>
