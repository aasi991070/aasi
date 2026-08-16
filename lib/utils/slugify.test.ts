import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/utils/slugify";

describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips punctuation", () => {
    expect(slugify("Men's — Kurta!")).toBe("mens-kurta");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("  --hello--  ")).toBe("hello");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
    expect(slugify("!!!")).toBe("");
  });

  it("strips non-ascii letters from slug output", () => {
    expect(slugify("कुर्ता")).toBe("");
  });
});
