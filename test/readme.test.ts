import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The README must not go stale on release: versions come from the npm/GitHub badges and
// dependency ranges from package.json, never from text typed into the README.
describe("README", () => {
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
  const pkg = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  ) as {
    version: string;
  };

  it("does not hard-code the package version", () => {
    expect(readme).not.toMatch(/Version \*\*\d/);
    expect(readme).not.toContain(`**${pkg.version}**`);
  });

  it("does not hard-code dependency ranges", () => {
    expect(readme).not.toMatch(/\*\*[\^~]\d+\.\d+\.\d+\*\*/);
  });

  it("shows a live version badge", () => {
    expect(readme).toContain("img.shields.io/npm/v/@lewismoten/");
  });
});
