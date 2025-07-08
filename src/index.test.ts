// This is a placeholder for actual tests.
// We need to export the functions from index.ts to test them here.
// For now, this file establishes the test setup.

import { describe, it, expect } from "vitest";
import { parseArgs } from "./index";

// Mock process.argv for testing
function setProcessArgs(args: string[]) {
  process.argv = ["node", "index.js", ...args];
}

describe("CLI Argument Parser", () => {
  it("should parse a simple flag", () => {
    setProcessArgs(["--generate"]);
    const parsed = parseArgs();
    expect(parsed).toEqual({ generate: true });
  });

  it("should parse a flag with a value", () => {
    setProcessArgs(["--name", "my-app"]);
    const parsed = parseArgs();
    expect(parsed).toEqual({ name: "my-app" });
  });

  it("should parse multiple flags", () => {
    setProcessArgs(["--name", "my-app", "--type", "full", "--yes"]);
    const parsed = parseArgs();
    expect(parsed).toEqual({ name: "my-app", type: "full", yes: true });
  });

  it("should handle flags with hyphens", () => {
    setProcessArgs(["--source-id", "src-123"]);
    const parsed = parseArgs();
    expect(parsed).toEqual({ "source-id": "src-123" });
  });
}); 