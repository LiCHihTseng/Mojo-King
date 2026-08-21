# Service Detail Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four-scene Service story with three typed services and build routed, animated editorial detail pages with black/upward page transitions and parallax heroes.

**Architecture:** A typed service catalog is the single source for homepage and detail content. Vue Router renders `HomePage` and one shared `ServiceDetailPage` inside a persistent `App` shell that owns the one-time loader, Lenis, scroll restoration, and GSAP route transition. Service scene motion, route-transition state, and detail animation are isolated so each has a clear lifecycle and test boundary.

**Tech Stack:** Vue 3.5, TypeScript 6, Vue Router 4, GSAP 3.15 with ScrollTrigger, Lenis, Tailwind CSS 4, Node test runner, Vite 8.

**Spec:** `docs/superpowers/specs/2026-08-21-service-detail-pages-design.md`

## Global Constraints

- The homepage contains exactly three services: `hr-consulting`, `fractional-chro`, and `custom-training`.
- Preserve the existing Intro expansion and the first scene's `backgroundImage`.
- Desktop scene images stack with `yPercent` only; they never crossfade or shrink.
- Desktop copy begins `opacity: 0, y: 20` and enters only after its image is fully positioned.
- Mobile, touch, hybrid-pointer, and reduced-motion modes use normal flow with immediately visible copy.
- Detail routes use one shared page component and exact approved copy from the design spec.
- Route entry blackens the old page and raises the new page from the bottom; browser Back reverses the visual relationship and restores homepage scroll.
- Detail heroes use restrained, edge-safe parallax; reduced motion is static.
- All component-owned GSAP timelines, ScrollTriggers, RAF callbacks, DOM attributes, and scroll locks are cleaned up.
- Preserve unrelated working-tree changes in `ConsultationBridge.vue`, `Contact.vue`, and `Navigation.vue`.

---

## File Structure

### Create

- `src/data/services.ts` — typed catalog, detail-section types, slug lookup, and route href generation.
- `src/pages/HomePage.vue` — existing homepage composition extracted from `App.vue`.
- `src/pages/ServiceDetailPage.vue` — slug lookup, not-found branch, detail-page composition, focus target.
- `src/components/service-detail/ServiceDetailHero.vue` — parallax hero and hero-level CTA.
- `src/components/service-detail/ServiceDetailSection.vue` — editorial renderer for prose, lists, and numbered content.
- `src/components/service-detail/FiveDMethod.vue` — shared connected 5D sequence.
- `src/router/index.ts` — history router and route definitions.
- `src/lib/appShell.ts` — injection keys for entrance state and route transition controller.
- `src/lib/routeTransitionState.ts` — pure transition lock/direction/scroll state.
- `tests/services.test.ts` — catalog and slug lookup tests.
- `tests/route-transition-state.test.ts` — re-entry lock and state-reset tests.

### Modify

- `package.json` and `package-lock.json` — add Vue Router.
- `src/main.ts` — install router.
- `src/App.vue` — persistent loader/Lenis shell, RouterView, GSAP route hooks, scroll restoration.
- `src/components/Service.vue` — consume three-service catalog, route CTAs, copy refs, three-scene GSAP timeline.
- `src/components/serviceMotion.ts` — copy/accessibility plans for three scenes and transition gaps.
- `tests/service-motion.test.ts` — three-scene, copy-reveal, static-mode, and no-active-scene assertions.
- `src/style.css` — global page background and scroll-lock utility only if component-scoped styles cannot own them.

---

### Task 1: Typed Service Catalog and Router Dependency

**Files:**
- Create: `src/data/services.ts`
- Create: `tests/services.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `ServiceSlug`, `ServiceDetailSection`, `ServiceDefinition`, `FiveDStep`, `services`, `fiveDSteps`, `getServiceBySlug(slug)`, and `getServiceHref(slug)`.
- Consumed by: Tasks 2–4.

- [ ] **Step 1: Write the failing catalog tests**

Create `tests/services.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  getServiceBySlug,
  getServiceHref,
  fiveDSteps,
  services,
} from "../src/data/services.ts";

