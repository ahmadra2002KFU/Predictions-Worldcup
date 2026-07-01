"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STAGE_LABELS, STATUS_LABELS } from "@/lib/labels";

interface Props {
  matchId: string;
  stage: string;
  status: string;
  venue: string;
  kickoffAtLocalRiyadh: string;
}

export function EditMatchForm({ matchId, stage, status, venue, kickoffAtLocalRiyadh }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ stage, status, venue, kickoffLocal: kickoffAtLocalRiyadh });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: form.stage,
          status: form.status,
          venue: form.venue,
          kickoffAt: new Date(`${form.kickoffLocal}+03:00`).toISOString(),
        }),
      });
      setMessage(res.ok ? "تم الحفظ" : "تعذر الحفظ");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-brand-100 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-brand-900/70">الدور</label>
          <select
            value={form.stage}
            onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
            className="w-full rounded-md border border-brand-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
          >
            {Object.entries(STAGE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-brand-900/70">الحالة</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="w-full rounded-md border border-brand-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-brand-900/70">موعد المباراة (بتوقيت الرياض)</label>
          <input
            type="datetime-local"
            value={form.kickoffLocal}
            onChange={(e) => setForm((f) => ({ ...f, kickoffLocal: e.target.value }))}
            className="w-full rounded-md border border-brand-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-brand-900/70">الملعب</label>
          <input
            value={form.venue}
            onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
            className="w-full rounded-md border border-brand-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        حفظ
      </button>
      {message && <span className="ms-3 text-sm text-brand-900/70">{message}</span>}
    </form>
  );
}
