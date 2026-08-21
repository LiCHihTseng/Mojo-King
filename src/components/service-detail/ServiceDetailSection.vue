<script setup lang="ts">
import type { ServiceDetailSection } from "../../data/services";

defineProps<{ section: ServiceDetailSection }>();

const zeroPad = (index: number) => String(index + 1).padStart(2, "0");
</script>

<template>
  <section
    data-detail-section
    class="mx-auto grid w-full max-w-8xl gap-y-8 border-t border-[#1c1b17]/25 px-5 py-16 sm:px-8 sm:py-20 md:px-12 md:py-24 lg:grid-cols-12 lg:gap-x-8 lg:px-16 lg:py-36"
  >
    <div class="lg:col-span-3">
      <p class="flex items-center gap-3 text-[10px] font-semibold tracking-[0.16em] text-[#393832]">
        <span aria-hidden="true" class="h-1.5 w-1.5 shrink-0 bg-[#d87820]" />
        {{ section.label }}
      </p>
    </div>

    <div class="lg:col-span-9">
      <h2
        class="max-w-[19ch] text-[clamp(2rem,4.2vw,4.6rem)] font-medium leading-[1.08] tracking-[-0.045em] text-[#1c1b17] text-balance"
      >
        {{ section.title }}
      </h2>

      <div
        v-if="section.type === 'prose'"
        data-detail-prose
        class="mt-9 grid w-full gap-6 text-base leading-8 text-[#3f3d36] sm:mt-11 md:mt-12 lg:mt-16 lg:grid-cols-2 lg:gap-20"
      >
        <p
          v-for="(column, index) in section.columns"
          :key="`${index}-${column}`"
          class="w-full"
        >
          {{ column }}
        </p>
      </div>

      <ol
        v-else-if="section.type === 'numbered-list'"
        class="mt-12 border-b border-[#1c1b17]/25 md:mt-16"
      >
        <li
          v-for="(item, index) in section.items"
          :key="item.title"
          data-detail-numbered-row
          class="grid gap-4 border-t border-[#1c1b17]/25 py-7 sm:grid-cols-[4rem_minmax(0,1fr)] md:py-9 lg:grid-cols-[4rem_minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-baseline lg:gap-8"
        >
          <span class="font-mono text-xs tracking-[0.12em] text-[#b35f15]">
            {{ zeroPad(index) }}
          </span>
          <h3 class="text-xl font-medium leading-snug text-[#1c1b17] md:text-2xl">
            {{ item.title }}
          </h3>
          <p
            v-if="item.description"
            class="w-full text-sm leading-7 text-[#56534b] sm:col-start-2 md:text-base md:leading-8 lg:col-start-auto"
          >
            {{ item.description }}
          </p>
        </li>
      </ol>

      <ul
        v-else
        data-detail-card-list
        class="mt-12 grid border-t border-[#1c1b17]/25 md:mt-16 lg:grid-cols-2"
      >
        <li
          v-for="item in section.items"
          :key="item.title"
          class="flex min-h-28 items-start gap-5 border-b border-[#1c1b17]/25 py-6 md:min-h-36 md:py-8 lg:px-7 lg:odd:border-r lg:odd:pl-0"
        >
          <span aria-hidden="true" class="mt-2.5 h-1.5 w-1.5 shrink-0 bg-[#d87820]" />
          <div>
            <h3 class="text-lg font-medium leading-8 text-[#1c1b17] md:text-xl">
              {{ item.title }}
            </h3>
            <p v-if="item.description" class="mt-2 text-sm leading-7 text-[#56534b] md:text-base">
              {{ item.description }}
            </p>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
