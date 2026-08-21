<script setup lang="ts">
import type { ServiceDetailSection } from "../../data/services";

defineProps<{ section: ServiceDetailSection }>();

const zeroPad = (index: number) => String(index + 1).padStart(2, "0");
</script>

<template>
  <section
    data-detail-section
    class="mx-auto grid w-full max-w-[1600px] gap-y-10 border-t border-[#1c1b17]/25 px-5 py-20 sm:px-8 md:grid-cols-12 md:gap-x-8 md:px-12 md:py-28 lg:px-16 lg:py-36"
  >
    <div class="md:col-span-3">
      <p class="flex items-center gap-3 text-[10px] font-semibold tracking-[0.16em] text-[#393832]">
        <span aria-hidden="true" class="h-1.5 w-1.5 shrink-0 bg-[#d87820]" />
        {{ section.label }}
      </p>
    </div>

    <div class="md:col-span-9">
      <h2
        class="max-w-[19ch] text-[clamp(2rem,4.2vw,4.6rem)] font-medium leading-[1.08] tracking-[-0.045em] text-[#1c1b17] text-balance"
      >
        {{ section.title }}
      </h2>

      <div
        v-if="section.type === 'prose'"
        class="mt-12 grid gap-8 text-base leading-8 text-[#3f3d36] md:mt-16 md:grid-cols-2 md:gap-12 lg:gap-20"
      >
        <p
          v-for="(column, index) in section.columns"
          :key="`${index}-${column}`"
          class="max-w-[38rem]"
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
          class="grid gap-4 border-t border-[#1c1b17]/25 py-7 sm:grid-cols-[4rem_minmax(0,1fr)] md:grid-cols-[5rem_minmax(14rem,0.8fr)_minmax(18rem,1.2fr)] md:items-baseline md:gap-8 md:py-9"
        >
          <span class="font-mono text-xs tracking-[0.12em] text-[#b35f15]">
            {{ zeroPad(index) }}
          </span>
          <h3 class="text-xl font-medium leading-snug text-[#1c1b17] md:text-2xl">
            {{ item.title }}
          </h3>
          <p
            v-if="item.description"
            class="max-w-[38rem] text-sm leading-7 text-[#56534b] sm:col-start-2 md:col-start-auto md:text-base md:leading-8"
          >
            {{ item.description }}
          </p>
        </li>
      </ol>

      <ul
        v-else
        class="mt-12 grid border-t border-[#1c1b17]/25 md:mt-16 md:grid-cols-2"
      >
        <li
          v-for="item in section.items"
          :key="item.title"
          class="flex min-h-28 items-start gap-5 border-b border-[#1c1b17]/25 py-6 md:min-h-36 md:px-7 md:py-8 md:odd:border-r md:odd:pl-0"
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