test("catalog exposes exactly the three approved services", () => {
  assert.deepEqual(
    services.map(({ slug }) => slug),
    ["hr-consulting", "fractional-chro", "custom-training"],
  );
});

test("each service has a unique route and complete detail content", () => {
  const hrefs = services.map(({ slug }) => getServiceHref(slug));
  assert.equal(new Set(hrefs).size, 3);
  assert.deepEqual(hrefs, [
    "/services/hr-consulting",
    "/services/fractional-chro",
    "/services/custom-training",
  ]);
  services.forEach((service) => {
    assert.ok(service.tag.length > 0);
    assert.ok(service.titleLine1.length > 0);
    assert.ok(service.titleLine2.length > 0);
    assert.ok(service.summary.length > 0);
    assert.ok(service.detailIntro.length > 0);
    assert.ok(service.sections.length > 0);
  });
});

test("unknown slugs never fall back to another service", () => {
  assert.equal(getServiceBySlug("missing-service"), undefined);
});

test("the shared method contains the five approved ordered steps", () => {
  assert.deepEqual(fiveDSteps.map(({ english }) => english), [
    "Define & Agree",
    "Discover & Analyze",
    "Deliver & Decide",
    "Design & Implement",
    "Disengage & Review",
  ]);
});
```

- [ ] **Step 2: Run the test and confirm the red state**

Run: `node --test tests/services.test.ts`

Expected: FAIL because `src/data/services.ts` does not exist.

- [ ] **Step 3: Add Vue Router**

Run: `npm install vue-router@4`

Expected: `vue-router` appears in `dependencies`, and the lockfile changes without upgrading unrelated packages.

- [ ] **Step 4: Implement the typed catalog**

Create the following public types and helpers in `src/data/services.ts`:

```ts
export type ServiceSlug =
  | "hr-consulting"
  | "fractional-chro"
  | "custom-training";

export interface ServiceListItem {
  title: string;
  description?: string;
}

export type ServiceDetailSection =
  | { type: "prose"; label: string; title: string; columns: string[] }
  | { type: "numbered-list"; label: string; title: string; items: ServiceListItem[] }
  | { type: "bullet-list"; label: string; title: string; items: ServiceListItem[] };

export interface ServiceDefinition {
  slug: ServiceSlug;
  index: "01" | "02" | "03";
  tag: string;
  titleLine1: string;
  titleLine2: string;
  summary: string;
  image: string;
  detailIntro: string;
  sections: ServiceDetailSection[];
}

export interface FiveDStep {
  english: string;
  chinese: string;
}

export const DEFAULT_SERVICE_HERO_IMAGE =
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2000&auto=format&fit=crop";

export const getServiceHref = (slug: ServiceSlug) => `/services/${slug}`;

export const getServiceBySlug = (slug: string) =>
  services.find((service) => service.slug === slug);
```

Populate `services` and `fiveDSteps` with exactly the approved strings and lists in the spec's “Homepage Service Content,” “Detail Content,” and “Shared 5D method” sections. Use `DEFAULT_SERVICE_HERO_IMAGE` for service 1 and the existing scene image sources for services 2 and 3. Task 3 must also use `DEFAULT_SERVICE_HERO_IMAGE` as the `backgroundImage` prop default so the first homepage scene and first detail hero remain identical.

- [ ] **Step 5: Run catalog tests and the full suite**

Run: `npm test`

Expected: catalog tests PASS; the existing Service tests remain green.

- [ ] **Step 6: Commit Task 1**

```powershell
git add package.json package-lock.json src/data/services.ts tests/services.test.ts
git commit -m "feat: add typed service catalog"
```

---

### Task 2: Router and Persistent Application Shell

**Files:**
- Create: `src/router/index.ts`
- Create: `src/lib/appShell.ts`
- Create: `src/pages/HomePage.vue`
- Create: `src/pages/ServiceDetailPage.vue` with a temporary semantic shell
- Modify: `src/main.ts`
- Modify: `src/App.vue`

**Interfaces:**
- Consumes: `getServiceBySlug(slug)` from Task 1.
- Produces: `router`, `entranceReadyKey`, `routeTransitionKey`, `/`, `/services/:slug`, and a stable route page root marked with `data-route-page`.
- Consumed by: Tasks 3–6.

- [ ] **Step 1: Create the router**

Create `src/router/index.ts`:

```ts
import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../pages/HomePage.vue";
import ServiceDetailPage from "../pages/ServiceDetailPage.vue";

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
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash };
    return { top: 0 };
  },
});
```

- [ ] **Step 2: Define typed app-shell injection keys**

Create `src/lib/appShell.ts` with these exact contracts:

```ts
import type { InjectionKey, Ref } from "vue";

