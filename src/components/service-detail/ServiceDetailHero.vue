<script setup lang="ts">
import { inject } from "vue";
import { useRouter } from "vue-router";
import type { ServiceDefinition } from "../../data/services";
import { routeTransitionKey } from "../../lib/appShell";

defineProps<{ service: ServiceDefinition }>();

const router = useRouter();
const transition = inject(routeTransitionKey, null);

const returnToServices = () => {
  if (transition) {
    void transition.returnToServices();
    return;
  }

  void router.push("/#service");
};
</script>

<template>
  <header
    data-detail-hero
    class="relative isolate min-h-[92svh] overflow-hidden bg-[#493c31] text-white md:min-h-[96svh]"
  >
    <img
      data-parallax-image
      :src="service.image"
      alt=""
      loading="eager"
      fetchpriority="high"
      class="absolute inset-0 -z-20 h-full w-full object-cover"
    />
    <div
      aria-hidden="true"
      class="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(15,13,10,0.3)_0%,rgba(15,13,10,0.02)_38%,rgba(15,13,10,0.76)_100%)]"
    />
    <div
      data-detail-nav-contrast
      aria-hidden="true"
      class="absolute inset-x-0 top-0 -z-10 h-28 bg-[linear-gradient(180deg,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.62)_72%,rgba(0,0,0,0)_100%)]"
    />

    <div
      class="mx-auto flex min-h-[92svh] w-full max-w-[1600px] flex-col px-5 pb-7 pt-5 sm:px-8 md:min-h-[96svh] md:px-12 md:pb-10 md:pt-7 lg:px-16"
    >
      <nav
        aria-label="服務詳情導覽"
        class="flex items-center justify-between border-b border-white/35 pb-4 text-[11px] font-medium tracking-[0.16em] drop-shadow-md md:text-xs"
      >
        <span class="uppercase">
          MOJO KING
        </span>
        <button
          type="button"
          class="inline-flex items-center gap-3 py-2 text-white transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d87820] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
          @click="returnToServices"
        >
          <span aria-hidden="true">←</span>
          返回服務
        </button>
      </nav>

      <div
        data-detail-title-layout
        class="mt-auto grid items-end gap-10 pt-20 lg:grid-cols-12 lg:gap-8"
      >
        <div class="lg:col-span-10">
          <div
            class="mb-5 flex items-center gap-4 text-[11px] font-medium tracking-[0.18em] text-white/85 md:text-xs"
          >
            <span>{{ service.index }}</span>
            <span class="h-px w-10 bg-[#d87820]" aria-hidden="true" />
            <span>{{ service.tag }}</span>
          </div>
          <h1
            :id="`service-${service.slug}-title`"
            data-detail-heading
            tabindex="-1"
            class="text-[clamp(2.65rem,4.25vw,5.25rem)] font-medium leading-[1.02] tracking-[-0.055em] text-balance focus:outline-none"
          >
            <span data-detail-title-line class="block lg:whitespace-nowrap">{{ service.titleLine1 }}</span>
            <span data-detail-title-line class="block lg:whitespace-nowrap">{{ service.titleLine2 }}</span>
          </h1>
          <p
            class="mt-6 max-w-[42rem] text-sm leading-7 text-white/90 sm:text-base md:mt-8 md:text-lg md:leading-8"
          >
            {{ service.summary }}
          </p>
        </div>

        <a
          href="/#consultation-form"
          data-detail-hero-cta
          class="group inline-flex w-fit items-center justify-between gap-8 border-b border-white pb-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d87820] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent md:text-base lg:col-span-2 lg:justify-self-end"
        >
          預約諮詢
          <span aria-hidden="true" class="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </a>
      </div>
    </div>
  </header>
</template>
