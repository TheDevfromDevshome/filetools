import { describe, it, expect, beforeEach } from "vitest";
import { registerConverter, getConverter, getAllConverters, getConvertersByCategory, findConverter, getWorkerQueue } from "../src/lib/converter-registry.js";
import { registerAllConverters } from "../src/lib/converter-definitions.js";

describe("Converter Registry", () => {
  beforeEach(() => {
    // Registry is module-level, so we register fresh each test
    registerAllConverters();
  });

  it("should register all converters", () => {
    const all = getAllConverters();
    expect(all.length).toBeGreaterThanOrEqual(10);
  });

  it("should find converter by input/output format", () => {
    const result = findConverter("jpg", "webp");
    expect(result).toBeDefined();
    expect(result!.definition.id).toBe("jpg-to-webp");
  });

  it("should find converter for png to webp", () => {
    const result = findConverter("png", "webp");
    expect(result).toBeDefined();
    expect(result!.definition.id).toBe("png-to-webp");
  });

  it("should find converter for webp to jpg", () => {
    const result = findConverter("webp", "jpg");
    expect(result).toBeDefined();
    expect(result!.definition.id).toBe("webp-to-jpg");
  });

  it("should find PDF to JPG converter", () => {
    const result = findConverter("pdf", "jpg");
    expect(result).toBeDefined();
    expect(result!.definition.id).toBe("pdf-to-jpg");
  });

  it("should find JPG to PDF converter", () => {
    const result = findConverter("jpg", "pdf");
    expect(result).toBeDefined();
    expect(result!.definition.id).toBe("jpg-to-pdf");
  });

  it("should return undefined for unsupported conversion", () => {
    const result = findConverter("mp3", "jpg");
    expect(result).toBeUndefined();
  });

  it("should get converter by id", () => {
    const converter = getConverter("jpg-to-webp");
    expect(converter).toBeDefined();
    expect(converter!.definition.name).toBe("JPG to WebP");
    expect(converter!.workerQueue).toBe("image-convert");
  });

  it("should return undefined for unknown id", () => {
    const converter = getConverter("unknown-converter");
    expect(converter).toBeUndefined();
  });

  it("should filter converters by category", () => {
    const imageConverters = getConvertersByCategory("image");
    expect(imageConverters.length).toBeGreaterThanOrEqual(6);
    for (const c of imageConverters) {
      expect(c.category).toBe("image");
    }

    const pdfConverters = getConvertersByCategory("pdf");
    expect(pdfConverters.length).toBeGreaterThanOrEqual(4);
    for (const c of pdfConverters) {
      expect(c.category).toBe("pdf");
    }
  });

  it("should return correct worker queue", () => {
    expect(getWorkerQueue("jpg-to-webp")).toBe("image-convert");
    expect(getWorkerQueue("pdf-to-jpg")).toBe("pdf-convert");
    expect(getWorkerQueue("unknown")).toBeUndefined();
  });

  it("should have valid input/output formats", () => {
    const all = getAllConverters();
    for (const c of all) {
      expect(c.inputFormats.length).toBeGreaterThan(0);
      expect(c.outputFormats.length).toBeGreaterThan(0);
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
    }
  });

  it("should support case-insensitive format lookup", () => {
    const upper = findConverter("JPG", "WebP");
    expect(upper).toBeDefined();
    expect(upper!.definition.id).toBe("jpg-to-webp");
  });
});
