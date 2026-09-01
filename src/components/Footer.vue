<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollToSection } from "../lib/scrollToSection";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  companyName?: string;
  companyId?: string;
  email?: string;
}

withDefaults(defineProps<Props>(), {
  companyName: "慕玖股份有限公司",
  email: "services@mojo-king.com",
});

const footerWrapRef = ref<HTMLElement | null>(null); // 外層：決定觸發時機的容器
const footerRef = ref<HTMLElement | null>(null); // 整個 footer 本身：做位移動畫

let mm: ReturnType<typeof gsap.matchMedia> | null = null;

onMounted(async () => {
  await nextTick();

  mm = gsap.matchMedia();

  /*
   * 這段位移只在桌機（>=1024px）執行。
   *
   * 它的範圍結束在 "bottom bottom"，也就是整頁的最底部 —— 正好是手機
   * 和平板網址列收合／展開的地方。捲到底時視窗高度反覆變化，scrub 補間
   * 就會跟著來回跳，看起來像畫面在抽動。觸控裝置本來就沒有這個裝飾的
   * 必要，直接不註冊，斷點跟 About 的桌機分支一致。
   */
  mm.add(
    "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
    () => {
      const wrap = footerWrapRef.value;
      const footer = footerRef.value;
      if (!wrap || !footer) return;

      const tween = gsap.fromTo(
        footer,
        { y: 150 },
        {
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: wrap,
            start: "top bottom",
            end: "bottom bottom",
            scrub: 0.8,
          },
        },
      );

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        gsap.set(footer, { clearProps: "transform" });
      };
    },
  );
});

onBeforeUnmount(() => {
  mm?.revert();
  mm = null;
});
/** 站內錨點統一走 Lenis，原生 hash 跳轉會被 Lenis 吃掉 */
const handleFooterLinkClick = (event: MouseEvent, hash: string) => {
  event.preventDefault();
  scrollToSection(hash);
};

</script>

