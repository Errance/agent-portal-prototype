# Agent Portal 后端对接需求清单

> **文档性质**：代理后台要什么 → 在主站 `web/`（surf-one）前端代码里能不能找到对应字段。
> - 能找到 → **§1 可复用字段**：列出主站来源、用在哪、怎么用
> - 找不到 → **§2 需新增字段**：列出用在哪、怎么用 / 计算规则
> - 最后汇总需要后端新开的 REST 接口（§3）和需要二次确认的开放问题（§4）
>
> **参考真源**：
> - 主站接口：[web/src/api/](../../web/src/api/)
> - 主站页面消费逻辑：[web/src/pages/Referrals/](../../web/src/pages/Referrals/)、[web/src/pages/RebateDashboard/](../../web/src/pages/RebateDashboard/)
> - 响应协议：`ApiResponse<T> = { errno, msg, data }`
> - 代理后台字段定义：[src/mock/types.ts](../src/mock/types.ts)
>
> **⚠️ 标记**：表示基于代码推断的映射，需与后端二次核对语义。

---

## 0. 对接约定

### 0.1 单位 / 时区 / 精度

| 项 | 约定 |
| --- | --- |
| 比例字段 | 主站返回小数（`0.015`），前端 ×100 展示为 `1.50%`；FF 保留 2 位、PS 保留 4 位、Event 保留 2 位 |
| 金额 | JSON `number`。若后端因精度必须用 `string`，前端入口统一 `parseFloat` |
| 时间 | `YYYY-MM-DD HH:mm:ss`；日明细用 `YYYY-MM-DD`；时区统一 **UTC+8**，不做转换 |
| 可空 | 用 `null`，不要用空字符串或 `0` 代替"无值" |

### 0.2 双币种平级

代理后台所有返佣字段要求 **USDT / USDC 独立分列**（同字号同颜色堆叠展示，不合并、不换算）。主站只给合计，所以几乎所有 `*Usdt` / `*Usdc` 字段都是 **新增**。

### 0.3 代理视角 vs 自我视角

主站 `/account/*` 全部是**登录用户本人**视角。代理后台要看**伞下用户**（被我邀请的人、子代理、他们的交易/充提），主站 REST 没有任何接口支持"代理看别人"。

主站 `RebateDashboard` 页面通过 `POST /metabase/query` 获取了大量代理维度数据（三级邀请人、按产品线/币种的汇总、按日期过滤），说明**后端数据已有**，只是没产品化成 REST。后端新增接口时可参考其 SQL 逻辑。

### 0.4 下级比例约束

推广码 / 子代理的 `subXxxRate` 必须**严格小于**代理商自身 `currentXxxRate`，由后端在写接口里校验。

### 0.5 权限 / 状态二次校验（审计 C4）

前端的"是否代理商 / 是否被冻结"只做**UX 层面**的导航与按钮禁用，不作为安全边界。代理后台所有接口（读 + 写）都要求后端在每次请求里校验：

1. **身份校验**：调用方必须是代理商（`is_agent === true` 或等价标记）
2. **状态校验**：代理商非冻结（`status === 'normal'`），冻结期间所有读写接口应返回相应 errno
3. **伞下范围校验**：写操作（修改子代理比例、创建 / 撤销推广码等）只允许修改**自己伞下**的资源
4. **推广码所有权**：`/invite/codes/*` 的写操作必须校验 `code` 属于当前代理
5. **错误码约定**：鉴权失败统一返回 HTTP 401（前端会触发登出流程）；权限不足但已登录返回 HTTP 200 + 非零 errno + 友好 msg

前端 `AppLayout` 对未代理用户的 `<Navigate to="/not-agent" />` 以及写按钮的 `disabled`（冻结时）都是 UX 防呆，不构成访问控制。

---

## 1. 可复用字段（来自 web/ 主站代码）

### 1.1 代理身份 AgentConfig

