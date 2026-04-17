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
 * sit 默认 Privy App ID。
 *
 * 后端 `surfv2-sit-api.nfexinsider.com` 的 /login aud 校验对齐的是 surf-one
 * sit App；之前卡在开发模式 user limit 已满，后端已调高上限。
 *
 * 历史尝试：
 *   cm3zc6y73001tjxd1ui968tg7   - surf-one sit（当前采用，后端 aud 对齐）
 *   cmb61g21n0087kz0mk7wo5b74   - LP Dashboard sit，后端未对齐
 *   cmbir1ip600bejx0mu6b42iek   - turboflow 主站 sit，后端未对齐
 */
export const DEFAULT_PRIVY_APP_ID = 'cm3zc6y73001tjxd1ui968tg7'