export interface RouteTransitionController {
  readonly isTransitioning: Readonly<Ref<boolean>>;
  navigateToService(href: string): Promise<void>;
  returnToServices(): Promise<void>;
  preloadImage(src: string): void;
}

export const entranceReadyKey: InjectionKey<Readonly<Ref<boolean>>> =
  Symbol("entranceReady");
export const routeTransitionKey: InjectionKey<RouteTransitionController> =
  Symbol("routeTransition");
```

- [ ] **Step 3: Extract the homepage without redesigning it**

Move the existing page composition from `App.vue` into `src/pages/HomePage.vue`. Keep the exact section order, ids, Navigation, Hero, About, Service, Testimonials, Process, Contact, ConsultationBridge, ConsultationForm, and Footer. Inject `entranceReadyKey` and pass its value to `Navigation` and `Hero`:

```ts
const entranceReady = inject(entranceReadyKey);
if (!entranceReady) throw new Error("HomePage requires entranceReady");
```

Do not move the one-time loader or Lenis lifecycle into `HomePage`.

- [ ] **Step 4: Add the temporary detail route shell**

Create a minimal `ServiceDetailPage.vue` that reads the `slug` prop, calls `getServiceBySlug`, renders an `h1` for a valid service, and renders a semantic not-found branch plus `RouterLink to="/#service"` for invalid slugs. Give the root `data-route-page` and `data-route-kind="detail"`.

- [ ] **Step 5: Convert App into the persistent route shell**

Keep the existing loader and Lenis code in `App.vue`. Add `provide(entranceReadyKey, readonly(entranceReady))`, render `<RouterView>` inside the persistent main shell, and keep `MojoKingLoader` outside the routed page. Mark routed roots via the page components rather than applying unknown attributes from App.

The first application mount may call `window.scrollTo(0, 0)`; internal route changes must not replay that initialization.

- [ ] **Step 6: Install the router and verify direct routes**

Modify `src/main.ts`:

```ts
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import "./style.css";
import "./font.css";

