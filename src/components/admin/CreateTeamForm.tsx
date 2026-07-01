"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateTeamForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [flagEmoji, setFlagEmoji] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nameEn: nameEn || undefined, flagEmoji: flagEmoji || undefined }),
      });
      if (!res.ok) {
        setError("تعذر إضافة الفريق");
        return;
      }
      setName("");
      setNameEn("");
      setFlagEmoji("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-brand-100 p-4">
      <div>
        <label className="mb-1 block text-xs text-brand-900/70">اسم الفريق (عربي)</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-brand-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-brand-900/70">الاسم بالإنجليزية (اختياري)</label>
        <input
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          className="rounded-md border border-brand-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-brand-900/70">رمز الدولة</label>
        <input
          value={flagEmoji}
          onChange={(e) => setFlagEmoji(e.target.value)}
          className="w-20 rounded-md border border-brand-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
          placeholder="SA"
          maxLength={2}
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        إضافة فريق
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
