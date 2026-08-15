import { describe, expect, it } from "vitest";

import {
  buildIlikeOrFilter,
  MAX_QUERY_LENGTH,
  PRODUCT_SEARCH_FIELDS,
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

describe("buildIlikeOrFilter", () => {
  it("builds one clause per token per field", () => {
    expect(buildIlikeOrFilter(["silk"], ["name", "slug"])).toBe(
      "name.ilike.%silk%,slug.ilike.%silk%"
    );
  });

  it("returns an empty string when there is nothing to match", () => {
    expect(buildIlikeOrFilter([], PRODUCT_SEARCH_FIELDS)).toBe("");
    expect(buildIlikeOrFilter(["silk"], [])).toBe("");
  });

  it("produces a filter with no stray delimiters from a hostile query", () => {
    const filter = buildIlikeOrFilter(
      tokenizeQuery("a,is_active.eq.false"),
      PRODUCT_SEARCH_FIELDS
    );

    // Every clause must be exactly `<field>.ilike.%<token>%` — a token that
    // smuggled in a comma would produce a clause that fails this.
    for (const clause of filter.split(",")) {
      expect(clause).toMatch(/^[a-z_]+\.ilike\.%[\p{L}\p{N}\-_]+%$/u);
    }
  });
});
