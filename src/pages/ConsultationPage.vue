<script setup lang="ts">
/**
 * ConsultationPage.vue
 *
 * 「預約諮詢」表單的獨立頁面。從 Contact 區塊的「填寫表單」按鈕進來，
 * 走 App.vue 那套覆蓋式轉場（頁面由下往上推出來），跟服務詳情頁同一套。
 *
 * 返回鍵沿用 routeTransition.returnToServices()：回到首頁最頂端，
 * 並播放對稱的退場動畫。沒有 provider 時（例如單元測試直接掛載）
 * 退回一般的 router.push。
 */
import { inject } from "vue";
import { useRouter } from "vue-router";
import ConsultationForm from "../components/ConsultationForm.vue";
import { routeTransitionKey } from "../lib/appShell";

const router = useRouter();
const transition = inject(routeTransitionKey, null);

const returnHome = () => {
  if (transition) {
    void transition.returnToServices();
    return;
  }

  void router.push("/");
};
</script>

<template>
  <main
    data-route-page
    data-route-kind="consultation"
    class="min-h-screen overflow-x-clip bg-[#F9F8F6]"
  >
    <header
      class="bg-[#252525] px-5 text-[11px] font-medium tracking-[0.16em] text-white sm:px-8 md:text-xs lg:px-16"
    >
      <nav
        aria-label="表單頁導覽"
        class="mx-auto flex w-full max-w-8xl items-center justify-between py-4"
      >
        <span class="uppercase">MOJO KING</span>
        <button
          type="button"
          class="inline-flex items-center gap-3 py-2 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF891D] focus-visible:ring-offset-4 focus-visible:ring-offset-[#252525]"
          @click="returnHome"
        >
          <span aria-hidden="true">←</span>
          返回首頁
        </button>
      </nav>
    </header>

    <ConsultationForm />
  </main>
</template>
