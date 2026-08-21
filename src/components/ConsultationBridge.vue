<script setup lang="ts">
/**
 * ConsultationBridge.vue
 * 夾在 Contact（大張橘色 CTA 區塊）跟 ConsultationForm（表單）中間的
 * 過渡區塊，語氣上從「要不要開始」推到「那就直接填表單」。
 */

</script>

<template>
  <section class="flex min-h-[50vh] items-center overflow-hidden bg-[#F9F8F6] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">


    <div class="z-10 mx-auto grid w-full max-w-8xl gap-y-10 lg:grid-cols-12 lg:gap-x-10 items-start">
      <!-- 左側：小標 + 裝飾圖示 -->
      <div class="lg:col-span-2">
        <p
          class="flex items-center justify-start gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#B55F00]"
        >
          <span class="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF891D]"></span>
          現在就可以開始
        </p>

      </div>

      <!-- 中間：標題 + 內文 -->
      <div class="lg:col-span-7">
        <h2 class="text-2xl font-medium leading-tight text-[#252525] sm:text-3xl">
          一次對話，不是一個承諾。<br />
          讓我們一起找到最適合你的方向。
        </h2>

        <div class="mt-6 space-y-4 text-sm leading-relaxed text-[#555] sm:text-base">
          <p>
            填寫下方表單，我們的團隊會與你聯繫，安排第一次的諮詢對談。如果你想直接聊聊，
          </p>
          <p>
            也歡迎直接聯絡我們——沒有壓力、也沒有推銷，我們的目標是幫助你在充分了解狀況後，做出清楚的決定。 
          </p>
        </div>
      </div>

      <!-- 右側：短文案 + CTA -->
      <div class="flex flex-col justify-end lg:col-span-3">
        <p class="text-sm leading-relaxed text-[#555] sm:text-base">
          慕玖的顧問可以幫你先看清楚問題出在哪裡，再決定下一步怎麼走。
        </p>
        <p class="mt-4 text-sm leading-relaxed text-[#555] sm:text-base">
          先填個表單，讓我們知道你的狀況。
        </p>

        <a
          href="#consultation-form"
          class="mt-6 inline-flex w-fit items-center justify-center bg-[#252525] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B55F00] focus-visible:ring-offset-2"
        >
          填寫表單
        </a>
      </div>
    </div>
  </section>
</template>