createApp(App).use(router).mount("#app");
```

Run: `npm run build`

Expected: TypeScript and Vite build PASS.

Run the dev server and open `/`, `/services/hr-consulting`, and `/services/not-real`. Expected: homepage, valid temporary detail heading, and stable not-found state respectively.

- [ ] **Step 7: Commit Task 2**

```powershell
git add src/main.ts src/App.vue src/router/index.ts src/lib/appShell.ts src/pages/HomePage.vue src/pages/ServiceDetailPage.vue
git commit -m "feat: add routed application shell"
```

---

### Task 3: Three Service Scenes, Copy Motion, and Routed CTAs

**Files:**
- Modify: `src/components/Service.vue`
- Modify: `src/components/serviceMotion.ts`
- Modify: `tests/service-motion.test.ts`

**Interfaces:**
- Consumes: `services`, `getServiceHref`, and `routeTransitionKey`.
- Produces: three desktop scenes, direct mobile copy, `sceneCopyRefs`, and route-aware Service CTA activation.
- Consumed by: route transitions in Task 5.

- [ ] **Step 1: Update motion tests to the approved three-scene contract**

Replace four-scene expectations with:

```ts
assert.deepEqual(createServiceMotionPlan(3, "desktop", true), {
  pin: true,
  initialYPercent: [0, 100, 100],
  incomingSceneIndexes: [1, 2],
  firstSceneCopyStartsVisible: false,
  animateFirstSceneCopyWithIntro: true,
});
```

Add a desktop transition-gap test:

```ts
assert.deepEqual(
  createServiceAccessibilityPlan(3, "desktop", true, null),
  {
    introCopyInteractive: false,
    sceneInteractive: [false, false, false],
  },
);
```

Keep the wide touch, hybrid touch, precise-pointer, mobile, and reduced-motion-equivalent plan assertions.

- [ ] **Step 2: Run the test and confirm the red state**

Run: `node --test tests/service-motion.test.ts`

Expected: FAIL because accessibility currently clamps `null` to scene 0 and tests still reflect four scenes.

- [ ] **Step 3: Permit an intentional no-active-scene state**

Change `createServiceAccessibilityPlan` to accept `activeSceneIndex: number | null`. In desktop mode, `null` returns `introCopyInteractive: false` and an all-false scene array. Mobile ignores the active index and returns all scenes interactive.

- [ ] **Step 4: Replace default card data with the catalog**

Import `services` and use it as the default three-card source. Keep the existing prop override capability, but extend each card with `slug` and derive `href` with `getServiceHref(card.slug)`. The first image remains `props.backgroundImage`; services 2 and 3 use their catalog images.

- [ ] **Step 5: Add copy refs and GSAP sequencing**

Collect the visible content wrappers in `sceneCopyRefs`. Desktop initialization sets incoming copy to `{ autoAlpha: 0, y: 20 }`; mobile/static initialization sets all copy to `{ autoAlpha: 1, y: 0 }`.

For each incoming desktop scene, use this sequence:

```ts
timeline
  .to(scene, {
    yPercent: 0,
    duration: SCENE_MOVE_DURATION,
    onComplete: () => applyAccessibility("desktop", null, introEnabled),
  })
  .to(copy, {
    autoAlpha: 1,
    y: 0,
    duration: SCENE_COPY_DURATION,
    ease: "power2.out",
    onComplete: () => applyAccessibility("desktop", sceneIndex, introEnabled),
    onReverseComplete: () => applyAccessibility("desktop", null, introEnabled),
  })
  .to({}, { duration: SCENE_HOLD_DURATION });
```

On the scene movement tween's `onReverseComplete`, restore `sceneIndex - 1`. Extend the existing first Intro copy fade tween to animate both `autoAlpha` and `y`, playing only when the `imageFull` label is crossed forward and reversing when shrink begins.

- [ ] **Step 6: Route CTA activation without breaking modified-click behavior**

Inject `routeTransitionKey` optionally and also create `const router = useRouter()`. Each CTA receives its real `href`. Handle only unmodified primary clicks with `preventDefault()` and `transition?.navigateToService(href) ?? router.push(href)`; allow Ctrl/Cmd-click, Shift-click, middle-click, and copied links to keep native browser behavior. On focus or pointer enter, preload the exact hero source (`props.backgroundImage` for scene 1, `card.image` for scenes 2 and 3). This fallback keeps routing functional before Task 5 installs the animated controller.

- [ ] **Step 7: Verify Service behavior**

Run: `npm test`

Expected: all motion and catalog tests PASS.

Run: `npm run build`

Expected: PASS.

Browser-check desktop at 1280×720: Scenes 2 and 3 reach `y = 0` before their copy opacity leaves zero. Browser-check mobile at 390×844: three scenes remain in normal flow with copy opacity `1`, transform `none`/`y = 0`, and no pin.

- [ ] **Step 8: Commit Task 3**

```powershell
git add src/components/Service.vue src/components/serviceMotion.ts tests/service-motion.test.ts
git commit -m "feat: animate three service scenes"
```

---

### Task 4: Editorial Detail Page and Approved Content

**Files:**
- Create: `src/components/service-detail/ServiceDetailHero.vue`
- Create: `src/components/service-detail/ServiceDetailSection.vue`
- Create: `src/components/service-detail/FiveDMethod.vue`
- Modify: `src/pages/ServiceDetailPage.vue`

**Interfaces:**
- Consumes: `ServiceDefinition`, `ServiceDetailSection`, `fiveDSteps`, `getServiceBySlug`, and `routeTransitionKey`.
- Produces: `[data-detail-heading]`, `[data-detail-hero]`, `[data-parallax-image]`, and `[data-detail-section]` hooks for Tasks 5–6.

- [ ] **Step 1: Build the semantic parallax-ready hero markup**

`ServiceDetailHero.vue` accepts `service: ServiceDefinition`. Render:

- A `90–100svh` overflow-hidden hero with `data-detail-hero`.
- The service image with `data-parallax-image`, eager loading, high fetch priority, and empty alt because the adjacent heading supplies the meaning.
- A bottom gradient that preserves image brightness above the text zone.
- Index and tag, an `h1` carrying `data-detail-heading` and `tabindex="-1"`, summary, and a `預約諮詢` link to `/#consultation-form`.
- A minimal top bar with brand label and a button that calls `transition?.returnToServices()` when the controller is present, otherwise `router.push("/#service")`.