| 代理字段 | 主站来源 | 用在哪里 | 怎么用 |
| --- | --- | --- | --- |
| `agentName` | `GET /account/info` → `user_name` | 首页"您好，{agentName}" | 直接展示 |
| `currentFlatFeeRate`（%） | `GET /account/mrebate/info` → `rebate_rate_flat` | 推广管理顶部 KPI；新建/编辑推广码、修改子代理比例时的**上限校验** | 主站小数 ×100，保留 2 位小数 |
| `currentProfitShareRate`（%） | `GET /account/mrebate/info` → `rebate_rate_share` | 同上（PS 档） | 主站小数 ×100，保留 4 位小数 |
| `agentLevel`（1-5） ⚠️ | `GET /account/info.rebate_agent_level` 或 `/mrebate/info.rebate_agent_level` | 首页欢迎语后的等级徽章 | 主站 `RebateRole` 是 `0/1/2/3` **四档**，代理后台设计 **五档**（青铜/白银/黄金/钻石/星耀），档数不一致——建议后端直接下发 1-5 |

### 1.2 推广码基础信息（单码场景）

主站每个代理只绑一个 `referral_code`，以下字段在单码场景下可复用；多码列表 / CRUD / 按码统计全部在 §2.3。

| 代理字段 | 主站来源 | 用在哪里 | 怎么用 |
| --- | --- | --- | --- |
| `InviteCode.code` | `GET /account/info` → `referral_code` | 单码场景：作为唯一推广码展示 | 直接展示 |
| `InviteCode.myFlatFeeRate` | `GET /account/mrebate/info` → `rebate_rate_flat` | 推广管理每行的"我的 FF 比例" | 小数 ×100，保留 2 位 |
| `InviteCode.myProfitShareRate` | `GET /account/mrebate/info` → `rebate_rate_share` | 同上（PS 档） | 小数 ×100，保留 4 位 |

### 1.3 推广汇总 InviteStats

| 代理字段 | 主站来源 | 用在哪里 | 怎么用 |
| --- | --- | --- | --- |
| `registrations` | `GET /account/mrebate/info` → `traders_referred` | 推广管理顶部"全局注册数" | 直接用 |
| `depositAmount` | `GET /account/mrebate/info` → `total_deposit` | 顶部"全局充值额"（USDT） | string → number |
| `tradeVolume` | `GET /account/mrebate/info` → `total_volume` | 顶部"全局交易额" | string → number |
| `commission` | `GET /account/mrebate/info` → `total_rebate` | 顶部"全局佣金" | string → number |

### 1.4 直接邀请人 Invitee（基础字段）

主站接口：`GET /account/mrebate/invitees?page_num=&page_size=`（[web/src/api/useReferrals.ts](../../web/src/api/useReferrals.ts)）。

| 代理字段 | 主站来源 | 用在哪里 | 怎么用 |
| --- | --- | --- | --- |
| `uid` | `account_id` | 好友中心表格"用户 (UID)"列 | 直接展示；**建议脱敏**（前 4 后 4） |
| `registeredAt` ⚠️ | `invitation_time` | "注册时间"（小字） | 格式统一为 `YYYY-MM-DD HH:mm:ss`，主站实际格式代码未明确，需后端确认 |
| `depositStatus` | 推导自 `personal_deposit` 或 `personal_data.total_deposit` | "已充值/未充值"徽章 | `> 0` → `deposited`，否则 `not_deposited`（阈值产品确认） |
| `tradeStatus` | 推导自 `personal_data.total_volume` | "已交易/未交易"徽章 | `> 0` → `traded`，否则 `not_traded` |

### 1.5 返佣流水 CommissionRecord（基础字段）

主站接口：`GET /account/mrebate/history?page_num=&page_size=`（[web/src/api/useReferrals.ts](../../web/src/api/useReferrals.ts)）。

