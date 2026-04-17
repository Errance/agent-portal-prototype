# Agent Portal 后端待补接口清单（sit 环境）

> 本文档列出 agent-portal 前端需要、但 [AGENT_PORTAL_FRONTEND_API.md](./AGENT_PORTAL_FRONTEND_API.md) 尚未覆盖的接口。可直接转发后端团队。
>
> 所有接口遵循现有约定：Base URL `https://surfv2-sit-api.nfexinsider.com`，响应外壳 `{ errno, msg, data }`（errno 为字符串），分页字段 `page_num/page_size/count/page_count`。

---

## 1. 认证 `/login`（最优先，阻塞 Privy 接入）

**前端调用时机**：用户在 Privy modal 登录成功后，前端拿到 Privy 的 `access_token` + `identity_token`，立刻向后端换取业务 JWT。

**前端期望的协议**（参考 surf-one `useMyLogin.ts` 的既有实现，请后端确认 agent-portal 是否一致）：

```http
POST /login
Content-Type: application/json
Biz-pf: <sit-specific value, 待告知>
Authorization: {
  "pf": "privy",
  "method": "wallet" | "email",
  "access_token": "<privy access token>",
  "address": "<wallet address, 仅 wallet 登录时有>",
  "identity_token": "<privy identity token>",
  "referral_code": null
}

(Body 为字符串 "null")
```

**前端期望的响应**：

```json
{
  "errno": "200",
  "msg": "ok",
  "data": "<业务 JWT 字符串>"
}
```

**待后端确认/补充的问题**：
1. 路径是否就是 `/login`，还是 `/agent/login` / `/user/login`？
2. `Authorization` 头真的是 JSON 字符串吗？（这个协议在 HTTP 标准里少见；surf-one 确实是这样做的）
3. Body 是字符串 `"null"` 还是 `null`？还是 `{}`？
4. `biz-pf` 在 sit 的具体值
5. 错误码表：
   - 不在代理白名单 → errno 值？主站 surf-one 用 `'10010012'`，agent-portal 是否一致？
   - token 过期 → errno 值？主站用 `'104'`
   - 参数错误 → errno 值？
6. 业务 JWT 过期时间多长？是否有 refresh token 机制？

**CORS 要求**：
- 允许 `http://localhost:5173`、`http://localhost:4173`、`https://errance.github.io` 带 `credentials: include` 发 `POST /login`

---

## 2. `/agent/me`（agent 身份，阻塞权限判断）

**前端用途**：AppLayout 初始化时拉一次；判断当前登录用户是否是代理商、是否冻结、等级、代理名。`/agent/profile` 只给比例，缺这些字段。

**前端期望**：

```http
GET /agent/me
Authorization: Bearer <JWT>
```

Response `data`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `is_agent` | boolean | 是否代理商（非代理直接走 /not-agent） |
| `status` | string | `normal` / `frozen` / `not_agent` |
| `agent_level` | number | 1-5（青铜/白银/黄金/钻石/星耀） |
| `agent_name` | string | 代理名，Dashboard 标题"您好，{agentName}"展示 |
| `self_rebate_enabled` | boolean | 是否允许自返佣（影响 FriendsCenter "我自己"行） |
| `trade_visibility` | string | `full` / `summary` / `hidden`（影响交易中心展示深度） |
| `current_flat_fee_rate` | string | （可合并 /agent/profile 进来） |
| `current_profit_share_rate` | string | 同上 |
| `current_event_rate` | string | 同上 |

**替代方案**：扩展现有 `/agent/profile` 返回上述字段，不用新开接口，也 OK。

---

## 3. `/agent/friends/invitees`（直接邀请人列表）

**前端用途**：好友中心 Tab 1 - 直接邀请人（代理伞下的普通用户 + 子代理）。

**前端期望**：

```http
GET /agent/friends/invitees?page_num=1&page_size=10&identity_type=regular|sub_agent
Authorization: Bearer <JWT>
```

Response `data`：列表元信息（`count / page_count / page_num / page_size`）+ `data[]`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `uid` | string | 用户 UID |
| `identity_type` | string | `regular` / `sub_agent` |
| `deposit_status` | string | `deposited` / `not_deposited` |
| `trade_status` | string | `traded` / `not_traded` |
| `registered_at` | string | YYYY-MM-DD HH:mm:ss |
| `remark` | string | 代理备注 |
| `is_self` | boolean | 是否代理自己（自返佣行） |
| `self_rebate_amount` | string | 自返佣金额，仅 is_self=true 时有 |
| `flat_fee_comm_usdt` | string | FF 返佣 USDT |
| `flat_fee_comm_usdc` | string | FF 返佣 USDC |
| `profit_share_comm_usdt` | string | PS 返佣 USDT |
| `profit_share_comm_usdc` | string | PS 返佣 USDC |
| `event_commission` | string | 事件返佣 |

**Summary**（顶部灰条）：`total_count`、`deposited_count`、`traded_count`。

---

## 4. `/agent/friends/sub-agents`（子代理列表）

