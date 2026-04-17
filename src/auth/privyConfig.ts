import type { PrivyClientConfig } from '@privy-io/react-auth'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'
import { bsc, bscTestnet, mainnet } from 'viem/chains'

/**
 * Privy 客户端配置（对齐 turboflow 主站 PrivyWalletProvider）。
 *
 * 主要差异：
 * - theme: 主站 `dark`，agent-portal 是浅色主题 → `light`
 * - loginMethods: 主站注释掉（走 Privy Dashboard 配置），这里保持一致
 *
 * 其余按主站原样：
 * - defaultChain = bsc
 * - supportedChains = [bsc, mainnet, bscTestnet]
 * - embeddedWallets.solana.createOnLogin = 'all-users'（ethereum 不创建）
 * - externalWallets.solana.connectors = solanaConnectors
 *
 * 账号体系与主站共用同一 Privy App ID（`VITE_PRIVY_APP_ID`）。
 */

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
})

export const privyConfig: PrivyClientConfig = {
  appearance: {
    theme: 'light',
    accentColor: '#0ABAB5',
    landingHeader: '登录 / 注册',
    walletChainType: 'ethereum-and-solana',
    walletList: ['metamask', 'okx_wallet', 'phantom', 'detected_wallets'],
  },
  defaultChain: bsc,
  supportedChains: [bsc, mainnet, bscTestnet],
  embeddedWallets: {
    // 与主站一致：ethereum 不创建；solana 全员创建以保证跨应用钱包体验一致
    solana: {
      createOnLogin: 'all-users',
    },
  },
  externalWallets: {
    solana: {
      connectors: solanaConnectors,
    },
  },
}

/**
 * sit 默认 Privy App ID（仅 DEV fallback，避免本地忘配 env 时直接空白崩溃）。
 *
 * 后端 `/login` 的 aud 校验是按 `biz-pf` header 查表得到期待值，然后对齐
 * 前端发的 Privy JWT 的 aud。
 *
 * 环境对照（agent-portal 用）：
 *   sit  = cmbir1ip600bejx0mu6b42iek
 *   uat  = cmdsozhfd004mlb0b47ukqv7s
 *   prod = cmcjy9lbg0028l70m9owhg0oa
 *
 * 历史尝试（各自原因）：
 *   cm3zc6y73001tjxd1ui968tg7   - surf-one 业务 sit，Privy 开发模式 user limit 已满
 *   cmb61g21n0087kz0mk7wo5b74   - LP Dashboard sit，后端未部署映射
 */
export const DEFAULT_PRIVY_APP_ID = 'cmbir1ip600bejx0mu6b42iek'

/**
 * 运行时解析 Privy App ID（审计 S2）。
 *
 * - env `VITE_PRIVY_APP_ID` 有值 → 直接用；这是生产 / uat 预期路径
 * - prod 构建 + 无 env → 抛错，**fail fast**，避免 CI 忘注入时悄悄用 sit 的 App ID 上线
 * - dev 构建 + 无 env → 用 `DEFAULT_PRIVY_APP_ID` 兜底，打 console.warn 提醒
 */
export function resolvePrivyAppId(): string {
  const fromEnv = import.meta.env.VITE_PRIVY_APP_ID
  if (fromEnv && fromEnv.length > 0) return fromEnv
  if (import.meta.env.PROD) {
    throw new Error(
      'VITE_PRIVY_APP_ID is required in production builds; 请在 CI / 部署环境配置对应环境的 Privy App ID',
    )
  }
  console.warn(
    '[auth/privy] VITE_PRIVY_APP_ID 未配置，DEV 环境回退到默认 sit App ID: ',
    DEFAULT_PRIVY_APP_ID,
  )
  return DEFAULT_PRIVY_APP_ID
}