| 代理字段 | 主站来源 | 用在哪里 | 怎么用 |
| --- | --- | --- | --- |
| `id` | `id` | 唯一 key | 直接用 |
| `time` | `created_at` | 收益中心"时间"列 | 直接展示 |
| `sourceUid` | `account_id` | "来源用户"列 | 当 `sourceType=platform_reward` 时后端传 `null` |
| `commissionAmount` | `rebate` | "返佣金额"列 | string → number |
| `settlementType` | `fee_mode` | "结算方式"列 | `FLAT=1 → flat_fee` / `PNL=2 → profit_share`；`productLine=event` 时必须为 `null` |
| `tradeVolume` ⚠️ | `trade_size` | "交易额"列 | `trade_size` 字面"数量"，代理后台需 USDT 等值金额；若单位不一致建议后端在代理接口下发 `trade_volume_usdt` |
| `settlementCoin` ⚠️ | `coin_code` 或 `coin_name` | 与 `commissionAmount` 并排展示 | 代理后台只需 USDT/USDC；主站可能返回其它币种，需后端保证枚举范围 |
| `productLine` ⚠️ | `rebate_type`（string） | "产品线"列 + 筛选 | 主站类型为 string 但未导出枚举；Metabase 已分 `CARD_PERP_RECORDS` / `CARD_EVENTS_RECORDS`，建议后端固定字符串 `"perpetual"` / `"event"` |

### 1.6 永续持仓 PerpPosition（基础字段）

主站接口（本人视角）：`GET /account/position/list?status=Holding`（[web/src/api/useGetPositions.ts](../../web/src/api/useGetPositions.ts)）。代理后台需要**伞下视角**的同结构，见 §2.8。

| 代理字段 | 主站来源 | 用在哪里 | 怎么用 |
| --- | --- | --- | --- |
| `pair` | `symbol` | 交易中心持仓表"交易对" | 直接展示 |
| `side` | `side: OrderSide` | "方向/杠杆"列 | `LONG=1 → long` / `SHORT=2 → short` |
| `quantity` | `hold_size` | "持仓数量" | string → number |
| `avgPrice` | `hold_av` | "开仓均价" | string → number |
| `leverage` | `leverage` | "方向/杠杆"列尾 | string → number |

### 1.7 永续历史订单 PerpOrder（基础字段）

主站接口（本人视角）：`GET /account/trade/list`（[web/src/api/useGetTradeHistory.ts](../../web/src/api/useGetTradeHistory.ts)）。代理后台需伞下视角，见 §2.8。

| 代理字段 | 主站来源 | 用在哪里 | 怎么用 |
| --- | --- | --- | --- |
| `time` | `created_at` | "成交时间"列 | 直接展示 |
| `pair` | `symbol` | "交易对"列 | 直接展示 |
| `price` ⚠️ | `done_price`（推荐） | "成交价格"列 | 主站根据 `view_type` 会切换到 `order_price`/`entry_price`/`exit_price`，代理接口建议统一下发成交价 |
| `quantity` | `done_size` | "成交数量"列 | string → number |
| `fee` | `done_fee` | "手续费"列 | string → number |
| `side`（buy/sell）⚠️ | `side: number` + `order_way` | "方向/类型"列 | 主站 `side` 类型为 `number` 但未导出枚举；目前按 `OrderWay` 推导：`OPEN_LONG=1 / CLOSE_SHORT=2 → buy`；`OPEN_SHORT=3 / CLOSE_LONG=4 → sell`，需后端确认 |
| `subType`（open/close/liquidation） | `order_way` + `order_mode` | "方向/类型"列 | `OrderWay ∈ {1,3} → open`；`{2,4}` 且 `order_mode=Normal → close`；`order_mode ∈ {Liquidate, Bankrupt, ADL, DownShift, Self} → liquidation` |

### 1.8 链上充提 TransferRecord（基础字段）

主站接口：
- `GET /account/assets/records?action=7|8`（链上充提，[web/src/api/useGetUserAssetsRecord.ts](../../web/src/api/useGetUserAssetsRecord.ts)）
- `GET /account/assets/records/by/actions?actions=[26,27]`（站内划转，[web/src/api/useGetInternalTransferHistory.ts](../../web/src/api/useGetInternalTransferHistory.ts)）

