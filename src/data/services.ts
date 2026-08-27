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
  | {
      type: "numbered-list";
      label: string;
      title: string;
      items: ServiceListItem[];
    }
  | {
      type: "bullet-list";
      label: string;
      title: string;
      items: ServiceListItem[];
    };

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

export const services: ServiceDefinition[] = [
  {
    slug: "hr-consulting",
    index: "01",
    tag: "人資顧問",
    titleLine1: "人資顧問",
    titleLine2: "",
    summary:
      "聚焦關鍵管理議題與制度建置，從診斷問題、凝聚共識到陪伴導入，打造符合企業發展階段的人才管理方案。",
    image: DEFAULT_SERVICE_HERO_IMAGE,
    detailIntro:
      "顧問不只是提供一套標準答案。我們從釐清經營問題開始，協助企業建立主管共識、設計適合組織現況的導入方式，並持續追蹤實際運作情形，讓制度不只存在於文件裡，而是真正成為支持決策與管理的工具。",
    sections: [
      {
        type: "numbered-list",
        label: "CONSULTING AREAS",
        title: "六項顧問服務範疇",
        items: [
          {
            title: "組織治理與組織設計",
            description: "釐清組織架構、角色權責與決策機制。",
          },
          {
            title: "績效管理與目標展開",
            description: "將經營策略轉化為清楚且可追蹤的團隊目標。",
          },
          {
            title: "薪酬、職級與激勵制度",
            description: "建立兼顧內部公平、外部競爭力與人才激勵的制度。",
          },
          {
            title: "人才策略與接班發展",
            description: "辨識關鍵職位與人才，建立可持續發展的人才梯隊。",
          },
          {
            title: "人資制度與員工關係",
            description: "完善人才管理流程，降低法遵與員工關係風險。",
          },
          {
            title: "領導發展與變革管理",
            description: "協助主管建立帶人能力，推動制度與組織改變。",
          },
        ],
      },
    ],
  },
  {
    slug: "fractional-chro",
    index: "02",
    tag: "共享人資長",
    titleLine1: "共享人資長",
    titleLine2: "",
    summary:
      "定期參與經營與人資決策，從策略、組織與人才角度整合關鍵議題，成為經營團隊長期且可信賴的人資夥伴。",
    image: "https://picsum.photos/seed/svc-2/1920/1280",
    detailIntro:
      "共享人資長是經營團隊的策略人資夥伴，定期參與重要決策，協助企業整合組織、制度與人才議題，持續推動關鍵制度，同時培育內部人資與主管團隊。",
    sections: [
      {
        type: "bullet-list",
        label: "SUITABLE COMPANIES",
        title: "適合合作的企業",
        items: [
          { title: "正在快速成長、轉型或進行接班。" },
          { title: "尚未設置資深人資主管，但已有多項議題需要整合。" },
          { title: "內部人資團隊具備執行能力，需要策略方向與專業指導。" },
          { title: "面臨組織調整、人才流失或主管能力斷層。" },
          { title: "希望建立完整制度，但暫時不需要聘任全職人資長。" },
          { title: "需要能與經營團隊對話，也能陪伴制度落地的人資夥伴。" },
        ],
      },
      {
        type: "bullet-list",
        label: "SUPPORT AREAS",
        title: "支持範疇",
        items: [
          { title: "經營策略與人資策略對齊。" },
          { title: "關鍵組織與人才議題決策。" },
          { title: "人資制度推動與進度追蹤。" },
          { title: "內部人資團隊專業培育。" },
          { title: "主管管理能力與人才決策支持。" },
        ],
      },
    ],
  },
  {
    slug: "custom-training",
    index: "03",
    tag: "客製化課程設計",
    titleLine1: "客製化課程設計",
    titleLine2: "",
    summary:
      "從企業情境、學員特性與管理痛點出發，客製案例、演練與工具，讓學習真正轉化為工作現場可運用的管理行為。",
    image: "https://picsum.photos/seed/svc-3/1920/1280",
    detailIntro:
      "課程不從既有教材開始，而是從企業真正面對的管理問題開始。我們透過顧問式診斷、情境案例、互動引導、工具練習與課後應用，讓學習轉化為工作現場可以持續使用的管理行為。",
    sections: [
      {
        type: "numbered-list",
        label: "COURSE DESIGN PROCESS",
        title: "課程設計流程",
        items: [
          {
            title: "需求診斷",
            description: "釐清企業情境、學員特性與真正需要解決的問題。",
          },
          {
            title: "客製設計",
            description: "依學習目標重新設計案例、工具、活動與演練內容。",
          },
          {
            title: "互動教學",
            description: "透過討論、情境演練與實務回饋建立理解與行動。",
          },
          {
            title: "應用落地",
            description: "將課堂成果轉化為可執行的工作方法與後續行動。",
          },
        ],
      },
      {
        type: "bullet-list",
        label: "COURSE THEMES",
        title: "課程主題",
        items: [
          { title: "領導力與主管發展。" },
          { title: "績效管理。" },
          { title: "人才甄選與發展。" },
          { title: "溝通與跨部門協作。" },
          { title: "員工關係與友善職場。" },
          { title: "HR 專業能力。" },
        ],
      },
    ],
  },
];

export const fiveDSteps: FiveDStep[] = [
  { english: "Define & Agree", chinese: "定義需求｜建立共識" },
  { english: "Discover & Analyze", chinese: "深度診斷｜分析問題" },
  { english: "Deliver & Decide", chinese: "呈現洞察｜共創決策" },
  { english: "Design & Implement", chinese: "設計方案｜陪伴落地" },
  { english: "Disengage & Review", chinese: "成效回顧｜能力移轉" },
];

export const getServiceHref = (slug: ServiceSlug) => `/services/${slug}`;

export const getServiceBySlug = (slug: string) =>
  services.find((service) => service.slug === slug);
