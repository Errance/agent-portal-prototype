import { agentConfig } from './agent-config'
import type {
  DashboardKPI,
  InviteCodeSummary,
  Invitee,
  SubAgent,
  DailyRevenue,
  CommissionRecord,
  PerpPosition,
  PerpOrder,
  EventOrder,
  InviteCode,
  TransferRecord,
  SettlementConfig,
  InviteStats,
} from '@/types/domain'
import { createRng } from '@/utils/prng'
import { dateDaysAgoShanghai } from '@/utils/tz'

/**
 * mock/data.ts
 * ------------------------------------------------------------
 * 所有 mock 都走一个 seeded PRNG（见审计 M1）。目的：
 * 1. HMR / reload 后数据保持完全一致，便于与线上截图对比。
 * 2. invitees / commissionRecords / transferRecords 使用同一 userPool，
 *    跳转 / 筛选 / 贡献明细之间数据自洽。
 * 3. 后端接入时，mock 层可被整体替换为 real adapter，不影响 UI 契约。
 */

const { rand, pick, pickInt, next } = createRng(20260416)

// ---- 基础生成器 ----------------------------------------------------
const uid = (i: number) => `UID${String(100000 + i)}`
/**
 * 审计 H9 修复：不再用 `new Date().toISOString().slice(0, 10)` 拿 UTC 日历日，
 * 改为显式按 Asia/Shanghai 生成，与 Dashboard "UTC+8" 文案一致。
 */
const date = (daysAgo: number) => `${dateDaysAgoShanghai(daysAgo)} 00:00:00`
const dateOnly = (daysAgo: number) => dateDaysAgoShanghai(daysAgo)
const randPs = (min: number, max: number) => rand(min, max, 4)

// 代理账户基础配置已拆到 @/mock/agent-config，见该文件顶部注释。
export { agentConfig }

// dashboardKPI 从下方数据派生（审计 M11：Dashboard 与 RevenueCenter/FriendsCenter/
// OnchainTransfers 共用同一批 mock 源数据）。见本文件尾部 `dashboardKPI` 定义。

export const inviteCodeSummary: InviteCodeSummary[] = Array.from({ length: 8 }, (_, i) => ({
  code: `TF${String(1000 + i)}`,
  registrations: pickInt(5, 105),
  flatFeeRate: rand(0.1, 0.6),
  profitShareRate: randPs(0.001, 0.006),
  eventRate: rand(0.2, 1.0),
}))

// ---- 用户池（uid + 身份）：所有下游表从这里 pick -----------------------
interface PooledUser {
  uid: string
  identityType: 'regular' | 'sub_agent'
}

const USER_POOL_SIZE = 50
export const userPool: PooledUser[] = Array.from({ length: USER_POOL_SIZE }, (_, i) => ({
  uid: uid(i),
  identityType: next() > 0.5 ? 'sub_agent' : 'regular',
}))

const pickUser = (): PooledUser => pick(userPool)
const pickUserUid = (): string => pickUser().uid

// ---- invitees（直接邀请人） ---------------------------------------------
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

// ---- 子代理 --------------------------------------------------------
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

export const dailyRevenue: DailyRevenue[] = Array.from({ length: 30 }, (_, i) => ({
  date: dateOnly(i),
  flatFeeCommUsdt: rand(40, 600),
  flatFeeCommUsdc: rand(10, 200),
  profitShareCommUsdt: rand(20, 400),
  profitShareCommUsdc: rand(5, 150),
  eventCommission: rand(20, 400),
  ffTradeVolUsdt: rand(20000, 250000),
  ffTradeVolUsdc: rand(5000, 80000),
  psTradeVolUsdt: rand(15000, 180000),
  psTradeVolUsdc: rand(3000, 50000),
  eventTradeVolume: rand(10000, 150000),
  flatFeeFeeUsdt: rand(8, 160),
  flatFeeFeeUsdc: rand(2, 50),
  payoutStatus: pick(['paid', 'frozen_pending'] as const),
}))