- [ ] **Step 2: Build the editorial section renderer**

`ServiceDetailSection.vue` accepts `section: ServiceDetailSection` and renders a wide warm-white grid with:

- left rail: dot plus `section.label`;
- main heading: `section.title`;
- prose columns for `type === "prose"`;
- ordered items with zero-padded numbers for `numbered-list`;
- semantic unordered items for `bullet-list`.

Every major root receives `data-detail-section`. Use borders and typography, not elevated rounded cards.

- [ ] **Step 3: Build the shared 5D sequence**

Render the exact five approved `fiveDSteps` from the catalog in `FiveDMethod.vue`. Use an ordered list with a continuous rule on desktop and a vertical rule on mobile. The heading is exactly `從需求定義到能力移轉，讓每一項方案真正落地並持續運作。`

- [ ] **Step 4: Compose the detail page and not-found state**

In `ServiceDetailPage.vue`, compute `service = getServiceBySlug(props.slug)`. For a valid service render Hero, the approved intro as a prose section, service-specific catalog sections, 5D, and a final consultation CTA. For invalid slugs render:

```html
<main data-route-page data-route-kind="detail" class="min-h-screen bg-[#f4f0e8]">
  <h1>找不到這項服務</h1>
  <a href="/#service">返回服務列表</a>
</main>
```

Do not substitute another service's content.

- [ ] **Step 5: Verify layout responsively**

Run: `npm run build`

Expected: PASS with no missing discriminated-union branch.

Browser-check each route at 1440×900 and 390×844. Expected: unique content, one-column mobile reading order, no horizontal overflow, visible focus states, and no duplicated 5D text.

- [ ] **Step 6: Commit Task 4**

```powershell
git add src/pages/ServiceDetailPage.vue src/components/service-detail
git commit -m "feat: build editorial service detail pages"
```

---

### Task 5: GSAP Route Transition, Locking, Focus, and Scroll Restoration

**Files:**
- Create: `src/lib/routeTransitionState.ts`
- Create: `tests/route-transition-state.test.ts`
- Modify: `src/App.vue`
- Modify: `src/lib/appShell.ts` only if the controller signature needs a read-only direction field
- Modify: `src/style.css` only for the root scroll-lock class

**Interfaces:**
- Produces: `createRouteTransitionState()`, the injected `RouteTransitionController`, and GSAP RouterView enter/leave hooks.
- Consumes: `[data-route-page]`, `[data-route-kind]`, and `[data-detail-heading]` from routed pages.

- [ ] **Step 1: Write failing transition-state tests**

Create `tests/route-transition-state.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { createRouteTransitionState } from "../src/lib/routeTransitionState.ts";

test("transition lock rejects duplicate navigation", () => {
  const state = createRouteTransitionState();
  assert.equal(state.begin("forward"), true);
  assert.equal(state.begin("forward"), false);
  state.finish();
  assert.equal(state.begin("back"), true);
});

test("home scroll is recorded and reset explicitly", () => {
  const state = createRouteTransitionState();
  state.rememberHomeScroll(2840);
  assert.equal(state.homeScrollY, 2840);
  state.clearHomeScroll();
  assert.equal(state.homeScrollY, null);
});
```

