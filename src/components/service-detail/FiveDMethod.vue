<script setup lang="ts">
import { fiveDSteps } from "../../data/services";
</script>

<template>
  <section
    data-detail-section
    class="mx-auto grid w-full max-w-[1600px] gap-y-10 border-t border-[#1c1b17]/25 px-5 py-20 sm:px-8 md:grid-cols-12 md:gap-x-8 md:px-12 md:py-28 lg:px-16 lg:py-36"
  >
    <div class="md:col-span-3">
      <p class="flex items-center gap-3 text-[10px] font-semibold tracking-[0.16em] text-[#393832]">
        <span aria-hidden="true" class="h-1.5 w-1.5 bg-[#d87820]" />
        5D METHOD
      </p>
    </div>

    <div class="md:col-span-9">
      <h2
        class="max-w-[24ch] text-[clamp(2rem,4.2vw,4.6rem)] font-medium leading-[1.08] tracking-[-0.045em] text-[#1c1b17] text-balance"
      >
        從需求定義到能力移轉，讓每一項方案真正落地並持續運作。
      </h2>

      <ol
        class="relative mt-14 grid border-l border-[#1c1b17]/30 pl-7 md:mt-20 md:grid-cols-5 md:border-l-0 md:border-t md:pl-0"
      >
        <li
          v-for="(step, index) in fiveDSteps"
          :key="step.english"
          class="relative pb-12 last:pb-0 md:px-4 md:pb-0 md:pt-8 md:first:pl-0 md:last:pr-0"
        >
          <span
            aria-hidden="true"
            class="absolute -left-[1.95rem] top-1.5 h-2.5 w-2.5 border-2 border-[#f4f0e8] bg-[#d87820] md:-top-[0.36rem] md:left-4 md:first:left-0"
          />
          <span class="font-mono text-[10px] tracking-[0.14em] text-[#a05213]">
            {{ String(index + 1).padStart(2, "0") }}
          </span>
          <h3 class="mt-4 text-base font-semibold leading-6 text-[#1c1b17]">
            {{ step.english }}
          </h3>
          <p class="mt-2 text-sm leading-6 text-[#56534b]">
            {{ step.chinese }}
          </p>
        </li>
      </ol>
    </div>
  </section>
</template>
