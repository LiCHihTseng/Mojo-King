<script setup lang="ts">
import { computed } from "vue";
import { getServiceBySlug } from "../data/services";

const props = defineProps<{ slug: string }>();
const service = computed(() => getServiceBySlug(props.slug));
</script>

<template>
  <main data-route-page data-route-kind="detail">
    <section v-if="service" :aria-labelledby="`service-${service.slug}-title`">
      <h1 :id="`service-${service.slug}-title`">
        {{ service.titleLine1 }}{{ service.titleLine2 }}
      </h1>
    </section>

    <section v-else aria-labelledby="service-not-found-title">
      <h1 id="service-not-found-title">找不到此服務</h1>
      <p>您尋找的服務頁面不存在。</p>
      <RouterLink to="/#service">查看服務內容</RouterLink>
    </section>
  </main>
</template>