代理后台建议后端**合并**为 §3 的 `GET /agent/transfers`，避免前端做双请求合并。

| 代理字段 | 主站来源 | 用在哪里 | 怎么用 |
| --- | --- | --- | --- |
| `amount` | `amount` | 链上充提表"数量"列 | A 接口是 number，B 接口是 string；统一 → number |
| `time` | `created_at` | "时间"列 | 直接展示 |
| `type`（deposit/withdrawal） | A 接口 `action` | "充提类型"列 | `7 → deposit` / `8 → withdrawal`；B 接口无此维度（见 §2.9 备注） |
| `subType`（normal/internal_transfer） | 接口本身 | "充提类型"列上的小徽章 | A 接口 → `normal`；B 接口 → `internal_transfer` |
| `status`（processing/success/failed） | `status` | "状态"列 | `Pending=1 → processing` / `Completed=2 → success` / `Failed=3 / Rejected=4 → failed`（A/B 两接口枚举一致） |
| `channel` ⚠️ | A 接口 `chain_id` | "渠道"列 | 需后端提供 `chain_id ↔ 链名` 字典（ERC-20 / TRC-20 / SOL / BSC / Arbitrum 的具体 ID）；B 接口无 `chain_id` |

### 1.9 写接口复用

| 用途 | 主站接口 | 用在哪里 | 备注 |
| --- | --- | --- | --- |
| 修改下级返佣比例 | `POST /account/mrebate/set`，body `{ invitee_id, rebate_rate }` | 好友中心"修改比例"弹窗；推广管理"编辑推广码"弹窗 | 代理后台要同时改 FF/PS/Event 三个比例，现有接口只有一个 `rebate_rate`，可能需要后端扩展为 `{ invitee_id, flat_fee_rate, profit_share_rate, event_rate }` |

---

## 2. 需新增字段（web/ 里找不到）

### 2.1 代理身份 AgentConfig 新增

| 代理字段 | 用在哪里 | 怎么用 | 备注 |
| --- | --- | --- | --- |
| `status`（`normal`/`frozen`/`not_agent`） | AppLayout 顶部冻结 banner；所有写操作按钮 disabled | `frozen` 时"新建/编辑/作废/修改比例"按钮灰化并禁止点击；`not_agent` 时路由跳 `/not-agent` | 主站 `is_rebate_login` 语义不等价，无法复用 |
| `selfRebateEnabled`（bool） | 好友中心"我自己"一行的自返佣显示 | `true` 时在 SELF 行展示 `selfRebateAmount USDT` | — |
| `tradeVisibility`（`full`/`summary`/`hidden`） | 交易中心整页 | `hidden` 时隐藏"交易中心"tab；`summary` 时只显示聚合数据，不显示明细表 | — |
| `currentEventRate`（%） | 推广管理顶部 KPI；新建/编辑推广码时 `subEventRate` 的上限校验 | 与 FF/PS 同列展示 | 主站 REST 未下发事件比例，但 `RebateDashboard/components/AccountInfo.tsx` 有 `rebate_rate_predict_chn` 文案，说明业务后端已有该比例概念 |
| `isNewAgent`（bool） | 首页"开启推广之旅"引导卡 | `true` 时渲染引导卡；点"我知道了" PUT 置为 false | 主站 `new_user_guide` 语义不一定对齐，建议新增独立字段 |

### 2.2 Dashboard 今日 KPI（整块新增）

主站 `/account/mrebate/info` 只返回**累计值**，没有"今日"维度；`public/daily/stats` 是**全站**维度，不是代理个人。整块需新增 `GET /agent/dashboard/kpi?date=YYYY-MM-DD`。

