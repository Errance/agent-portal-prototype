# Agent Portal 后端待补事项清单

> 本文档列出 agent-portal 前端对接 SIT 环境过程中，**后端仍需补齐或确认**的内容。可直接转发后端团队。
>
> 基础信息：
>
> - Base URL: `https://surfv2-sit-api.nfexinsider.com`
> - 响应外壳: `{ errno, msg, data }`，`errno` 为字符串
> - 分页字段: `count / page_count / page_num / page_size`，`page_size` 最大 200
> - 鉴权: `Authorization: Bearer <业务JWT>`、`biz-pf: 6`（SURFV2_DEX_TRADE）、`LANG: zh-cn`
> - Privy App ID: `cmbir1ip600bejx0mu6b42iek`（biz-pf=6 后端映射）
>
> 文档大纲：
>
> - [§1 对接进度总览](#1-对接进度总览)
> - [§2 登录协议（已实测）](#2-登录协议已实测)
> - [§3 完全待实现的接口](#3-完全待实现的接口)
> - [§4 已有接口的字段补齐](#4-已有接口的字段补齐)
> - [§5 写操作接口](#5-写操作接口)
> - [§6 非接口类问题](#6-非接口类问题)

---

## 1. 对接进度总览

### 1.1 已联通（SIT 前端在用）

| 接口 | 用途 | 状态 |
| --- | --- | --- |
| `POST /login` | 业务 JWT 换取 | ✅ 实测成功 |
| `GET /agent/profile` | 自身三档比例 | ✅ 已接，字段充足 |
| `GET /agent/invite-stats` | 推广管理顶部灰条统计 | ✅ 已接 |
| `GET /agent/invite-codes` | 推广码列表 | ✅ 已接，字段**缺 3 个**见 §4.3 |
| `GET /agent/positions` | 永续持仓 | ✅ 已接，字段**缺 `vip_tier`** 见 §4.2 |
| `GET /agent/trade-history` | 永续历史 | ✅ 已接 |
| `GET /agent/event-history` | 事件合约历史 | ✅ 已接 |
| `GET /agent/transfers` | 链上充提 | ✅ 已接 |
| `GET /agent/revenue/daily` | 收益中心日明细 | ✅ 已接，字段**缺分产品线/分币种细节** 见 §4.1 |
| `GET /agent/revenue/history` | 返佣流水 | ✅ 已接 |
| `GET /agent/settlement-config` | 结算方式配置 | ✅ 已接 |

### 1.2 前端还在 mock（后端未提供）

这些功能在前端 UI 上是展示的，但实际取数走前端 mock 常量。生产上线前必须接入：

| 功能 | 对应接口（建议路径） | 优先级 |
| --- | --- | --- |
| Dashboard 身份 / 等级 / 自返佣开关 / 代理名 | `GET /agent/me` | **高**（影响徽章/权限/NotAgent 跳转） |
| Dashboard 首页 7 张 KPI 卡 | `GET /agent/dashboard/kpi` | 中 |
| Dashboard 推广码贡献前 N 行 | `GET /agent/dashboard/invite-summary` | 中（或用 /agent/invite-codes 自取） |
| 好友中心 · 直接邀请人 | `GET /agent/friends/invitees` | 高（好友中心整张页面数据来源） |
| 好友中心 · 子代理列表 | `GET /agent/friends/sub-agents` | 高 |

### 1.3 写操作（整页面都还没 backend）

- 创建 / 编辑 / 作废推广码
- 修改子代理比例
- 编辑邀请人备注

详见 [§5 写操作接口](#5-写操作接口)。

---

## 2. 登录协议（已实测）

此节记录 2026-04-17 SIT 实测结果，作为后端团队内部对齐的参考。若有理解差异请告知。

### 2.1 请求

```http
POST /login HTTP/1.1
Host: surfv2-sit-api.nfexinsider.com
Content-Type: application/json
biz-pf: 6
LANG: zh-cn
Authorization: <JSON 字符串，见下>
```

**`Authorization` 头（注意是 JSON 字符串，不是 Bearer）**：

```json
{
  "pf": "privy",
  "method": "wallet" | "email",
  "access_token": "<privy access_token>",
  "address": "<钱包地址，后端强制要求非空>",
  "identity_token": "<privy identity_token>",
  "referral_code": null
}
```

- Body：空（`undefined`）
- `credentials: 'omit'`（不走 cookie）

**关键确认项**：

1. **`address` 字段是否真的强制非空？** 实测空值返回 `{"msg":"Login address is empty"}`。前端目前对邮箱登录也会从 Privy `embeddedWallets.solana` 取一个地址顶上去，但这和主站 surf-one `useMyLogin.ts` 的行为不同（主站文档里说只在 wallet 登录时传）。建议后端说明：
   - 对 email 登录用户，应该传哪个地址？（建议：embedded wallet 地址）
   - 如果不传会被视为匿名还是白名单拒绝？

### 2.2 响应

**当前 SIT 返回**：

```json
{
  "errno": "200",
  "msg": "success",
  "data": {
    "access_token": "<业务 JWT, HS256>",
    "wallet_approve_state": true
  }
}
```

业务 JWT payload（HS256）包含：

```json
{
  "exp": 1779039163,
  "jwtId": "907ee0c0-9c58-4339-b1ab-f80cb22ba9ab",
  "origIat": 1776447163,
  "tkValSta": true,
  "userId": "513519754410144768",
  "userLastLoginAt": "2026-04-17T17:32:43.261215557Z",
  "userRoleType": "0"
}
```

**待确认/补齐**：

1. `wallet_approve_state` 的业务含义？为 false 时前端应做什么（UI 提示 / 跳转 / 禁用操作）？
2. `userRoleType = "0"` 是什么角色？对应 `1/2/...` 都代表什么？前端是否需要用它做分叉？
3. JWT 有效期多长？（当前 `exp - origIat ≈ 30 天`）是否有 refresh 机制？过期后前端应该调哪个接口换新 token？
4. `/login` 里能否顺便返回 `is_agent`（是否代理商），让前端可以**立即**判断是否跳 `/not-agent` 页？目前前端是靠 `/agent/me`（尚未提供），所以暂时假设"凡是能登进来的都是代理"，这和最终业务规则会不一致。

### 2.3 错误码

**待后端提供完整 errno 表**。当前前端只识别以下几个：

| errno | 含义 | 前端处理 |
| --- | --- | --- |
| `200` | 成功 | ✅ |
| `104` | token 失效 | 触发登出，弹登录 modal |
| `10010012` | 不在代理白名单（推测值，来自主站 surf-one） | 清 Privy 会话，显示"未授权"提示 |

其它值目前一律按 `ApiError` 抛出，UI 显示原始 msg。

**建议补充**：参数缺失 / 过期 / 重复登录 / 风控触发 / 账号冻结 等各自对应的 errno。

---

## 3. 完全待实现的接口

### 3.1 `GET /agent/me`（优先级：**最高**）

影响路由守卫和 Dashboard 身份区。暂时硬编码代理身份使得"非代理身份"用户也能误入 Dashboard。

**期望响应 `data`**：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `is_agent` | boolean | 当前用户是否代理商；false → 前端跳 `/not-agent` |
| `status` | string | `normal` / `frozen` / `not_agent`；`frozen` 时禁用创建推广码等写操作 |
| `agent_level` | number | 1–5（青铜/白银/黄金/钻石/星耀），Dashboard 顶部徽章 |
| `agent_name` | string | Dashboard "您好，{name}" 显示；当前是前端 mock |
| `self_rebate_enabled` | boolean | 是否允许自返佣（影响 FriendsCenter "我自己"这行） |
| `trade_visibility` | string | `full` / `summary` / `hidden`，影响 TradingCenter 展示深度 |

> 也可以把这些字段合并到现有 `GET /agent/profile` 里返回（目前 `/agent/profile` 只返了 3 个比例），不用新开接口。前端适配成本一样。

### 3.2 `GET /agent/friends/invitees`（高）

好友中心 Tab 1 · 直接邀请人。

**期望请求**：

```
GET /agent/friends/invitees?page_num=1&page_size=10
  [&identity_type=regular|sub_agent]
  [&deposit_status=deposited|not_deposited]
  [&trade_status=traded|not_traded]
  [&uid=<模糊搜索>]
```

**`data.data[]` 字段**：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `uid` | string | |
| `identity_type` | string | `regular` / `sub_agent` |
| `deposit_status` | string | `deposited` / `not_deposited` |
| `trade_status` | string | `traded` / `not_traded` |
| `registered_at` | string | `YYYY-MM-DD HH:mm:ss` |
| `remark` | string | 代理给这个邀请人打的备注 |
| `is_self` | boolean | 是否代理自己（自返佣行，通常全列表只有 1 条） |
| `self_rebate_amount` | string | 自返佣金额，仅 `is_self=true` 时有值 |
| `flat_fee_comm_usdt` | string | FF 返佣 USDT |
| `flat_fee_comm_usdc` | string | FF 返佣 USDC |
| `profit_share_comm_usdt` | string | PS 返佣 USDT |
| `profit_share_comm_usdc` | string | PS 返佣 USDC |
| `event_commission` | string | 事件返佣 |

**期望 `data.summary`**：`total_count`、`deposited_count`、`traded_count`。

### 3.3 `GET /agent/friends/sub-agents`（高）

好友中心 Tab 2 · 子代理概览。

**期望请求**：

```
GET /agent/friends/sub-agents?page_num=1&page_size=10
  [&uid=<模糊>]
```

**`data.data[]` 字段**：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `uid` | string | |
| `nickname` | string | 子代理昵称 |
| `flat_fee_rate` | string | FF 比例 |
| `profit_share_rate` | string | PS 比例 |
| `event_rate` | string | 事件比例 |
| `registered_at` | string | |
| `direct_comm_usdt` | string | 子代理直推返佣贡献（USDT） |
| `direct_comm_usdc` | string | 同上 USDC |
| `platform_reward_usdt` | string | 平台奖励 USDT |
| `platform_reward_usdc` | string | 平台奖励 USDC |

**期望 `data.summary`**：`total_count` + `direct_comm_usdt/c` 合计 + `reward_usdt/c` 合计。

### 3.4 `GET /agent/dashboard/kpi`（中）

Dashboard 首页顶部 7 张 KPI。

> **替代方案**：如果不专门开这个聚合接口，前端可以从 `/agent/revenue/daily`（今日行 + 昨日行）+ `/agent/friends/invitees`（今日注册数）自行派生。对后端工作量更小，但前端会多 1 次请求。推荐但不强制。

**若单独接口，`data[]`**：每项按顺序展示，结构如下：

```json
{ "label": "今日注册数", "value": "23", "unit": "人", "change_percent": "15.0" }
```

展示条目依次为：

1. 今日注册数（人）
2. 今日净充值（USDT）
3. 今日 Flat Fee（USDT）
4. 今日 PS 有效交易量（USDT）
5. 今日事件合约交易量（USDT）
6. 今日佣金（直推，USDT）
7. 今日平台奖励（USDT）

`change_percent` 为"较昨日涨跌百分比"，负数表示下跌。

### 3.5 `GET /agent/dashboard/invite-summary`（中/低）

Dashboard 下方推广码贡献小表（TOP N 行）。

> **替代方案**：直接复用 `/agent/invite-codes?page_num=1&page_size=5&sort=registrations_desc`（若支持排序）。若前端用这个办法，此接口可不开。

---

## 4. 已有接口的字段补齐

这些接口已经在文档里、前端也接入了，但返回字段还不够丰富。前端 mapper 已把缺失字段标为 `optional`，**后端什么时候补齐，UI 就什么时候自动生效**，不需要前端重部署。

### 4.1 `GET /agent/revenue/daily` 行：分产品线 / 分币种的交易量 + 手续费

当前只给合计：

- `total_trade_volume_usdt`
- `flat_fee_fee_total_usdt`

前端 UI（RevenueCenter 日明细表）现在只能显示这两项合计。希望补齐：

| 期望字段 | 说明 |
| --- | --- |
| `ff_trade_vol_usdt` / `ff_trade_vol_usdc` | Flat Fee 交易量分币种 |
| `ps_trade_vol_usdt` / `ps_trade_vol_usdc` | Profit Share 交易量分币种 |
| `event_trade_volume` | 事件合约交易量（USDT 计价） |
| `flat_fee_fee_usdt` / `flat_fee_fee_usdc` | Flat Fee 手续费分币种 |

补齐前：UI 暂时显示两列合计，省略其它维度。

### 4.2 `GET /agent/positions` 行：`vip_tier`

期望在每行加：

```json
"vip_tier": "VIP3"
```

允许空字符串。前端会在 UID 下方小字显示。

### 4.3 `GET /agent/invite-codes` 行：贡献维度

当前行只有 `registrations / first_deposit_count / first_trade_count`。"推广管理 - 筛选结果" 统计条还需要：

| 字段 | 说明 |
| --- | --- |
| `trade_dau` | 该推广码邀请人当日活跃数 |
| `trade_volume` | 该推广码邀请人累计交易额（USDT） |
| `commission` | 该推广码贡献的佣金累计（USDT，已到账） |

补齐前：UI 筛选结果条对应字段显示 `—`。

### 4.4 `GET /agent/revenue/daily.summary.total_rebate_usdt_equiv` 的口径确认

文档说是 "USDT 等价"。请后端明确：

1. 是**按真实汇率折算**（USDT + USDC×市价），还是**USDT + USDC 1:1 加和**？
2. 折算时刻是请求时实时 / 当日收盘 / 统计区间末日？

前端 RevenueCenter Top KPI 的"合计"一列直接展示这个字段。如果是 1:1 加和会对代理造成误导，前端审计已标红，请确认后端实现。

---

## 5. 写操作接口

当前前端的新建/编辑/作废/修改比例/编辑备注都是**本地 state**，刷新页面就丢。需要后端提供以下 API 才能真实写入。

### 5.1 创建推广码

```http
POST /agent/invite-codes
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "sub_flat_fee_rate": "0.012",
  "sub_profit_share_rate": "0.0050",
  "sub_event_rate": "0.008",
  "remark": "可选"
}
```

**校验要求**：

- 三个 rate 都必须**严格小于**代理自身 `current_xxx_rate`（若业务允许 `≤` 请告知）
- `code` / `link_url` 由后端生成，**不要**让前端传
- 账号处于 `frozen` 状态时拒绝 → 期望 errno = ?

**响应 data**：新建的 invite-code 完整字段（结构同 `GET /agent/invite-codes.data[]`）。

### 5.2 编辑推广码比例

```http
PATCH /agent/invite-codes/:code
Content-Type: application/json

{
  "sub_flat_fee_rate": "...",
  "sub_profit_share_rate": "...",
  "sub_event_rate": "..."
}
```

**校验**：同 5.1（严格小于代理自身）。

### 5.3 作废推广码

```http
DELETE /agent/invite-codes/:code
```

或

```http
POST /agent/invite-codes/:code/revoke
```

两种语义都行，以后端方便为准。作废后该 `code` 不能再接受新注册，但已注册用户继续计返佣。

### 5.4 修改子代理比例

```http
PATCH /agent/sub-agents/:uid/rate
Content-Type: application/json

{
  "flat_fee_rate": "...",
  "profit_share_rate": "...",
  "event_rate": "..."
}
```

**校验**：严格小于代理自身 `current_xxx_rate`。

### 5.5 编辑邀请人备注

```http
PATCH /agent/invitees/:uid/remark
Content-Type: application/json

{ "remark": "..." }
```

---

## 6. 非接口类问题

### 6.1 Privy Dashboard 配置

**App ID**: `cmbir1ip600bejx0mu6b42iek`

需要加入 **Allowed Origins**：

- `http://localhost:5173`（前端 Vite dev server）
- `http://localhost:4173`（`vite preview` 验证构建产物）
- `https://errance.github.io`（GitHub Pages 演示部署）
- **生产域名**：未定，待后端/产品决定后再加

当前 origin 未全部加上时，Privy SDK 会在 iframe CSP `frame-ancestors` 上拦截，或者 `/sessions/logout` / `/siwe/init` 等请求返回 400/403。

### 6.2 白名单管理

- SIT 代理白名单是手动维护还是和业务系统自动同步？
- 如何把测试账号加入白名单？（如前端测试需要多个号，一次告知流程即可）
- 账号被加白名单后有多久的"代理生效等待时间"？（影响测试效率）

### 6.3 CORS

当前已联通，但记录下需要的策略，避免生产部署时遗漏：

```
Access-Control-Allow-Origin: http://localhost:5173, http://localhost:4173, https://errance.github.io, <生产域名>
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, biz-pf, LANG
```

前端明确 `credentials: 'omit'`，不走 cookie；故**不**需要 `Access-Control-Allow-Credentials`。

### 6.4 时区

文档约定时间字段是 `YYYY-MM-DD HH:mm:ss`（UTC+8）。前端已按 `Asia/Shanghai` 统一处理。如果后端某些接口返回 ISO UTC 格式或 timestamp，请单独标出。

### 6.5 金额精度

文档约定多数金额是字符串（便于前端 `Decimal` 精度处理）。前端全部通过 `toNumber(...)` 归一化，同时支持 string / number。请**避免**同一字段在不同接口里混用 string / number / null，会增加前端防御逻辑。

### 6.6 API 文档后续

以上 §3、§5 条目是否有计划排期？建议优先级：

1. **阻塞级**：`GET /agent/me`（影响权限判断）
2. **高**：好友中心两个接口（整个页面空白）+ §4 字段补齐（UI 有列但显示 `—`）
3. **中**：写操作（当前是本地演示）
4. **低**：Dashboard KPI / invite-summary（前端可自行聚合替代）

---

## 7. Unblock 最小可用集

已达成：

- [x] `/login` 协议实测通过
- [x] `biz-pf=6` 映射到正确的 Privy App ID
- [x] Privy Allowed Origins 加了 `http://localhost:5173`
- [x] 测试账号能过白名单换到业务 JWT

下一步最少需要的：

- [ ] `GET /agent/me` → 让前端知道用户是否真是代理 + 等级 + visibility
- [ ] `GET /agent/friends/invitees` / `/agent/friends/sub-agents` → 好友中心数据
- [ ] §4 已有接口的字段补齐（Q1/Q3/Q4）

写操作（§5）可以放到后面一批，前端暂时保留本地 state 演示模式。
