import { pgTable, uuid, text, decimal, integer, timestamp, date, bigint, boolean, uniqueIndex, index } from 'drizzle-orm/pg-core';

/**
 * listings — 榜单核心表
 * bid_amount: 当前在榜金额（每日重置回 1）
 * lifetime_amount: 累计投入（不受重置影响）
 * last_bid_at: 同额时后出价者靠前的排序依据
 * board_version: SSE 推送依据，任何竞价生效 +1
 * status: approved(审核通过) | rejected(被管理员下线)
 * paid: 支付门控 —— 至少一笔 confirmed 支付才进榜单可见；
 *       status 与 paid 是独立两维：审核不过（rejected）即使付了钱也不显示
 * verified: 是否命中可信源（域名白名单/目录）
 */
export const listings = pgTable('listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: text('url').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  category: text('category').notNull().default('ai-tools'),
  bidAmount: decimal('bid_amount', { precision: 10, scale: 2 }).notNull().default('0.00'),
  lifetimeAmount: decimal('lifetime_amount', { precision: 10, scale: 2 }).notNull().default('0.00'),
  lastBidAt: timestamp('last_bid_at', { withTimezone: true }).notNull().defaultNow(),
  totalClicks: integer('total_clicks').notNull().default(0),
  ownerEmail: text('owner_email'),
  boardVersion: bigint('board_version', { mode: 'number' }).notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  status: text('status').notNull().default('pending'),
  reviewReason: text('review_reason'),
  verified: boolean('verified').notNull().default(false),
  paid: boolean('paid').notNull().default(false),
}, (t) => [
  uniqueIndex('uniq_listings_url').on(t.url),
  index('idx_listings_rank').on(t.bidAmount, t.lastBidAt),
  index('idx_listings_status').on(t.status),
]);

/** bids — 出价记录（公开审计） */
export const bids = pgTable('bids', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(), // yungouos（微信/支付宝 一码付）
  status: text('status').notNull().default('pending'), // pending | confirmed | refunded
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_bids_listing').on(t.listingId, t.createdAt),
]);

/** payments — 幂等与验签记录；external_id 唯一约束是 webhook 幂等键 */
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  bidId: uuid('bid_id').references(() => bids.id, { onDelete: 'set null' }),
  listingId: uuid('listing_id').references(() => listings.id, { onDelete: 'set null' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull(), // USD
  paymentMethod: text('payment_method').notNull(),
  externalId: text('external_id'), // YunGouOS transaction_id（幂等键）
  status: text('status').notNull().default('pending'),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
}, (t) => [
  uniqueIndex('uniq_payments_external').on(t.externalId),
]);

/** clicks — 防刷计数：同 ip 同 listing 每天只计 1 次 */
export const clicks = pgTable('clicks', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  ipHash: text('ip_hash').notNull(),
  day: date('day').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('uniq_clicks_ip_day').on(t.listingId, t.ipHash, t.day),
]);

/** daily_resets — 重置日志（reset_date 唯一 = 幂等） */
export const dailyResets = pgTable('daily_resets', {
  id: uuid('id').primaryKey().defaultRandom(),
  resetDate: date('reset_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('uniq_daily_resets_date').on(t.resetDate),
]);