| 字段 | 用在哪里 | 怎么用 | 备注 |
| --- | --- | --- | --- |
| `registrationsToday`（人） | KPI 卡"今日注册数" | 作为 `StatCard.value` | 带 `changePercent` |
| `netDepositTodayUsdt`（USDT） | "今日净充值" | 净 = 充值 - 提现 | 带 `changePercent` |
| `flatFeeCommTodayUsdt`（USDT） | "今日 Flat Fee" | 当日 FF 返佣 | 带 `changePercent` |
| `psTradeVolTodayUsdt`（USDT） | "今日 PS 有效交易量" | 当日 PS 有效交易量 | 带 `changePercent` |
| `eventTradeVolTodayUsdt`（USDT） | "今日事件合约交易量" | 当日事件交易量 | 带 `changePercent` |
| `directCommTodayUsdt`（USDT） | "今日佣金（直推）" | 一级返佣 | 带 `changePercent` |
| `platformRewardTodayUsdt`（USDT） | "今日平台奖励" | 伞下间接返佣 | 带 `changePercent` |
| `changePercent`（各卡片） | KPI 卡下方"较昨日"小字 | 带符号：`12.5` 表示 +12.5%，`-8.3` 表示 -8.3% | 所有 7 个卡片都需要 |

### 2.3 推广码多码 CRUD

主站单码 `referral_code`。代理后台要求多码，每码独立比例、独立统计、独立漏斗。全部新增：

| 字段 | 用在哪里 | 怎么用 | 备注 |
| --- | --- | --- | --- |
| `InviteCode.status`（`active`/`revoked`） | 推广管理列表"状态"列；作废按钮控制 | `revoked` 隐藏"编辑/作废"按钮 | — |
| `InviteCode.subFlatFeeRate` | "FF 下级比例"列；创建/编辑表单字段 | 必须 `< myFlatFeeRate` | — |
| `InviteCode.subProfitShareRate` | "PS 下级比例"列；同上 | 必须 `< myProfitShareRate` | — |
| `InviteCode.myEventRate` / `subEventRate` | "事件下级比例"列；同上 | 依赖 `currentEventRate`（§2.1）存在 | — |
| `InviteCode.registrations`（按码） | "注册"列 | 按推广码分组的注册数 | 主站只有总 `traders_referred` |
| `InviteCode.firstDepositCount` | "充值"列 | 通过该码注册且首次充值的人数 | — |
| `InviteCode.firstTradeCount` | "交易"列 | 通过该码注册且首次交易的人数 | — |
| `InviteCode.tradeDau` | 推广汇总 DAU | 活跃交易用户数 | 粒度待产品定义 |
| `InviteCode.tradeVolume` | 按码交易额（筛选后汇总用） | number | — |
| `InviteCode.commission` | 按码佣金（筛选后汇总用） | number | — |
| `InviteCode.linkUrl` | "复制链接"按钮 | 前端剪贴板写入；**必须做 URL 白名单校验**（`https://app.turboflow.io/r/...`） | 防止后端字段被注入 `javascript:` 类恶意 URL |
| `InviteCode.createdAt` | 列表详情 | 创建时间 | — |
| `InviteCode.remark` | "备注"列；新建/编辑时可填 | 代理自己的标注 | — |
| `InviteStats.tradeDau` | 顶部全局汇总"DAU" | number | 主站无 |

### 2.4 直接邀请人 Invitee 新增

| 字段 | 用在哪里 | 怎么用 | 备注 |
| --- | --- | --- | --- |
| `identityType`（`regular`/`sub_agent`） | 用户列的身份说明小字 | 区分普通用户 vs 子代理；`sub_agent` 身份筛选依赖此字段 | — |
| `remark` | "备注"列；编辑弹窗 | 代理对该用户的可编辑备注 | — |
| `isSelf`（bool） | SELF 一行特殊展示 | `true` 时 UID 显示为"我自己"，跳过返佣列 | — |
| `selfRebateAmount` | SELF 行自返佣展示 | 仅 `isSelf=true` 时有值，单位 USDT | — |
| `flatFeeCommUsdt` / `flatFeeCommUsdc` | "FF 返佣"列（双币种堆叠） | 两币种平级，不换算 | 主站 `personal_data.total_rebate_flat` 为**合计**，无币种拆分 |
| `profitShareCommUsdt` / `profitShareCommUsdc` | "PS 返佣"列（双币种堆叠） | 同上 | 主站 `total_rebate_share` 同样是合计 |
| `eventCommission` | "事件返佣"列 | USDT 等值 | 主站 REST 无事件线 |

