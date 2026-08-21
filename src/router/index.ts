import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../pages/HomePage.vue";
import ServiceDetailPage from "../pages/ServiceDetailPage.vue";
import { shouldAppOwnRouteScroll } from "../lib/routeTransitionState";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "home", component: HomePage },
    {
      path: "/services/:slug",
      name: "service-detail",
      component: ServiceDetailPage,
      props: (route) => ({ slug: String(route.params.slug) }),
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (shouldAppOwnRouteScroll(to.name, _from.name)) return false;
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash };
    return { top: 0 };
  },
});
