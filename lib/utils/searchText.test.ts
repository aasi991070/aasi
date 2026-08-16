import { describe, expect, it } from "vitest";

import {
  MAX_QUERY_LENGTH,
  sanitizeToken,
  tokenizeQuery,
} from "./searchText";

/**
 * A token reaches PostgREST inside an `or=` expression where `,` `.` and `)`
 * are structural. The contract these tests defend: whatever goes in, what comes
 * out contains only letters, digits, hyphens and underscores.
 */
const STRUCTURAL = /[,.()]/;

describe("sanitizeToken", () => {
  it("strips PostgREST metacharacters", () => {
    expect(sanitizeToken("na,me")).toBe("name");
    expect(sanitizeToken("a)")).toBe("a");
    expect(sanitizeToken("%wild%")).toBe("wild");
  });

  it("keeps letters, digits, hyphens and underscores", () => {
    expect(sanitizeToken("lawn-21116_a")).toBe("lawn-21116_a");
  });

  it("keeps non-Latin scripts", () => {
    expect(sanitizeToken("कुर्ता")).toBe("कुर्ता");
    expect(sanitizeToken("قميص")).toBe("قميص");
  });
});

describe("tokenizeQuery", () => {
  it("splits on a comma injection instead of stripping it", () => {
    // Stripping would yield the junk token "ais_activeeqfalse", which matches
    // nothing. Splitting degrades to an ordinary multi-word search.
    expect(tokenizeQuery("a,is_active.eq.false")).toEqual([
      "is_active",
      "eq",
      "false",
    ]);
  });

  it("survives an unbalanced closing paren", () => {
    expect(tokenizeQuery("silk)")).toEqual(["silk"]);
    expect(tokenizeQuery("a)")).toEqual([]);
  });

  it("drops a query that is only wildcards", () => {
    expect(tokenizeQuery("%%%")).toEqual([]);
    expect(tokenizeQuery("*")).toEqual([]);
  });

  it("returns nothing for empty or whitespace-only input", () => {
    expect(tokenizeQuery("")).toEqual([]);
    expect(tokenizeQuery("   \t\n ")).toEqual([]);
  });

  it("drops single-character tokens", () => {
    expect(tokenizeQuery("a silk b")).toEqual(["silk"]);
  });

  it("caps the token count at 6", () => {
    const tokens = tokenizeQuery("one two three four five six seven eight");
    expect(tokens).toHaveLength(6);
    expect(tokens).toEqual(["one", "two", "three", "four", "five", "six"]);
  });

  it("caps each token at 32 characters", () => {
    const tokens = tokenizeQuery("x".repeat(80));
    expect(tokens[0]).toHaveLength(32);
  });

  it("truncates the raw query before tokenising", () => {
    // The 129th character onwards must never reach a token.
    const query = `${"ab ".repeat(50)}needle`;
    expect(query.length).toBeGreaterThan(MAX_QUERY_LENGTH);
    expect(tokenizeQuery(query)).not.toContain("needle");
  });

  it("lowercases", () => {
    expect(tokenizeQuery("SILK Kurta")).toEqual(["silk", "kurta"]);
  });

  it("keeps unicode queries intact", () => {
    expect(tokenizeQuery("कुर्ता")).toEqual(["कुर्ता"]);
    expect(tokenizeQuery("قميص حرير")).toEqual(["قميص", "حرير"]);
  });

  it("never emits a token containing a structural character", () => {
    const hostile = [
      "a,is_active.eq.false",
      "silk)",
      "%%%",
      "name.ilike.*",
      'x")or(1.eq.1',
      "a\\b|c/d",
      "{}[]:;",
    ];

    for (const query of hostile) {
      for (const token of tokenizeQuery(query)) {
        expect(token).not.toMatch(STRUCTURAL);
      }
    }
  });
});
