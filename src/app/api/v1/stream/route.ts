import { NextRequest } from 'next/server';
import { db } from '@/db';
import { listings } from '@/db/schema';
import { desc, gt, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/stream — SSE 榜单实时推送
 * 每 2 秒轮询 board_version，变化才推全量榜单（MVP 够用，Neon HTTP driver 无原生 LISTEN）
 */
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastVersion = -1;
      let closed = false;
      const close = () => {
        closed = true;
        try { controller.close(); } catch { /* already closed */ }
      };
      req.signal.addEventListener('abort', close);

      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // 初始版本号
      const [first] = await db
        .select({ v: listings.boardVersion })
        .from(listings)
        .orderBy(desc(listings.boardVersion))
        .limit(1);
      lastVersion = first?.v ?? 0;

      while (!closed) {
        try {
          await new Promise((r) => setTimeout(r, 2000));
          if (closed) break;

          const [latest] = await db
            .select({ v: listings.boardVersion })
            .from(listings)
            .where(gt(listings.boardVersion, lastVersion))
            .orderBy(desc(listings.boardVersion))
            .limit(1);

          if (latest) {
            lastVersion = latest.v;
            const board = await db
              .select({
                id: listings.id,
                name: listings.name,
                url: listings.url,
                iconUrl: listings.iconUrl,
                bidAmount: listings.bidAmount,
                totalClicks: listings.totalClicks,
                lastBidAt: listings.lastBidAt,
              })
              .from(listings)
              .where(eq(listings.status, 'approved'))
              .orderBy(desc(listings.bidAmount), desc(listings.lastBidAt))
              .limit(100);
            send('board', { listings: board, version: lastVersion });
          }
        } catch {
          break;
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