### 2.5 子代理 SubAgent（整块新增）

主站 `/account/mrebate/invitees` 里的 `tier2_*` 是"每个一级邀请人对应的二级团队聚合"，不是"子代理列表"。Metabase 侧 `CARD_L1_DETAILS / L2_DETAILS / L3_DETAILS` 能给到分层明细，但是 Metabase 通路不是 REST。整块需新开 `GET /agent/sub-agents`。

| 字段 | 用在哪里 | 怎么用 | 备注 |
| --- | --- | --- | --- |
| `uid` | 子代理表"子代理"列 | 直接展示 | — |
| `nickname` | 子代理列小字 | 直接展示 | — |
| `flatFeeRate` / `profitShareRate` / `eventRate` | "FF/PS/Event 比例"三列 | 各档百分比；修改时走 `POST /account/mrebate/set` 或其扩展版 | — |
| `registeredAt` | 列小字 | 成为子代理的时间 | — |
| `directCommUsdt` / `directCommUsdc` | "子代理返佣"列（双币种堆叠） | 双币种平级 | — |
| `platformRewardUsdt` / `platformRewardUsdc` | "平台奖励"列（双币种堆叠） | 双币种平级 | — |

### 2.6 日收益明细 DailyRevenue（整块新增）

主站 REST 没有"按日 × 按代理"维度（`public/daily/stats` 是全站维度）。Metabase 卡片按日可聚合，但只给 scalar 不给明细行。整块新增 `GET /agent/revenue/daily?from=&to=`。

| 字段 | 用在哪里 | 怎么用 | 备注 |
| --- | --- | --- | --- |
| `date` | 收益中心日明细表"日期"列 | `YYYY-MM-DD` | — |
| `flatFeeCommUsdt` / `flatFeeCommUsdc` | "FF 返佣"列（双币种） | 双币种平级 | — |
| `profitShareCommUsdt` / `profitShareCommUsdc` | "PS 返佣"列（双币种） | 双币种平级 | — |
| `eventCommission` | "事件返佣"列 | USDT 等值 | — |
| `ffTradeVolUsdt` / `ffTradeVolUsdc` | "FF 交易量"列（双币种，需展开） | 双币种平级 | — |
| `psTradeVolUsdt` / `psTradeVolUsdc` | "PS 交易量"列（双币种，需展开） | 双币种平级 | — |
| `eventTradeVolume` | "事件交易量"列（需展开） | USDT 等值 | — |
| `flatFeeFeeUsdt` / `flatFeeFeeUsdc` | "FF 手续费"列（双币种，需展开） | 透明度展示，不是代理自赚 | — |
| `payoutStatus`（`paid`/`frozen_pending`） | "状态"列 StatusBadge | 冻结态的日收益仍算但不发放 | — |

### 2.7 返佣流水 CommissionRecord 新增

在 §1.5 基础字段之外，还需：

| 字段 | 用在哪里 | 怎么用 | 备注 |
| --- | --- | --- | --- |
| `sourceType`（`direct`/`platform_reward`） | "来源类型"列 | `direct` 显示"直推返佣"，`platform_reward` 显示"平台奖励"；后者 `sourceUid=null` | 主站 `/mrebate/history` 不区分一级直推 vs 伞下间接 |
| `payoutStatus`（`paid`/`frozen_pending`） | "状态"列 StatusBadge | 与 `AgentConfig.status=frozen` 联动 | 主站无 |

### 2.8 交易中心（伞下视角 + 事件合约）

#### 2.8.1 伞下视角字段（PerpPosition / PerpOrder）

主站 `position/list` 和 `trade/list` 是本人视角，代理要看伞下。建议新开 `GET /agent/users/{uid}/positions` + `/trade-history`，或在现有接口加 `target_account_id` 参数。

