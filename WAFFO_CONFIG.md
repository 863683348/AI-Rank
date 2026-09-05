# Waffo 支付变量配置指南（ai-rank / ToolsRank）

> 适用项目：`D:\WorkBuddyData\2026-08-12-17-30-29\ai-rank`
> SDK：`@waffo/pancake-ts`
> 接口实现：`src/lib/waffo.ts` + `src/app/api/v1/webhooks/waffo/route.ts`
> 文档更新：2026-09-05

---

## 0. 当前状态（先纠正一个误解）

| 项 | 实际状态 |
|---|---|
| `src/lib/waffo.ts` | ✅ 代码完整，含 `createCheckoutSession` / `verifyWebhook` |
| `src/app/api/v1/webhooks/waffo/route.ts` | ✅ **活的路由**，不在 501 列表里 |
| 路由注册 | ✅ Next build 输出 `ƒ /api/v1/webhooks/waffo`（与 yungouos 同列） |
| 环境变量 | ❌ **`.env` / `.env.example` 均未配** `WAFFO_*` |
| 能否立即收钱 | ❌ 调 `getClient()` 抛 `WAFFO_MERCHANT_ID / WAFFO_PRIVATE_KEY 未配置` |

**结论**：Waffo 是「**SDK 完整 + 等变量启用**」的准活状态，不是 Stripe/微信那种 501 死路由。配齐环境变量就能切。

---

## 1. 必填变量（少一个就走不通）

| 变量名 | 类型 | 来源 | 示例 | 说明 |
|--------|------|------|------|------|
| `WAFFO_MERCHANT_ID` | string | Waffo 商户后台 | `MER_8K3HQ2...` | 商户 ID，`MER_` 前缀 |
| `WAFFO_PRIVATE_KEY` | PEM（多行） | Waffo 商户后台 → API 密钥 | `-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----` | **RSA 私钥**，签名 + 验签都用它；**永不入库、永不上前端** |

## 2. 可选变量

| 变量名 | 默认值 | 何时改 |
|--------|--------|--------|
| `WAFFO_BASE_URL` | `https://api.waffo.ai` | 沙盒：`https://api-sandbox.waffo.ai`；自部署代理：自定义 |

## 3. 申请步骤

### 3.1 商户号与私钥

