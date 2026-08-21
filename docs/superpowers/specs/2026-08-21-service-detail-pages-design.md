# Service Scenes and Detail Pages Design

Date: 2026-08-21

## Goal

Replace the current four-scene Service story with three services, give each service a dedicated URL backed by one shared Vue detail-page system, and add restrained GSAP motion that preserves the existing Intro behavior.

The three routes are:

- `/services/hr-consulting`
- `/services/fractional-chro`
- `/services/custom-training`

Each homepage CTA opens the matching route. The detail page rises from the bottom over a blackened homepage, begins with a parallax image hero, and continues into a spacious editorial content layout.

## Scope

### In scope

- Three desktop Service scenes instead of four.
- Revised homepage card copy.
- Copy fade and short Y-axis entrance after each scene image is fully in place.
- Static, fully visible copy in the mobile and reduced-motion layouts.
- Vue Router with clean, shareable service URLs.
- One typed service catalog as the source for homepage and detail-page content.
- One shared detail-page component that renders different content by route slug.
- GSAP route transition, parallax hero, accessibility handling, browser-history support, tests, build verification, performance review, and code review.

### Out of scope

- A CMS or administration interface.
- New AI-generated photography.
- Redesigning homepage sections outside Service.
- Changing the existing Intro image-expansion behavior beyond coordinating the first scene copy entrance.
- Adding more service routes than the approved three.

## Homepage Service Content

### 01 — 人資顧問

- Slug: `hr-consulting`
- Tag: `人資顧問`
- Title line 1: `從經營問題出發，`
- Title line 2: `建立真正能運作的人才管理體系。`
- Summary: `聚焦關鍵管理議題與制度建置，從診斷問題、凝聚共識到陪伴導入，打造符合企業發展階段的人才管理方案。`
- CTA: `深入了解`

### 02 — 共享人資長

- Slug: `fractional-chro`
- Tag: `共享人資長`
- Title line 1: `每個成長中的企業，`
- Title line 2: `都需要人資長的視角。`
- Summary: `定期參與經營與人資決策，從策略、組織與人才角度整合關鍵議題，成為經營團隊長期且可信賴的人資夥伴。`
- CTA: `深入了解`

### 03 — 客製化課程設計

- Slug: `custom-training`
- Tag: `客製化課程設計`
- Title line 1: `不只上一堂課，`
- Title line 2: `而是解決真實的管理問題。`
- Summary: `從企業情境、學員特性與管理痛點出發，客製案例、演練與工具，讓學習真正轉化為工作現場可運用的管理行為。`
- CTA: `深入了解`

Each service keeps the image assigned to its matching homepage scene. The first scene continues to use the same `backgroundImage` as the existing Intro.

## Application Architecture

### Router and page shell

- Add `vue-router` and use HTML5 history mode.
- `App.vue` becomes the persistent application shell. It owns the one-time loader, global smooth-scroll lifecycle, the route-transition overlay, and `<RouterView>`.
- Move the current homepage section composition into `HomePage.vue`. It receives the existing `entranceReady` state so the Loader, Hero, Navigation, Intro, and homepage entrance behavior remain coordinated.
- Add `ServiceDetailPage.vue` for all three service routes.
- Add a small not-found page or route state for invalid service slugs, with a clear link back to the homepage Service section.
- Configure production hosting with an SPA fallback so a direct request to `/services/<slug>` resolves to `index.html`.

The loader runs only once per application session. Returning from a service detail page must not replay it.

### Service catalog

Create a typed `src/data/services.ts` catalog. It is the only source of service slugs, homepage copy, images, hero copy, detail sections, and CTA URLs.

Each catalog item contains:

- `slug`
- `index`
- `tag`
- `titleLine1`
- `titleLine2`
- `summary`
- `image`
- `detailIntro`
- `sections`

Detail sections use a small discriminated union instead of three separate page components:

- `prose` for one- or two-column introductory text.
- `numbered-list` for consulting areas and process steps.
- `bullet-list` for suitable-company and topic lists.
- `steps` for the shared 5D method.

Unknown slugs do not silently fall back to another service.

## Homepage Motion

### Desktop

The existing Intro remains intact. Image scenes do not crossfade or shrink.

1. The first Intro image expands to its existing full state.
2. Only after the image reaches the `imageFull` label, the first copy animates from `autoAlpha: 0, y: 20` to `autoAlpha: 1, y: 0`.
3. On reverse, crossing back into the Intro shrink phase fades the first copy out and moves it slightly downward while the image begins shrinking.
4. Scene 2 moves from `yPercent: 100` to `yPercent: 0` with opacity fixed at `1`.
5. After Scene 2 reaches `yPercent: 0`, its copy animates from `autoAlpha: 0, y: 20` to `autoAlpha: 1, y: 0`.
6. Scene 3 repeats the same sequence.
7. On reverse, an incoming scene's copy fades down before that full scene moves out of view.

