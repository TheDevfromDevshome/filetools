"use client";

import { useState } from "react";
import type { Lang } from "@/lib/i18n";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").trim();

export function SetupWizard({ onComplete }: { onComplete: (lang: Lang) => void }) {
  const [step, setStep] = useState<"lang" | "domain">("lang");
  const [lang, setLang] = useState<Lang>("en");
  const [domain, setDomain] = useState("filetools.local");
  const [customDomain, setCustomDomain] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);

  const useCustom = domain === "custom";

  const handleDomainNext = async () => {
    const finalDomain = useCustom ? customDomain.trim() : domain;
    if (!finalDomain) {
      setError(lang === "de" ? "Bitte geben Sie einen Domain-Namen ein" : "Please enter a domain name");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang, domainName: finalDomain }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSavedUrl(data.data.baseUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (savedUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 dark:border-green-900 dark:bg-green-950">
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">
              {lang === "de" ? "Einrichtung abgeschlossen!" : "Setup complete!"}
            </h2>
            <p className="mt-3 text-sm text-green-700 dark:text-green-300">
              {lang === "de" ? "Öffnen Sie FileTools über:" : "Open FileTools at:"}
            </p>
            <a
              href={savedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-lg font-mono text-green-900 underline decoration-green-400 dark:text-green-100 dark:decoration-green-700"
            >
              {savedUrl}
            </a>
            <button
              onClick={() => onComplete(lang)}
              className="mt-6 w-full rounded-xl bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700"
            >
              {lang === "de" ? "Loslegen" : "Get Started"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            File<span className="text-brand-600">Tools</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {lang === "de"
              ? "Willkommen! Bitte richten Sie FileTools ein."
              : "Welcome! Let's set up FileTools."}
          </p>
        </div>

        {/* Step: Language */}
        {step === "lang" && (
          <div className="space-y-6">
            <h2 className="text-center text-lg font-medium text-gray-800 dark:text-gray-200">
              {lang === "de" ? "Sprache wählen" : "Choose your language"}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setLang("en"); setStep("domain"); }}
                className={`rounded-xl border-2 p-6 text-center transition-all ${
                  lang === "en"
                    ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-950"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                }`}
              >
                <span className="text-2xl">🇬🇧</span>
                <p className="mt-2 font-medium text-gray-800 dark:text-gray-200">English</p>
              </button>
              <button
                onClick={() => { setLang("de"); setStep("domain"); }}
                className={`rounded-xl border-2 p-6 text-center transition-all ${
                  lang === "de"
                    ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-950"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                }`}
              >
                <span className="text-2xl">🇩🇪</span>
                <p className="mt-2 font-medium text-gray-800 dark:text-gray-200">Deutsch</p>
              </button>
            </div>
          </div>
        )}

        {/* Step: Domain */}
        {step === "domain" && (
          <div className="space-y-6">
            <div>
              <button onClick={() => setStep("lang")} className="text-sm text-brand-600 hover:text-brand-700">
                {lang === "de" ? "← Zurück" : "← Back"}
              </button>
              <h2 className="mt-2 text-center text-lg font-medium text-gray-800 dark:text-gray-200">
                {lang === "de" ? "Domain-Name wählen" : "Choose your domain name"}
              </h2>
              <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
                {lang === "de"
                  ? "Wird im Netzwerk für den Zugriff verwendet"
                  : "Used to access FileTools on your network"}
              </p>
            </div>

            <div className="space-y-3">
              {["filetools.local", "converter.local", "custom"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setDomain(opt)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                    domain === opt
                      ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-950"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                >
                  {opt === "custom" ? (
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {lang === "de" ? "Eigener Name…" : "Custom name…"}
                    </span>
                  ) : (
                    <span className="font-mono font-medium text-gray-800 dark:text-gray-200">{opt}</span>
                  )}
                </button>
              ))}
            </div>

            {useCustom && (
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="meine-app.local"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-mono text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              />
            )}

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              onClick={handleDomainNext}
              disabled={saving}
              className="w-full rounded-xl bg-brand-600 px-6 py-3 font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {saving
                ? (lang === "de" ? "Speichern…" : "Saving…")
                : (lang === "de" ? "Einrichtung abschließen" : "Complete setup")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
