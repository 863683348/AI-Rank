import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, bids } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/v1/listings/[id] — 详情 + 公开竞价历史 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [listing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!listing) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const history = await db
    .select({
      id: bids.id,
      amount: bids.amount,
      paymentMethod: bids.paymentMethod,
      status: bids.status,
      createdAt: bids.createdAt,
    })
    .from(bids)
    .where(eq(bids.listingId, id))
    .orderBy(desc(bids.createdAt))
    .limit(50);

  return NextResponse.json({ listing, history });
}
