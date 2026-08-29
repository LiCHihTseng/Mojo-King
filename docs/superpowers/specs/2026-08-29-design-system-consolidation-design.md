# MoJo King Design System Consolidation

**Date:** 2026-08-29  
**Status:** Proposed  
**Mode:** Persuade / refinement  
**Scope:** Runtime frontend, design-system code artifacts, typography delivery, and automated conformance checks

## Objective

Consolidate the current visual implementation into a maintainable semantic design system without replacing MoJo King's established visual identity. The migration must preserve the site's charcoal, warm-white, and orange character while eliminating near-duplicate colors, one-off font sizes, inaccessible accent use, 14px mobile form controls, and duplicate font delivery.

## Non-goals

- Do not redesign page layouts, motion narratives, content, routes, or application behavior.
- Do not replace Noto Sans TC with a different brand typeface.
- Do not introduce a component framework, CSS-in-JS, or a second styling system.
- Do not refactor unrelated API, form-validation, routing, analytics, or animation logic.
- Do not overwrite existing uncommitted work in ConsultationForm, Contact, Hero, the consultation API, or related tests.
- Do not mutate the remote Figma file directly. The repository plugin and documentation will be synchronized so the user can rerun the plugin in Figma.

## Source of truth

`src/style.css` becomes the runtime source of truth for all visual tokens. It will contain Tailwind v4 theme tokens and typography-role utilities. Runtime Vue and TypeScript code must consume semantic utilities or CSS custom properties rather than defining raw brand values.

`design-system/tailwind-theme.css` remains the documented design-system mirror and migration reference. It must match `src/style.css`; it is not imported at runtime to avoid two competing sources.

The Figma plugin will keep its own required JavaScript token mirror in `design-system/figma-plugin/src/00-helpers.js`, because the plugin cannot import the website CSS at execution time. All other plugin source files must consume that mirror rather than repeat color literals. The generated `design-system/figma-plugin/code.js` must be rebuilt from the source fragments.

## Color system

### Approved primitives

| Token | Value | Purpose |
|---|---:|---|
| `white` | `#FFFFFF` | White pages and text on dark surfaces |
| `cream` | `#F9F8F6` | Warm page and form surface |
| `soft` | `#F1F0EE` | Subtle tracks, pills, and low-emphasis surfaces |
| `ink` | `#1A1A1A` | Primary text and editorial dark surface |
| `surface` | `#252525` | Navigation, footer, cards, and controls |
| `deep` | `#11110F` | Service-story background and deepest surface |
| `muted` | `#555555` | Secondary text on light surfaces |
| `accent` | `#AE5700` | Small text, links, focus rings, and light-background accents |
| `accent-bright` | `#FF891D` | Dark-background accents, icons, markers, and decorative motion |
| `error` | `#B91C1C` | Validation and error text on white or cream |

`accent` replaces `#B55F00`. Its contrast is approximately 4.75:1 on `cream` and 5.04:1 on white, meeting WCAG AA for normal text. `accent-bright` must not be used for small text on white or cream.

The following current values are removed as independent primitives and mapped by intent:

- `#FF9A3D` and `#D9873A` -> `accent-bright` or an `accent` to `accent-bright` gradient.
- `#2F2F2F`, `#262626` -> `surface`.
- `#1F1F1F`, `#1C1B17`, `#171717` -> `ink`, `surface`, or `deep` according to the element's role.
- `#666666`, `#56534B`, `#3F3D36` -> `muted` or `ink` with an opacity modifier.
- `#F2F2EF` -> `soft`; `#D6D3CE` becomes `ink` or `muted` at a documented opacity.
- Decorative `#D4A574` glow -> `accent-bright` at low opacity.

Alpha variants must be derived from semantic tokens through Tailwind opacity modifiers or `color-mix()`. They must not become separate hex primitives.

### Semantic roles

Runtime components use semantic roles such as:

- Surfaces: `page-white`, `page-cream`, `surface-soft`, `surface-dark`, `surface-deep`.
- Text: `text-primary`, `text-muted`, `text-on-dark`, `text-accent`, `text-error`.
- Interaction: `focus-ring`, `focus-ring-on-dark`, `link-hover`, `accent-dot`.
- Structure: `border-subtle`, `border-strong`, `border-on-dark`.

Raw hex values are allowed only in the token-definition source and source image assets. Inline Vue templates, component scripts, component styles, and page files must not contain brand hex literals after migration.

## Typography system

### Font family and delivery

- Keep `Noto Sans TC` as the only downloaded brand family.
- Load it from Google Fonts in `index.html` with weights 400, 500, and 700 only.
- Keep `display=swap` and the existing Google Fonts preconnects.
- Remove Rubik from the Google Fonts request.
- Remove the local `src/font.css` import and file.
- Remove all local `src/assets/font/*.ttf` files from the project, including unused weights.
- Replace weight 600 by either 500 or 700 based on hierarchy; replace weight 800 by 700.
- Replace the isolated `font-mono` numbering treatment with Noto Sans TC plus tabular numerals and existing tracking.
- Retain the system CJK fallback stack after Noto Sans TC.

This produces one font source rather than the current simultaneous Google and local sources, removes roughly 27 MiB of fonts from the production bundle, and removes roughly 61 MiB of TTF files from the repository.

### Runtime typography roles

The site will expose nine complete typography-role utilities. A role owns size, line height, letter spacing, and default weight; components may only override weight when the content has a genuine semantic emphasis.

