"use client";

import type { Converter } from "@/lib/api";

interface ToolCardProps {
  converter: Converter;
  onStart: (converter: Converter) => void;
}

export function ToolCard({ converter, onStart }: ToolCardProps) {
  const inputFmt = converter.inputFormats[0]?.toUpperCase() || "?";
  const outputFmt = converter.outputFormats[0]?.toUpperCase() || "?";

  const categoryColors: Record<string, string> = {
    image: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    pdf: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    audio: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    video: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    archive: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    document: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  };

  return (
    <div className="card group cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-brand-500">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {inputFmt}
            </span>
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {outputFmt}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {converter.description}
          </p>

          <span
            className={`mt-3 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[converter.category] || ""}`}
          >
            {converter.category}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onStart(converter);
          }}
          className="btn-primary ml-4 shrink-0"
        >
          Start
        </button>
      </div>
    </div>
  );
}
