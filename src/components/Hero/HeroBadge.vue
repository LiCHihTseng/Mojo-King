<script setup lang="ts">
interface Props {
  count?: string;
  label?: string;
  avatarCount?: number;
}

withDefaults(defineProps<Props>(), {
  count: "150+",
  label: "企業信賴合作",
  avatarCount: 3,
});
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- 頭像群組 -->
    <div class="flex -space-x-3">
      <img
        v-for="n in avatarCount"
        :key="n"
        :src="`https://i.pravatar.cc/80?img=${n + 10}`"
        alt=""
        class="h-9 w-9 rounded-full border-2 border-black object-cover"
      />
    </div>

    <!-- 數字與文字 -->
    <p class="text-sm font-medium leading-tight text-white">
      {{ count }}

      <br />

      <span class="text-white/70">
        {{ label }}
      </span>
    </p>
  </div>
</template>