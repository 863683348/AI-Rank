import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, bids } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createCheckout } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

/** POST /api/v1/listings/[id]/bid — 已上榜工具加价 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { amount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 1 || amount > 100000) {
    return NextResponse.json({ error: '竞价金额范围 1 - 100000' }, { status: 400 });
  }

  const [listing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!listing) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const [bid] = await db
    .insert(bids)
    .values({ listingId: id, amount: amount.toFixed(2), paymentMethod: 'stripe' })
    .returning();

  const origin = req.headers.get('origin') ?? new URL(req.url).origin;
  const checkout = await createCheckout({ bidId: bid.id, amount, name: listing.name, origin });

  return NextResponse.json({ checkoutUrl: checkout.url, bidId: bid.id });
}
