/**
 * 单例 EventSource：整个 app 只维护一条 SSE 连接，
 * 多个组件订阅同一连接，避免路由切换时重复建立/关闭连接。
 */

type Listener<T = unknown> = (data: T) => void;

type BoardPayload = { listings: any[] };

let es: EventSource | null = null;
let refs = 0;
const boardListeners = new Set<Listener<BoardPayload>>();
const liveListeners = new Set<Listener<void>>();
const errorListeners = new Set<Listener<void>>();

function ensure(): void {
  if (es || typeof window === "undefined") return;
  es = new EventSource("/api/v1/stream");
  es.addEventListener("open", () => liveListeners.forEach((fn) => fn()));
  es.addEventListener("board", (e) => {
    let parsed: BoardPayload = { listings: [] };
    try {
      parsed = JSON.parse((e as MessageEvent).data);
    } catch {
      // ignore malformed payload
    }
    boardListeners.forEach((fn) => fn(parsed));
  });
  es.addEventListener("error", () => errorListeners.forEach((fn) => fn()));
}

function teardown(): void {
  if (refs > 0) return;
  es?.close();
  es = null;
  boardListeners.clear();
  liveListeners.clear();
  errorListeners.clear();
}

export function subscribeBoard(fn: Listener<BoardPayload>): () => void {
  ensure();
  boardListeners.add(fn);
  refs++;
  return () => {
    boardListeners.delete(fn);
    refs--;
    if (refs === 0) teardown();
  };
}

export function subscribeLive(fn: Listener<void>): () => void {
  ensure();
  liveListeners.add(fn);
  refs++;
  return () => {
    liveListeners.delete(fn);
    refs--;
    if (refs === 0) teardown();
  };
}

export function subscribeError(fn: Listener<void>): () => void {
  ensure();
  errorListeners.add(fn);
  refs++;
  return () => {
    errorListeners.delete(fn);
    refs--;
    if (refs === 0) teardown();
  };
}