| Role | Size | Default use |
|---|---|---|
| `type-display-feature` | `clamp(2.75rem, 7vw, 7.5rem)` | Oversized editorial numbers or feature statements |
| `type-display-hero` | `clamp(3rem, 5.6vw, 6.2rem)` | Hero and primary service titles |
| `type-display-section` | `clamp(2rem, 4.2vw, 4.6rem)` | Major section and detail-page headings |
| `type-heading-section` | `clamp(1.875rem, 3.4vw, 3.25rem)` | Standard section headings and testimonial/contact titles |
| `type-heading-card` | `clamp(1.25rem, 2.2vw, 2.25rem)` | Card, step, and outcome headings |
| `type-body-lg` | `1.125rem` | Lead copy and large supporting copy |
| `type-body` | `1rem` | Default body copy and all form controls |
| `type-label` | `0.875rem` | Navigation, buttons, labels, badges, and counters |
| `type-caption` | `0.75rem` | Eyebrows, legal supporting copy, and compact indices |

Each role will preserve the closest existing line-height and tracking behavior for its semantic use. The migration may retain responsive layout modifiers, but must remove raw font-size utilities such as `text-[clamp(...)]`, `text-[11px]`, and `text-[1.75rem]` from runtime components.

Input, textarea, and select control text must use `type-body` at all viewport sizes. Labels and help text may use `type-label` or `type-caption`. This prevents mobile controls from rendering at 14px and avoids iOS input zoom.

## Runtime migration

The migration covers every `.vue`, `.css`, and relevant `.ts` file under `src/`:

1. Merge the approved color, font, typography, line-height, tracking, radius, shadow, layout, and motion tokens into `src/style.css`.
2. Replace every raw brand color in Vue template classes, scoped styles, prop defaults, SVG attributes, and JavaScript animation configuration with semantic utilities, `currentColor`, or CSS custom-property references.
3. Replace every arbitrary font-size class with one of the nine typography roles.
4. Normalize explicit font weights to 400, 500, or 700.
5. Change ConsultationForm inputs and textareas from 14px to the 16px body role while preserving field dimensions, validation associations, and behavior.
6. Remove duplicate font loading and local font assets.
7. Preserve all existing animation timing, layout, responsive breakpoints, content, aria behavior, and form behavior unless a token substitution requires a visually equivalent CSS expression.

If a component needs a color value in JavaScript for GSAP, it must resolve a named CSS custom property at runtime through one small shared helper rather than duplicate a hex value in TypeScript. SVG icons should prefer `currentColor` so the parent semantic text color controls them.

## Figma design-system synchronization

- Replace repeated plugin color literals with a centralized `DS.COLOR` map in `design-system/figma-plugin/src/00-helpers.js`.
- Update plugin text-style mappings to the nine approved typography roles and three supported weights.
- Update mockup and guideline descriptions that currently cite removed color or size values.
- Rebuild `design-system/figma-plugin/code.js` from the ordered source fragments.
- Update `design-system/tailwind-theme.css` and `design-system/README.md` so their documented values and migration instructions match runtime code.
- The actual remote Figma variables are updated only when the user reruns the local plugin; the code change does not claim to mutate the remote Figma document automatically.

## Automated conformance

Add a focused design-system audit module and tests. Tests must exercise the audit behavior using controlled fixtures rather than merely asserting that an exact source line exists.

The audit must report:

- Runtime raw hex colors outside the approved token-definition file.
- Runtime arbitrary font-size utilities.
- Unsupported explicit font weights.
- Rubik or local TTF font loading in runtime entry files.
- Form controls that resolve to a font-size below 16px in the rendered production CSS or a component-level test fixture.
- Accent/text combinations whose configured contrast falls below 4.5:1 on white or cream.
- Drift between runtime token values and the design-system mirror.

The audit is added to the existing test command or run as an adjacent required verification command. Existing behavior tests remain unchanged unless a semantic class assertion must be updated.

## Visual verification

After tests and the production build pass, verify the following at desktop and mobile widths in one bounded browser pass:

- Home hero, navigation, About, Service, Testimonials, Process, Contact, and Footer.
- Consultation page default, validation-error, consent-expanded, submitting, and success states.
- At least one service-detail page, including hero, 5D method, content lists, and closing CTA.
- Focus rings on light and dark surfaces.
- No font flash or unexpected fallback after the Google font loads.
- No layout shift caused by the 14px to 16px form-control change.
- No loss of visual hierarchy after arbitrary font sizes are mapped to roles.

Only one consolidated fix pass and one confirmation pass are allowed after the initial visual inspection.

## Acceptance criteria

- The production build and all existing automated tests pass.
- The design-system audit passes.
- `src/` contains no raw brand hex colors outside the token-definition file.
- `src/` contains no arbitrary font-size utilities.
- Runtime uses only font weights 400, 500, and 700.
- Rubik, `src/font.css`, and all local TTF assets are absent from the runtime and repository.
- The production bundle no longer emits the four approximately 6.8 MiB Noto Sans TC TTF assets.
- Small accent text meets at least 4.5:1 contrast on white and cream.
- Consultation form controls are at least 16px on mobile.
- Runtime tokens, design-system mirror, README, plugin source, and generated plugin bundle agree on the approved color and typography roles.
- Desktop and mobile visual verification finds no functional regression or material brand-identity drift.

## Rollback boundary

Changes are organized so the token foundation, runtime component migration, font-delivery cleanup, and Figma artifact synchronization can be reviewed separately. No existing user-owned edits are discarded. If visual verification exposes a mismatch, the fix must adjust role mapping or token metadata rather than reintroduce raw per-component values.
