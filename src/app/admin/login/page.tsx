import { AdminLoginForm } from "@/components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-surface px-6 py-24 text-center">
      <h1 className="text-2xl font-bold text-brand-700">دخول المسؤول</h1>
      <AdminLoginForm />
    </div>
  );
}
