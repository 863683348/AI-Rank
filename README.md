# ToolsRank — C位的显眼包

AI 工具垂直竞价排行榜：金额即排名，花小钱上 C 位、当显眼包。每一笔竞价公开可审计，每日 00:00（北京时间）在榜金额重置为 ¥1，条目与点击数保留。

对标 outbid.lol / cc8.cc，差异：AI 单分类专注、竞价历史全公开、点击数据可算 CPC、中文优先。

## 技术栈

Next.js 15 (App Router) + Neon PostgreSQL (drizzle-orm HTTP driver) + Stripe Checkout + Tailwind 4 + lucide-react

## 快速开始

```bash
npm install --legacy-peer-deps
cp .env.example .env   # 填入 Neon 连接串与 Stripe test keys
npx drizzle-kit push   # 建表
npm run dev
```

## 环境变量

见 `.env.example`。必填：`DATABASE_URL`（Neon）、`STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`、`CRON_SECRET`、`CLICK_SALT`。

## 部署（Vercel）

1. 导入仓库，绑定 `DATABASE_URL` 等环境变量
2. Stripe Dashboard 配置 webhook 端点：`/api/v1/webhooks/stripe`（事件 `checkout.session.completed`）
3. 每日重置已由 `vercel.json` 内置：UTC 16:00 = 北京时间 00:00，访问需 `Authorization: Bearer <CRON_SECRET>`
4. 绑定域名 toolsrank.lol

## API 一览

| 端点 | 说明 |
|------|------|
| `GET /api/v1/listings` | 榜单（金额降序，同额后出价者优先） |
| `POST /api/v1/listings` | 上架新工具（返回 Stripe Checkout URL） |
| `GET /api/v1/listings/[id]` | 详情 + 公开竞价历史 |
| `POST /api/v1/listings/[id]/bid` | 加价 |
| `POST /api/v1/webhooks/stripe` | 支付回调（幂等） |
| `GET /api/v1/click/[id]` | 出站跳转 + 去重计数 |
| `GET /api/v1/stream` | SSE 实时榜单推送 |
| `GET /api/v1/cron/reset` | 每日重置（CRON_SECRET） |

## MVP 简化说明

- Stripe 渠道按同面额美元结算（¥10 → $10），榜单金额以 CNY 记账排序
- 微信支付预留 `WECHAT_ENABLED` 开关，MVP 阶段隐藏入口
