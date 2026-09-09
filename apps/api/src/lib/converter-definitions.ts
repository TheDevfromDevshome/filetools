import type { ConverterDefinition, ConverterCategory } from "@filetools/types";
import { registerConverter } from "../lib/converter-registry.js";

const VIDEO_FORMATS = ["mp4", "mov", "avi", "mkv", "webm", "wmv", "flv", "m4v", "mpeg", "mpg", "ts", "mts", "3gp", "ogv"];
const AUDIO_FORMATS = ["mp3", "wav", "ogg", "flac", "m4a", "aac", "opus", "wma", "aiff", "amr"];
const ARCHIVE_FORMATS = ["zip", "7z", "rar", "tar", "tgz", "gz", "bz2", "xz", "tbz2"];
const OFFICE_ALL = ["doc", "docx", "odt", "rtf", "txt", "html", "md", "epub", "xls", "xlsx", "ods", "csv", "ppt", "pptx", "odp", "pdf"];
const OFFICE_TEXT = ["doc", "docx", "odt", "rtf"];
const OFFICE_SHEET = ["xls", "xlsx", "ods"];
const OFFICE_SLIDE = ["ppt", "pptx", "odp"];
const IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "tif", "svg"];

function register(
  id: string,
  name: string,
  description: string,
  category: ConverterCategory,
  inputFormats: string[],
  outputFormats: string[],
  workerQueue: string,
  options: ConverterDefinition["options"] = []
): void {
  registerConverter(
    { id, name, description, category, inputFormats, outputFormats, options },
    workerQueue
  );
}

function registerImageConverters(): void {
  register("jpg-to-webp", "JPG to WebP", "Convert JPG images to WebP format", "image", ["jpg", "jpeg"], ["webp"], "image-convert", [
    { key: "quality", label: "Quality", type: "number", min: 1, max: 100, default: 80 },
  ]);
  register("png-to-webp", "PNG to WebP", "Convert PNG images to WebP format", "image", ["png"], ["webp"], "image-convert", [
    { key: "quality", label: "Quality", type: "number", min: 1, max: 100, default: 80 },
  ]);
  register("webp-to-jpg", "WebP to JPG", "Convert WebP images to JPG format", "image", ["webp"], ["jpg", "jpeg"], "image-convert", [
    { key: "quality", label: "Quality", type: "number", min: 1, max: 100, default: 85 },
  ]);
  register("webp-to-png", "WebP to PNG", "Convert WebP images to PNG format", "image", ["webp"], ["png"], "image-convert");
  register("png-to-jpg", "PNG to JPG", "Convert PNG images to JPG format", "image", ["png"], ["jpg", "jpeg"], "image-convert", [
    { key: "quality", label: "Quality", type: "number", min: 1, max: 100, default: 85 },
  ]);
  register("jpg-to-png", "JPG to PNG", "Convert JPG images to PNG format", "image", ["jpg", "jpeg"], ["png"], "image-convert");
  register("png-to-tiff", "PNG to TIFF", "Convert PNG images to TIFF format", "image", ["png"], ["tiff"], "image-convert");
  register("jpg-to-tiff", "JPG to TIFF", "Convert JPG images to TIFF format", "image", ["jpg", "jpeg"], ["tiff"], "image-convert");
  register("webp-to-tiff", "WebP to TIFF", "Convert WebP images to TIFF format", "image", ["webp"], ["tiff"], "image-convert");
  register("tiff-to-png", "TIFF to PNG", "Convert TIFF images to PNG format", "image", ["tiff", "tif"], ["png"], "image-convert");
  register("tiff-to-jpg", "TIFF to JPG", "Convert TIFF images to JPG format", "image", ["tiff", "tif"], ["jpg", "jpeg"], "image-convert", [
    { key: "quality", label: "Quality", type: "number", min: 1, max: 100, default: 85 },
  ]);
  register("png-to-bmp", "PNG to BMP", "Convert PNG images to BMP format", "image", ["png"], ["bmp"], "image-convert");
  register("jpg-to-bmp", "JPG to BMP", "Convert JPG images to BMP format", "image", ["jpg", "jpeg"], ["bmp"], "image-convert");
  register("webp-to-bmp", "WebP to BMP", "Convert WebP images to BMP format", "image", ["webp"], ["bmp"], "image-convert");
  register("bmp-to-png", "BMP to PNG", "Convert BMP images to PNG format", "image", ["bmp"], ["png"], "image-convert");
  register("gif-to-webp", "GIF to WebP", "Convert GIF images to WebP format", "image", ["gif"], ["webp"], "image-convert", [
    { key: "quality", label: "Quality", type: "number", min: 1, max: 100, default: 80 },
  ]);
  register("gif-to-png", "GIF to PNG", "Convert GIF images to PNG format", "image", ["gif"], ["png"], "image-convert");
  register("gif-to-jpg", "GIF to JPG", "Convert GIF images to JPG format", "image", ["gif"], ["jpg", "jpeg"], "image-convert", [
    { key: "quality", label: "Quality", type: "number", min: 1, max: 100, default: 85 },
  ]);
  register("svg-to-png", "SVG to PNG", "Convert SVG images to PNG format", "image", ["svg"], ["png"], "image-convert");
  register("svg-to-jpg", "SVG to JPG", "Convert SVG images to JPG format", "image", ["svg"], ["jpg", "jpeg"], "image-convert", [
    { key: "quality", label: "Quality", type: "number", min: 1, max: 100, default: 85 },
  ]);
}