Only GSAP owns scene transforms after initialization. CSS may provide a pre-initialization fallback only while the Service root does not have its ready class.

### Mobile, touch, and reduced motion

- All three scenes remain in normal document flow.
- The viewport is not pinned.
- The Intro is presented in its expanded/static form.
- All copy is immediately visible with no opacity or Y-axis animation.
- `prefers-reduced-motion` uses the same static behavior.

### Interaction and accessibility

- Only the CTA belonging to the fully revealed desktop scene is focusable.
- Covered scenes and the duplicate first-scene content use `inert` and `aria-hidden`.
- During the short gap between a scene reaching its final image position and its copy finishing the entrance, no hidden CTA may receive focus.
- Mobile keeps all inline scene CTAs available.
- CTA focus, keyboard activation, and visible focus rings must work without relying on pointer input.

## Route Transition

The transition is coordinated at the app shell so it works for mouse, keyboard, browser history, and direct navigation.

### Forward navigation from Service

1. Record the homepage scroll position and reject additional navigation attempts while a transition is active.
2. Lock document scrolling without changing the visible scroll position.
3. Fade a fixed black overlay over the current homepage.
4. Resolve the target route and mount the detail page at the top.
5. Keep black visible behind the new page while the detail page moves from `yPercent: 100` to `yPercent: 0`.
6. Remove the overlay, release fixed positioning and scroll lock, focus the detail-page `h1`, and refresh ScrollTrigger measurements.

The URL must match the mounted detail page. A failed or unknown slug goes to the not-found state rather than leaving the transition locked.

### Back navigation

- Browser Back and the detail-page return control use the reverse visual relationship: the detail page moves down and the black layer clears to reveal the homepage.
- Restore the recorded homepage scroll position after the homepage layout is ready.
- Do not replay the loader.
- A direct visit to a service URL with no stored homepage state returns to `/#service`.

### Reduced motion

- Do not translate full pages.
- Use an immediate route swap or a very short black opacity transition.
- Preserve focus, scroll restoration, and transition locking behavior.

## Service Detail Visual Design

The supplied screenshots are visual references only. Their English copy and subject matter are not reused.

### Parallax hero

- The hero occupies approximately `90–100svh`.
- Use the corresponding homepage scene image with a crop chosen for the service.
- The image is oversized inside an overflow-hidden container so parallax never exposes an edge.
- A single scrubbed ScrollTrigger moves the image a restrained vertical distance as the page scrolls.
- A dark bottom gradient supports white text without lowering the overall image brightness more than necessary.
- Lower-left content: service index, tag, large title, and short summary.
- Lower-right content: `預約諮詢` CTA.
- A minimal top bar provides brand context and a return control.
- Mobile uses a smaller parallax range. Reduced-motion renders a static image.

### Editorial body

- Warm off-white background.
- Wide layout with a small dot and uppercase-style section label in the left rail.
- Large section headings begin in the main content column.
- Body copy uses controlled line lengths and asymmetrical one- or two-column placement.
- Generous vertical spacing separates sections.
- Service-specific lists use large numbers, fine rules, and typography rather than generic elevated cards.
- The shared 5D method is a connected five-step sequence, not five disconnected cards.
- On mobile the grid becomes one column in reading order, with comfortable text size and no horizontal overflow.

Detail-body entrances are restrained: small opacity/Y reveals for major sections only. The transition and hero parallax remain the primary motion moments.

## Detail Content

### 人資顧問

Intro:

`顧問不只是提供一套標準答案。我們從釐清經營問題開始，協助企業建立主管共識、設計適合組織現況的導入方式，並持續追蹤實際運作情形，讓制度不只存在於文件裡，而是真正成為支持決策與管理的工具。`

Six consulting fields:

1. `組織治理與組織設計` — `釐清組織架構、角色權責與決策機制。`
2. `績效管理與目標展開` — `將經營策略轉化為清楚且可追蹤的團隊目標。`
3. `薪酬、職級與激勵制度` — `建立兼顧內部公平、外部競爭力與人才激勵的制度。`
4. `人才策略與接班發展` — `辨識關鍵職位與人才，建立可持續發展的人才梯隊。`
5. `人資制度與員工關係` — `完善人才管理流程，降低法遵與員工關係風險。`
6. `領導發展與變革管理` — `協助主管建立帶人能力，推動制度與組織改變。`

### 共享人資長

Intro:

`共享人資長是經營團隊的策略人資夥伴，定期參與重要決策，協助企業整合組織、制度與人才議題，持續推動關鍵制度，同時培育內部人資與主管團隊。`

Suitable companies:

- 正在快速成長、轉型或進行接班。
- 尚未設置資深人資主管，但已有多項議題需要整合。
- 內部人資團隊具備執行能力，需要策略方向與專業指導。
- 面臨組織調整、人才流失或主管能力斷層。
- 希望建立完整制度，但暫時不需要聘任全職人資長。
- 需要能與經營團隊對話，也能陪伴制度落地的人資夥伴。

Support areas:

- 經營策略與人資策略對齊。
- 關鍵組織與人才議題決策。
- 人資制度推動與進度追蹤。
- 內部人資團隊專業培育。
- 主管管理能力與人才決策支持。

### 客製化課程設計

Intro:

`課程不從既有教材開始，而是從企業真正面對的管理問題開始。我們透過顧問式診斷、情境案例、互動引導、工具練習與課後應用，讓學習轉化為工作現場可以持續使用的管理行為。`

Course design process:

1. `需求診斷` — `釐清企業情境、學員特性與真正需要解決的問題。`
2. `客製設計` — `依學習目標重新設計案例、工具、活動與演練內容。`
3. `互動教學` — `透過討論、情境演練與實務回饋建立理解與行動。`
4. `應用落地` — `將課堂成果轉化為可執行的工作方法與後續行動。`

Course themes:

- 領導力與主管發展。
- 績效管理。
- 人才甄選與發展。
- 溝通與跨部門協作。
- 員工關係與友善職場。
- HR 專業能力。

### Shared 5D method

Heading:

`從需求定義到能力移轉，讓每一項方案真正落地並持續運作。`

1. `Define & Agree` — `定義需求｜建立共識`
2. `Discover & Analyze` — `深度診斷｜分析問題`
3. `Deliver & Decide` — `呈現洞察｜共創決策`
4. `Design & Implement` — `設計方案｜陪伴落地`
5. `Disengage & Review` — `成效回顧｜能力移轉`

## Performance and Lifecycle Rules

- Animate transforms and opacity; do not animate layout properties.
- Use `gsap.context()` or `gsap.matchMedia()` for every component-owned animation and revert on route leave/unmount.
- A scene element has one transform owner after initialization.
- Use one ScrollTrigger for hero parallax and only a small number of section-reveal triggers.
- Cancel scheduled animation frames and refreshes on unmount.
- Preload the selected detail hero image when its CTA receives hover or keyboard focus, but do not eagerly load all detail imagery.
- Use eager loading and high fetch priority only for the active detail hero.
- Release persistent `will-change` hints after route transitions complete.
- Refresh ScrollTrigger after route entry, image decode, and font/layout stabilization.

## Error and Edge-Case Handling

- Invalid service slugs render a stable not-found state.
- A route-transition failure always removes the black overlay and scroll lock.
- Repeated CTA activation while transitioning is ignored.
- Direct service-route loads work without first visiting the homepage.
- Browser Back restores the homepage Service scroll position when available.
- Image loading failure retains readable hero content on a service-specific fallback background.
- Breakpoint changes and reduced-motion changes rebuild animations without retaining stale transforms, opacity, `inert`, or `aria-hidden` state.

## Verification

### Automated

- Catalog contains exactly three unique slugs and valid route hrefs.
- Every service has required homepage and detail fields.
- Unknown slugs resolve to not-found.
- Desktop motion plan contains three scenes and schedules copy reveal after each scene reaches its final position.
- Mobile and reduced-motion plans keep all copy visible and all inline CTAs available.
- Accessibility plans expose only the current completed desktop scene.
- Type checking and production build pass.

### Browser

- Desktop Scene 1 copy starts only after Intro reaches full size and reverses correctly.
- Desktop Scenes 2 and 3 reach `yPercent: 0` before their copy begins the opacity/Y entrance.
- No scene image crossfades or shrinks.
- Mobile shows three normal-flow scenes with immediately visible copy.
- Each CTA opens its matching URL and content.
- The homepage blackens and the detail page rises from the bottom once per navigation.
- Back navigation reverses the visual relationship and restores the homepage position without replaying the loader.
- Detail hero parallax remains edge-free throughout its scroll range.
- Keyboard focus moves to the detail heading after entry and never lands on covered scene CTAs.
- Reduced-motion navigation, Service, and detail hero remain usable without large movement.

### Review

- Run a focused GSAP performance review for transform ownership, ScrollTrigger count, cleanup, image decoding, and route-transition locking.
- Run an independent code review and resolve all Critical and Important findings before completion.
