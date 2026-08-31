# MoJo King 官網｜作品集文字稿 + 全站文案清冊

來源：本專案原始碼（Vue 3 + TypeScript + Tailwind v4 + GSAP + Lenis + Vercel）
產出日期：2026-08-30

本檔三個部分：

1. **Part 1 — 作品集案例文字稿**（照你給的 imBee 範例結構寫，英文，可直接貼進作品集）
2. **Part 2 — 需要哪些圖**（作品集要拍的截圖 + 網站本身的圖片資產清單）
3. **Part 3 — 全站文案清冊**（逐區塊、逐字，從程式碼抓出來的實際文案）

⚠️ 標記 `[需要你補]` 的地方是我在程式碼裡找不到的事實（成效數字、專案期程、客戶背景）。
作品集不能編數字，這些位置請你填真實資料，或整段拿掉。

---

# Part 1 — Case Study（英文，imBee 格式）

## Overview

MoJo King is a Taiwan-based HR consulting firm offering fractional CHRO services,
HR system design, and custom management training to mid-size and listed companies.

The founder has 20+ years of HR leadership experience across semiconductor, tech,
manufacturing, and traditional industries — but that credibility existed only in
person, in meetings and referrals. There was no digital surface where a business
owner could evaluate the service before picking up the phone.

I designed and built the entire product end to end: information architecture,
copy structure, visual design, motion design, front-end implementation, the
consultation form pipeline, and technical SEO. Vue 3, TypeScript, Tailwind v4,
GSAP, Lenis, deployed on Vercel with a serverless form endpoint.

`[需要你補]` 期程（例：2026.07 – 2026.08）、角色（solo designer + developer）、
以及專案起點（原本沒有官網 / 有舊站 / 只有 FB 粉專）。

## Challenge

HR consulting is a high-trust, low-frequency purchase. The buyer is a founder or
an HR head who is not shopping for features — they are deciding whether this
person understands their problem. A conventional service site (three cards, a
list of offerings, a contact form) makes that decision impossible: it flattens
20 years of judgment into bullet points.

Two constraints shaped everything:

- The content is dense Traditional Chinese long-form. Three service offerings,
  each with six or more sub-topics. Any layout that could not carry that weight
  of text would push the real substance onto a second page nobody reaches.
- One person building and maintaining it. Every motion decision had to survive
  without a front-end team behind it.

The goal was to make one continuous scroll do the work of a first meeting: who
this is, what she has actually done, what a project looks like, and what happens
if you say yes.

## Discovery

The problem was not visual quality — it was **legibility of expertise**.

- Credibility had to arrive before the service list. The About section leads with
  the founder, not the company: 20+ years, the industries, the kinds of problems
  she has seen. The offerings only make sense after that.
- Case evidence is confidentiality-bound. Client names cannot appear, so cases
  are structured as industry + situation + what actually changed — the change is
  the proof, not the logo.
- Every offering needed its own URL. Three services buried inside one scrolling
  section cannot rank, cannot be shared, and cannot be sent as a follow-up link
  after a meeting.

That produced the architecture: **one narrative homepage** (Hero → About →
Service → Cases → Process → Contact) with **three dedicated service routes** and
a **separate consultation page** that slides up as an overlay rather than
navigating away.

`[需要你補]` 這段最強的補充是「你問過誰」——如果和郁婷做過訪談、或看過她既有的
客戶提案簡報，寫一句「透過與創辦人的 N 次訪談，把她口頭簡報的順序反推成頁面順序」，
Discovery 就從推論變成有依據。

## Solution

### Scroll storytelling that degrades to a plain document

**Problem:** The About section tells three chapters — the founder, the company,
why us. On desktop a pinned sticky scroll lets each chapter land with its own
image. On mobile the same technique fights the browser itself: the URL bar
collapses and expands while scrolling, viewport height changes, and every
scrubbed timeline tied to that height jitters at exactly the moment the user
reaches the bottom of the page.

**Decision:** Desktop gets the pinned three-scene crossfade. Below the large
breakpoint the *same content* renders in plain document flow with zero animation.
The same rule is applied to the footer reveal and the consultation image
parallax — decorative motion is registered only where it cannot break.