1. 登录 [Waffo Dashboard](https://dashboard.waffo.ai)（或对应区域面板）
2. **商户管理** → 商户列表 → 复制 `MERCHANT_ID`
3. **API 密钥** → 创建密钥 → 下载 PEM 格式 RSA 私钥（**只显示一次**，立即保存）
4. **Webhook** → 添加回调地址：
   ```
   https://你的域名/api/v1/webhooks/waffo
   ```
   启用订阅事件：`order.completed` / `refund.succeeded` / `refund.failed` / `subscription.*`
5. 拿到密钥回填到环境变量

### 3.2 私钥格式注意

- 多行 PEM 直接粘进 `.env` 会爆。要么：
  - **方案 A（推荐）**：Base64 编码私钥，单行存；代码启动时 `Buffer.from(b64, 'base64').toString()`
  - **方案 B（Vercel 友好）**：在 Vercel Dashboard 把整个 PEM 粘进 secret（textarea 会保留换行）
  - **方案 C**：私钥放 Vercel KV / 外部密钥管理（AWS Secrets Manager / Doppler / Cloudflare Workers Secrets），代码启动 `fetch` 拉取

**当前代码实现吃原始 PEM 字符串**（`new WaffoPancake({ privateKey })`）。所以**优先用方案 B**，粘到 Vercel 时保留换行。

---

## 4. 沙盒 vs 生产

| 环境 | `WAFFO_BASE_URL` | 商户 ID | 私钥 | 走的钱 |
|------|------------------|---------|------|--------|
| **本地开发** | `https://api-sandbox.waffo.ai` | 沙盒 `MER_SBX_*` | 沙盒私钥 | 假钱 |
| **预览部署（Vercel preview）** | 同上 | 沙盒 | 沙盒 | 假钱 |
| **生产** | `https://api.waffo.ai`（默认值，留空即可） | 生产 `MER_*` | 生产私钥 | 真钱 |

Vercel 环境变量按 **Production / Preview / Development** 三档分别配，互不污染。

---

## 5. 启用检查清单

### 5.1 代码侧（已基本就位）

- [x] `src/lib/waffo.ts` 含 `getClient` / `createCheckoutSession` / `verifyWebhook`
- [x] `webhooks/waffo/route.ts` 处理 `order.completed` / `refund.*`，幂等 + DB 更新
- [x] `getClient()` 缺变量时**抛错而非 silent fail**（`throw new Error`）
- [x] `verifyWebhook` 失败返 401（验签失败的硬处理）

### 5.2 环境侧（待补）

- [ ] `.env` 填三个 `WAFFO_*` 变量
- [ ] `.env.example` 补文档（**当前没写**，要加）
- [ ] Vercel 三档环境（Production / Preview / Development）各自配齐
- [ ] Waffo 后台把回调地址加白

### 5.3 数据库侧（待补）

- [ ] `payments.payment_method` 当前 schema 注释只写 `yungouos`，**waffo 已能写入**（代码硬编码 `'waffo'`），但注释需同步：`// yungouos（微信/支付宝 一码付）| waffo`
- [ ] 不需要新列：`payment_method` 已是 text 类型，'waffo' 直接进
- [ ] 不需要迁移：`bid` / `listing` / `payment` 三表当前结构已能承载 waffo 数据

---

## 6. `.env.example` 补全模板（建议直接复制）

```bash
# ============================================
# Waffo（国际支付，独立于 YunGouOS，主要服务海外/外卡/订阅场景）
# SDK: @waffo/pancake-ts
# 接口: src/lib/waffo.ts + src/app/api/v1/webhooks/waffo/route.ts
# ============================================
# 必填：商户 ID（MER_ 开头，Waffo Dashboard → 商户管理）
WAFFO_MERCHANT_ID=

# 必填：RSA 私钥（PEM 格式；Vercel secret 粘贴保留换行；本地 .env 推荐 Base64 单行）
# 例：
# WAFFO_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----"
WAFFO_PRIVATE_KEY=

# 可选：API base URL
#   生产（默认）：https://api.waffo.ai
#   沙盒：       https://api-sandbox.waffo.ai
WAFFO_BASE_URL=https://api.waffo.ai

# 必填：Webhook 回调完整 URL（与 Waffo 后台配置一致）
WAFFO_WEBHOOK_URL=https://your-domain.com/api/v1/webhooks/waffo
```

> 当前 `.env.example` 完全没写 Waffo 段，直接 `Edit` 追加在 YunGouOS 段后即可。

---

## 7. 与 YunGouOS 的关系（并存策略）

两者**完全独立**，互不干扰：

| 维度 | YunGouOS（当前主用） | Waffo（待启用） |
|------|---------------------|----------------|
| 覆盖 | 国内 · 微信/支付宝 一码付 | 海外 · 卡支付 + 订阅 + 多币种 |
| 创建订单 | `POST /api/v1/payments/yungouos` | `createCheckoutSession`（SDK 方法，**目前没有暴露 HTTP 端点**，需新建 `/api/v1/payments/waffo`） |
| Webhook | `webhooks/yungouos`（已活） | `webhooks/waffo`（已活但缺前置订单路由） |
| 字段 | `payment_method='yungouos'` | `payment_method='waffo'` |
| 验签 | YunGouOS RSA + sign | Waffo RSA SDK 内置 |

**启用 waffo 必须新增的 HTTP 路由**：`POST /api/v1/payments/waffo`，调 `createCheckoutSession` → 返 `{checkoutUrl}` → 前端跳转。当前代码里**只有 webhook 端点，没有创建订单端点**，这是阻塞点。

参考 yungouos 路由结构（约 80 行）：解析 `{listingId, amount}` → 创建本地 bid 记录（pending）→ 调 SDK → 返 `qrcode/checkoutUrl`。

---

## 8. 测试 Checklist（启用前跑一遍）

### 8.1 配置正确性

```bash
# 1. 启动 dev，连通性 + 变量读取
npm run dev

# 2. 验证 SDK 初始化（缺变量应抛错）
curl -s -X POST http://localhost:3000/api/v1/payments/waffo \
  -H 'Content-Type: application/json' \
  -d '{"listingId":"xxx","amount":10}'
# 期望：500 { error: "WAFFO_MERCHANT_ID / WAFFO_PRIVATE_KEY 未配置" }

# 3. 配齐后再请求
# 期望：200 { checkoutUrl: "https://checkout.waffo.ai/..." }
```

### 8.2 验签链路

```bash
# 4. 用 Waffo Dashboard「触发测试 webhook」功能
#    选 order.completed 事件 → 发到你的回调 URL
# 期望：200 { received: true }

# 5. 重放同一事件（验证幂等）
# 期望：200 { received: true }，且 DB 不出现第二条 payments 记录
#      （uniq_payments_external 唯一索引兜底）
```

### 8.3 沙盒端到端

1. Waffo 后台切沙盒 → 拿测试卡号（沙盒通常 `4242 4242 4242 4242` 类）
2. 前端提交流程走完一笔
3. 检查 DB：
   - `listings.bid_amount` 是否 +amount
   - `bids` 表新增 confirmed 记录
   - `payments` 表有 `payment_method='waffo'`、`status='confirmed'` 行
4. 检查 SSE：`/api/v1/stream` 推送 boardVersion+1

---

## 9. 故障排查

| 现象 | 原因 | 排查 |
|------|------|------|
| `WAFFO_MERCHANT_ID / WAFFO_PRIVATE_KEY 未配置` | 缺变量 | `echo $WAFFO_MERCHANT_ID` 在 Vercel CLI 看 |
| Webhook 返 401 `invalid signature` | 私钥不匹配 / 用了生产私钥接沙盒 | 比对 Dashboard「API 密钥」与环境变量 |
| `base64 decode error` | 私钥格式破坏 | Vercel secret 重粘 PEM，注意换行 |
| `uniq_payments_external` 冲突 | 同一订单重放 | 这是预期行为，不算 bug，看 `payments` 表确认 |
| 回调地址 404 | 域名没绑 / 路径错 | Vercel 项目 → Domains → 检查绑定 |
| 沙盒支付成功但生产报错 `merchant not active` | 用了沙盒私钥跑生产 | Dashboard 把生产密钥同步到 Vercel Production 档 |

---

## 10. 安全约束（别踩坑）

1. **私钥永不入库、永不进前端 bundle、永不写进代码注释**
2. **Vercel secret 必勾 `sensitive`**（API 列表里看不到明文）
3. **Webhook 验签硬要求**：当前 `verifyWebhook` 失败返 401，**不要为了日志方便改成 200**（会被刷单）
4. **白名单回调 IP**（如有）：Waffo 后台 → 安全 → IP 白名单 + Vercel egress 锁定
5. **金额校验**：webhook 里读到的 `evt.amount` **不直接信**——应回查 `meta.listingId` + 服务端 bid.amount 与 webhook 传值一致才落库（当前代码**没做二次校验**，是已知 V1.1 TODO）

---

## 11. 启用 TODO（按顺序）

1. `.env.example` 加 Waffo 段（按本文 §6 模板）
2. Waffo Dashboard 拿 `MERCHANT_ID` + RSA 私钥 + 配回调 URL
3. 本地 `.env` 三变量填齐
4. **新增 `POST /api/v1/payments/waffo` 路由**（阻塞点，约 60 行，照 yungouos 路由抄）
5. 前端 `/pay` 页加 Waffo 入口（按钮 + 走 checkoutUrl 跳转）
6. Vercel 三档环境各配齐
7. 沙盒端到端测一遍（§8.3）
8. 生产密钥切真钱前再测一次小额（¥0.01）

---

## 12. 决策记录

| 时间 | 决策 | 原因 |
|------|------|------|
| 2026-09-05 | Waffo 标记为「准活」而非「死路由」 | 实际代码 + 路由都完整，仅缺变量 |
| 2026-09-05 | 与 YunGouOS 并存而非互斥 | 覆盖场景互补：YunGouOS = 国内扫码 / Waffo = 海外卡 + 订阅 |
| 2026-09-05 | 当前主推 YunGouOS 上线 | 国内用户基数大，先验证主支付通道；Waffo 等海外流量来再启用 |
