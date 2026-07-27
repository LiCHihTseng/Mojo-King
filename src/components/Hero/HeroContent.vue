<script setup lang="ts">
import HeroCTA from "./HeroCTA.vue";
import HeroTitle from "./HeroTitle.vue";


interface Props {
  eyebrow?: string;
  headingLine1?: string;
  headingLine2?: string;
  headingLine3?: string;
  description?: string;
  ctaText?: string;
  videoCardTitle?: string;
  videoCardDescription?: string;
}

withDefaults(defineProps<Props>(), {
  eyebrow: "共享人資長服務",
  headingLine1: "為你的企業",
  headingLine2: "打造清晰的",
  headingLine3: "人才策略",
  description:
    "我與企業主、主管與團隊合作，帶來清楚的方向與實際可行的策略，讓組織能穩健成長，不再對人才管理感到困惑。",
  ctaText: "預約諮詢",
  videoCardTitle: "結構化且量身打造",
  videoCardDescription: "沒有制式建議，只有真正適合你的策略。",
});
</script>

<template>
  <div class="mx-auto flex w-full  max-w-[1800px] flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16 xl:gap-20">
    <!-- 主要文字內容 -->
    <div class="flex w-full min-w-0 flex-col">

      <HeroTitle
        :line1="headingLine1"
        :line2="headingLine2"
        :line3="headingLine3"
        :description="description"
      />

      <div class="mt-6 sm:mt-8 ml-5 md:ml-0">
        <HeroCTA :text="ctaText" />
      </div>
    </div>

    <!-- 平板與手機：排在文字下方；桌機：排在右側 -->
    <!-- <div class="flex w-full justify-start lg:w-auto lg:shrink-0 lg:justify-end">
      <HeroVideoCard
        :title="videoCardTitle"
        :description="videoCardDescription"
      />
    </div> -->
  </div>
</template>