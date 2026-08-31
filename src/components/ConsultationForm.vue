<script setup lang="ts">
/**
 * ConsultationForm.vue
 * 「預約諮詢」表單區塊 —— 左圖右表單的分割版面。
 *
 * 欄位：姓名、Email、職位、公司名稱、推薦人、想詢問的事情、想預約的原因、同意聯繫。
 *
 * 網址帶 ?from=<service slug> 時（服務詳情頁的 CTA 會帶），表單知道使用者
 * 剛剛在讀哪一項服務：標題下方顯示來源、「想詢問的事情」先幫他填好，
 * 送出的信裡也會標明。使用者不必把剛讀完的東西再打一次。
 *
 * 送出後會打 /api/consultation（見 api/consultation.ts），
 * 由 Resend 寄一封信到 Vercel 環境變數 CONSULTATION_TO_EMAIL 指定的信箱。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getServiceBySlug } from "../data/services";
import { useOverlayNav } from "../lib/overlayNav";
import consultationImage from "../assets/Consulting_img.png";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  /**
   * 送出後承諾的回覆時間。這是對外的服務承諾，不是技術設定 ——
   * 慕玖實際能做到幾天就改幾天，別讓它變成做不到的字。
   */
  responseTime?: string;
}

const props = withDefaults(defineProps<Props>(), {
  responseTime: "2 個工作天",
});

const route = useRoute();
const { returnHome } = useOverlayNav();

/** 使用者是從哪個服務頁按「預約諮詢」進來的（沒有就是直接進表單） */
const sourceService = computed(() =>
  getServiceBySlug(String(route.query.from ?? "")),
);

const defaultInquiry = () =>
  sourceService.value ? `我想了解「${sourceService.value.tag}」這項服務。` : "";

interface ConsultationFormState {
  name: string;
  email: string;
  title: string;
  company: string;
  referrer: string;
  inquiry: string;
  reason: string;
  agreeContact: boolean;
}

const form = reactive<ConsultationFormState>({
  name: "",
  email: "",
  title: "",
  company: "",
  referrer: "",
  inquiry: defaultInquiry(),
  reason: "",
  agreeContact: false,
});

type SubmitStatus = "idle" | "submitting" | "success" | "error";
const status = ref<SubmitStatus>("idle");
const errorMessage = ref("");
const successRef = ref<HTMLElement | null>(null);

/** 只擋明顯打錯的格式，真正的驗證交給後端 */
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

async function handleSubmit() {
  if (status.value === "submitting") return;

  if (!isValidEmail(form.email)) {
    errorMessage.value = "請填寫正確的 email，我們會寄一封確認信給你。";
    status.value = "error";
    return;
  }

  // 同意聯繫是真的閘門，不是裝飾。沒勾就不該有資料被送出去。
  if (!form.agreeContact) {
    errorMessage.value =
      "需要你同意讓我們與你聯繫，才能安排諮詢時間。請勾選下方的同意項目。";
    status.value = "error";
    return;
  }

  errorMessage.value = "";
  status.value = "submitting";

  try {
    const response = await fetch("/api/consultation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        // 讓收信的人一眼知道這筆詢問是從哪個服務頁來的
        service: sourceService.value?.tag ?? "",
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error ?? `送出失敗（${response.status}）`);
    }

    status.value = "success";
    // 表單整個被成功訊息取代，焦點得跟著搬過去，
    // 否則使用鍵盤或讀螢幕軟體的人不知道剛剛發生了什麼事。
    await nextTick();
    successRef.value?.focus();
  } catch (error) {
    console.error("送出預約表單失敗", error);
    errorMessage.value =
      error instanceof Error && error.message
        ? error.message
        : "送出時發生問題，請稍後再試一次，或直接聯繫我們。";
    status.value = "error";
  }
}

function resetForm() {
  form.name = "";
  form.email = "";
  form.title = "";
  form.company = "";
  form.referrer = "";
  form.inquiry = defaultInquiry();
  form.reason = "";
  form.agreeContact = false;
  errorMessage.value = "";
  status.value = "idle";
}

/* ----------------------------------
   左側圖片的 parallax：往下滾動時圖片跟著微微往下移，
   跟 Contact.vue 的裝飾圖形用同一套手法（scrub 綁 ScrollTrigger）
---------------------------------- */

const sectionRef = ref<HTMLElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);

let mm: ReturnType<typeof gsap.matchMedia> | null = null;