function registerPdfConverters(): void {
  // PDF → Images
  register("pdf-to-jpg", "PDF to JPG", "Convert PDF pages to JPG images", "pdf", ["pdf"], ["jpg", "jpeg"], "pdf-convert", [
    { key: "quality", label: "Quality", type: "number", min: 72, max: 300, default: 150 },
  ]);
  register("pdf-to-png", "PDF to PNG", "Convert PDF pages to PNG images", "pdf", ["pdf"], ["png"], "pdf-convert", [
    { key: "quality", label: "DPI", type: "number", min: 72, max: 300, default: 150 },
  ]);

  // Images → PDF
  register("jpg-to-pdf", "JPG to PDF", "Convert JPG images to PDF document", "pdf", ["jpg", "jpeg"], ["pdf"], "pdf-convert");
  register("png-to-pdf", "PNG to PDF", "Convert PNG images to PDF document", "pdf", ["png"], ["pdf"], "pdf-convert");
  register("webp-to-pdf", "WebP to PDF", "Convert WebP images to PDF document", "pdf", ["webp"], ["pdf"], "pdf-convert");
  register("gif-to-pdf", "GIF to PDF", "Convert GIF images to PDF document", "pdf", ["gif"], ["pdf"], "pdf-convert");
  register("tiff-to-pdf", "TIFF to PDF", "Convert TIFF images to PDF document", "pdf", ["tiff", "tif"], ["pdf"], "pdf-convert");

  // PDF → Text
  register("pdf-to-txt", "PDF to Text", "Extract text from PDF documents", "pdf", ["pdf"], ["txt"], "pdf-convert");

  // PDF processing tools (merge, split, rotate, compress, protect, unlock, watermark, extract pages)
  register("pdf-merge", "Merge PDFs", "Merge multiple PDF documents into one", "pdf", ["pdf"], ["pdf"], "pdf-convert");
  register("pdf-split", "Split PDF", "Split a PDF into separate pages", "pdf", ["pdf"], ["pdf"], "pdf-convert");
  register("pdf-rotate", "Rotate PDF", "Rotate PDF pages by a given angle", "pdf", ["pdf"], ["pdf"], "pdf-convert", [
    { key: "angle", label: "Angle", type: "select", default: 90, options: [
      { label: "90° clockwise", value: 90 },
      { label: "180°", value: 180 },
      { label: "270° clockwise", value: 270 },
    ] },
  ]);
  register("pdf-compress", "Compress PDF", "Compress PDF file size using qpdf", "pdf", ["pdf"], ["pdf"], "pdf-convert");
  register("pdf-protect", "Protect PDF", "Lock PDF with a password", "pdf", ["pdf"], ["pdf"], "pdf-convert", [
    { key: "password", label: "Password", type: "text", default: "" },
  ]);
  register("pdf-unlock", "Unlock PDF", "Remove password protection from a PDF", "pdf", ["pdf"], ["pdf"], "pdf-convert", [
    { key: "password", label: "Password (if known)", type: "text", default: "" },
  ]);
  register("pdf-watermark", "Add Watermark", "Add a text watermark to every page", "pdf", ["pdf"], ["pdf"], "pdf-convert", [
    { key: "text", label: "Watermark text", type: "text", default: "CONFIDENTIAL" },
  ]);
  register("pdf-extract", "Extract Pages", "Extract a range of pages from a PDF", "pdf", ["pdf"], ["pdf"], "pdf-convert", [
    { key: "range", label: "Page range (e.g. 1-3,5)", type: "text", default: "1" },
  ]);
}

