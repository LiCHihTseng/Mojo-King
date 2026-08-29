<script setup lang="ts">
import { fiveDSteps } from "../../data/services";
</script>

<template>
  <section
    data-detail-section
    data-five-d-method
    class="mx-auto w-full max-w-8xl border-t border-ink/20 px-5 py-16 sm:px-8 sm:py-20 md:px-12 md:py-24 lg:px-16 lg:py-32"
  >
    <div>
      <h2
        class="max-w-[24ch] text-h2 text-ink text-balance"
      >
        從需求定義到能力移轉，讓每一項方案真正落地並持續運作。
      </h2>

      <ol
        class="relative mt-14 grid border-l border-ink/30 pl-7 lg:mt-20 lg:grid-cols-5 lg:border-l-0 lg:border-t lg:pl-0"
      >
        <li
          v-for="(step, index) in fiveDSteps"
          :key="step.english"
          class="relative pb-12 last:pb-0 lg:px-4 lg:pb-0 lg:pt-8 lg:first:pl-0 lg:last:pr-0"
        >
          <span
            aria-hidden="true"
            class="absolute -left-[1.95rem] top-1.5 h-2.5 w-2.5 border-2 border-white bg-brand lg:-top-[0.36rem] lg:left-4 lg:first:left-0"
          />
          <span class="text-eyebrow text-brand-ink">
            {{ String(index + 1).padStart(2, "0") }}
          </span>
          <h3 class="mt-4 text-h4 text-ink">
            {{ step.english }}
          </h3>
          <p class="mt-2 text-body text-ink-muted">
            {{ step.chinese }}
          </p>
        </li>
      </ol>
    </div>
  </section>
</template>
