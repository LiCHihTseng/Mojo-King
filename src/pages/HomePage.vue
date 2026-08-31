<script setup lang="ts">
import { inject } from "vue";
import About from "../components/About.vue";
import Contact from "../components/Contact.vue";
import Footer from "../components/Footer.vue";
import Hero from "../components/Hero/Hero.vue";
import Navigation from "../components/Navigation.vue";
import Process from "../components/Process.vue";
import Service from "../components/Service.vue";
import Testimonials from "../components/Testimonials.vue";
import { entranceReadyKey } from "../lib/appShell";

const entranceReady = inject(entranceReadyKey);
if (!entranceReady) throw new Error("HomePage requires entranceReady");
</script>

<template>
  <div data-route-page data-route-kind="home">
    <Navigation :entrance-ready="entranceReady" />

    <div class="relative">
      <section class="sticky top-0 z-0 h-[100svh] w-full">
        <Hero :entrance-ready="entranceReady" />
      </section>

      <!-- data-nav-light-surface：導覽列從這裡開始要換成深色 logo -->
      <section
        id="about"
        data-nav-light-surface
        class="relative z-10 rounded-t-[2rem] bg-white"
      >
        <div
          class="pointer-events-none absolute inset-x-0 top-0 h-px shadow-[0_-30px_60px_15px_rgba(0,0,0,0.25)]"
        ></div>

        <About />
      </section>
    </div>

    <Service id="service" />
    <Testimonials />
    <Process />
    <Contact id="contact" />

    <Footer />
  </div>
</template>