**Result:** One content source, two delivery modes. No separate mobile copy to
maintain, and no visual instability at the page bottom on phones.

### Hero legibility across breakpoints

**Problem:** The hero is a portrait photograph behind the headline. A
left-to-right dark gradient works on desktop, where the text sits left and the
subject sits right. At mobile width the image crops toward the center — the face
slides into the middle of the frame, directly under the headline.

**Decision:** Desktop keeps the horizontal gradient. Below the large breakpoint
the gradient flips to bottom-to-top and the content block anchors to the bottom
of the viewport, with padding expressed in viewport units so short screens
(iPhone SE) do not let the text block eat the face. The headline is constrained
by character count rather than a no-wrap rule, so longer future copy wraps
instead of being silently clipped.

**Result:** The subject stays clean and the headline stays readable at every
width, from a single photograph — no second crop, no separate mobile asset.

### One image that becomes the service section

**Problem:** Three services presented as a card grid bury the third option and
communicate no progression — they read as a menu, not as a practice.

**Decision:** The section opens with a single line — 「人才有策略。組織有未來。」 —
which splits apart as the background image expands to full bleed and becomes
service scene 01. Scenes crossfade on scroll, each carrying its own 「深入了解」
CTA into a dedicated `/services/{slug}` route. The intro background reads from
the first service's own image, so the expanding image and the first scene can
never drift out of sync when the photography is swapped.

**Result:** Three offerings read as one sequence instead of a menu, while each
still owns a real URL for search, for sharing, and for post-meeting follow-up.

### Motion that is decoration, never a requirement

**Problem:** Pinned overlapping scenes leave every scene in the DOM at once.
Screen readers announce all three services simultaneously, and keyboard focus
lands on invisible CTAs behind the active scene.

**Decision:** Inactive scenes are toggled `inert` and `aria-hidden` by the same
timeline that drives the visuals. A reduced-motion preference skips the pin
entirely and returns the section to document flow. Smooth scrolling is never
initialized under that setting, and all in-page anchors fall back to native
scrolling when it is absent.

**Result:** The page is complete without the animation. Motion adds sequencing
for people who can use it and costs nothing to people who cannot.

### Technical SEO for a single-page app

**Problem:** A fully Traditional Chinese site was declared `lang="en"`, meaning
every Chinese keyword was working against the crawler's own language signal. The
head was static, so all three service routes and the consultation page appeared
in search results under the homepage title and description. The favicon pointed
at an AVIF file, a format Google does not render in results.

**Decision:** `lang="zh-Hant-TW"`; per-route title, description and canonical
rewritten after every navigation; a square PNG favicon; JSON-LD
`ProfessionalService` describing the founder and the service catalog; a
`noscript` block carrying the core positioning and contact address; GA4 wired to
emit a manual page view per route *after* the title is rewritten, so the report
does not label every page as the homepage.

**Result:** Each service page can be indexed and ranked on its own terms.
Documented limit, deliberately left open: OG tags are rewritten client-side, so
Facebook and LINE previews still show the homepage version until the site is
server-rendered or prerendered.

## Impact

`[需要你補 — 這一段目前沒有任何可引用的數據，請填真實數字或整段刪除]`

網站已上線（www.mojo-king.com），GA4 已接好逐頁 page_view，表單走 Resend 自動寄出
內部通知信與客戶確認信。可以填的候選指標：

