import { describe, expect, it } from "vitest";
import { splitDescriptionParagraphs } from "@/lib/utils/formatDescription";

describe("splitDescriptionParagraphs", () => {
  it("splits on blank lines", () => {
    expect(splitDescriptionParagraphs("First para.\n\nSecond para.")).toEqual([
      "First para.",
      "Second para.",
    ]);
  });

  it("returns empty array for whitespace-only input", () => {
    expect(splitDescriptionParagraphs("   ")).toEqual([]);
    expect(splitDescriptionParagraphs(null)).toEqual([]);
    expect(splitDescriptionParagraphs(undefined)).toEqual([]);
  });

  it("trims each paragraph", () => {
    expect(splitDescriptionParagraphs("  hello  \n\n  world  ")).toEqual([
      "hello",
      "world",
    ]);
  });
});
