<script setup lang="ts">
import { fiveDSteps } from "../../data/services";
</script>

<template>
  <section
    data-detail-section
    data-five-d-method
    class="mx-auto grid w-full max-w-8xl gap-y-8 border-t border-[#1c1b17]/25 px-5 py-16 sm:px-8 sm:py-20 md:px-12 md:py-24 lg:grid-cols-12 lg:gap-x-8 lg:px-16 lg:py-36"
  >
    <div class="lg:col-span-3">
      <p class="flex items-center gap-3 text-[10px] font-semibold tracking-[0.16em] text-[#393832]">
        <span aria-hidden="true" class="h-1.5 w-1.5 bg-[#d87820]" />
        5D METHOD
      </p>
    </div>

    <div class="lg:col-span-9">
      <h2
        class="max-w-[24ch] text-[clamp(2rem,4.2vw,4.6rem)] font-medium leading-[1.08] tracking-[-0.045em] text-[#1c1b17] text-balance"
      >
        從需求定義到能力移轉，讓每一項方案真正落地並持續運作。
      </h2>

      <ol
        class="relative mt-14 grid border-l border-[#1c1b17]/30 pl-7 lg:mt-20 lg:grid-cols-5 lg:border-l-0 lg:border-t lg:pl-0"
      >
        <li
          v-for="(step, index) in fiveDSteps"
          :key="step.english"
          class="relative pb-12 last:pb-0 lg:px-4 lg:pb-0 lg:pt-8 lg:first:pl-0 lg:last:pr-0"
        >
          <span
            aria-hidden="true"
            class="absolute -left-[1.95rem] top-1.5 h-2.5 w-2.5 border-2 border-[#f4f0e8] bg-[#d87820] lg:-top-[0.36rem] lg:left-4 lg:first:left-0"
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