| 字段 | 用在哪里 | 怎么用 | 备注 |
| --- | --- | --- | --- |
| `PerpPosition.uid` / `PerpOrder.uid` | 持仓表 / 历史表"用户 (UID)"列 | 伞下用户 UID；**建议脱敏** | — |
| `PerpPosition.markPrice` | "标记价格"列 | 直接展示 | **接口未返回**。主站前端 (`Trade/components/PNL.tsx`) 通过 WS `ticker.p1` 实时算；代理后台是表格，不宜每行接 WS。**建议后端在代理接口里直接下发** |
| `PerpPosition.unrealizedPnl` | "未实现盈亏"列 | 红/绿展示 | 同上。主站靠 `(markPrice - hold_av) * hold_size * side` 自算；建议后端下发计算好的值 |
| `PerpPosition.remark` / `PerpOrder.remark` | 用户列小字 | 代理对用户的可编辑备注 | — |

#### 2.8.2 事件合约 EventOrder（整块新增）

主站 `web/src/api/` 下**完全没有**事件合约 REST 接口。Metabase `CARD_EVENTS_RECORDS`（`dashcardId: 6433`）说明业务后端已有数据。整块新增 `GET /agent/event-history?uid=`。

| 字段 | 用在哪里 | 怎么用 | 备注 |
| --- | --- | --- | --- |
| `uid` | "用户 (UID)"列 | 伞下用户 UID | — |
| `time` | "投注时间"列 | `YYYY-MM-DD HH:mm:ss` | — |
| `eventName` | "事件标的"列 | 直接展示，如"BTC 价格预测" | — |
| `direction` | "投注方向"列 | 直接字符串 `"看涨"` / `"看跌"` | — |
| `amount` | "投注金额"列 | USDT 等值 | — |
| `result`（`win`/`lose`/`pending`） | "结算结果"列 StatusBadge | `pending` 时 `pnl` 显示 `—` | — |
| `pnl` | "盈亏"列 | `result=pending` 时应为 `0`；其他情况红/绿 | — |
| `remark` | 用户列小字 | 代理对用户的可编辑备注 | — |

### 2.9 链上充提 TransferRecord 新增

在 §1.8 基础字段之外，还需：

| 字段 | 用在哪里 | 怎么用 | 备注 |
| --- | --- | --- | --- |
| `uid` | "用户 (UID)"列 | 伞下用户 UID；**建议脱敏** | 主站两个接口**都没有**"这笔是谁的"字段：A 接口没有 `account_id`，B 接口的 `account_id` 是**对手方**。代理维度必须由后端补齐本人 UID |
| `userLevel`（`regular`/`sub_agent`） | UID 列小字 | 区分普通用户 vs 子代理 | — |
| `subAgentUid` | "归属子代理"列 | 该用户挂在哪个子代理名下 | — |

> **对站内划转的 `type` 字段**：B 接口本身不分充提（只有 SEND=26 / RECEIVE=27 两个动作）。代理后台 `TransferRecord.type` 应如何折算，需产品确认（候选方案：`SEND → withdrawal` / `RECEIVE → deposit`）。

### 2.10 结算方式配置 SettlementConfig

主站无此配置展示接口。内容少，可放在 `AgentConfig` 里一次返回，也可独立。

| 字段 | 用在哪里 | 怎么用 | 备注 |
| --- | --- | --- | --- |
| `method` | 收益中心"结算方式配置" tab | 直接字符串"实时结算"等 | — |
| `frequency` | 同上 | 直接字符串 | — |
| `coin` | 同上 | 默认结算币种 | — |

---

## 3. 需新增 REST 接口清单

