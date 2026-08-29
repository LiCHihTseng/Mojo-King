<script setup lang="ts">
/**
 * ServiceDetailSection.vue
 *
 * 版面是「標題壓在內容正上方」的直向堆疊，不是左右分欄。
 *
 * 舊版把 section.label（ABOUT THE SERVICE 之類）單獨放進 12 欄裡的左 3 欄，
 * 結果是一個 10px 的英文標籤孤零零佔著 300px 寬的欄位、底下全空，
 * 而右邊的內文被壓在剩下的 9 欄裡。那個英文標籤講的事情中文標題已經
 * 說完了（「關於人資顧問」上面再掛一行 ABOUT THE SERVICE），
 * 所以標籤直接拿掉，欄位一併收掉，內容拿回整個寬度。
 *
 * section.label 仍留在資料裡當作 v-for 的 key，只是不再渲染。
 */
import type { ServiceDetailSection } from "../../data/services";

defineProps<{ section: ServiceDetailSection }>();

const zeroPad = (index: number) => String(index + 1).padStart(2, "0");
</script>

<template>
  <section
    data-detail-section
    class="mx-auto w-full max-w-8xl border-t border-ink/20 px-5 py-16 sm:px-8 sm:py-20 md:px-12 md:py-24 lg:px-16 lg:py-32"
  >
    <h2
      class="max-w-[19ch] text-h2 text-ink text-balance"
    >
      {{ section.title }}
    </h2>

    <!--
      連續內文限制行長。中文字是全形，40em 大約是 40 字一行，
      再寬眼睛回行就會找不到位置。舊版這裡是 lg:grid-cols-2，
      但 columns 陣列實際上永遠只有一段文字，等於每次都把段落
      擠進左半邊、右邊留一塊 500px 的空白。
    -->
    <div
      v-if="section.type === 'prose'"
      data-detail-prose
      class="mt-10 flex max-w-[40em] flex-col gap-6 text-base leading-8 text-ink-soft md:mt-12 lg:mt-14"
    >
      <p v-for="(column, index) in section.columns" :key="`${index}-${column}`">
        {{ column }}
      </p>
    </div>

    <!--
      條列的分隔線比 section 的分隔線淡，兩層才分得出「這是新的一段」
      和「這是同一段裡的下一項」。舊版兩者都是 /25，整頁讀起來
      就是一疊一模一樣的橫線。
    -->
    <ol
      v-else-if="section.type === 'numbered-list'"
      class="mt-10 border-b border-ink/10 md:mt-12 lg:mt-14"
    >
      <li
        v-for="(item, index) in section.items"
        :key="item.title"
        data-detail-numbered-row
        class="grid gap-x-8 gap-y-3 border-t border-ink/10 py-6 sm:grid-cols-[3.5rem_minmax(0,1fr)] md:py-8 lg:grid-cols-[3.5rem_minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-baseline"
      >
        <span class="text-eyebrow text-brand-ink">
          {{ zeroPad(index) }}
        </span>
        <h3 class="text-h3 text-ink">
          {{ item.title }}
        </h3>
        <p
          v-if="item.description"
          class="max-w-[34em] text-body text-ink-muted sm:col-start-2 lg:col-start-auto"
        >
          {{ item.description }}
        </p>
      </li>
    </ol>

    <ul
      v-else
      data-detail-card-list
      class="mt-10 grid border-t border-ink/10 md:mt-12 lg:mt-14 lg:grid-cols-2"
    >
      <li
        v-for="item in section.items"
        :key="item.title"
        class="flex items-start gap-5 border-b border-ink/10 py-6 md:py-8 lg:px-10 lg:odd:border-r lg:odd:pl-0"
      >
        <span aria-hidden="true" class="mt-2.5 h-1.5 w-1.5 shrink-0 bg-brand" />
        <div>
          <h3 class="text-h4 text-ink">
            {{ item.title }}
          </h3>
          <p
            v-if="item.description"
            class="mt-2 max-w-[34em] text-body text-ink-muted"
          >
            {{ item.description }}
          </p>
        </div>
      </li>
    </ul>
  </section>
</template>
