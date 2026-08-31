<script setup lang="ts">
/**
 * ConsultationPage.vue
 *
 * 「預約諮詢」表單的獨立頁面。走 App.vue 那套覆蓋式轉場（頁面由下往上
 * 推出來），跟服務詳情頁同一套。
 *
 * 導覽用全站的 Navigation：原本那條「MOJO KING ／ ← 返回首頁」已經
 * 併進去，logo 就是返回鍵（走反向轉場退回首頁）。
 */
import ConsultationForm from "../components/ConsultationForm.vue";
import Navigation from "../components/Navigation.vue";
</script>

<template>
  <main
    data-route-page
    data-route-kind="consultation"
    data-nav-light-surface
    class="min-h-screen overflow-x-clip bg-surface-alt pt-[76px] sm:pt-[88px] lg:pt-[108px]"
  >
    <!--
      這一頁整片是淺色底（左邊那張深色圖從導覽列下緣才開始，見
      ConsultationForm 的 lg:top），所以導覽列一進來就是深色 logo
      ＋ 深色 Menu 的狀態。上方的 pt 是留給浮在上面的導覽列的位置。
    -->
    <Navigation entrance-ready />

    <ConsultationForm />
  </main>
</template>