- [ ] **Step 2: Run the test and confirm the red state**

Run: `node --test tests/route-transition-state.test.ts`

Expected: FAIL because the state module does not exist.

- [ ] **Step 3: Implement the pure state machine**

Create `src/lib/routeTransitionState.ts`:

```ts
export type RouteTransitionDirection = "direct" | "forward" | "back";

export function createRouteTransitionState() {
  let active = false;
  let direction: RouteTransitionDirection = "direct";
  let homeScrollY: number | null = null;

  return {
    get active() { return active; },
    get direction() { return direction; },
    get homeScrollY() { return homeScrollY; },
    begin(next: RouteTransitionDirection) {
      if (active) return false;
      active = true;
      direction = next;
      return true;
    },
    finish() { active = false; direction = "direct"; },
    rememberHomeScroll(value: number) { homeScrollY = Math.max(0, value); },
    clearHomeScroll() { homeScrollY = null; },
  };
}
```

- [ ] **Step 4: Add the persistent black overlay and transition controller**

In `App.vue`, create a fixed black overlay above the outgoing page and below the incoming page. Provide a controller whose `navigateToService(href)`:

1. returns immediately if `state.begin("forward")` is false;
2. records `window.scrollY` while on the homepage;
3. sets the reactive transition lock;
4. calls `router.push(href)`;
5. catches failures and always clears overlay, scroll lock, and state.

`returnToServices()` sets direction `back` and uses `router.back()` when history is available; a direct detail visit uses `router.push("/#service")`.

- [ ] **Step 5: Implement RouterView GSAP hooks**

Use `<RouterView v-slot="{ Component, route }">` and `<Transition :css="false" mode="out-in">` keyed by `route.fullPath`.

Forward leave: lock scroll and tween overlay opacity `0 → 1` in about 0.28 seconds.

Forward enter: set page `yPercent: 100`, tween to `0` in about 0.85 seconds with `power3.inOut`, then hide the overlay, release scroll, focus `[data-detail-heading]`, call `ScrollTrigger.refresh()`, and finish state.

Back leave: keep overlay black behind the page and tween the detail root to `yPercent: 100`.

Back enter: restore recorded homepage Y before revealing it, tween overlay opacity to zero, release scroll, refresh ScrollTrigger, and finish state.

Reduced motion skips page translation and uses at most the short black opacity transition.

- [ ] **Step 6: Handle popstate, failures, and cleanup**

Mark browser popstate as `back` before RouterView hooks run. Keep a GSAP context/timeline reference and kill/revert it on App unmount. Always remove the scroll-lock class in error and unmount paths. Ignore repeated CTA clicks while active.

- [ ] **Step 7: Run tests and browser verification**

Run: `npm test`

Expected: transition-state tests PASS and the full suite remains green.

Browser-check CTA entry, Back, direct service load, invalid slug, rapid double click, and reduced motion. Expected: one transition, correct URL/content, no persistent black overlay, no persistent scroll lock, detail `h1` focused, and restored Service scroll.

- [ ] **Step 8: Commit Task 5**

```powershell
git add src/App.vue src/lib/appShell.ts src/lib/routeTransitionState.ts src/style.css tests/route-transition-state.test.ts
git commit -m "feat: add gsap service route transitions"
```

---

### Task 6: Detail Hero Parallax and Restrained Section Reveals

**Files:**
- Modify: `src/components/service-detail/ServiceDetailHero.vue`
- Modify: `src/pages/ServiceDetailPage.vue`

**Interfaces:**
- Consumes: `[data-detail-hero]`, `[data-parallax-image]`, and `[data-detail-section]`.
- Produces: scoped GSAP MatchMedia animations that fully revert on slug change and unmount.

- [ ] **Step 1: Implement edge-safe hero parallax**

