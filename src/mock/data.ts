import type {
  AgentStatus, AgentLevel, TradeVisibility, DashboardKPI, InviteCodeSummary,
  Invitee, SubAgent, DailyRevenue, CommissionRecord,
  PerpPosition, PerpOrder, EventOrder, InviteCode, TransferRecord,
  SettlementConfig, InviteStats,
} from './types'

// ─── Global Config (switchable for demo) ───
export const agentConfig = {
  status: 'normal' as AgentStatus,
  selfRebateEnabled: true,
  tradeVisibility: 'full' as TradeVisibility,
  isNewAgent: false,
  currentPerpRate: 1.5,
  currentEventRate: 1.2,
  agentName: '王大拿BG',
  agentLevel: 3 as AgentLevel,
}

// ─── Helpers ───
const uid = (i: number) => `UID${String(100000 + i)}`
const date = (daysAgo: number) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10) + ' 00:00:00'
}
const dateOnly = (daysAgo: number) => date(daysAgo).slice(0, 10)
const rand = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 100) / 100
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

// ─── Dashboard KPI (PRD 5.1.1: 5 indicators) ───
export const dashboardKPI: DashboardKPI[] = [
  { label: '今日注册数（人）', value: 23, unit: '人', changePercent: 15.0 },
  { label: '今日净充值（USDT）', value: 45280.50, unit: 'USDT', changePercent: -8.3 },
  { label: '今日 Flat Fee（USDT）', value: 1256.80, unit: 'USDT', changePercent: 12.5 },
  { label: '今日 Profit Share 有效交易量（USDT）', value: 892340.00, unit: 'USDT', changePercent: 5.2 },
  { label: '今日佣金（USDT）', value: 3842.65, unit: 'USDT', changePercent: 22.1 },
]

// ─── Invite Code Summary (PRD 5.1.2) ───
export const inviteCodeSummary: InviteCodeSummary[] = Array.from({ length: 8 }, (_, i) => ({
  code: `TF${String(1000 + i)}`,
  registrations: Math.floor(Math.random() * 100) + 5,
  perpRate: rand(0.3, 1.2),
  eventRate: rand(0.2, 1.0),
}))

// ─── Invitees (PRD 5.2.1) ───
export const invitees: Invitee[] = [
  {
    uid: 'SELF',
    identityType: 'sub_agent',
    depositStatus: 'deposited',
    registeredAt: '2025-01-15 10:30:00',
    remark: '我自己',
    isSelf: true,
    selfRebateAmount: 245.60,
  },
  ...Array.from({ length: 50 }, (_, i) => ({
    uid: uid(i),
    identityType: pick(['regular', 'sub_agent'] as const),
    depositStatus: pick(['deposited', 'not_deposited'] as const),
    registeredAt: date(Math.floor(Math.random() * 90)),
    remark: i % 5 === 0 ? `备注${i}` : '',
  })),
]

// ─── Sub-Agents (PRD 5.2.2) ───
export const subAgents: SubAgent[] = Array.from({ length: 15 }, (_, i) => ({
  uid: uid(200 + i),
  nickname: `Agent_${String.fromCharCode(65 + i)}`,
  perpRate: rand(0.3, 1.2),
  eventRate: rand(0.2, 0.9),
  registeredAt: date(Math.floor(Math.random() * 180)),
  totalDirectCommission: rand(100, 15000),
}))

// ─── Daily Revenue (PRD 5.3.4) ───
export const dailyRevenue: DailyRevenue[] = Array.from({ length: 30 }, (_, i) => {
  const ff = rand(50, 800)
  const ps = rand(30, 500)
  const ev = rand(20, 400)
  return {
    date: dateOnly(i),
    commission: +(ff + ps + ev).toFixed(2),
    tradeVolume: rand(50000, 500000),
    perpCommission: +(ff + ps).toFixed(2),
    flatFeeCommission: ff,
    profitShareCommission: ps,
    eventCommission: ev,
    payoutStatus: pick(['paid', 'frozen_pending'] as const),
  }
})

// ─── Commission Records (PRD 5.3.5 + 4.7 visibility rules) ───
export const commissionRecords: CommissionRecord[] = Array.from({ length: 100 }, (_, i) => {
  const isDirect = Math.random() > 0.3
  const isPerp = Math.random() > 0.4
  return {
    id: `CR${String(10000 + i)}`,
    time: date(Math.floor(Math.random() * 30)),
    sourceType: isDirect ? 'direct' : 'platform_reward',
    sourceUid: isDirect ? uid(Math.floor(Math.random() * 50)) : null,
    productLine: isPerp ? 'perpetual' : 'event',
    settlementType: isPerp ? pick(['flat_fee', 'profit_share'] as const) : null,
    tradeVolume: isDirect ? rand(1000, 50000) : null,
    commissionAmount: rand(5, 500),
    settlementCoin: pick(['USDT', 'USDC']),
    payoutStatus: pick(['paid', 'frozen_pending'] as const),
  }
})

