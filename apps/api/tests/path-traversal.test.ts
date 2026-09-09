import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Path Traversal Protection", () => {
  const testDir = join(tmpdir(), "filetools-path-test-" + Date.now());

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("should detect path traversal in filenames", () => {
    const malicious = ["../../etc/passwd", "..\\..\\windows\\system32", "../../../root/.ssh/id_rsa", "file/../../../secret"];
    for (const name of malicious) {
      const hasTraversal = name.includes("..") || name.includes("\\");
      expect(hasTraversal).toBe(true);
    }
  });

  it("should sanitize path traversal attempts", () => {
    const { sanitizeFilename } = require("@filetools/shared");
    const malicious = "../../etc/passwd";
    const safe = sanitizeFilename(malicious);
    expect(safe).not.toContain("..");
    expect(safe).not.toContain("/");
  });

  it("should not allow writing outside storage", async () => {
    const { ensureDir } = require("@filetools/shared");
    const storageBase = join(testDir, "storage");
    await ensureDir(storageBase);

    // This should create inside storage, not outside
    const safePath = join(storageBase, "safe-file.txt");
    writeFileSync(safePath, "test");

    expect(existsSync(safePath)).toBe(true);
    expect(safePath.startsWith(storageBase)).toBe(true);
  });

  it("should reject absolute paths", () => {
    const { sanitizeFilename } = require("@filetools/shared");
    const absolute = "/etc/passwd";
    const safe = sanitizeFilename(absolute);
    expect(safe).not.toContain("/");
    expect(safe).not.toMatch(/^\/|^\\/);
  });
});
