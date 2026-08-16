import { STORAGE_BUCKET } from "@/constants";

export const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80";

/** Matches `--color-store-surface` in app/globals.css. */
const STORE_SURFACE = "#fafaf8";

let cachedBlurDataUrl: string | null = null;

/** Tiny static shimmer for `placeholder="blur"`. Not per-image. */
export function getBlurDataUrl(): string {
  if (cachedBlurDataUrl) return cachedBlurDataUrl;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect fill="${STORE_SURFACE}" width="8" height="8"/></svg>`;
  cachedBlurDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return cachedBlurDataUrl;
}

function getSupabaseBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
}

function encodeStoragePath(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/** Strip bucket prefixes and extract storage paths from full Supabase URLs. */
export function normalizeStoragePath(path: string): string {
  let normalized = path.trim().replace(/^\/+/, "");

  const publicMarker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const publicIndex = normalized.indexOf(publicMarker);
  if (publicIndex !== -1) {
    normalized = normalized.slice(publicIndex + publicMarker.length);
  }

  if (normalized.startsWith(`${STORAGE_BUCKET}/`)) {
    normalized = normalized.slice(STORAGE_BUCKET.length + 1);
  }

  return normalized.split("?")[0]?.split("#")[0] ?? "";
}

export function isSupabaseStorageUrl(url: string): boolean {
  const baseUrl = getSupabaseBaseUrl();
  if (!baseUrl || !url.startsWith(baseUrl)) return false;
  return url.includes(`/storage/v1/object/public/${STORAGE_BUCKET}/`);
}

export function getPublicUrl(path: string | null | undefined): string {
  if (!path?.trim()) return "";

  if (path.startsWith("http://") || path.startsWith("https://")) {
    if (isSupabaseStorageUrl(path)) {
      const storagePath = normalizeStoragePath(path);
      if (!storagePath) return path;
      const baseUrl = getSupabaseBaseUrl();
      if (!baseUrl) return path;
      return `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${encodeStoragePath(storagePath)}`;
    }
    return path;
  }

  const storagePath = normalizeStoragePath(path);
  if (!storagePath) return "";

  const baseUrl = getSupabaseBaseUrl();
  if (!baseUrl) return "";

  return `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${encodeStoragePath(storagePath)}`;
}

export function resolveImageUrl(path?: string | null): string {
  const url = getPublicUrl(path);
  return url || PLACEHOLDER_IMAGE;
}

export function getProductImagePaths(product: {
  images?: string[] | null;
  thumbnail_url?: string | null;
}): string[] {
  const images = Array.isArray(product.images)
    ? product.images.filter(Boolean)
    : [];

  if (images.length > 0) return images;

  if (product.thumbnail_url?.trim()) {
    return [product.thumbnail_url];
  }

  return [];
}

export function resolveProductImageList(product: {
  images?: string[] | null;
  thumbnail_url?: string | null;
}): string[] {
  const paths = getProductImagePaths(product);
  if (!paths.length) return [PLACEHOLDER_IMAGE];
  return paths.map((path) => resolveImageUrl(path));
}

export async function uploadImage(
  file: File,
  folder: string
): Promise<string> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}-${sanitizeFilename(file.name.replace(`.${ext}`, ""))}.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: false });

  if (error) throw error;
  return path;
}

export async function deleteImage(path: string): Promise<void> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const storagePath = normalizeStoragePath(path);
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);
  if (error) throw error;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
}
