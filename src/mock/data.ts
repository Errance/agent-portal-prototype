import { agentConfig } from './agent-config'
import type { DashboardKPI, InviteCodeSummary, Invitee, SubAgent } from '@/types/domain'
import { createRng } from '@/utils/prng'
import { dateDaysAgoShanghai } from '@/utils/tz'

/**
 * mock/data.ts
 * ------------------------------------------------------------
 * 后端已接入 10 个真实 GET 接口后（见 docs/AGENT_PORTAL_FRONTEND_API.md）
 * 本文件仅保留 **后端尚未提供** 的数据源作为兜底：
 *
 *   - dashboardKPI / inviteCodeSummary: Dashboard 页还没有后端 KPI 聚合接口
 *   - invitees / subAgents / userPool: 好友中心两个接口后端未提供
 *   - agentConfig: 代理身份 / 冻结 / 等级 / visibility / agentName 等
 *                 仍走 mock（/agent/profile 只提供费率，其它字段待后端）
 *
 * 其它 mock（dailyRevenue、commissionRecords、perpPositions、perpHistory、
 * eventHistory、inviteCodes、inviteStats、transferRecords、settlementConfig）
 * 已全部删除，走真实 API。
 *
 * 所有 mock 仍走 seeded PRNG（审计 M1），保证 HMR / reload 后数据稳定。
 *
 * 后续 Dashboard 接入 `/agent/dashboard/kpi` 后，该 KPI 将与收益中心
 * `/agent/revenue/daily.summary` 在后端侧保持同源（审计 M11 修正）。
 */

const { rand, pick, pickInt, next } = createRng(20260416)

const uid = (i: number) => `UID${String(100000 + i)}`
const date = (daysAgo: number) => `${dateDaysAgoShanghai(daysAgo)} 00:00:00`
const randPs = (min: number, max: number) => rand(min, max, 4)

export { agentConfig }

/* ========== 好友中心（invitees + subAgents），后端未提供 ========== */

interface PooledUser {
  uid: string
  identityType: 'regular' | 'sub_agent'
}

const USER_POOL_SIZE = 50
export const userPool: PooledUser[] = Array.from({ length: USER_POOL_SIZE }, (_, i) => ({
  uid: uid(i),
  identityType: next() > 0.5 ? 'sub_agent' : 'regular',
}))

export const invitees: Invitee[] = [
  {
    uid: 'SELF',
    identityType: 'sub_agent',
    depositStatus: 'deposited',
    tradeStatus: 'traded',
    registeredAt: '2025-01-15 10:30:00',
    remark: '我自己',
    isSelf: true,
    selfRebateAmount: 245.6,
    flatFeeCommUsdt: 0,
    flatFeeCommUsdc: 0,
    profitShareCommUsdt: 0,
    profitShareCommUsdc: 0,
    eventCommission: 0,
  },
  ...userPool.map((u, i) => {
    const dep = pick(['deposited', 'not_deposited'] as const)
    const traded = dep === 'deposited' && next() > 0.3
    return {
      uid: u.uid,
      identityType: u.identityType,
      depositStatus: dep,
      tradeStatus: (traded ? 'traded' : 'not_traded') as 'traded' | 'not_traded',
      registeredAt: date(pickInt(0, 89)),
      remark: i % 5 === 0 ? `备注${i}` : '',
      flatFeeCommUsdt: traded ? rand(5, 400) : 0,
      flatFeeCommUsdc: traded ? rand(2, 150) : 0,
      profitShareCommUsdt: traded ? rand(3, 200) : 0,
      profitShareCommUsdc: traded ? rand(1, 80) : 0,
      eventCommission: traded ? rand(1, 200) : 0,
    }
  }),
]

export const subAgents: SubAgent[] = Array.from({ length: 15 }, (_, i) => ({
  uid: uid(200 + i),
  nickname: `Agent_${String.fromCharCode(65 + i)}`,
  flatFeeRate: rand(0.1, 0.6),
  profitShareRate: randPs(0.001, 0.006),
  eventRate: rand(0.2, 0.9),
  registeredAt: date(pickInt(0, 179)),
  directCommUsdt: rand(50, 8000),
  directCommUsdc: rand(20, 3000),
  platformRewardUsdt: rand(30, 5000),
  platformRewardUsdc: rand(10, 2000),
}))

/* ========== Dashboard：后端未提供 KPI 聚合接口 ========== */

export const inviteCodeSummary: InviteCodeSummary[] = Array.from({ length: 8 }, (_, i) => ({
  code: `TF${String(1000 + i)}`,
  registrations: pickInt(5, 105),
  flatFeeRate: rand(0.1, 0.6),
  profitShareRate: randPs(0.001, 0.006),
  eventRate: rand(0.2, 1.0),
}))

/**
 * dashboardKPI 硬编码兜底：后端 `/agent/dashboard/kpi` 就绪前使用。
 * 数值为展示样例，不代表任何真实业务口径；DashboardKPI 接口定义见 types/domain.ts。
 */
export const dashboardKPI: DashboardKPI[] = [
  { label: '今日注册数', value: 12, unit: '人', changePercent: 20 },
  { label: '今日净充值', value: 4800, unit: 'USDT', changePercent: -8.35 },
  { label: '今日 Flat Fee', value: 320.5, unit: 'USDT', changePercent: 15.2 },
  { label: '今日 PS 有效交易量', value: 185000, unit: 'USDT', changePercent: 6.18 },
  { label: '今日事件合约交易量', value: 42000, unit: 'USDT', changePercent: -3.4 },
  { label: '今日佣金（直推）', value: 156.8, unit: 'USDT', changePercent: 9.6 },
  { label: '今日平台奖励', value: 85.3, unit: 'USDT', changePercent: 4.1 },
]