onMounted(async () => {
  await nextTick();

  mm = gsap.matchMedia();

  /*
   * 視差只在桌機執行。
   *
   * 手機版圖片容器是 h-[45vh]，高度直接綁在視窗高度上；捲到接近頁尾時
   * 網址列會反覆收合／展開，innerHeight 一變，這條 scrub 補間就跟著
   * 來回跳，看起來像畫面在抽動。手機沒有這個裝飾也不損失什麼，
   * 直接不註冊，跟 Footer、About 的處理方式一致。
   */
  mm.add(
    "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
    () => {
      const section = sectionRef.value;
      const image = imageRef.value;
      if (!section || !image) return;

      gsap.set(image, { yPercent: -8 });

      const tween = gsap.to(image, {
        yPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        gsap.set(image, { clearProps: "transform" });
      };
    },
  );
});

onBeforeUnmount(() => {
  mm?.revert();
  mm = null;
});
</script>

<template>
  <section ref="sectionRef" class="grid lg:min-h-screen lg:grid-cols-2">
    <!-- 左側：圖片（固定吃滿一個螢幕高度，不會被圖片本身的長寬比撐開；
         桌機版用 sticky，如果右側表單內容比一個螢幕高，圖片會固定停在畫面上。
         圖片本身比容器高一截、絕對定位，讓 parallax 上下移動時不會露出空白邊） -->
    <!--
      桌機的 sticky 從導覽列下緣開始（lg:top-[108px]），不是視窗頂端。
      釘在 top-0 的話這張深色圖會捲到浮動導覽列底下，深色 logo 壓在
      深色照片上就消失了 —— 而右半邊的淺色表單又需要深色 logo。
    -->
    <div class="relative h-[45vh] w-full overflow-hidden bg-ink lg:sticky lg:top-[108px] lg:h-[calc(100svh-108px)]">
      <img
        ref="imageRef"
        :src="consultationImage"
        alt="慕玖顧問團隊與客戶對談"
        class="absolute left-0 -top-[15%] h-[130%] w-full object-cover md:will-change-transform"
        loading="lazy"
      />
    </div>

    <!-- 右側：表單 -->
    <div class="flex items-center bg-surface-alt px-8 py-20 sm:px-14 lg:px-20 lg:py-24">
      <div class="mx-auto w-full max-w-full">
        <!-- 標題 -->
        <h2
          data-detail-heading
          tabindex="-1"
          class="text-h2 text-ink focus:outline-none"
        >
          一次對話，不是一個承諾。<br />
          讓我們一起找到最適合你的方向。
        </h2>
        <p class="mt-6 text-body text-ink-muted">
          填寫下方表單，我們的團隊會與你聯繫，安排第一次的諮詢對談。如果你想直接聊聊，也歡迎直接聯絡我們——沒有壓力、也沒有推銷，我們的目標是幫助你在充分了解狀況後，做出清楚的決定。
        </p>

        <!-- 從服務詳情頁進來時，讓使用者看見系統已經記住他在讀哪一項 -->
        <p
          v-if="sourceService"
          class="mt-6 inline-flex items-center gap-2 border border-ink/15 bg-white px-4 py-2 text-caption text-ink-muted"
        >
          <span aria-hidden="true" class="h-1.5 w-1.5 shrink-0 rounded-full bg-brand"></span>
          你正在詢問：<span class="text-ink">{{ sourceService.tag }}</span>
        </p>

        <!-- 送出成功狀態 -->
        <div
          v-if="status === 'success'"
          ref="successRef"
          role="status"
          tabindex="-1"
          class="mt-10 border border-ink/15 bg-white px-6 py-10 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink sm:px-10"
        >
          <p class="text-h3 text-ink">
            收到了，謝謝你花時間填寫！
          </p>
          <p class="mt-3 text-body text-ink-muted">
            我們已經寄了一封確認信到 {{ form.email }}。
          </p>
          <!-- 送出後的空白期是焦慮最高的時候，說清楚多久、由誰回覆 -->
          <p class="mt-2 text-body text-ink">
            郁婷會在 {{ props.responseTime }}內親自與你聯繫，安排第一次的諮詢對談。
          </p>

          <div class="mt-8 flex flex-col items-center gap-4">
            <button
              type="button"
              class="w-full bg-ink px-6 py-4 text-sm font-medium tracking-wide text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2 sm:w-auto"
              @click="returnHome"
            >
              返回首頁
            </button>
            <button
              type="button"
              class="text-sm font-medium text-brand-ink underline underline-offset-4"
              @click="resetForm"
            >
              填寫另一筆諮詢
            </button>
          </div>
        </div>

        <!-- 表單 -->
        <form v-else class="mt-12 space-y-9" novalidate @submit.prevent="handleSubmit">
          <div class="grid gap-x-12 gap-y-9 sm:grid-cols-2">
            <div>
              <label for="cf-name" class="block text-sm text-ink">
                姓名 <span class="text-brand">*</span>
              </label>
              <input
                id="cf-name"
                v-model="form.name"
                type="text"
                name="name"
                autocomplete="name"
                required
                placeholder="請輸入你的姓名"
                class="mt-3 w-full border-0 border-b border-ink/20 bg-transparent pb-3 text-sm text-ink placeholder:text-ink/40 focus:border-brand focus:outline-none focus:ring-0"
              />
            </div>

            <div>
              <label for="cf-email" class="block text-sm text-ink">
                Email <span class="text-brand">*</span>
              </label>
              <input
                id="cf-email"
                v-model.trim="form.email"
                type="email"
                name="email"
                autocomplete="email"
                required
                inputmode="email"
                placeholder="我們會寄一封確認信到這個信箱"
                class="mt-3 w-full border-0 border-b border-ink/20 bg-transparent pb-3 text-sm text-ink placeholder:text-ink/40 focus:border-brand focus:outline-none focus:ring-0"
              />
            </div>

            <div>
              <label for="cf-title" class="block text-sm text-ink">
                職位
              </label>
              <input
                id="cf-title"
                v-model="form.title"
                type="text"
                name="title"
                autocomplete="organization-title"
                placeholder="例如：人資主管"
                class="mt-3 w-full border-0 border-b border-ink/20 bg-transparent pb-3 text-sm text-ink placeholder:text-ink/40 focus:border-brand focus:outline-none focus:ring-0"
              />
            </div>

            <!--
              原本這格是「公司地址」。第一次接觸就要地址，摩擦高但對顧問
              沒用 —— 要判斷這筆詢問值不值得回，看的是公司名與規模。
            -->
            <div>
              <label for="cf-company" class="block text-sm text-ink">
                公司名稱
              </label>
              <input
                id="cf-company"
                v-model="form.company"
                type="text"
                name="company"
                autocomplete="organization"
                placeholder="例如：慕玖股份有限公司"
                class="mt-3 w-full border-0 border-b border-ink/20 bg-transparent pb-3 text-sm text-ink placeholder:text-ink/40 focus:border-brand focus:outline-none focus:ring-0"
              />
            </div>

            <div>
              <label for="cf-referrer" class="block text-sm text-ink">
                是誰推薦你的？
              </label>
              <input
                id="cf-referrer"
                v-model="form.referrer"
                type="text"
                name="referrer"
                placeholder="朋友、客戶、網路搜尋⋯"
                class="mt-3 w-full border-0 border-b border-ink/20 bg-transparent pb-3 text-sm text-ink placeholder:text-ink/40 focus:border-brand focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          <div>
            <label for="cf-inquiry" class="block text-sm text-ink">
              想詢問的事情 <span class="text-brand">*</span>
            </label>
            <textarea
              id="cf-inquiry"
              v-model="form.inquiry"
              name="inquiry"
              rows="1"
              required
              placeholder="想了解哪方面的協助？例如招募、留才、主管培力⋯"
              class="mt-3 w-full resize-none border-0 border-b border-ink/20 bg-transparent pb-3 text-sm text-ink placeholder:text-ink/40 focus:border-brand focus:outline-none focus:ring-0"
            ></textarea>
          </div>

          <div>
            <label for="cf-reason" class="block text-sm text-ink">
              想預約諮詢的原因
            </label>
            <textarea
              id="cf-reason"
              v-model="form.reason"
              name="reason"
              rows="1"
              placeholder="目前遇到的狀況或想解決的問題"
              class="mt-3 w-full resize-none border-0 border-b border-ink/20 bg-transparent pb-3 text-sm text-ink placeholder:text-ink/40 focus:border-brand focus:outline-none focus:ring-0"
            ></textarea>
          </div>

          <div class="space-y-4 pt-4">
            <label class="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-ink-muted sm:text-sm">
              <input
                v-model="form.agreeContact"
                type="checkbox"
                name="agreeContact"
                required
                class="mt-0.5 h-4 w-4 shrink-0 border-ink/40 text-brand focus:ring-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink"
              />
              <span>
                我同意讓慕玖團隊透過電話或 email 與我聯繫，安排諮詢時間。
                <span class="text-brand">*</span>
              </span>
            </label>
          </div>

          <div v-if="status === 'error'" role="alert" class="text-sm text-red-600">
            {{ errorMessage || "送出時發生問題，請稍後再試一次，或直接聯繫我們。" }}
          </div>

          <button
            type="submit"
            :disabled="status === 'submitting'"
            class="mt-6 w-full bg-ink px-6 py-4 text-sm font-medium tracking-wide text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {{ status === "submitting" ? "送出中⋯" : "送出預約" }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>