In `ServiceDetailHero.vue`, wait for `nextTick()` and image decode, then use `gsap.matchMedia()`:

```ts
media.add(
  {
    desktop: "(min-width: 768px)",
    reduceMotion: "(prefers-reduced-motion: reduce)",
  },
  ({ conditions }) => {
    const { desktop, reduceMotion } = conditions as {
      desktop: boolean;
      reduceMotion: boolean;
    };
    if (reduceMotion) {
      gsap.set(image, { yPercent: 0, scale: 1.08 });
      return;
    }
    gsap.fromTo(
      image,
      { yPercent: desktop ? -4 : -2, scale: 1.12 },
      {
        yPercent: desktop ? 8 : 4,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      },
    );
  },
);
```

The image wrapper remains overflow-hidden, and the scale/range must be visually checked so no edge appears.

- [ ] **Step 2: Add restrained detail-section reveals**

In `ServiceDetailPage.vue`, scope a GSAP context to the page. On non-reduced motion, create one reveal per `[data-detail-section]` with `autoAlpha: 0, y: 20`, `duration: 0.55`, `ease: "power2.out"`, `start: "top 84%"`, and `once: true`. Reduced motion sets all sections to `autoAlpha: 1, y: 0`.

- [ ] **Step 3: Rebuild cleanly when slug changes**

Watch the resolved service slug. Revert the previous context and hero MatchMedia state before initializing the new content. On unmount, cancel pending RAF/image decode continuation, revert contexts, and remove inline `will-change` left by transition setup.

- [ ] **Step 4: Verify performance and lifecycle**

Use browser inspection to confirm:

- one hero parallax ScrollTrigger;
- no duplicate section triggers after navigating between all three service routes;
- no transform edge exposure;
- no animation in reduced motion;
- no stale inline opacity, transform, `inert`, or scroll lock after Back.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit Task 6**

```powershell
git add src/components/service-detail/ServiceDetailHero.vue src/pages/ServiceDetailPage.vue
git commit -m "feat: animate service detail content"
```

---

### Task 7: Final Integration, Accessibility, Performance, and Review

**Files:**
- Modify only files required by verified findings.
- Test: `tests/*.test.ts`

**Interfaces:**
- Consumes: all completed tasks.
- Produces: verified production-ready behavior with no unresolved Critical or Important review findings.

- [ ] **Step 1: Run the complete automated gate**

Run:

```powershell
npm test
npm run build
git diff --check
```

Expected: all tests pass, production build exits `0`, and diff check reports no whitespace errors.

- [ ] **Step 2: Run the desktop browser matrix**

At 1280×720 or larger, verify:

- Intro expansion remains unchanged.
- Scene 1 copy begins after full expansion with opacity/Y movement.
- Scenes 2 and 3 images move `100 → 0` before their copy enters.
- All three CTAs open the matching slug and content.
- Old page blackens; new page rises once.
- Back lowers the detail page and restores the same homepage Service position.
- Detail hero parallax never exposes an edge.
- Tab focus never enters a covered scene and lands on detail `h1` after route entry.

- [ ] **Step 3: Run the mobile and reduced-motion matrix**

At 390×844 and with reduced motion emulated, verify:

- exactly three normal-flow Service scenes;
- copy visible immediately with no pinned story;
- detail editorial grid collapses without overflow;
- mobile hero parallax is restrained;
- reduced motion has no full-page translation or hero movement;
- CTA navigation, Back, focus, and scroll restoration still work.

- [ ] **Step 4: Request focused code and GSAP performance review**

Ask the reviewer to inspect only task files and check:

- transform ownership;
- route lock and error cleanup;
- ScrollTrigger/MatchMedia/context cleanup;
- keyboard focus and `inert` state;
- image loading and parallax GPU cost;
- direct-route and Back behavior;
- preservation of unrelated dirty files.

Fix every Critical and Important issue, then repeat Steps 1–3.

- [ ] **Step 5: Final commit**

Stage only files belonging to this feature and verify the staged diff before committing:

```powershell
git diff --cached --check
git commit -m "feat: launch service detail experience"
```
