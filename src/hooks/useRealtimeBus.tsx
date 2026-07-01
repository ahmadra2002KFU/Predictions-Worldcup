"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const RealtimeContext = createContext<EventTarget | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  // Lazy useState gives a single stable EventTarget instance without touching a
  // ref during render.
  const [target] = useState(() => new EventTarget());

  useEffect(() => {
    const es = new EventSource("/api/sse");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        target.dispatchEvent(new CustomEvent(data.channel, { detail: data }));
      } catch {
        // ignore malformed frames
      }
    };
    return () => es.close();
  }, [target]);

  return <RealtimeContext.Provider value={target}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeChannel<T>(channel: string, onEvent: (data: T) => void) {
  const target = useContext(RealtimeContext);

  useEffect(() => {
    if (!target) return;
    const handler = (e: Event) => onEvent((e as CustomEvent).detail as T);
    target.addEventListener(channel, handler);
    return () => target.removeEventListener(channel, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, channel]);
}
