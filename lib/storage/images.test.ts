import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getPublicUrl,
  isSupabaseStorageUrl,
  normalizeStoragePath,
} from "@/lib/storage/images";

const ORIGINAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

describe("normalizeStoragePath", () => {
  it("strips bucket prefix", () => {
    expect(normalizeStoragePath("product-images/folder/file.jpg")).toBe(
      "folder/file.jpg"
    );
  });

  it("extracts path from full public URL", () => {
    expect(
      normalizeStoragePath(
        "https://example.supabase.co/storage/v1/object/public/product-images/folder/file.jpg?token=abc"
      )
    ).toBe("folder/file.jpg");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeStoragePath("")).toBe("");
    expect(normalizeStoragePath("   ")).toBe("");
  });
});

describe("getPublicUrl", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_URL;
  });

  it("builds a public storage URL from a relative path", () => {
    expect(getPublicUrl("folder/file.jpg")).toBe(
      "https://example.supabase.co/storage/v1/object/public/product-images/folder/file.jpg"
    );
  });

  it("normalizes bucket-prefixed paths", () => {
    expect(getPublicUrl("product-images/folder/file.jpg")).toBe(
      "https://example.supabase.co/storage/v1/object/public/product-images/folder/file.jpg"
    );
  });

  it("returns empty string for empty input", () => {
    expect(getPublicUrl(null)).toBe("");
  });

  it("passes through external https URLs", () => {
    expect(getPublicUrl("https://images.example.com/p.jpg")).toBe(
      "https://images.example.com/p.jpg"
    );
  });
});

describe("isSupabaseStorageUrl", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_URL;
  });

  it("detects project storage URLs", () => {
    expect(
      isSupabaseStorageUrl(
        "https://example.supabase.co/storage/v1/object/public/product-images/a.jpg"
      )
    ).toBe(true);
  });
});
