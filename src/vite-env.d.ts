/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * mock 开关（审计 C3）：
   * - 显式 'true'  → 始终走 mock
   * - 显式 'false' → 始终走真实 API
   * - 未设置时：DEV 默认 mock，生产默认真实 API
   */
  readonly VITE_USE_MOCK?: 'true' | 'false'
  /** 真实 API 基址，默认 `/api` */
  readonly VITE_API_BASE?: string
  /** 路由类型：'browser' | undefined(hash)，见 main.tsx */
  readonly VITE_ROUTER?: 'browser'
  /** 构建 base 路径，由 CI 通过 GitHub Actions vars 注入，默认 `/` */
  readonly VITE_BASE?: string
  /** Privy App ID，与主站一致（未接入时可留空） */
  readonly VITE_PRIVY_APP_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
