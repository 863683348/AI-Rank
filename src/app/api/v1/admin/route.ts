import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** 管理鉴权：比较 token 与 ADMIN_TOKEN 环境变量 */
function authed(req: NextRequest): boolean {
  const header = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const q = new URL(req.url).searchParams.get('token');
  const t = header || q;
  return !!t && t === process.env.ADMIN_TOKEN;
}

/** GET /api/v1/admin — 拉取待审核（pending）与最近处理（approved/rejected）条目 */
export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const pending = await db
    .select({
      id: listings.id,
      url: listings.url,
      name: listings.name,
      description: listings.description,
      iconUrl: listings.iconUrl,
      category: listings.category,
      bidAmount: listings.bidAmount,
      verified: listings.verified,
      createdAt: listings.createdAt,
    })
    .from(listings)
    .where(eq(listings.status, 'pending'))
    .orderBy(desc(listings.createdAt))
    .limit(100);

  return NextResponse.json({
    pending: pending.map((r) => ({
      ...r,
      bidAmount: Number(r.bidAmount),
      createdAt: new Date(r.createdAt).toISOString(),
    })),
  });
}

/** POST /api/v1/admin — 审核：approve → approved；reject → rejected + reason */
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: { action?: string; listingId?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const { action, listingId, reason } = body;
  if (!listingId || !/^[0-9a-f-]{36}$/.test(listingId)) {
    return NextResponse.json({ error: 'invalid listingId' }, { status: 400 });
  }

  if (action === 'approve') {
    await db
      .update(listings)
      .set({ status: 'approved', reviewReason: null, updatedAt: new Date() })
      .where(eq(listings.id, listingId));
    return NextResponse.json({ ok: true, status: 'approved' });
  }

  if (action === 'reject') {
    const msg = (reason ?? '').trim().slice(0, 200) || '不符合上架规范';
    await db
      .update(listings)
      .set({ status: 'rejected', reviewReason: msg, updatedAt: new Date() })
      .where(eq(listings.id, listingId));
    return NextResponse.json({ ok: true, status: 'rejected' });
  }

  return NextResponse.json({ error: 'action must be approve|reject' }, { status: 400 });
}