- 上線後 N 個月的 GA4 工作階段數 / 平均互動時間
- 表單送出數（= 直接的商業成果，這個最有力）
- 服務詳情頁的到達率（有多少人真的往下點進 /services/*）
- Lighthouse / PageSpeed 分數（我沒有跑過，你跑完再填）

程式碼裡可以直接寫進作品集、不需要外部數據的事實：

- 主要圖片走 AVIF，About 與 Contact 的視覺各壓在 40–60KB
- 8 支 `node:test` 測試涵蓋路由轉場、SEO meta、行動版首頁與服務動態
- 全站動態皆有 reduced-motion 的降級路徑

如果暫時沒有數據，建議把 Impact 改寫成 "Outcome"，講交付範圍與已知限制（OG 分享
預覽仍待 SSR），誠實比空的數字有說服力。

---

# Part 2 — 需要哪些圖

## A. 作品集要放的圖（圖說照 imBee 範例格式寫好了，可直接貼）

| # | 位置 | 內容 | 圖說 |
|---|------|------|------|
| 1 | Overview 後 | 桌機首頁全景，或 Hero + About 兩張並排 | MoJo King homepage — a single narrative scroll from founder credibility to service offerings |
| 2 | Discovery 後 | 網站架構圖／sitemap（首頁區塊 + 3 服務頁 + 諮詢頁） | Site architecture — one narrative homepage with three dedicated service routes for search and follow-up |
| 3 | Solution 1 | About 區塊：桌機 sticky 三幕 vs 手機直式排列，左右對照 | Scroll storytelling on desktop degrades to plain document flow on mobile, where viewport-height animation is unstable |
| 4 | Solution 2 | Hero 桌機（左右漸層）vs 手機（下上漸層）對照 | Hero gradient direction and content anchoring change with breakpoint to keep both the face and the headline readable |
| 5 | Solution 3 | Service 區塊三格連續截圖：intro 文字 → 圖片展開 → 場景 01 | One intro image expands into service scene 01 — three offerings read as a sequence, not a card grid |
| 6 | Solution 3 | 服務詳情頁（/services/hr-consulting）完整頁 | Each service owns a real route with its own hero, content sections, and the 5D method timeline |
| 7 | Solution 4 | reduced-motion 對照，或 DevTools 顯示 inert 切換 | Inactive scenes are inert and aria-hidden — the page is complete without the animation |
| 8 | Solution 5 | Google 搜尋結果截圖，或 head meta 對照（首頁 vs 服務頁） | Per-route title, description, and canonical rewritten on navigation so each service page indexes on its own terms |
| 9 | Impact | GA4 儀表板 / 表單通知信截圖 `[需要你補]` | — |

加分項：Figma 設計稿或 design token 截圖、手機實機照。

## B. 網站本身正在用的圖片資產

| 檔案 | 用在哪 | 大小 | 備註 |
|------|--------|------|------|
| `src/assets/Test.png` | Hero 人像（首頁第一屏） | **1.05 MB** | ⚠️ 檔名叫 Test，而且全站最重要的圖卻是 PNG。建議改名 + 轉 AVIF |
| `src/assets/About_1.avif` | About 第 1 幕（創辦人） | 61 KB | ok |
| `src/assets/About_2.avif` | About 第 2 幕（公司） | 60 KB | ok |
| `src/assets/About_3.avif` | About 第 3 幕（我們留下什麼） | 38 KB | ok |
| `src/assets/Service_1.avif` | 服務 01 人資顧問（首頁場景 + intro 展開圖 + 詳情頁 hero） | 416 KB | 一張圖三處共用 |
| `src/assets/Service_2.avif` | 服務 02 共享人資長 | 266 KB | |
| `src/assets/Service_3.avif` | 服務 03 客製化課程設計 | 111 KB | |
| `src/assets/Contact.avif` | Contact 圓形人像（白底、人物偏右） | 41 KB | 白底被圓形裁切後在深色卡片上讀成白圓盤，不能換透明底 |
| `src/assets/Consulting_img.png` | 諮詢表單頁左側圖 | **2.04 MB** | ⚠️ 全站最重的檔案，建議轉 AVIF |
| `public/icon.png` | favicon | 11 KB | 必須是正方形 PNG，Google 不吃 AVIF |
| `public/og-image.png` | 分享預覽 1270×845 | — | |
| Logo | Navigation / Footer / Loader | — | inline SVG path，沒有獨立檔案 |

## C. 沒有被引用的檔案（可以刪，也代表不用重做）

圖片：`About_img1.png`(2.02 MB)、`portrait.png`(744 KB)、`icon.avif`、`mojo.avif`、
`Blob.svg`、`Logo.svg`、`Shape.svg`、`quote.svg`、`align-right.svg`、
`brainstorming-svgrepo-com.svg`、`list-1-svgrepo-com (1).svg`

元件：`Tree.vue`、`Transition.vue`、`ConsultationBridge.vue`（三支都沒有被 import）

---

# Part 3 — 全站文案清冊（逐字）

## 0. SEO / head（index.html + src/lib/routeMeta.ts）

**首頁 title**
> 慕玖 MoJo King｜人資顧問・人才發展與雇用策略｜共享人資長服務

**首頁 description**
> 慕玖 MoJo King 是專注於人力資源管理與組織發展的人資顧問公司。由 20 年上市櫃人資長經驗的顧問親自帶領，提供共享人資長、人才發展、雇用與招募制度、主管培訓與組織診斷服務，協助企業把人才策略真正落地。

**keywords**
> 人資顧問,人資,共享人資長,人才發展,人才策略,雇用,招募,人力資源管理,組織發展,主管培訓,HR顧問,人資長,慕玖,MoJo King

**分享用短版（og / twitter）**
> 標題：慕玖 MoJo King｜人資顧問・人才發展與雇用策略
> 摘要：20 年上市櫃人資長經驗的人資顧問，提供共享人資長、人才發展、雇用制度與主管培訓，協助企業把人才策略真正落地。
> og:image:alt：慕玖人資顧問王郁婷

**諮詢頁 meta**
> 標題：預約諮詢｜慕玖 MoJo King 人資顧問
> 摘要：填寫諮詢表單，慕玖團隊會與你聯繫，安排第一次的諮詢對談。從人資制度、人才發展到主管培訓，先了解你的狀況，再一起找出適合的做法。

**服務詳情頁 meta**（自動組出）
> 標題：{服務名稱}｜慕玖 MoJo King 人資顧問
> 摘要：該服務的 summary

**noscript 靜態內容**
> 慕玖 MoJo King｜人資顧問・人才發展與雇用策略
> 慕玖股份有限公司是專注於人力資源管理與組織發展的人資顧問公司，提供共享人資長、人才發展、雇用與招募制度建置、主管培訓與組織診斷服務。聯絡我們：services@mojo-king.com

**JSON-LD 結構化資料**

- 公司：慕玖股份有限公司 MoJo King／別名 慕玖人資顧問
- 描述：專注於人力資源管理與組織發展的人資顧問公司，提供共享人資長、人才發展、雇用與招募制度、主管培訓與組織診斷服務。
- 創辦人：王郁婷｜執行長暨人資顧問｜擁有超過 20 年上市櫃企業人資經驗，曾任科技、半導體、製造與傳統產業人資長。
- 服務目錄四項：共享人資長／人才發展與人才策略／雇用與招募制度建置／主管培訓與領導力培育

## 1. Navigation（src/components/Navigation.vue）

- 關於慕玖
- 服務內容
- 聯絡我們
- CTA：預約諮詢
- 選單按鈕文字：Menu
- Logo 連結 aria-label：回到首頁最上方
- 選單 aria-label：開啟選單／關閉選單／網站選單

## 2. Hero（src/components/Hero/Hero.vue）

**標題**（兩行；程式碼裡還有一行被註解掉的「為你的企業」）
> 打造清晰的
> 人才策略

**內文**
> 我與企業主、主管與團隊合作，帶來清楚的方向與實際可行的策略，讓組織能穩健成長，不再對人才管理感到困惑。

**CTA**：預約諮詢
**人像 alt**：王郁婷，慕玖共享人資長

## 3. About（src/components/About.vue）— 三幕

**區塊標籤**：關於慕玖

### 第 1 幕 · 創辦人（圖：About_1.avif）

標題
> 20+ 年經驗，讓我看見企業真正的人資問題

內文
> 我是人資顧問郁婷，慕玖股份有限公司執行長，外號「HR 女神」。
> 擁有超過 20 年上市櫃企業人資經驗，從人資管理到人資長的歷練，讓我深刻體會：人資不只是制度與行政，而是影響人才、組織與企業長期發展的重要力量。
> 也因為看見許多企業在成長過程中，缺乏成熟的人資策略與經驗支持，我創立了慕玖，希望把多年企業實戰經驗帶進更多組織。

條列
> - 20+ 年企業人資實戰經驗
> - 上市櫃科技、半導體、製造與傳統產業歷練
> - 參與企業整併、組織轉型與制度重建
> - 從經營視角思考人才與組織問題

數據：**100+** 企業合作案例

### 第 2 幕 · 公司（圖：About_2.avif）

標題
> 讓人資，成為企業成長的策略力量

內文
> 慕玖股份有限公司（MoJo King）專注於人力資源管理與組織發展。
> 我們透過策略型人資顧問與管理培訓，協助企業從人才發展、領導力到組織文化，建立真正符合企業發展階段的管理系統。
> 我們不只是解決眼前的人資問題，更希望協助企業建立一套未來能夠自己持續運作的管理能力。

條列
> - 人才發展｜建立符合企業成長階段的人才策略
> - 領導力培育｜提升主管帶人、溝通與決策能力
> - 組織文化｜建立支持企業長期發展的制度與文化
> - 管理培訓｜讓制度真正被主管理解與運用

數據：**150+** 一對一深度諮詢

### 第 3 幕 · 為什麼是我們（圖：About_3.avif）

標題
> 我們留下的不只是一套制度

內文
> 慕玖結合企業人資長的實戰經驗、組織顧問能力與管理培訓方法，從問題診斷、制度設計到實際導入，陪企業把改變真正落實。

條列
> - 具備經營視角的人資專業
> - 從制度設計到真正落地
> - 顧問 × 培訓雙重能力
> - 跨產業實戰經驗
> - 國際專業認證

數據：**100%** 教練顧問陪跑

## 4. Service 區塊（src/components/Service.vue + src/data/services.ts）

**隱藏區塊標題（給螢幕閱讀器）**：專業人資顧問服務

**Intro 分段文字**（會被拆開做動畫）
> 人才 ／ 有策略。 ／ 組織有未來。

**每張卡片 CTA**：深入了解

### 服務 01｜人資顧問（/services/hr-consulting，圖：Service_1.avif）

摘要
> 聚焦關鍵管理議題與制度建置，從診斷問題、凝聚共識到陪伴導入，打造符合企業發展階段的人才管理方案。

詳情頁導言（區塊標籤 ABOUT THE SERVICE／標題「關於人資顧問」）
> 顧問不只是提供一套標準答案。我們從釐清經營問題開始，協助企業建立主管共識、設計適合組織現況的導入方式，並持續追蹤實際運作情形，讓制度不只存在於文件裡，而是真正成為支持決策與管理的工具。

CONSULTING AREAS｜六項顧問服務範疇

1. 組織治理與組織設計 — 釐清組織架構、角色權責與決策機制。
2. 績效管理與目標展開 — 將經營策略轉化為清楚且可追蹤的團隊目標。
3. 薪酬、職級與激勵制度 — 建立兼顧內部公平、外部競爭力與人才激勵的制度。
4. 人才策略與接班發展 — 辨識關鍵職位與人才，建立可持續發展的人才梯隊。
5. 人資制度與員工關係 — 完善人才管理流程，降低法遵與員工關係風險。
6. 領導發展與變革管理 — 協助主管建立帶人能力，推動制度與組織改變。

### 服務 02｜共享人資長（/services/fractional-chro，圖：Service_2.avif）

摘要
> 定期參與經營與人資決策，從策略、組織與人才角度整合關鍵議題，成為經營團隊長期且可信賴的人資夥伴。

詳情頁導言
> 共享人資長是經營團隊的策略人資夥伴，定期參與重要決策，協助企業整合組織、制度與人才議題，持續推動關鍵制度，同時培育內部人資與主管團隊。

SUITABLE COMPANIES｜適合合作的企業

- 正在快速成長、轉型或進行接班。
- 尚未設置資深人資主管，但已有多項議題需要整合。
- 內部人資團隊具備執行能力，需要策略方向與專業指導。
- 面臨組織調整、人才流失或主管能力斷層。
- 希望建立完整制度，但暫時不需要聘任全職人資長。
- 需要能與經營團隊對話，也能陪伴制度落地的人資夥伴。

SUPPORT AREAS｜支持範疇

- 經營策略與人資策略對齊。
- 關鍵組織與人才議題決策。
- 人資制度推動與進度追蹤。
- 內部人資團隊專業培育。
- 主管管理能力與人才決策支持。

### 服務 03｜客製化課程設計（/services/custom-training，圖：Service_3.avif）

摘要
> 從企業情境、學員特性與管理痛點出發，客製案例、演練與工具，讓學習真正轉化為工作現場可運用的管理行為。

詳情頁導言
> 課程不從既有教材開始，而是從企業真正面對的管理問題開始。我們透過顧問式診斷、情境案例、互動引導、工具練習與課後應用，讓學習轉化為工作現場可以持續使用的管理行為。

COURSE DESIGN PROCESS｜課程設計流程

1. 需求診斷 — 釐清企業情境、學員特性與真正需要解決的問題。
2. 客製設計 — 依學習目標重新設計案例、工具、活動與演練內容。
3. 互動教學 — 透過討論、情境演練與實務回饋建立理解與行動。
4. 應用落地 — 將課堂成果轉化為可執行的工作方法與後續行動。

COURSE THEMES｜課程主題

- 領導力與主管發展。
- 績效管理。
- 人才甄選與發展。
- 溝通與跨部門協作。
- 員工關係與友善職場。
- HR 專業能力。

## 5. 5D 方法（src/components/service-detail/FiveDMethod.vue）

標題
> 從需求定義到能力移轉，讓每一項方案真正落地並持續運作。

| # | English | 中文 |
|---|---------|------|
| 01 | Define & Agree | 定義需求｜建立共識 |
| 02 | Discover & Analyze | 深度診斷｜分析問題 |
| 03 | Deliver & Decide | 呈現洞察｜共創決策 |
| 04 | Design & Implement | 設計方案｜陪伴落地 |
| 05 | Disengage & Review | 成效回顧｜能力移轉 |

## 6. 服務詳情頁其他文字（src/pages/ServiceDetailPage.vue）

- 頁首左：MOJO KING
- 頁首右：← 返回服務
- Hero CTA：預約諮詢 →
- 頁尾大標：讓下一步，更貼近企業真正的需要。
- 找不到服務時：找不到這項服務／返回服務列表

## 7. 案例（src/components/Testimonials.vue）

標題
> 我們一起解決過的問題.

前言
> 基於保密，以下案例不具名呈現。只說明產業、當時遇到的狀況，以及最後真正改變了什麼。

### 案例 1｜上市櫃科技公司｜組織制度重整

狀況：跨部門權責重疊，決策卡在中層動彈不得。
結果
> 重新盤點組織架構與決策層級，把「誰可以決定什麼」寫進制度裡。三個事業處完成權責重劃後，過去要開三次會才推得動的事，現在一次會議就能定案。

### 案例 2｜半導體企業｜主管培訓與人才發展

狀況：新任主管比例過半，帶人方式各行其是。
結果
> 依照主管的任期與職責設計分階段的培育路徑，把面談、回饋與績效對話變成可以練習的具體動作。半年後，第一線主管開始自己處理團隊問題，而不是全部往上丟。

### 案例 3｜傳統製造業｜人資制度建立

狀況：沒有職級與薪酬標準，加薪升遷全憑印象。
結果
> 從職務盤點做起，建立職級架構與薪酬帶寬。第一次，調薪與升遷有了能對員工說明、也能對經營層交代的依據，人事爭議明顯減少。

### 案例 4｜連鎖服務業｜招募與雇用流程

狀況：門市長期開缺補不滿，面談品質因人而異。
結果
> 重寫職缺說明、導入結構化面談與到職後的追蹤機制。補缺速度變快之外，更重要的是新人留得住——不再是招進來又走。

按鈕：上一則案例／下一則案例（自動輪播，游標移到內文會暫停）

## 8. 合作流程（src/components/Process.vue）

小標：合作流程
標題
> 我們是這樣陪你走完整個專案

| 步驟 | 標題 | 內文 |
|------|------|------|
| 01 | 初談 | 我們會親自拜訪、坐下來聽你說。先釐清真正的問題出在哪裡，而不是急著給答案。 |
| 02 | 整體規劃 | 根據初談的結果，量身設計一套可執行的方案，包含時程、範圍與預期成果，讓你清楚知道每一步要往哪走。 |
| 03 | 專案執行 | 正式進場陪跑。過程中定期回報進度、隨時調整方向，不會讓你在中途失去掌握感。 |
| 04 | 結案會議 | 完整回顧成果與過程中的關鍵決策，並交付後續可以自行延續的做法，讓改變真的留在組織裡。 |

## 9. Contact（src/components/Contact.vue）

標題
> 我們期待與你展開長期的合作.

內文
> 先聊聊也好，喝杯咖啡也可以。

聯絡人
> 郁婷
> 慕玖執行長｜人資顧問
> services@mojo-king.com
> +886 932 178 741
> （LinkedIn 欄位存在但目前留空，連結文字為 Connect via LinkedIn）

CTA：填寫表單
人像 alt：慕玖執行長郁婷

## 10. 諮詢表單（src/components/ConsultationForm.vue + src/pages/ConsultationPage.vue）

頁首：MOJO KING ／ ← 返回首頁

標題
> 一次對話，不是一個承諾。
> 讓我們一起找到最適合你的方向。

內文
> 填寫下方表單，我們的團隊會與你聯繫，安排第一次的諮詢對談。如果你想直接聊聊，也歡迎直接聯絡我們——沒有壓力、也沒有推銷，我們的目標是幫助你在充分了解狀況後，做出清楚的決定。

**欄位**

| 欄位 | 必填 | Placeholder |
|------|------|-------------|
| 姓名 | ✓ | 請輸入你的姓名 |
| Email | ✓ | 我們會寄一封確認信到這個信箱 |
| 職位 | | 例如：人資主管 |
| 公司地址 | | 請輸入公司地址 |
| 是誰推薦你的？ | | 朋友、客戶、網路搜尋⋯ |
| 想詢問的事情 | ✓ | 想了解哪方面的協助？例如招募、留才、主管培力⋯ |
| 想預約諮詢的原因 | | 目前遇到的狀況或想解決的問題 |

同意項
> 我同意讓慕玖團隊透過電話或 email 與我聯繫，安排諮詢時間。

送出按鈕：送出預約／送出中⋯

**成功狀態**
> 收到了，謝謝你花時間填寫！
> 我們已經寄了一封確認信到 {email}，並會盡快與你聯繫，安排適合的諮詢時間。
> 按鈕：填寫另一筆諮詢

**錯誤訊息**
> 送出時發生問題，請稍後再試一次，或直接聯繫我們。
> 請填寫正確的 email，我們會寄一封確認信給你。
> 缺少必填欄位（姓名 / 想詢問的事情）
> 伺服器尚未設定完成

**自動確認信（api/consultation.ts）**

主旨
> 我們已收到你的預約諮詢申請｜慕玖 MoJo King

內文
> {姓名} 你好，
> 我們已經收到你的預約諮詢申請，謝謝你花時間填寫。
> 慕玖團隊會盡快與你聯繫，安排第一次的諮詢對談。
> 以下是你送出的內容：…
> 如果有任何補充，直接回覆這封信即可。
> 慕玖股份有限公司 MoJo King

**內部通知信**：主旨「新的預約諮詢：{姓名}」

## 11. Footer（src/components/Footer.vue）

> 共享人資長服務，陪你把人才策略做到落地。

連結：關於慕玖／服務內容／聯絡我們／services@mojo-king.com
版權：© {當年} 慕玖股份有限公司. All rights reserved.

## 12. 未使用但存在於程式碼的文案（ConsultationBridge.vue，沒有被 import）

> 一次對話，不是一個承諾。讓我們一起找到最適合你的方向。
> 慕玖的顧問可以幫你先看清楚問題出在哪裡，再決定下一步怎麼走。
> 先填個表單，讓我們知道你的狀況。
> 按鈕：填寫表單
