"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [nameTaken, setNameTaken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = displayName.trim();
    debounceRef.current = setTimeout(async () => {
      if (!trimmed) {
        setNameTaken(false);
        return;
      }
      try {
        const res = await fetch(`/api/register/check-name?name=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setNameTaken(Boolean(data.taken));
      } catch {
        // advisory only — ignore failures
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [displayName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!agreedToRules) {
      setError("يجب الموافقة على القوانين أولاً");
      return;
    }

    if (!email.trim()) {
      setError("البريد الإلكتروني مطلوب لحفظ حسابك ونقاطك");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, email, agreedToRules }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) setError("محاولات كثيرة جداً، حاول لاحقاً");
        else if (res.status === 409 || data.error === "email_taken") setError("هذا البريد مسجل مسبقاً — استخدم استعادة الحساب");
        else if (data.issues?.[0]?.message) setError(data.issues[0].message);
        else setError("حدث خطأ، حاول مرة أخرى");
        return;
      }

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
          maxLength={60}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-lg border border-brand-200 px-4 py-2.5 text-brand-900 outline-none focus:border-brand-500"
          placeholder="اكتب اسمك"
        />
        {nameTaken && (
          <p className="mt-1 text-sm text-brand-500">
            يوجد مستخدم آخر بهذا الاسم — يمكنك المتابعة
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-brand-900">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-brand-200 px-4 py-2.5 text-brand-900 outline-none focus:border-brand-500"
          placeholder="example@email.com"
        />
        <p className="mt-1 text-xs text-brand-900/50">
          سيتم ربط حسابك ونتائجك بهذا البريد حتى لا تفقد الوصول إليها.
        </p>
      </div>

      <label className="flex items-start gap-2 text-sm text-brand-900/80">
        <input
          type="checkbox"
          checked={agreedToRules}
          onChange={(e) => setAgreedToRules(e.target.checked)}
          className="mt-1"
        />
        <span>
          أوافق على{" "}
          <Link href="/rules" target="_blank" className="font-medium text-brand-600 underline">
            القوانين والشروط
          </Link>
          ، بما في ذلك حفظ سجلات الدخول لكشف الغش.
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !displayName.trim() || !email.trim() || !agreedToRules}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "جارٍ التسجيل..." : "تسجيل"}
      </button>
    </form>
  );
}
