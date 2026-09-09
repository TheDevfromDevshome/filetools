import { describe, it, expect } from "vitest";
import { sanitizeFilename, getExtension, ensureDir, cleanupJob, getJobDir, getInputDir, getOutputDir } from "@filetools/shared";
import { existsSync } from "node:fs";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("File Utilities", () => {
  describe("sanitizeFilename", () => {
    it("should remove unsafe characters", () => {
      const result = sanitizeFilename("file name with spaces.txt");
      expect(result).toBe("file_name_with_spaces.txt");
    });

    it("should handle path traversal attempts", () => {
      const result = sanitizeFilename("../../etc/passwd");
      expect(result).not.toContain("..");
      expect(result).not.toContain("/");
    });

    it("should truncate long filenames", () => {
      const longName = "a".repeat(300) + ".txt";
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(200);
    });

    it("should preserve dots and hyphens", () => {
      const result = sanitizeFilename("my-file.v2.txt");
      expect(result).toBe("my-file.v2.txt");
    });

    it("should handle empty filename", () => {
      const result = sanitizeFilename("");
      expect(typeof result).toBe("string");
    });
  });

  describe("getExtension", () => {
    it("should extract extension from filename", () => {
      expect(getExtension("photo.jpg")).toBe("jpg");
      expect(getExtension("document.PDF")).toBe("pdf");
      expect(getExtension("archive.tar.gz")).toBe("gz");
    });

    it("should handle files without extension", () => {
      expect(getExtension("Makefile")).toBe("");
    });

    it("should handle hidden files", () => {
      expect(getExtension(".gitignore")).toBe("");
    });
  });

  describe("Path utilities", () => {
    const testStorage = join(tmpdir(), "filetools-test-" + Date.now());

    it("should generate correct job directory paths", () => {
      const jobDir = getJobDir(testStorage, "abc123");
      expect(jobDir).toBe(join(testStorage, "jobs", "abc123"));
    });

    it("should generate correct input/output paths", () => {
      const input = getInputDir(testStorage, "abc123");
      const output = getOutputDir(testStorage, "abc123");
      expect(input).toBe(join(testStorage, "jobs", "abc123", "input"));
      expect(output).toBe(join(testStorage, "jobs", "abc123", "output"));
    });

    it("should create directories with ensureDir", async () => {
      const testDir = join(testStorage, "test-ensure-" + Date.now());
      await ensureDir(testDir);
      expect(existsSync(testDir)).toBe(true);
    });

    it("should cleanup job directory", async () => {
      const jobId = "cleanup-test-" + Date.now();
      const jobDir = getJobDir(testStorage, jobId);
      await ensureDir(join(jobDir, "input"));
      await writeFile(join(jobDir, "test.txt"), "hello");
      expect(existsSync(join(jobDir, "test.txt"))).toBe(true);

      await cleanupJob(testStorage, jobId);
      expect(existsSync(jobDir)).toBe(false);
    });
  });
});
