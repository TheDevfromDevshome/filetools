"use client";

import { useEffect, useState } from "react";
import { SetupWizard } from "./SetupWizard";
import { LangProvider, type Lang } from "@/lib/i18n";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").trim();

export function SetupGate({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [lang, setLangState] = useState<Lang>("en");

  const setLang = async (l: Lang) => {
    setLangState(l);
    try {
      await fetch(`${API_URL}/api/v1/settings/language`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: l }),
      });
    } catch {}
  };

  useEffect(() => {
    fetch(`${API_URL}/api/v1/setup/status`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSetupComplete(d.data.setupComplete);
          setLang(d.data.language === "de" ? "de" : "en");
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  if (!setupComplete) {
    return <SetupWizard onComplete={(l) => { setLang(l); setSetupComplete(true); }} />;
  }

  return <LangProvider value={{ lang, setLang }}>{children}</LangProvider>;
}