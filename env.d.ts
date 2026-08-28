declare module "*.vue" {
    import type { DefineComponent } from "vue";
  
    const component: DefineComponent<
      Record<string, unknown>,
      Record<string, unknown>,
      unknown
    >;
  
    export default component;
  }

interface ImportMetaEnv {
  /** GA4 評估 ID（G-XXXXXXXXXX）。沒設就完全不載入 GA。 */
  readonly VITE_GA_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
