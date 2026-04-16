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

export interface DashboardKPI {
  label: string
  value: number
  unit: string
  changePercent: number
}

export interface InviteCodeSummary {
  code: string
  registrations: number
  flatFeeRate: number
  profitShareRate: number
  eventRate: number
}

export interface Invitee {
  uid: string
  identityType: IdentityType
  depositStatus: DepositStatus
  tradeStatus: TradeStatus
  registeredAt: string
  remark: string
  isSelf?: boolean
  selfRebateAmount?: number
  flatFeeCommission: number
  profitShareCommission: number
  eventCommission: number
}

export interface SubAgent {
  uid: string
  nickname: string
  flatFeeRate: number
  profitShareRate: number
  eventRate: number
  registeredAt: string
  totalDirectCommission: number
}

export interface DailyRevenue {
  date: string
  commission: number
  tradeVolume: number
  perpCommission: number
  flatFeeCommission: number
  profitShareCommission: number
  eventCommission: number
  payoutStatus: PayoutStatus
}

export interface CommissionRecord {
  id: string
  time: string
  sourceType: SourceType
  sourceUid: string | null
  productLine: 'perpetual' | 'event'
  settlementType: 'flat_fee' | 'profit_share' | null
  tradeVolume: number | null
  commissionAmount: number
  settlementCoin: string
  payoutStatus: PayoutStatus
}

export interface PerpPosition {
  uid: string
  remark: string
  pair: string
  side: PositionSide
  quantity: number
  avgPrice: number
  markPrice: number
  unrealizedPnl: number
  leverage: number
}

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

export interface InviteCode {
  code: string
  myFlatFeeRate: number
  subFlatFeeRate: number
  myProfitShareRate: number
  subProfitShareRate: number
  myEventRate: number
  subEventRate: number
  registrations: number
  firstDepositCount: number
  firstTradeCount: number
  tradeDau: number
  tradeVolume: number
  commission: number
  linkUrl: string
  createdAt: string
  remark: string
}

export interface TransferRecord {
  uid: string
  userLevel: IdentityType
  subAgentUid: string | null
  channel: string
  type: TransferType
  subType: TransferSubType
  amount: number
  status: TransferStatus
  time: string
}

export interface SettlementConfig {
  method: string
  frequency: string
  coin: string
}

export interface InviteStats {
  registrations: number
  depositAmount: number
  tradeVolume: number
  commission: number
  tradeDau: number
}
