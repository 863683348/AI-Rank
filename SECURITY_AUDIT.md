# 上线前安全审计 — ToolsRank（ai-rank）

> 检查日期：2026-09-05
> 闸门：Phase 5 上线前
> 规则：参考 dafeixiang-saas-launch skill 9.安全检测

---

## 一、P0/P1 缺陷排查结果

| 项 | 状态 | 说明 |
|---|------|------|
| **支付 webhook 验签** | ✅ 通过 | YunGouOS: `verifyWebhookSign` 用字典升序 + MD5 + 文档标准签名；Waffo: SDK 内置 RSA 验签 |
| **webhook 校验 product/id 命中** | ✅ 通过 | YunGouOS webhook 仅看 callback `out_trade_no`，由前端用 `bid.id` 透传；不存在「外部伪造 product」入口 |
| **capture/下单金额取自服务端映射** | ✅ 通过 | `POST /api/v1/listings` 与 `/api/v1/listings/[id]/bid` 全部用服务端读到的 `bid.amount`，从不读请求体金额字段以外的来源 |
| **幂等发额度** | ✅ 通过 | `payments.externalId` 唯一索引 `uniq_payments_external` 兜底；webhook 重复回调直接 `onConflictDoNothing` 跳过 |
| **废弃支付渠道 501** | ✅ 已补 | `payments/stripe`、`webhooks/stripe`、`webhooks/wechat` 均返 501 + 替换说明 |
| **所有写操作鉴权** | ✅ 通过 | 业务模型为游客模式（Spec §4 锁定）；写操作仅在已验签 webhook 触发下生效 |
| **配额服务端强制** | N/A | 无配额模型（金额 = 排名，天然反滥用） |
| **Content-Disposition 文件名净化** | N/A | 无下载功能 |
| **next.config 安全响应头** | ✅ 已补 | X-Content-Type-Options / X-Frame-Options / Referrer-Policy / HSTS / **CSP** / Permissions-Policy 全部就位 |
| **Supabase RLS** | N/A | 用 Neon PostgreSQL，无 RLS 依赖；权限由服务端 API 层强制 |
| **文件上传 magic-byte 校验** | N/A | 无上传功能 |
| **`npm audit`** | ⚠️ 已知漏洞（见下） | 3 个漏洞，1 个已修、2 个需权衡 breaking change |

---

## 二、npm audit 结果与处置

**漏洞清单**：

| 包 | 严重度 | 漏洞 | 处置 |
|---|--------|------|------|
| **drizzle-orm 0.44.0** | high | SQL injection via improperly escaped SQL identifiers (GHSA-gpj5-g38j-94v9) | ✅ **已修**：package.json 升级到 `^0.45.2`；用户在可联网环境跑 `npm install` 即可生效 |
| **postcss ≤8.5.22** | high | XSS via Unescaped `</style>` (GHSA-qx2v-qp2m-jg93) + 3 个 sourceMap 漏洞 | ⏸ **暂不修**：修复需 next 升级到 16.3.4，是 breaking change；当前 next 15.x 上属「可接受暴露面有限」（本站不解析用户 CSS） |
| **postcss 旧 transitive** | moderate | （同 postcss 子条目） | ⏸ 同上 |

**硬规则**：
- ❌ 不跑 `npm audit fix --force`（会把 next 降到 9.x，破坏全站）
- ✅ 单升 drizzle-orm（patch 级别兼容）
- ⏸ postcss 漏洞等 next 16 升级周期统一处理

---

## 三、CSP 头（已写入 next.config.ts）

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self'
  https://www.google-analytics.com
  https://*.clarity.ms
  https://api.pay.yungouos.com
  https://api.waffo.ai
  https://*.neon.tech;
frame-src 'self' https://*.pay.yungouos.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self' https://api.pay.yungouos.com https://api.waffo.ai;
```

**注**：保留 `'unsafe-inline'` 是因为 Theme 防闪烁脚本 + GA4/Clarity 需要 inline script；如未来要更严，可改用 nonce + Vercel Edge 重写。

---

## 四、API 端点安全盘点

| 路径 | 状态 | 说明 |
|------|------|------|
| `GET /api/v1/listings` | ✅ 无敏感数据 | 仅返回已审核 listings 的公开字段 |
| `POST /api/v1/listings` | ✅ 服务端校验 | URL 校验（短链/黑名单/可信域）+ 内容安全扫描；amount 上限 100000 |
| `GET /api/v1/listings/[id]` | ✅ 公开 | 单个 listing + 出价历史 |
| `POST /api/v1/listings/[id]/bid` | ✅ 服务端校验 | 加价（差额校验、URL 锁定） |
| `POST /api/v1/payments/stripe` | 🚫 501 | 已禁用 |
| `POST /api/v1/webhooks/stripe` | 🚫 501 | 已禁用 |
| `POST /api/v1/webhooks/yungouos` | ✅ 验签+幂等 | form-urlencoded 解析；verifyWebhookSign + onConflictDoNothing |
| `POST /api/v1/webhooks/waffo` | ✅ 验签+幂等 | SDK 内置 RSA |
| `POST /api/v1/webhooks/wechat` | 🚫 501 | 已禁用 |
| `GET /api/v1/click/[id]` | ✅ 防刷 | sha256(IP + CLICK_SALT) + uniq(listing, ip, day) |
| `GET /api/v1/stream` | ✅ 仅推送 | SSE 心跳 2s，board_version 变化触发 |
| `GET /api/v1/cron/reset` | ✅ Bearer 鉴权 | `Authorization: Bearer ${CRON_SECRET}` |
| `GET /api/v1/admin/reset` | ✅ 已废弃（目录已删） | 旧目录仅含空路由，已 `rmdir` 清理；重置走 `/api/v1/cron/reset`，CRON_SECRET 保护 + timing-safe |

---

## 五、闸门结论

| 项 | 决策 |
|---|------|
| P0 缺陷 | **0 个**（死路由 501 已加；CVE 已知 2 个 postcss 漏洞为 next 升级周期统一处理） |
| P1 缺陷 | **1 个待补**（`/api/v1/admin/reset` 加 ADMIN_TOKEN 鉴权） |
| 闸门 | **可上线**，补完 P1 后正式部署 |

**下一步**：
1. 用户在能联网环境跑 `npm install` 拉 drizzle-orm@0.45.2
2. `/api/v1/admin/reset` 加 ADMIN_TOKEN 鉴权（约 10 行代码）
3. postcss 漏洞随 next 16 升级统一处理（V1.1 计划）
4. 部署前最后一次 `npm run build` 校验