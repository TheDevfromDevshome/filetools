"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";

interface ConvertOptionsProps {
  converterId: string;
  options: Array<{
    key: string;
    label: string;
    type: string;
    min?: number;
    max?: number;
    default: unknown;
    options?: { label: string; value: unknown }[];
  }>;
  onOptionsChange: (options: Record<string, unknown>) => void;
}

export function ConvertOptions({ converterId, options, onOptionsChange }: ConvertOptionsProps) {
  const t = useT();
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const opt of options) {
      initial[opt.key] = opt.default;
    }
    return initial;
  });

  if (options.length === 0) return null;

  const handleChange = (key: string, value: unknown) => {
    const newValues = { ...values, [key]: value };
    setValues(newValues);
    onOptionsChange(newValues);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
      <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
        {t.optionsTitle}
      </h3>
      <div className="space-y-3">
        {options.map((opt) => (
          <div key={opt.key} className="flex items-center justify-between gap-4">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              {opt.label}
            </label>
            {opt.type === "number" ? (
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={opt.min ?? 0}
                  max={opt.max ?? 100}
                  value={Number(values[opt.key] ?? opt.default)}
                  onChange={(e) => handleChange(opt.key, parseInt(e.target.value))}
                  className="w-32 accent-brand-600"
                />
                <span className="w-10 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                  {String(values[opt.key] ?? opt.default)}
                </span>
              </div>
            ) : opt.type === "text" ? (
              <input
                type="text"
                value={String(values[opt.key] ?? opt.default ?? "")}
                onChange={(e) => handleChange(opt.key, e.target.value)}
                className="w-48 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              />
            ) : opt.type === "select" ? (
              <select
                value={String(values[opt.key] ?? opt.default)}
                onChange={(e) => {
                  const selectedDef = options.find((o) => o.key === opt.key);
                  const selectedOpt = selectedDef?.options?.find((o) => String(o.value) === e.target.value);
                  handleChange(opt.key, selectedOpt ? selectedOpt.value : e.target.value);
                }}
                className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              >
                {(opt.options ?? []).map((option) => (
                  <option key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : opt.type === "boolean" ? (
              <button
                onClick={() => handleChange(opt.key, !values[opt.key])}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  values[opt.key] ? "bg-brand-600" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    values[opt.key] ? "translate-x-5" : ""
                  }`}
                />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
