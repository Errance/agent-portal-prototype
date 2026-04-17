/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * mock 开关（审计 C3）：
   * - 显式 'true'  → 始终走 mock
   * - 显式 'false' → 始终走真实 API
   * - 未设置时：DEV 默认 mock，生产默认真实 API
   */
  readonly VITE_USE_MOCK?: 'true' | 'false'
  /**
   * 真实 API 基址。sit 默认 `https://surfv2-sit-api.nfexinsider.com`。
   * 接入 Privy 后 `/login` 总是打向此地址（不受 VITE_USE_MOCK 控制）。
   */
  readonly VITE_API_BASE?: string
  /** 路由类型：'browser' | undefined(hash)，见 main.tsx */
  readonly VITE_ROUTER?: 'browser'
  /** 构建 base 路径，由 CI 通过 GitHub Actions vars 注入，默认 `/` */
  readonly VITE_BASE?: string
  /** Privy App ID（turboflow sit = cmbir1ip600bejx0mu6b42iek） */
  readonly VITE_PRIVY_APP_ID?: string
  /** 业务平台标识，主站 surf-one 为 '4'；值由后端按环境确定 */
  readonly VITE_BIZ_PF?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