export const commissionRecords: CommissionRecord[] = Array.from({ length: 100 }, (_, i) => {
  const isDirect = next() > 0.3
  const isPerp = next() > 0.4
  return {
    id: `CR${String(10000 + i)}`,
    time: date(pickInt(0, 29)),
    sourceType: isDirect ? 'direct' : 'platform_reward',
    sourceUid: isDirect ? pickUserUid() : null,
    productLine: isPerp ? 'perpetual' : 'event',
    settlementType: isPerp ? pick(['flat_fee', 'profit_share'] as const) : null,
    tradeVolume: isDirect ? rand(1000, 50000) : null,
    commissionAmount: rand(5, 500),
    settlementCoin: pick(['USDT', 'USDC']),
    payoutStatus: pick(['paid', 'frozen_pending'] as const),
  }
})

export const settlementConfig: SettlementConfig = {
  method: '实时结算',
  frequency: '交易产生后实时到账',
  coin: 'USDT',
}

const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
export const perpPositions: PerpPosition[] = Array.from({ length: 30 }, (_, i) => ({
  uid: pickUserUid(),
  remark: i % 4 === 0 ? `VIP${i}` : '',
  pair: pick(pairs),
  side: pick(['long', 'short'] as const),
  quantity: rand(0.01, 10),
  avgPrice: rand(20000, 70000),
  markPrice: rand(20000, 70000),
  unrealizedPnl: rand(-5000, 5000),
  leverage: pick([2, 5, 10, 20, 50]),
}))

export const perpHistory: PerpOrder[] = Array.from({ length: 30 }, (_, i) => ({
  uid: pickUserUid(),
  remark: i % 3 === 0 ? `Note${i}` : '',
  pair: pick(pairs),
  subType: pick(['open', 'close', 'liquidation'] as const),
  side: pick(['buy', 'sell'] as const),
  price: rand(20000, 70000),
  quantity: rand(0.01, 5),
  fee: rand(0.5, 50),
  time: date(pickInt(0, 29)),
}))

const events = ['BTC 价格预测', 'ETH 价格预测', '黄金走势', '美元指数', 'SOL 突破']
export const eventHistory: EventOrder[] = Array.from({ length: 30 }, () => ({
  uid: pickUserUid(),
  remark: '',
  eventName: pick(events),
  direction: pick(['看涨', '看跌']),
  amount: rand(100, 10000),
  result: pick(['win', 'lose', 'pending'] as const),
  pnl: rand(-5000, 5000),
  time: date(pickInt(0, 29)),
}))

export const inviteCodes: InviteCode[] = Array.from({ length: 20 }, (_, i) => ({
  code: `TF${String(1000 + i)}`,
  status: i % 7 === 0 ? ('revoked' as const) : ('active' as const),
  myFlatFeeRate: agentConfig.currentFlatFeeRate,
  subFlatFeeRate: rand(0.1, agentConfig.currentFlatFeeRate - 0.01),
  myProfitShareRate: agentConfig.currentProfitShareRate,
  subProfitShareRate: randPs(0.001, agentConfig.currentProfitShareRate - 0.0001),
  myEventRate: agentConfig.currentEventRate,
  subEventRate: rand(0.2, agentConfig.currentEventRate - 0.01),
  registrations: pickInt(2, 81),
  firstDepositCount: pickInt(1, 40),
  firstTradeCount: pickInt(1, 30),
  tradeDau: pickInt(0, 19),
  tradeVolume: rand(10000, 500000),
  commission: rand(100, 8000),
  linkUrl: `https://app.turboflow.io/r/TF${String(1000 + i)}`,
  createdAt: date(pickInt(0, 59)),
  remark: i % 3 === 0 ? `推广${i}` : '',
}))

export const inviteStats: InviteStats = {
  registrations: inviteCodes.reduce((s, c) => s + c.registrations, 0),
  depositAmount: rand(50000, 200000),
  tradeVolume: rand(500000, 3000000),
  commission: rand(10000, 50000),
  tradeDau: pickInt(10, 89),
}

const channels = ['ERC-20', 'TRC-20', 'SOL', 'BSC', 'Arbitrum']
export const transferRecords: TransferRecord[] = Array.from({ length: 40 }, () => {
  const u = pickUser()
  const isSubAgent = u.identityType === 'sub_agent'
  return {
    uid: u.uid,
    userLevel: u.identityType,
    subAgentUid: isSubAgent ? uid(200 + pickInt(0, 14)) : null,
    channel: pick(channels),
    type: pick(['deposit', 'withdrawal'] as const),
    subType: pick(['normal', 'internal_transfer'] as const),
    amount: rand(10, 50000),
    status: pick(['processing', 'success', 'failed'] as const),
    time: date(pickInt(0, 29)),
  }
})

