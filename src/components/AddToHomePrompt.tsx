"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISSED_STORAGE_KEY = "addToHome.dismissed.v1";
const INSTALLED_STORAGE_KEY = "addToHome.installed.v1";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function AddToHomePrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(INSTALLED_STORAGE_KEY) === "true") return;
    if (localStorage.getItem(DISMISSED_STORAGE_KEY) === "true") return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onAppInstalled = () => {
      localStorage.setItem(INSTALLED_STORAGE_KEY, "true");
      setVisible(false);
      setInstallPrompt(null);
      setShowIosHelp(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    if (isIos()) {
      const timer = window.setTimeout(() => {
        if (!isStandalone() && localStorage.getItem(DISMISSED_STORAGE_KEY) !== "true") {
          setShowIosHelp(true);
          setVisible(true);
        }
      }, 1500);

      return () => {
        window.clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        window.removeEventListener("appinstalled", onAppInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) {
      setShowIosHelp(true);
      setVisible(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (choice.outcome === "accepted") {
      localStorage.setItem(INSTALLED_STORAGE_KEY, "true");
      setVisible(false);
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_STORAGE_KEY, "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-2xl border border-brand-200 bg-surface p-4 text-start shadow-2xl shadow-black/20">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-xl">📲</div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-brand-900">أضف توقعات مفيد للشاشة الرئيسية</h2>
          <p className="mt-1 text-xs leading-5 text-brand-900/60">
            افتحها كتطبيق سريع حتى لا تنسى إدخال توقعاتك قبل المباريات.
          </p>
          {showIosHelp && !installPrompt && (
            <p className="mt-2 rounded-xl bg-brand-50 px-3 py-2 text-xs leading-5 text-brand-900/70">
              على iPhone: اضغط زر المشاركة ثم اختر “إضافة إلى الشاشة الرئيسية”.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={install}
              className="rounded-full bg-brand-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-700"
            >
              أضف للتطبيق
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              لاحقاً
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