| Method + Path | 用途 | 对应字段章节 | 优先级 |
| --- | --- | --- | --- |
| `GET /account/info` 扩展 | 补 `status` / `selfRebateEnabled` / `tradeVisibility` / `currentEventRate` / `isNewAgent`，或新开 `GET /agent/profile` | §2.1 | **P0** |
| `GET /agent/dashboard/kpi?date=` | 首页今日 KPI 7 项 + changePercent | §2.2 | **P0** |
| `GET /agent/invite-codes?page_num=&page_size=&status=` | 多推广码列表 | §2.3 | **P0** |
| `POST /agent/invite-codes` | 新建推广码 | §2.3 | **P0** |
| `PUT /agent/invite-codes/{code}` | 修改推广码比例/备注 | §2.3 | **P0** |
| `POST /agent/invite-codes/{code}/revoke` | 作废推广码 | §2.3 | **P0** |
| `GET /agent/invite-codes/summary` | 首页缩表（`InviteCodeSummary`） | §2.3 | **P0** |
| `GET /agent/invite-stats` | 推广管理全局汇总 | §1.3 + §2.3.`tradeDau` | **P0** |
| `GET /agent/invitees` | 代理维度直接邀请人列表（含双币种拆分、identityType、remark、isSelf） | §1.4 + §2.4 | **P0** |
| `PUT /agent/invitees/{uid}/remark` | 保存邀请人备注 | §2.4 | P1 |
| `GET /agent/sub-agents` | 子代理列表 | §2.5 | **P0** |
| `POST /account/mrebate/set` 扩展 | 从单 `rebate_rate` 扩到 `{flat_fee_rate, profit_share_rate, event_rate}` | §1.9 | P1 |
| `GET /agent/revenue/daily?from=&to=` | 日收益明细 | §2.6 | P1 |
| `GET /agent/revenue/history?...` | 返佣流水（代理维度，含 sourceType/payoutStatus/productLine=event） | §1.5 + §2.7 | **P0** |
| `GET /agent/users/{uid}/positions` | 伞下用户永续持仓（含 markPrice/unrealizedPnl） | §1.6 + §2.8.1 | **P0** |
| `GET /agent/users/{uid}/trade-history` | 伞下用户永续历史 | §1.7 + §2.8.1 | **P0** |
| `GET /agent/users/{uid}/event-history` 或 `GET /agent/event-history` | 伞下用户事件合约历史 | §2.8.2 | **P0** |
| `GET /agent/transfers?uid=&type=&sub_type=&user_level=&from=&to=` | 合并充提（含 userLevel/subAgentUid） | §1.8 + §2.9 | **P0** |

**分页协议**：沿用主站 `BaseListParams = { page_num, page_size }` 入参和 `List<T> = { count, page_count, page_num, page_size, data[] }` 响应。
**错误结构**：沿用 `ApiResponse<T> = { errno, msg, data }`。
**鉴权**：沿用主站 token Header。

---

## 4. 需与后端二次确认的开放问题

1. **`agentLevel` 1-5 vs `RebateRole` 0-3 映射**——档数不对齐，建议后端直接下发代理后台语义的 1-5（§1.1）
2. **`fee_mode` 1/2 是否严格等价于 `flat_fee`/`profit_share`**（§1.5，仅代码推断）
3. **`TradeHistoryType.side: number` 取值范围**——主站未导出 enum，目前按 `OrderWay` 推导 buy/sell（§1.7）
4. **`chain_id → 链名` 字典**（ERC-20 / TRC-20 / SOL / BSC / Arbitrum 的具体 ID，§1.8）
5. **`coin_code` 完整枚举**——代理后台只需 USDT/USDC，需后端保证不会返回其他币种（§1.5）
6. **`rebate_type` 字符串枚举值**——主站类型声明为 string 但未固定具体值，建议后端固定为 `"perpetual"`/`"event"`（§1.5）
7. **站内划转（B 接口）的 `type` 如何折算**——B 接口本身不分充提，需产品确认映射方案（§2.9）
8. **`invitation_time` 的具体格式**——代理后台期望 `YYYY-MM-DD HH:mm:ss`（§1.4）
9. **`depositStatus` / `tradeStatus` 的阈值规则**——是否 `> 0` 即算已充值/已交易，还是需要 min 阈值（§1.4）
10. **`POST /account/mrebate/set` 是否可扩展到三比例同改**，或者新开 `POST /agent/invitees/{uid}/rates`（§1.9）