**前端用途**：好友中心 Tab 2 - 子代理概览。

**前端期望**：

```http
GET /agent/friends/sub-agents?page_num=1&page_size=10
Authorization: Bearer <JWT>
```

Response `data.data[]`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `uid` | string | 子代理 UID |
| `nickname` | string | 昵称 |
| `flat_fee_rate` | string | FF 比例（小数） |
| `profit_share_rate` | string | PS 比例 |
| `event_rate` | string | 事件比例 |
| `registered_at` | string | |
| `direct_comm_usdt` | string | 子代理直推返佣 USDT |
| `direct_comm_usdc` | string | 同上 USDC |
| `platform_reward_usdt` | string | 平台奖励 USDT |
| `platform_reward_usdc` | string | 平台奖励 USDC |

**Summary**：`total_count`、`direct_comm_usdt`、`direct_comm_usdc`、`reward_usdt`、`reward_usdc` 合计。

---

## 5. `/agent/dashboard/kpi`（首页 7 KPI）

**前端用途**：Dashboard 顶部 7 张 KPI 卡片。**如果你们建议前端自己从 `/agent/revenue/daily`（今日行）+ 邀请人接口派生，也 OK**——前端 mock 层已经实现了这种派生逻辑。但有专门的 KPI 接口更省请求数。

**前端期望**：

```http
GET /agent/dashboard/kpi
Authorization: Bearer <JWT>
```

Response `data[]`（按顺序展示）：

| label | value 字段 | unit | change_percent |
| --- | --- | --- | --- |
| 今日注册数 | number | 人 | 较昨日 % |
| 今日净充值 | string | USDT | % |
| 今日 Flat Fee | string | USDT | % |
| 今日 PS 有效交易量 | string | USDT | % |
| 今日事件合约交易量 | string | USDT | % |
| 今日佣金（直推） | string | USDT | % |
| 今日平台奖励 | string | USDT | % |

每项结构：
```json
{ "label": "今日注册数", "value": "23", "unit": "人", "change_percent": "15.0" }
```

---

## 6. 写操作接口（推广码 CRUD）

文档 §2 只给了 GET /agent/invite-codes。前端还需要创建/编辑/撤销。

### 6.1 创建推广码
```http
POST /agent/invite-codes
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "sub_flat_fee_rate": "0.012",      // 严格小于代理自身 current_flat_fee_rate
  "sub_profit_share_rate": "0.0050",
  "sub_event_rate": "0.008",
  "remark": "可选"
}
```

Response `data`：新建的 invite-code 完整字段（同 §2.3 data[] 行）。

校验：
- 三个 rate 都必须 `< current_xxx_rate`（严格小于；如业务允许等于请告知前端）
- 后端生成 `code` 和 `link_url`
- 冻结账号禁止调用 → errno = ?

### 6.2 编辑推广码比例
```http
PATCH /agent/invite-codes/:code
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "sub_flat_fee_rate": "...",
  "sub_profit_share_rate": "...",
  "sub_event_rate": "..."
}
```

### 6.3 撤销推广码
```http
DELETE /agent/invite-codes/:code
```
或
```http
POST /agent/invite-codes/:code/revoke
```

两种都可以，以后端方便为准。

### 6.4 修改子代理比例
```http
PATCH /agent/sub-agents/:uid/rate
Authorization: Bearer <JWT>

{
  "flat_fee_rate": "...",
  "profit_share_rate": "...",
  "event_rate": "..."
}
```

### 6.5 编辑邀请人备注
```http
PATCH /agent/invitees/:uid/remark
Authorization: Bearer <JWT>

{
  "remark": "..."
}
```

---

## 7. 综合性问题

1. **Privy Dashboard `cmbir1ip600bejx0mu6b42iek` 的访问权限**：谁能加 Allowed Origins？我们需要加 `http://localhost:5173` + `https://errance.github.io`。
2. **白名单管理**：sit 的代理白名单是手动维护还是自动？能否把我们的测试账号加白？
3. **errno 错误码表**：主站 surf-one 用了 `'200'`（成功）、`'104'`（token 失效）、`'10010012'`（不在白名单）。代理后台是否共用同一套？
4. **/agent/revenue/daily.summary.total_rebate_usdt_equiv**：文档说是"USDT 等价"，请确认是**真实汇率折算**（不是 USDT+USDC 的 1:1 数值加和），否则前端审计 C1 已经明确不接受后者。
5. **API 文档后续**：`/agent/me`、好友中心、写操作等是否有计划排期？

---

## 8. Unblock 路径建议

如果短期内上述全部拿不到，**最小可用集**是：

- `/login` 协议确认（只需文字回复协议即可，不需要后端改代码）
- CORS 允许 localhost:5173（能本地 dev server 联调 /login 就够）
- 一个能过白名单的测试账号

拿到这 3 样，agent-portal 就能跑通"Privy 登录 → 业务 JWT 入账 → Dashboard mock 数据展示"的演示，其他业务 API 补齐前继续走 mock。
