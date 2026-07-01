"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RecoverForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, email }),
      });

      if (!res.ok) {
        if (res.status === 404) setError("لم نجد حساباً مطابقاً لهذا البريد الإلكتروني");
        else if (res.status === 429) setError("محاولات كثيرة جداً، حاول لاحقاً");
        else setError("حدث خطأ، حاول مرة أخرى");
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 text-start">
      <div>
        <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-brand-900">
          الاسم
        </label>
        <input
          id="displayName"
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-lg border border-brand-200 px-4 py-2.5 text-brand-900 outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-brand-900">
          البريد الإلكتروني المسجّل
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-brand-200 px-4 py-2.5 text-brand-900 outline-none focus:border-brand-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "جارٍ الاسترجاع..." : "استرجاع الحساب"}
      </button>
    </form>
  );
}
