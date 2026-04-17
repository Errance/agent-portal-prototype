/**
 * 后端 snake_case + string 金额 → 前端 camelCase + number 的 mapper 集中层。
 *
 * 原则：
 * - 只映射后端文档里明确列出的字段；多余字段忽略
 * - 缺失字段用 safe default（金额 0、文本空串）
 * - 所有数值字段走 `toNumber` 防字符串拼接（审计 C2）
 * - 外层 `apiFetch<T>` 已解包 ApiResponse；列表类再从 RawPagedResponse.data 取 rows
 *
 * 每个 mapper 命名约定：`map{Name}Row`（列表单行）、`map{Name}Summary`（汇总）、`map{Name}`（单对象接口）。
 */

import { toNumber } from '@/utils/parse'
import type {
  AgentProfile,
  CommissionRecord,
  DailyRevenue,
  EventHistorySummary,
  EventOrder,
  InviteCode,
  InviteStats,
  PayoutStatus,
  PerpOrder,
  PerpPosition,
  PositionsSummary,
  PromoCodeStatus,
  RevenueDailySummary,
  SettlementConfig,
  TradeHistorySummary,
  TransferRecord,
  TransfersSummary,
  TransfersSummaryBucket,
} from '@/types/domain'

type RawAny = Record<string, unknown>

function str(v: unknown, fallback = ''): string {
  if (v === null || v === undefined) return fallback
  return typeof v === 'string' ? v : String(v)
}

/* ========== §2.1 /agent/profile ========== */

export function mapAgentProfile(r: RawAny): AgentProfile {
  return {
    currentFlatFeeRate: toNumber(r.current_flat_fee_rate),
    currentProfitShareRate: toNumber(r.current_profit_share_rate),
    currentEventRate: toNumber(r.current_event_rate),
  }
}

/* ========== §2.2 /agent/invite-stats ========== */

export function mapInviteStats(r: RawAny): InviteStats {
  return {
    registrations: toNumber(r.registrations),
    depositUsdt: toNumber(r.deposit_usdt),
    tradeVolume: toNumber(r.trade_volume),
    commission: toNumber(r.commission),
    dau: toNumber(r.dau),
  }
}

/* ========== §2.3 /agent/invite-codes ========== */

export function mapInviteCodeRow(r: RawAny): InviteCode {
  const status = r.status === 'revoked' ? 'revoked' : 'active'
  return {
    code: str(r.code),
    status: status as PromoCodeStatus,
    subFlatFeeRate: toNumber(r.sub_flat_fee_rate),
    subProfitShareRate: toNumber(r.sub_profit_share_rate),
    subEventRate: toNumber(r.sub_event_rate),
    registrations: toNumber(r.registrations),
    firstDepositCount: toNumber(r.first_deposit_count),
    firstTradeCount: toNumber(r.first_trade_count),
    linkUrl: str(r.link_url),
    createdAt: str(r.created_at),
    remark: str(r.remark),
    // Q4：待后端补齐
    tradeDau: r.trade_dau !== undefined ? toNumber(r.trade_dau) : undefined,
    tradeVolume: r.trade_volume !== undefined ? toNumber(r.trade_volume) : undefined,
    commission: r.commission !== undefined ? toNumber(r.commission) : undefined,
  }
}

/* ========== §3.1 /agent/positions ========== */

export function mapPerpPositionRow(r: RawAny): PerpPosition {
  const side = r.side === 'short' ? 'short' : 'long'
  return {
    uid: str(r.uid),
    vipTier: str(r.vip_tier) || undefined, // Q3：UI 在 UID 下方显示
    remark: str(r.remark),
    pair: str(r.pair),
    side,
    quantity: toNumber(r.quantity),
    avgPrice: toNumber(r.avg_price),
    markPrice: toNumber(r.mark_price),
    unrealizedPnl: toNumber(r.unrealized_pnl),
    leverage: toNumber(r.leverage),
  }
}

export function mapPositionsSummary(r: RawAny): PositionsSummary {
  return {
    positionCount: toNumber(r.position_count),
    positionMarketValueUsdt: toNumber(r.position_market_value_usdt),
    unrealizedPnlUsdt: toNumber(r.unrealized_pnl_usdt),
  }
}

/* ========== §3.2 /agent/trade-history ========== */

export function mapPerpOrderRow(r: RawAny): PerpOrder {
  const sub = r.sub_type
  const subType = sub === 'close' ? 'close' : sub === 'liquidation' ? 'liquidation' : 'open'
  const side = r.side === 'sell' ? 'sell' : 'buy'
  return {
    uid: str(r.uid),
    remark: str(r.remark),
    pair: str(r.pair),
    subType,
    side,
    price: toNumber(r.price),
    quantity: toNumber(r.quantity),
    fee: toNumber(r.fee),
    time: str(r.created_at),
  }
}

export function mapTradeHistorySummary(r: RawAny): TradeHistorySummary {
  return {
    orderCount: toNumber(r.order_count),
    tradeVolumeUsdt: toNumber(r.trade_volume_usdt),
    feeUsdt: toNumber(r.fee_usdt),
  }
}

/* ========== §3.3 /agent/event-history ========== */

export function mapEventOrderRow(r: RawAny): EventOrder {
  const result = r.result === 'win' ? 'win' : r.result === 'lose' ? 'lose' : 'pending'
  return {
    uid: str(r.uid),
    remark: str(r.remark),
    eventName: str(r.event_name),
    direction: str(r.direction),
    amount: toNumber(r.amount),
    result,
    pnl: toNumber(r.pnl),
    time: str(r.time),
  }
}

