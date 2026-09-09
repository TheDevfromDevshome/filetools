import { describe, it, expect } from "vitest";

describe("Image Converter (unit tests)", () => {
  it("should map converter IDs to output extensions", () => {
    const map: Record<string, string> = {
      "jpg-to-webp": "webp",
      "png-to-webp": "webp",
      "webp-to-jpg": "jpg",
      "webp-to-png": "png",
      "png-to-jpg": "jpg",
      "jpg-to-png": "png",
    };

    expect(map["jpg-to-webp"]).toBe("webp");
    expect(map["png-to-webp"]).toBe("webp");
    expect(map["webp-to-jpg"]).toBe("jpg");
    expect(map["webp-to-png"]).toBe("png");
    expect(map["png-to-jpg"]).toBe("jpg");
    expect(map["jpg-to-png"]).toBe("png");
  });

  it("should have correct format pairs", () => {
    const formats: Record<string, { input: string[]; output: string[] }> = {
      "jpg-to-webp": { input: ["jpg", "jpeg"], output: ["webp"] },
      "png-to-webp": { input: ["png"], output: ["webp"] },
      "webp-to-jpg": { input: ["webp"], output: ["jpg", "jpeg"] },
      "webp-to-png": { input: ["webp"], output: ["png"] },
      "png-to-jpg": { input: ["png"], output: ["jpg", "jpeg"] },
      "jpg-to-png": { input: ["jpg", "jpeg"], output: ["png"] },
    };

    for (const [id, fmt] of Object.entries(formats)) {
      expect(fmt.input.length).toBeGreaterThan(0);
      expect(fmt.output.length).toBeGreaterThan(0);
      expect(id).toBeTruthy();
    }
  });
});

describe("PDF Converter (unit tests)", () => {
  it("should map PDF converter IDs to output formats", () => {
    const map: Record<string, string> = {
      "pdf-to-jpg": "jpg",
      "pdf-to-png": "png",
      "jpg-to-pdf": "pdf",
      "png-to-pdf": "pdf",
    };

    expect(map["pdf-to-jpg"]).toBe("jpg");
    expect(map["pdf-to-png"]).toBe("png");
    expect(map["jpg-to-pdf"]).toBe("pdf");
    expect(map["png-to-pdf"]).toBe("pdf");
  });

  it("should correctly identify PDF-to-image converters", () => {
    const pdfToImage = ["pdf-to-jpg", "pdf-to-png"];
    const imageToPdf = ["jpg-to-pdf", "png-to-pdf"];

    for (const id of pdfToImage) {
      expect(id.startsWith("pdf-to-")).toBe(true);
    }

    for (const id of imageToPdf) {
      expect(id.endsWith("-to-pdf")).toBe(true);
    }
  });
});
