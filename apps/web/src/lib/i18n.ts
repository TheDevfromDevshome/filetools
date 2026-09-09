"use client";

import { createContext, useContext } from "react";

export type Lang = "en" | "de";

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

interface TranslationStrings {
  headerTitle1: string;
  headerTitle2: string;
  headerSubtitle: string;
  headerPrivacy: string;
  allTools: string;
  filterTools: (cat: string) => string;
  category: Record<string, string>;
  dropHere: string;
  clickToBrowse: string;
  filesSelected: (n: number) => string;
  chooseTool: string;
  noConverters: string;
  back: string;
  options: string;
  convertButton: (n: number) => string;
  uploading: string;
  queued: string;
  processing: string;
  complete: string;
  failed: string;
  downloadResults: string;
  filesGenerated: (n: number) => string;
  downloadAllZip: string;
  downloadFirst: string;
  download: string;
  convertMore: string;
  footerText: string;
  footerPrivacy: string;
  optionsTitle: string;
  total: string;
  size: string;
  categoryTitle: string;
}

const translations: Record<Lang, TranslationStrings> = {
  en: {
    headerTitle1: "File",
    headerTitle2: "Tools",
    headerSubtitle: "Convert your files. Fast. Private. Self-hosted.",
    headerPrivacy: "Your files are processed on our servers and automatically deleted after processing.",
    allTools: "All Tools",
    filterTools: (cat) => `${cat} Tools`,
    dropHere: "Drop files here",
    clickToBrowse: "or click to browse",
    filesSelected: (n) => `${n} file${n !== 1 ? "s" : ""} selected`,
    chooseTool: "Choose a tool below to start converting.",
    noConverters: "No converters available in this category.",
    back: "← Back",
    options: "Options",
    convertButton: (n) => `Convert ${n} file${n !== 1 ? "s" : ""}`,
    uploading: "Uploading...",
    queued: "Queued...",
    processing: "Processing...",
    complete: "Complete",
    failed: "Failed",
    downloadResults: "Download results",
    filesGenerated: (n) => `${n} file${n !== 1 ? "s" : ""} generated`,
    downloadAllZip: "Download all as ZIP",
    downloadFirst: "Download first file only",
    download: "Download",
    convertMore: "Convert more files",
    footerText: "FileTools — Self-hosted file converter platform",
    footerPrivacy: "Your files stay private. No tracking. No ads.",
    category: {
      all: "All Tools",
      image: "Image Tools",
      pdf: "PDF Tools",
      audio: "Audio Tools",
      video: "Video Tools",
      archive: "Archive Tools",
      document: "Document Tools",
    },
    optionsTitle: "Options",
    total: "Total:",
    size: "Size",
    categoryTitle: "Tools",
  },
  de: {
    headerTitle1: "Datei",
    headerTitle2: "Tools",
    headerSubtitle: "Dateien konvertieren. Schnell. Privat. Selbst gehostet.",
    headerPrivacy: "Dateien werden auf unseren Servern verarbeitet und nach der Verarbeitung automatisch gelöscht.",
    allTools: "Alle Werkzeuge",
    filterTools: (cat) => `${cat}-Werkzeuge`,
    dropHere: "Dateien hier ablegen",
    clickToBrowse: "oder klicken zum Durchsuchen",
    filesSelected: (n) => `${n} Datei${n !== 1 ? "en" : ""} ausgewählt`,
    chooseTool: "Wählen Sie ein Werkzeug zum Konvertieren.",
    noConverters: "Keine Werkzeuge in dieser Kategorie verfügbar.",
    back: "← Zurück",
    options: "Optionen",
    convertButton: (n) => `${n} Datei${n !== 1 ? "en" : ""} konvertieren`,
    uploading: "Hochladen...",
    queued: "In Warteschlange...",
    processing: "Verarbeitung...",
    complete: "Fertig",
    failed: "Fehlgeschlagen",
    downloadResults: "Ergebnisse herunterladen",
    filesGenerated: (n) => `${n} Datei${n !== 1 ? "en" : ""} erstellt`,
    downloadAllZip: "Alle als ZIP herunterladen",
    downloadFirst: "Nur erste Datei herunterladen",
    download: "Herunterladen",
    convertMore: "Weitere Dateien konvertieren",
    footerText: "FileTools — Self-hosted Dateikonverter",
    footerPrivacy: "Ihre Dateien bleiben privat. Kein Tracking. Keine Werbung.",
    category: {
      all: "Alle Werkzeuge",
      image: "Bild-Werkzeuge",
      pdf: "PDF-Werkzeuge",
      audio: "Audio-Werkzeuge",
      video: "Video-Werkzeuge",
      archive: "Archiv-Werkzeuge",
      document: "Dokument-Werkzeuge",
    },
    optionsTitle: "Optionen",
    total: "Gesamt:",
    size: "Größe",
    categoryTitle: "Werkzeuge",
  },
};

const LangCtx = createContext<LangContextValue>({ lang: "en", setLang: () => {} });
export const LangProvider = LangCtx.Provider;

export function useLang(): LangContextValue {
  return useContext(LangCtx);
}

export function useT(): TranslationStrings {
  const { lang } = useLang();
  return translations[lang] ?? translations.en;
}
