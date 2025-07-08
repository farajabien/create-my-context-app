import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseArgs } from "./index";

/**
 * Test utilities for mocking process.argv and other CLI-related functions
 */
class TestUtils {
  private originalArgv: string[];

  constructor() {
    this.originalArgv = process.argv;
  }

  /**
   * Sets process.argv for testing CLI argument parsing
   * @param args - Array of command line arguments to test
   */
  setProcessArgs(args: string[]): void {
    process.argv = ["node", "index.js", ...args];
  }

  /**
   * Restores the original process.argv
   */
  restoreProcessArgs(): void {
    process.argv = this.originalArgv;
  }
}

describe("CLI Argument Parser", () => {
  const testUtils = new TestUtils();

  beforeEach(() => {
    // Reset process.argv before each test
    testUtils.restoreProcessArgs();
  });

  afterEach(() => {
    // Clean up after each test
    testUtils.restoreProcessArgs();
  });

  describe("parseArgs function", () => {
    it("should parse a simple boolean flag", () => {
      testUtils.setProcessArgs(["--generate"]);
      const parsed = parseArgs();
      expect(parsed).toEqual({ generate: true });
    });

    it("should parse a flag with a string value", () => {
      testUtils.setProcessArgs(["--name", "my-app"]);
      const parsed = parseArgs();
      expect(parsed).toEqual({ name: "my-app" });
    });

    it("should parse multiple flags with mixed types", () => {
      testUtils.setProcessArgs(["--name", "my-app", "--type", "full", "--yes"]);
      const parsed = parseArgs();
      expect(parsed).toEqual({ name: "my-app", type: "full", yes: true });
    });

    it("should handle flags with hyphens in the name", () => {
      testUtils.setProcessArgs(["--source-id", "src-123"]);
      const parsed = parseArgs();
      expect(parsed).toEqual({ "source-id": "src-123" });
    });

    it("should handle flags with numeric values", () => {
      testUtils.setProcessArgs(["--port", "3000"]);
      const parsed = parseArgs();
      expect(parsed).toEqual({ port: "3000" });
    });

    it("should handle empty arguments", () => {
      testUtils.setProcessArgs([]);
      const parsed = parseArgs();
      expect(parsed).toEqual({});
    });

    it("should handle flags at the end without values as boolean", () => {
      testUtils.setProcessArgs(["--name", "test", "--verbose"]);
      const parsed = parseArgs();
      expect(parsed).toEqual({ name: "test", verbose: true });
    });

    it("should handle consecutive boolean flags", () => {
      testUtils.setProcessArgs(["--yes", "--generate", "--verbose"]);
      const parsed = parseArgs();
      expect(parsed).toEqual({ yes: true, generate: true, verbose: true });
    });

    it("should treat flags starting with -- as boolean if next arg also starts with --", () => {
      testUtils.setProcessArgs(["--flag1", "--flag2", "value"]);
      const parsed = parseArgs();
      expect(parsed).toEqual({ flag1: true, flag2: "value" });
    });

    it("should handle complex CLI arguments for the app", () => {
      testUtils.setProcessArgs([
        "--name", "my-context-app",
        "--type", "landing",
        "--email", "user@example.com",
        "--project", "proj-123",
        "--yes"
      ]);
      const parsed = parseArgs();
      expect(parsed).toEqual({
        name: "my-context-app",
        type: "landing",
        email: "user@example.com",
        project: "proj-123",
        yes: true
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle malformed arguments gracefully", () => {
      testUtils.setProcessArgs(["--", "not-a-flag"]);
      const parsed = parseArgs();
      expect(parsed).toEqual({});
    });

    it("should handle arguments with special characters", () => {
      testUtils.setProcessArgs(["--description", "A project with spaces & symbols!"]);
      const parsed = parseArgs();
      expect(parsed).toEqual({ description: "A project with spaces & symbols!" });
    });

    it("should handle arguments with equals signs", () => {
      testUtils.setProcessArgs(["--config", "key=value"]);
      const parsed = parseArgs();
      expect(parsed).toEqual({ config: "key=value" });
    });
  });
});