export function mapEventHistorySummary(r: RawAny): EventHistorySummary {
  return {
    orderCount: toNumber(r.order_count),
    betAmountUsdt: toNumber(r.bet_amount_usdt),
    pnlUsdt: toNumber(r.pnl_usdt),
  }
}

/* ========== §4.1 /agent/transfers ========== */

export function mapTransferRow(r: RawAny): TransferRecord {
  const type = r.type === 'withdrawal' ? 'withdrawal' : 'deposit'
  const subType = r.sub_type === 'internal_transfer' ? 'internal_transfer' : 'normal'
  const userLevel = r.user_level === 'sub_agent' ? 'sub_agent' : 'regular'
  const status =
    r.status === 'success' ? 'success' : r.status === 'failed' ? 'failed' : 'processing'
  return {
    uid: str(r.uid),
    userLevel,
    subAgentUid: r.sub_agent_uid ? str(r.sub_agent_uid) : null,
    channel: str(r.channel),
    type,
    subType,
    amountUsdt: toNumber(r.amount_usdt),
    status,
    time: str(r.created_at),
  }
}

function mapTransfersBucket(r: RawAny): TransfersSummaryBucket {
  return {
    depositCount: toNumber(r.deposit_count),
    depositAmountUsdt: toNumber(r.deposit_amount_usdt),
    withdrawCount: toNumber(r.withdraw_count),
    withdrawAmountUsdt: toNumber(r.withdraw_amount_usdt),
  }
}

export function mapTransfersSummary(r: RawAny): TransfersSummary {
  const total = r.total && typeof r.total === 'object' ? (r.total as RawAny) : {}
  const filtered = r.filtered && typeof r.filtered === 'object' ? (r.filtered as RawAny) : {}
  return {
    total: mapTransfersBucket(total),
    filtered: mapTransfersBucket(filtered),
  }
}

/* ========== §5.1 /agent/revenue/daily ========== */

export function mapDailyRevenueRow(r: RawAny): DailyRevenue {
  const payoutStatus = (r.payout_status === 'frozen_pending'
    ? 'frozen_pending'
    : 'paid') as PayoutStatus
  return {
    date: str(r.date),
    flatFeeCommUsdt: toNumber(r.flat_fee_comm_usdt),
    flatFeeCommUsdc: toNumber(r.flat_fee_comm_usdc),
    profitShareCommUsdt: toNumber(r.profit_share_comm_usdt),
    profitShareCommUsdc: toNumber(r.profit_share_comm_usdc),
    eventCommission: toNumber(r.event_commission),
    totalTradeVolumeUsdt: toNumber(r.total_trade_volume_usdt),
    flatFeeFeeTotalUsdt: toNumber(r.flat_fee_fee_total_usdt),
    payoutStatus,

    // Q1：待后端补齐；先做 optional，若 key 存在则取
    ffTradeVolUsdt: r.ff_trade_vol_usdt !== undefined ? toNumber(r.ff_trade_vol_usdt) : undefined,
    ffTradeVolUsdc: r.ff_trade_vol_usdc !== undefined ? toNumber(r.ff_trade_vol_usdc) : undefined,
    psTradeVolUsdt: r.ps_trade_vol_usdt !== undefined ? toNumber(r.ps_trade_vol_usdt) : undefined,
    psTradeVolUsdc: r.ps_trade_vol_usdc !== undefined ? toNumber(r.ps_trade_vol_usdc) : undefined,
    eventTradeVolume:
      r.event_trade_volume !== undefined ? toNumber(r.event_trade_volume) : undefined,
    flatFeeFeeUsdt: r.flat_fee_fee_usdt !== undefined ? toNumber(r.flat_fee_fee_usdt) : undefined,
    flatFeeFeeUsdc: r.flat_fee_fee_usdc !== undefined ? toNumber(r.flat_fee_fee_usdc) : undefined,
  }
}

export function mapRevenueDailySummary(r: RawAny): RevenueDailySummary {
  return {
    totalRebateUsdtEquiv: toNumber(r.total_rebate_usdt_equiv),
    totalTradeVolumeUsdt: toNumber(r.total_trade_volume_usdt),
    perpetualContractVolumeUsdt: toNumber(r.perpetual_contract_volume_usdt),
    eventContractVolumeUsdt: toNumber(r.event_contract_volume_usdt),
    rebateCreditHint: str(r.rebate_credit_hint),
  }
}

/* ========== §5.2 /agent/revenue/history ========== */

export function mapCommissionRecordRow(r: RawAny): CommissionRecord {
  const sourceType = r.source_type === 'platform_reward' ? 'platform_reward' : 'direct'
  const rawProduct = r.product_line
  const productLine = rawProduct === 'event' ? 'event' : 'perpetual'
  const rawSettle = r.settlement_type
  const settlementType: CommissionRecord['settlementType'] =
    rawSettle === 'flat_fee' ? 'flat_fee' : rawSettle === 'profit_share' ? 'profit_share' : null
  const payoutStatus: PayoutStatus = r.payout_status === 'frozen_pending' ? 'frozen_pending' : 'paid'
  return {
    id: str(r.id),
    time: str(r.time),
    sourceType,
    sourceUid: r.source_uid ? str(r.source_uid) : null,
    productLine,
    settlementType,
    tradeVolumeUsdt: toNumber(r.trade_volume_usdt),
    commissionUsdt: toNumber(r.commission_usdt),
    commissionUsdc: toNumber(r.commission_usdc),
    payoutStatus,
  }
}

/* ========== §5.3 /agent/settlement-config ========== */

export function mapSettlementConfig(r: RawAny): SettlementConfig {
  return {
    method: str(r.method),
    frequency: str(r.frequency),
    coin: str(r.coin),
  }
}