// ---- Dashboard KPI（审计 M11：从上面的源数据派生，和 RevenueCenter/FriendsCenter/
// OnchainTransfers 共享同一事实源，保证 "今日" 口径在多个页面之间完全一致） --------

const todayDate = dailyRevenue[0].date // YYYY-MM-DD
const yesterdayDate = dailyRevenue[1].date

function changePct(t: number, y: number): number {
  if (!Number.isFinite(t) || !Number.isFinite(y)) return 0
  if (y === 0) return t === 0 ? 0 : 100
  return +(((t - y) / y) * 100).toFixed(2)
}

function sumBy<T>(list: T[], pred: (x: T) => number): number {
  return list.reduce((acc, x) => acc + pred(x), 0)
}

// 注册数
const regsToday = invitees.filter(u => !u.isSelf && u.registeredAt.startsWith(todayDate)).length
const regsYesterday = invitees.filter(
  u => !u.isSelf && u.registeredAt.startsWith(yesterdayDate),
).length

// 净充值 = 成功 deposit − 成功 withdrawal（与 OnchainTransfers `aggregate` 同一规则）
const transfersSucceeded = transferRecords.filter(r => r.status === 'success')
const netDeposit = (day: string) => {
  const rows = transfersSucceeded.filter(r => r.time.startsWith(day))
  return (
    sumBy(
      rows.filter(r => r.type === 'deposit'),
      r => r.amount,
    ) -
    sumBy(
      rows.filter(r => r.type === 'withdrawal'),
      r => r.amount,
    )
  )
}
const netDepositToday = netDeposit(todayDate)
const netDepositYesterday = netDeposit(yesterdayDate)

// 直推佣金 / 平台奖励（按 USDT 口径，与 RevenueCenter aggregateCommissions.totalUsdt 同源）
const commByType = (day: string, type: 'direct' | 'platform_reward') =>
  sumBy(
    commissionRecords.filter(
      r => r.time.startsWith(day) && r.sourceType === type && r.settlementCoin === 'USDT',
    ),
    r => r.commissionAmount,
  )
const directUsdtToday = commByType(todayDate, 'direct')
const directUsdtYesterday = commByType(yesterdayDate, 'direct')
const platformUsdtToday = commByType(todayDate, 'platform_reward')
const platformUsdtYesterday = commByType(yesterdayDate, 'platform_reward')

// Flat Fee / PS 交易量 / 事件交易量 直接读 dailyRevenue 当日行
const today = dailyRevenue[0]
const yesterday = dailyRevenue[1]

export const dashboardKPI: DashboardKPI[] = [
  {
    label: '今日注册数',
    value: regsToday,
    unit: '人',
    changePercent: changePct(regsToday, regsYesterday),
  },
  {
    label: '今日净充值',
    value: +netDepositToday.toFixed(2),
    unit: 'USDT',
    changePercent: changePct(netDepositToday, netDepositYesterday),
  },
  {
    label: '今日 Flat Fee',
    value: +today.flatFeeCommUsdt.toFixed(2),
    unit: 'USDT',
    changePercent: changePct(today.flatFeeCommUsdt, yesterday.flatFeeCommUsdt),
  },
  {
    label: '今日 PS 有效交易量',
    value: +today.psTradeVolUsdt.toFixed(2),
    unit: 'USDT',
    changePercent: changePct(today.psTradeVolUsdt, yesterday.psTradeVolUsdt),
  },
  {
    label: '今日事件合约交易量',
    value: +today.eventTradeVolume.toFixed(2),
    unit: 'USDT',
    changePercent: changePct(today.eventTradeVolume, yesterday.eventTradeVolume),
  },
  {
    label: '今日佣金（直推）',
    value: +directUsdtToday.toFixed(2),
    unit: 'USDT',
    changePercent: changePct(directUsdtToday, directUsdtYesterday),
  },
  {
    label: '今日平台奖励',
    value: +platformUsdtToday.toFixed(2),
    unit: 'USDT',
    changePercent: changePct(platformUsdtToday, platformUsdtYesterday),
  },
]