// ─── Settlement Config (PRD 5.3.6) ───
export const settlementConfig: SettlementConfig = {
  method: '实时结算',
  frequency: '交易产生后实时到账',
  coin: 'USDT',
}

// ─── Perp Positions (PRD 5.4.4) ───
const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
export const perpPositions: PerpPosition[] = Array.from({ length: 30 }, (_, i) => ({
  uid: uid(Math.floor(Math.random() * 50)),
  remark: i % 4 === 0 ? `VIP${i}` : '',
  pair: pick(pairs),
  side: pick(['long', 'short'] as const),
  quantity: rand(0.01, 10),
  avgPrice: rand(20000, 70000),
  markPrice: rand(20000, 70000),
  unrealizedPnl: rand(-5000, 5000),
  leverage: pick([2, 5, 10, 20, 50]),
}))

// ─── Perp Orders (PRD 5.4.4) ───
export const perpHistory: PerpOrder[] = Array.from({ length: 30 }, (_, i) => ({
  uid: uid(Math.floor(Math.random() * 50)),
  remark: i % 3 === 0 ? `Note${i}` : '',
  pair: pick(pairs),
  subType: pick(['open', 'close', 'liquidation'] as const),
  side: pick(['buy', 'sell'] as const),
  price: rand(20000, 70000),
  quantity: rand(0.01, 5),
  fee: rand(0.5, 50),
  time: date(Math.floor(Math.random() * 30)),
}))

// ─── Event Orders (PRD 5.4.4) ───
const events = ['BTC 价格预测', 'ETH 价格预测', '黄金走势', '美元指数', 'SOL 突破']
export const eventHistory: EventOrder[] = Array.from({ length: 30 }, (_, i) => ({
  uid: uid(Math.floor(Math.random() * 50)),
  remark: '',
  eventName: pick(events),
  direction: pick(['看涨', '看跌']),
  amount: rand(100, 10000),
  result: pick(['win', 'lose', 'pending'] as const),
  pnl: rand(-5000, 5000),
  time: date(Math.floor(Math.random() * 30)),
}))

// ─── Invite Codes Full (PRD 5.5.2) ───
export const inviteCodes: InviteCode[] = Array.from({ length: 20 }, (_, i) => ({
  code: `TF${String(1000 + i)}`,
  myPerpRate: agentConfig.currentPerpRate,
  subPerpRate: rand(0.3, agentConfig.currentPerpRate - 0.01),
  myEventRate: agentConfig.currentEventRate,
  subEventRate: rand(0.2, agentConfig.currentEventRate - 0.01),
  registrations: Math.floor(Math.random() * 80) + 2,
  firstDepositCount: Math.floor(Math.random() * 40) + 1,
  firstTradeCount: Math.floor(Math.random() * 30) + 1,
  tradeDau: Math.floor(Math.random() * 20),
  tradeVolume: rand(10000, 500000),
  commission: rand(100, 8000),
  linkUrl: `https://app.turboflow.io/r/TF${String(1000 + i)}`,
  createdAt: date(Math.floor(Math.random() * 60)),
  remark: i % 3 === 0 ? `推广${i}` : '',
}))

// ─── Invite Stats (PRD 5.5.3) ───
export const inviteStats: InviteStats = {
  registrations: inviteCodes.reduce((s, c) => s + c.registrations, 0),
  depositAmount: rand(50000, 200000),
  tradeVolume: rand(500000, 3000000),
  commission: rand(10000, 50000),
  tradeDau: Math.floor(Math.random() * 80) + 10,
}

// ─── Transfer Records (PRD 5.6.3) ───
const channels = ['ERC-20', 'TRC-20', 'SOL', 'BSC', 'Arbitrum']
export const transferRecords: TransferRecord[] = Array.from({ length: 40 }, (_, i) => {
  const isSubAgent = Math.random() > 0.6
  return {
    uid: uid(Math.floor(Math.random() * 50)),
    userLevel: isSubAgent ? 'sub_agent' : 'regular',
    subAgentUid: isSubAgent ? uid(200 + Math.floor(Math.random() * 15)) : null,
    remark: i % 5 === 0 ? `转账备注${i}` : '',
    channel: pick(channels),
    transferId: `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    type: pick(['deposit', 'withdrawal'] as const),
    subType: pick(['normal', 'internal_transfer'] as const),
    amount: rand(10, 50000),
    status: pick(['processing', 'success', 'failed'] as const),
    time: date(Math.floor(Math.random() * 30)),
  }
})
