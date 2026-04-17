export type AgentStatus = 'normal' | 'frozen' | 'not_agent'
export type AgentLevel = 1 | 2 | 3 | 4 | 5
export type TradeVisibility = 'full' | 'summary' | 'hidden'
export type ProductLine = 'all' | 'perpetual' | 'event'
export type SettlementType = 'all' | 'flat_fee' | 'profit_share'
export type PayoutStatus = 'paid' | 'frozen_pending'
export type SourceType = 'direct' | 'platform_reward'
export type IdentityType = 'regular' | 'sub_agent'
export type DepositStatus = 'deposited' | 'not_deposited'
export type TradeStatus = 'traded' | 'not_traded'
export type TransferType = 'deposit' | 'withdrawal'
export type TransferSubType = 'normal' | 'internal_transfer'
export type TransferStatus = 'processing' | 'success' | 'failed'
export type PositionSide = 'long' | 'short'
export type OrderSubType = 'open' | 'close' | 'liquidation'
export type OrderSide = 'buy' | 'sell'
export type EventResult = 'win' | 'lose' | 'pending'
export type PromoCodeStatus = 'active' | 'revoked'

/* ========== 代理身份 ========== */

/**
 * GET /agent/profile 返回的代理自身比例（文档 §2.1）。
 * 身份 / 冻结 / 等级 / agentName 等字段后端未提供，仍走 mock agentConfig。
 */
export interface AgentProfile {
  currentFlatFeeRate: number
  currentProfitShareRate: number
  currentEventRate: number
}

/* ========== Dashboard ========== */

export interface DashboardKPI {
  label: string
  value: number
  unit: string
  changePercent: number
  note?: string
}

export interface InviteCodeSummary {
  code: string
  registrations: number
  flatFeeRate: number
  profitShareRate: number
  eventRate: number
}

/* ========== 好友中心（mock，后端未提供） ========== */

export interface Invitee {
  uid: string
  identityType: IdentityType
  depositStatus: DepositStatus
  tradeStatus: TradeStatus
  registeredAt: string
  remark: string
  isSelf?: boolean
  selfRebateAmount?: number
  flatFeeCommUsdt: number
  flatFeeCommUsdc: number
  profitShareCommUsdt: number
  profitShareCommUsdc: number
  eventCommission: number
}

export interface SubAgent {
  uid: string
  nickname: string
  flatFeeRate: number
  profitShareRate: number
  eventRate: number
  registeredAt: string
  directCommUsdt: number
  directCommUsdc: number
  platformRewardUsdt: number
  platformRewardUsdc: number
}

/* ========== 收益中心 ========== */

/**
 * GET /agent/revenue/daily 的行（文档 §5.1）。
 *
 * 后端当前只给 total_trade_volume_usdt + flat_fee_fee_total_usdt 合计。
 * 前端 UI 原有的 FF/PS/event 各自交易量、FF/PS 双币种手续费等字段暂保留
 * 为 optional（Q1：等后端补齐分币种细节），mapper 返回 undefined，UI 显示 "—"。
 */
export interface DailyRevenue {
  date: string
  flatFeeCommUsdt: number
  flatFeeCommUsdc: number
  profitShareCommUsdt: number
  profitShareCommUsdc: number
  eventCommission: number
  /** 后端合计（Q1，当前唯一数据源） */
  totalTradeVolumeUsdt: number
  /** 后端合计（Q1，当前唯一数据源） */
  flatFeeFeeTotalUsdt: number
  payoutStatus: PayoutStatus

  /** 待后端补齐的分币种细节（Q1） */
  ffTradeVolUsdt?: number
  ffTradeVolUsdc?: number
  psTradeVolUsdt?: number
  psTradeVolUsdc?: number
  eventTradeVolume?: number
  flatFeeFeeUsdt?: number
  flatFeeFeeUsdc?: number
}

/**
 * Summary（文档 §5.1）：
 *   total_rebate_usdt_equiv / total_trade_volume_usdt / ... / rebate_credit_hint
 */
