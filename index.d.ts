declare global {
  // 基础的多语言字段接口
  interface LocalizedMeta {
    name: string;
    description: string;
  }

  // JSON 源数据的接口结构
  interface ToolSourceItem {
    slug: string;
    icon: string;
    [key: string]: any; // 允许 en, zh 等动态键
  }

  // 类型语言包
  interface CateUIInfo {
    title: string;
    description: string;
    keywords: string[];
    h2: string;
    pdesc: string;
    article: Array<{
      title: string;
      content: string;
    }>;
    highlights: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
    faq: Array<{
      q: string;
      a: string;
    }>;
  }

  // 工具语言包，主要用于在界面上做展示用途
  interface ToolUIInfo {
    name: string;
    description: string;
    hero: {
      trustHtml: string;
    },
    meta: {
      title: string;
      description: string;
      keywords?: string[];
    },
    presets: Record<string, any>;
    features: Array<{
      icon: string;
      title: string;
      description: string;
    }>,
    guide: Array<{
      title: string;
      description: string;
    }>,
    article: Array<{
      title: string;
      description: string;
    }>,
    faq: Array<{
      question: string;
      answer: string;
    }>,
    results: {
      workflow: {
        tip: string;
      }
    }
  }

  // 经过 useTools 处理后，组件真正使用的接口
  interface ProcessedTool {
    slug: string;
    icon: string;
    category: string;
    name: string;
    description: string;
    component: string;
    applicationCategory: string;
    sort: number;
    nextSteps: string[];
    recommends: string[];
    preset: Record<string, any>;
    [key: string]: any;
  }

  // 分类配置接口
  interface ToolCategory {
    sort: number;
    slug: string;
    type: string;
    icon: string;
    tools: ProcessedTool[];
    theme: CategoryTheme;
    [key: string]: any;
  }

  interface CategoryTheme {
    bg: string
    text: string
    iconBg: string
  }
}
export { }
