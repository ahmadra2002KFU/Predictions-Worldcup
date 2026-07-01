"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useRealtimeChannel } from "@/hooks/useRealtimeBus";
import type { ChatMessageDTO } from "@/lib/realtime";

interface Props {
  matchId: string;
  canSend: boolean;
}

export function ChatPanel({ matchId, canSend }: Props) {
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/chat/${matchId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setMessages(data.messages ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  useRealtimeChannel<{ matchId: string; message: ChatMessageDTO }>("chat", (data) => {
    if (data.matchId !== matchId) return;
    setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;

    setError(null);
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      if (!res.ok) {
        setError(res.status === 429 ? "أرسل رسائل ببطء أكثر" : "تعذر إرسال الرسالة");
        return;
      }
      setBody("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-brand-100">
      <div className="flex max-h-80 flex-col gap-2 overflow-y-auto p-4">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm"
          >
            <span className="font-semibold text-brand-700">{m.displayName}: </span>
            <span className="text-brand-900/80">{m.body}</span>
          </motion.div>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-sm text-brand-900/40">لا توجد رسائل بعد</p>
        )}
        <div ref={bottomRef} />
      </div>
      {canSend && (
        <form onSubmit={handleSend} className="flex gap-2 border-t border-brand-100 p-3">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={500}
            placeholder="اكتب رسالة..."
            className="flex-1 rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            إرسال
          </button>
        </form>
      )}
      {error && <p className="px-3 pb-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
