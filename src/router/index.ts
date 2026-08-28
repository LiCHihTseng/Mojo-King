import { createRouter, createWebHistory } from "vue-router";
import ConsultationPage from "../pages/ConsultationPage.vue";
import HomePage from "../pages/HomePage.vue";
import ServiceDetailPage from "../pages/ServiceDetailPage.vue";
import { trackPageView } from "../lib/analytics";
import { applyRouteMeta, resolveRouteMeta } from "../lib/routeMeta";
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
    { path: "/consultation", name: "consultation", component: ConsultationPage },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (shouldAppOwnRouteScroll(to.name, _from.name)) return false;
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash };
    return { top: 0 };
  },
});

// SPA 換頁不會重載 index.html，head 得自己跟著路由改，
// 否則每一頁在搜尋結果都長得跟首頁一樣。
router.afterEach((to) => {
  applyRouteMeta(resolveRouteMeta(to.name, to.params));
  // 順序有意義：標題先換好，GA 的「網頁標題」才會是這一頁的標題
  trackPageView(to.fullPath);
});
