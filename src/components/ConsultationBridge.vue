<script setup lang="ts">
/**
 * ConsultationBridge.vue
 * 夾在 Contact（大張橘色 CTA 區塊）跟 ConsultationForm（表單）中間的
 * 過渡區塊，語氣上從「要不要開始」推到「那就直接填表單」。
 */

</script>

<template>
  <section class="relative flex min-h-[50vh] items-center overflow-hidden bg-[#F9F8F6] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
    <!-- 左側裝飾圖形：貼著最左邊，部分裁切出畫面 -->
    <div
      class="pointer-events-none absolute -left-[28%] top-1/2 z-0 -translate-y-1/2 sm:-left-[20%] lg:-left-[12%]"
      aria-hidden="true"
    >
      <svg
        class="h-[70vh] w-auto min-w-[420px] opacity-70 sm:h-[85vh]"
        viewBox="0 0 3622 5110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clip-path="url(#bridge-decor-clip)">
          <path
            d="M2823.17 3126.72C2924.6 3029.34 3054.85 2949.36 3198.16 2936.32C3467.51 2911.85 3678.18 3005.75 3608.58 3309.17C3529.78 3652.47 2965.36 4138.97 2706.34 4394.95C2313.58 4783.08 1846.49 5336.03 1244.41 5012.48C956.926 4857.97 248.584 4371.35 94.4617 4099.84C-218.631 3548.51 604.681 3263.22 895.152 3672.34C959.039 3762.26 989.49 3875.78 1061.08 3966.08C1277.23 4238.7 1346.71 4010.54 1327.69 3774.18C1319.11 3667.74 1255.72 3486.66 1190.47 3402.07C1077.86 3255.76 916.282 3254.77 759.55 3186.83C234.415 2959.17 -120.564 2468.07 38.1572 1877.87C183.828 1336.1 625.811 1766.46 785.527 2042.93C924.361 2283.26 1134.42 2812.11 1134.42 2812.11C1134.42 2812.11 1550.17 2958.67 1526.56 2631.4C1504.68 2328.97 1101.35 1727.33 1101.35 1727.33C1101.35 1727.33 699.889 761.163 889.932 331.92C1088.3 -115.953 1776.76 -82.9151 2066.86 265.721C2565.02 864.251 1927.4 2126.39 1927.4 2126.39C1927.4 2126.39 1953.25 2575.63 2191.27 2352.81C2476.77 2085.53 2677.63 1175.75 3112.03 1124.21C3361.36 1094.65 3443.39 1288.53 3463.28 1503.27C3529.53 2218.68 2495.79 2855.83 2495.79 2855.83C2495.79 2855.83 2124.9 3449.4 2202.83 3669.48C2252.92 3811.07 2356.08 3661.23 2445.33 3625.14C2671.68 3533.6 2672.03 3271.66 2822.93 3126.84L2823.17 3126.72Z"
            fill="#FF891D"
            fill-opacity="0.12"
          />
        </g>
        <defs>
          <clipPath id="bridge-decor-clip">
            <rect width="3622" height="5110" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </div>

    <div class="relative z-10 mx-auto grid w-full max-w-8xl gap-y-10 lg:grid-cols-12 lg:gap-x-10 items-start">
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
          別讓問題，拖到影響整個團隊
        </h2>

        <div class="mt-6 space-y-4 text-sm leading-relaxed text-[#555] sm:text-base">
          <p>
            你可能已經注意到——離職率悄悄上升、面試官意見兜不攏、主管遇到棘手的人力狀況不知道怎麼處理。這些訊號通常不會自己消失，只會越拖越麻煩。
          </p>
          <p>
            我們見過太多企業，等到問題已經很嚴重才尋求協助。其實越早開始一次對話，能調整的空間就越大，成本也越低。
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
