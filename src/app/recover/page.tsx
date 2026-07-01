import { RecoverForm } from "@/components/RecoverForm";

export default function RecoverPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-surface px-6 py-24 text-center">
      <h1 className="text-2xl font-bold text-brand-700">استرجاع الحساب</h1>
      <p className="max-w-sm text-brand-900/70">
        أدخل اسمك والبريد الإلكتروني الذي سجّلت به لاسترجاع حسابك على هذا الجهاز.
      </p>
      <RecoverForm />
    </div>
  );
}