<template>
  <div ref="footerWrapRef" class="relative overflow-hidden">
    <!-- will-change 只在有動畫的桌機才給，手機／平板掛著等於白白多一層合成層 -->
    <footer
      ref="footerRef"
      class="w-full bg-ink px-6 py-16 text-white sm:py-20 lg:[will-change:transform]"
    >
      <div class="mx-auto max-w-wide">
        <div class="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <svg
              width="327"
              height="140"
              class="h-auto w-[110px] sm:w-[130px]"
              viewBox="0 0 327 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="慕玖 MoJo King"
            >
              <path
                d="M53.248 103.68L15.104 4.608V94.592L27.392 99.712V102.4H0V99.712L12.032 94.592V4.608L0.256 2.816V0H28.544L60.672 82.176L93.44 0H119.296V2.816L107.52 4.608V97.792L119.296 99.712V102.4H81.664V99.712L93.44 97.792V8.448L55.552 103.68H53.248ZM163.036 103.68C156.892 103.68 151.303 102.272 146.268 99.456C141.233 96.5547 137.223 92.5014 134.236 87.296C131.335 82.0054 129.884 75.9894 129.884 69.248C129.884 62.5067 131.335 56.5334 134.236 51.328C137.223 46.1227 141.233 42.112 146.268 39.296C151.303 36.3947 156.892 34.944 163.036 34.944C169.18 34.944 174.769 36.3947 179.804 39.296C184.839 42.112 188.807 46.1227 191.708 51.328C194.695 56.5334 196.188 62.5067 196.188 69.248C196.188 75.9894 194.695 82.0054 191.708 87.296C188.807 92.5014 184.839 96.5547 179.804 99.456C174.769 102.272 169.18 103.68 163.036 103.68ZM163.036 100.864C169.351 100.864 174.087 98.56 177.244 93.952C180.487 89.344 182.108 83.2427 182.108 75.648V62.848C182.108 55.2534 180.487 49.1947 177.244 44.672C174.087 40.064 169.351 37.76 163.036 37.76C156.721 37.76 151.943 40.064 148.7 44.672C145.543 49.1947 143.964 55.2534 143.964 62.848V75.648C143.964 83.2427 145.543 89.344 148.7 93.952C151.943 98.56 156.721 100.864 163.036 100.864ZM216.792 139.904C211.672 139.904 207.405 138.795 203.992 136.576C200.664 134.357 199 131.115 199 126.848C199 124.032 199.768 121.771 201.304 120.064C202.925 118.272 205.016 117.376 207.576 117.376C209.624 117.376 211.245 117.931 212.44 119.04C213.635 120.149 214.445 121.344 214.872 122.624C215.384 123.819 215.64 124.587 215.64 124.928C213.165 126.72 211.928 128.811 211.928 131.2C211.928 132.821 212.44 134.187 213.464 135.296C214.488 136.405 215.896 136.96 217.688 136.96C220.419 136.96 222.552 135.125 224.088 131.456C225.709 127.701 226.52 121.259 226.52 112.128V39.552L214.744 37.76V34.944H251.864V37.76L240.088 39.552V112.128C240.088 118.101 239.491 123.093 238.296 127.104C237.187 131.029 234.925 134.144 231.512 136.448C228.099 138.752 223.192 139.904 216.792 139.904ZM293.786 103.68C287.642 103.68 282.053 102.272 277.018 99.456C271.983 96.5547 267.973 92.5014 264.986 87.296C262.085 82.0054 260.634 75.9894 260.634 69.248C260.634 62.5067 262.085 56.5334 264.986 51.328C267.973 46.1227 271.983 42.112 277.018 39.296C282.053 36.3947 287.642 34.944 293.786 34.944C299.93 34.944 305.519 36.3947 310.554 39.296C315.589 42.112 319.557 46.1227 322.458 51.328C325.445 56.5334 326.938 62.5067 326.938 69.248C326.938 75.9894 325.445 82.0054 322.458 87.296C319.557 92.5014 315.589 96.5547 310.554 99.456C305.519 102.272 299.93 103.68 293.786 103.68ZM293.786 100.864C300.101 100.864 304.837 98.56 307.994 93.952C311.237 89.344 312.858 83.2427 312.858 75.648V62.848C312.858 55.2534 311.237 49.1947 307.994 44.672C304.837 40.064 300.101 37.76 293.786 37.76C287.471 37.76 282.693 40.064 279.45 44.672C276.293 49.1947 274.714 55.2534 274.714 62.848V75.648C274.714 83.2427 276.293 89.344 279.45 93.952C282.693 98.56 287.471 100.864 293.786 100.864Z"
                fill="#ffffff" />
            </svg>
            <p class="mt-4 max-w-xs text-caption text-white/50">
              共享人資長服務，陪你把人才策略做到落地。
            </p>
          </div>

          <!-- 手機：導覽與 email 併成同一列（各佔一半），桌機維持兩欄並排 -->
          <div class="flex gap-8 sm:gap-16">
            <div class="min-w-0 flex-1 sm:flex-none">
              <ul class="flex flex-col gap-2 text-sm text-white/70 sm:text-base lg:text-lg">
                <li><a href="#about" class="transition-colors hover:text-brand" @click="handleFooterLinkClick($event, '#about')">關於慕玖</a></li>
                <li><a href="#service" class="transition-colors hover:text-brand" @click="handleFooterLinkClick($event, '#service')">服務內容</a></li>
                <li><a href="#contact" class="transition-colors hover:text-brand" @click="handleFooterLinkClick($event, '#contact')">聯絡我們</a></li>
              </ul>
            </div>

            <div class="min-w-0 flex-1 sm:flex-none">
              <ul class="flex flex-col gap-2 text-sm text-white/70 sm:text-base lg:text-lg">
                <li>
                  <a
                    :href="`mailto:${email}`"
                    class="break-all transition-colors hover:text-brand"
                  >{{ email }}</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-md text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {{ new Date().getFullYear() }} {{ companyName }}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>