export interface RevenueDailySummary {
  totalRebateUsdtEquiv: number
  totalTradeVolumeUsdt: number
  perpetualContractVolumeUsdt: number
  eventContractVolumeUsdt: number
  rebateCreditHint: string
}

/**
 * GET /agent/revenue/history 的行（文档 §5.2）。
 * Q2：commission 按 USDT + USDC 两个独立字段存；UI 行内双行显示非零币种。
 */
export interface CommissionRecord {
  id: string
  time: string
  sourceType: SourceType
  sourceUid: string | null
  productLine: 'perpetual' | 'event'
  settlementType: 'flat_fee' | 'profit_share' | null
  tradeVolumeUsdt: number
  commissionUsdt: number
  commissionUsdc: number
  payoutStatus: PayoutStatus
}

/* ========== 交易中心 ========== */

/**
 * GET /agent/positions 的行（文档 §3.1）。
 * Q3：新增 vipTier 字段（后端可能为空），UI 显示在 UID 下方小字。
 */
export interface PerpPosition {
  uid: string
  vipTier?: string
  remark: string
  pair: string
  side: PositionSide
  quantity: number
  avgPrice: number
  markPrice: number
  unrealizedPnl: number
  leverage: number
}

export interface PositionsSummary {
  positionCount: number
  positionMarketValueUsdt: number
  unrealizedPnlUsdt: number
}

/** GET /agent/trade-history 的行（文档 §3.2） */
export interface PerpOrder {
  uid: string
  remark: string
  pair: string
  subType: OrderSubType
  side: OrderSide
  price: number
  quantity: number
  fee: number
  time: string
}

export interface TradeHistorySummary {
  orderCount: number
  tradeVolumeUsdt: number
  feeUsdt: number
}

/** GET /agent/event-history 的行（文档 §3.3） */
export interface EventOrder {
  uid: string
  remark: string
  eventName: string
  direction: string
  amount: number
  result: EventResult
  pnl: number
  time: string
}

export interface EventHistorySummary {
  orderCount: number
  betAmountUsdt: number
  pnlUsdt: number
}

/* ========== 推广 ========== */

/**
 * GET /agent/invite-codes 的行（文档 §2.3）。
 * Q4：后端行不包含 tradeVolume / commission / tradeDau，暂标 optional，
 * mapper 返回 undefined，筛选结果统计条缺值显示 "—"；待后端补齐。
 *
 * my_* 比例文档也未给，从 /agent/profile 读全局值，无需每行存。
 */
export interface InviteCode {
  code: string
  status: PromoCodeStatus
  subFlatFeeRate: number
  subProfitShareRate: number
  subEventRate: number
  registrations: number
  firstDepositCount: number
  firstTradeCount: number
  linkUrl: string
  createdAt: string
  remark: string

  /** 待后端补齐（Q4） */
  tradeDau?: number
  tradeVolume?: number
  commission?: number
}

/** GET /agent/invite-stats 的 data（文档 §2.2） */
export interface InviteStats {
  registrations: number
  depositUsdt: number
  tradeVolume: number
  commission: number
  dau: number
}

/* ========== 链上充提 ========== */

/** GET /agent/transfers 的行（文档 §4.1） */
export interface TransferRecord {
  uid: string
  userLevel: IdentityType
  subAgentUid: string | null
  channel: string
  type: TransferType
  subType: TransferSubType
  amountUsdt: number
  status: TransferStatus
  time: string
}

export interface TransfersSummaryBucket {
  depositCount: number
  depositAmountUsdt: number
  withdrawCount: number
  withdrawAmountUsdt: number
}

/** Summary 分 total（全量）/ filtered（当前筛选）两份（文档 §4.1） */
export interface TransfersSummary {
  total: TransfersSummaryBucket
  filtered: TransfersSummaryBucket
}

/* ========== 结算配置 ========== */

/** GET /agent/settlement-config（文档 §5.3） */
export interface SettlementConfig {
  method: string
  frequency: string
  coin: string
}
