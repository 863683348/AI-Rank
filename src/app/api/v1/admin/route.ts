import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings } from '@/db/schema';
import { and, desc, eq, like, or, sql, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** 管理鉴权：比较 token 与 ADMIN_TOKEN 环境变量 */
function authed(req: NextRequest): boolean {
  const header = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const q = new URL(req.url).searchParams.get('token');
  const t = header || q;
  return !!t && t === process.env.ADMIN_TOKEN;
}

const UUID_RE = /^[0-9a-f-]{36}$/;
const VALID_STATUS = new Set(['pending', 'approved', 'rejected']);

const BASE_SELECT = {
  id: listings.id,
  url: listings.url,
  name: listings.name,
  description: listings.description,
  iconUrl: listings.iconUrl,
  category: listings.category,
  bidAmount: listings.bidAmount,
  verified: listings.verified,
  status: listings.status,
  reviewReason: listings.reviewReason,
  createdAt: listings.createdAt,
  updatedAt: listings.updatedAt,
};

/** GET /api/v1/admin — 审核列表（默认 pending，可加 ?status=approved|rejected|all&search=&ids=） */
export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status') ?? 'pending';
  const search = (url.searchParams.get('search') ?? '').trim().slice(0, 80);
  const idsParam = url.searchParams.get('ids');

  const conditions = [];
  if (statusFilter !== 'all') {
    if (!VALID_STATUS.has(statusFilter)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 });
    }
    conditions.push(eq(listings.status, statusFilter));
  }
  if (search) {
    const like_ = `%${search}%`;
    conditions.push(or(like(listings.name, like_), like(listings.url, like_)));
  }
  if (idsParam) {
    const ids = idsParam
      .split(',')
      .map((s) => s.trim())
      .filter((s) => UUID_RE.test(s));
    if (ids.length === 0) return NextResponse.json({ items: [] });
    conditions.push(inArray(listings.id, ids));
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select(BASE_SELECT)
    .from(listings)
    .where(where)
    .orderBy(desc(listings.createdAt))
    .limit(200);

  return NextResponse.json({
    items: rows.map((r) => ({
      ...r,
      bidAmount: Number(r.bidAmount),
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
    })),
  });
}

/** POST /api/v1/admin — 审核：approve|reject + 支持批量（listingIds[]） */
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: {
    action?: string;
    listingId?: string;
    listingIds?: string[];
    reason?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const { action, listingId, listingIds: batchIds, reason } = body;
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be approve|reject' }, { status: 400 });
  }

  // 收集目标 id：单条 + 批量并集去重
  const ids = new Set<string>();
  if (listingId && UUID_RE.test(listingId)) ids.add(listingId);
  if (Array.isArray(batchIds)) {
    for (const id of batchIds) if (typeof id === 'string' && UUID_RE.test(id)) ids.add(id);
  }
  if (ids.size === 0) {
    return NextResponse.json({ error: 'no valid listingId(s)' }, { status: 400 });
  }

  const now = new Date();
  const msg = (reason ?? '').trim().slice(0, 200) || '不符合上架规范';

  if (action === 'approve') {
    await db
      .update(listings)
      .set({ status: 'approved', reviewReason: null, updatedAt: now })
      .where(inArray(listings.id, [...ids]));
  } else {
    await db
      .update(listings)
      .set({ status: 'rejected', reviewReason: msg, updatedAt: now })
      .where(inArray(listings.id, [...ids]));
  }

  // 触发明细：同时 bump boardVersion 让 SSE 立刻推送
  await db
    .update(listings)
    .set({ boardVersion: sql`${listings.boardVersion} + 1` })
    .where(inArray(listings.id, [...ids]));

  return NextResponse.json({ ok: true, status: action, count: ids.size });
}