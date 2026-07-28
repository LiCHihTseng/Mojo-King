<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Hero from "./components/Hero/Hero.vue";
import About from "./components/About.vue";
import Service from "./components/Service.vue";
import Testimonials from "./components/Testimonials.vue";
import Navigation from "./components/Navigation.vue";
import Contact from "./components/Contact.vue";
import Footer from "./components/Footer.vue";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

onMounted(() => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion) return;

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  // 讓 Lenis 每次更新捲動位置時，通知 ScrollTrigger 重新計算
  lenis.on("scroll", ScrollTrigger.update);

  // 用 GSAP 的 ticker 驅動 Lenis，比 requestAnimationFrame 更穩定
  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
});

onBeforeUnmount(() => {
  lenis?.destroy();
});
</script>

<!-- App.vue -->
<template>
  <main class="relative">
    <Navigation />

    <div class="relative">
      <section class="sticky top-0 z-0 h-screen w-full">
        <Hero />
      </section>
      <section class="relative z-10 rounded-t-[2.5rem] bg-white shadow-[0_-30px_60px_-15px_rgba(0,0,0,0.25)]">
        <About id="about" />
      </section>
    </div>

    <Service id="service" />
    <Testimonials />
    <Contact id="contact" />
    <Footer />
  </main>
</template>