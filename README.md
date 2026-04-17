# TurboFlow Agent Portal

代理后台 Web 前端。管理返佣比例、推广码、邀请树、子代理和交易数据。

## Tech Stack

- React 18 + TypeScript
- Vite 6
- Chakra UI 3
- @tanstack/react-query
- @privy-io/react-auth（接入中）

## Scripts

| Command | 用途 |
| --- | --- |
| `npm run dev` | 本地开发 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览 build 产物 |
| `npm run test` | 单测（vitest + happy-dom） |
| `npm run test:watch` | 单测 watch 模式 |
| `npm run typecheck` | TS 检查（不出产物） |

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `VITE_USE_MOCK` | `true` 时走内置 mock 数据，不调真实后端 |
| `VITE_PRIVY_APP_ID` | Privy appId，与主站共用同一个项目 |
| `VITE_API_BASE` | 后端 REST 基址 |
| `VITE_BASE` | （可选）Vite base path，部署到子路径时使用 |
| `VITE_ROUTER` | `browser`（生产）或 `hash`（静态托管 fallback） |

## 目录约定

- `src/api/` — React Query + fetch 封装，mock/real 双模
- `src/auth/` — Privy 登录与业务 JWT 管理（建设中）
- `src/components/shared/` — 跨页复用的通用组件
- `src/pages/` — 业务页面（Dashboard / FriendsCenter / RevenueCenter / TradingCenter / InvitePromotion / OnchainTransfers）
- `src/utils/` — 纯计算工具（金额精度、返佣校验、URL 安全、seeded PRNG）
- `src/hooks/` — 通用 React hooks
- `src/mock/` — 开发期假数据与类型定义
- `docs/` — 对后端的接口需求清单

## 本地启动

```bash
npm install
npm run dev
```

默认以 `VITE_USE_MOCK=true` 运行，无需后端。

## 部署

默认构建 `base = '/'`，可通过 `VITE_BASE` 覆盖。`public/404.html` 是给 GitHub Pages `BrowserRouter` 使用的 SPA fallback，部署到子路径时需同步调整 `segments` 值。
