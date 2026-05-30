import { STORAGE_BUCKET } from "@/constants";
import { createClient } from "@/lib/supabase/client";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
}

export async function uploadImage(
  file: File,
  folder: string
): Promise<string> {
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
  const supabase = createClient();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) throw error;
}

export function getPublicUrl(path: string | null | undefined): string {
  if (!path?.trim()) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const supabase = createClient();
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80";

export function resolveImageUrl(path?: string | null): string {
  if (!path?.trim()) return PLACEHOLDER_IMAGE;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return getPublicUrl(path);
}