function registerVideoConverters(): void {
  const videoTo = (
    to: string,
    name: string,
    extraOptions: ConverterDefinition["options"] = []
  ): void => {
    register(
      `video-to-${to}`,
      name,
      `Convert video files to ${to.toUpperCase()}`,
      "video",
      VIDEO_FORMATS,
      [to],
      "media-convert",
      [
        { key: "quality", label: "CRF (lower = better)", type: "number", min: 16, max: 40, default: 23 },
        ...extraOptions,
      ]
    );
  };

  videoTo("mp4", "Video to MP4");
  videoTo("webm", "Video to WebM");
  videoTo("mkv", "Video to MKV");
  videoTo("mov", "Video to MOV");
  videoTo("avi", "Video to AVI");
  videoTo("gif", "Video to GIF", [
    { key: "fps", label: "Frame rate (fps)", type: "number", min: 5, max: 30, default: 10 },
  ]);

  const audioOf = (
    to: string,
    name: string,
    fromFormats: string[]
  ): void => {
    register(
      `audio-to-${to}`,
      name,
      `Convert ${fromFormats.length > 8 ? "audio/video" : "audio"} files to ${to.toUpperCase()}`,
      "audio",
      fromFormats,
      [to],
      "media-convert",
      [
        { key: "bitrate", label: "Bitrate (kbps)", type: "number", min: 64, max: 320, default: 192 },
      ]
    );
  };

  audioOf("mp3", "Audio to MP3", [...AUDIO_FORMATS, ...VIDEO_FORMATS]);
  audioOf("wav", "Audio to WAV", [...AUDIO_FORMATS, ...VIDEO_FORMATS]);
  audioOf("flac", "Audio to FLAC", [...AUDIO_FORMATS, ...VIDEO_FORMATS]);
  audioOf("ogg", "Audio to OGG", [...AUDIO_FORMATS, ...VIDEO_FORMATS]);
  audioOf("m4a", "Audio to M4A", [...AUDIO_FORMATS, ...VIDEO_FORMATS]);
  audioOf("aac", "Audio to AAC", [...AUDIO_FORMATS, ...VIDEO_FORMATS]);
  audioOf("opus", "Audio to Opus", [...AUDIO_FORMATS, ...VIDEO_FORMATS]);
}

function registerArchiveConverters(): void {
  const keys: Array<{ to: string; label: string }> = [
    { to: "zip", label: "ZIP" },
    { to: "7z", label: "7Z" },
    { to: "tar", label: "TAR" },
    { to: "tgz", label: "TAR.GZ" },
    { to: "tbz2", label: "TAR.BZ2" },
  ];

  for (const { to, label } of keys) {
    const inputs = ARCHIVE_FORMATS.filter((f) => {
      const norm = f.replace(".", "").replace("-", "");
      return `${to}` !== norm && to !== f && !(to === "tbz2" && f === "tar.bz2") && !(to === "tgz" && f === "tgz");
    });
    register(
      `archive-to-${to}`,
      `Archive to ${label}`,
      `Re-package archive files to ${label}`,
      "archive",
      inputs,
      [to],
      "archive-convert"
    );
  }
}

function registerDocumentConverters(): void {
  const docTo = (to: string, name: string, inputs: string[]): void => {
    register(
      `document-to-${to}`,
      name,
      `Convert documents to ${to.toUpperCase()}`,
      "document",
      inputs,
      [to],
      "document-convert"
    );
  };

  // Everything → PDF (via LibreOffice)
  docTo("pdf", "Document to PDF", OFFICE_ALL.filter((f) => f !== "pdf"));

  // Word-family → other word-family formats
  const wordInputs = ["doc", "docx", "odt", "rtf", "txt", "html", "md", "epub"];
  docTo("docx", "Document to DOCX (Word)", wordInputs.filter((f) => f !== "docx"));
  docTo("odt", "Document to ODT", wordInputs.filter((f) => f !== "odt"));
  docTo("rtf", "Document to RTF", ["doc", "docx", "odt", "txt", "html", "md", "epub"]);

  // Spreadsheets
  docTo("xlsx", "Spreadsheet to XLSX (Excel)", ["xls", "ods", "csv"]);
  docTo("ods", "Spreadsheet to ODS", ["xls", "xlsx", "csv"]);
  docTo("csv", "Spreadsheet to CSV", ["xls", "xlsx", "ods"]);

  // Presentations
  docTo("pptx", "Slides to PPTX", ["ppt", "odp"]);
  docTo("odp", "Slides to ODP", ["ppt", "pptx"]);

  // PDF → editable documents
  // Disabled: LibreOffice 26.8's writer_pdf_import hangs on this machine,
  // making pdf→docx/pdf→odt unreliable. Re-enable once a working build is available.
  // register("pdf-to-docx", "PDF to DOCX", "Convert PDF to a Word document (OCR available)", "pdf", ["pdf"], ["docx"], "document-convert");
  // register("pdf-to-odt", "PDF to ODT", "Convert PDF to an OpenDocument text", "pdf", ["pdf"], ["odt"], "document-convert");
}

export function registerAllConverters(): void {
  registerImageConverters();
  registerPdfConverters();
  registerVideoConverters();
  registerArchiveConverters();
  registerDocumentConverters();
}