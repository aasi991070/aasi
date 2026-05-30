import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { SiteSettings } from "@/types";

const DEFAULT_SETTINGS: SiteSettings = {
  monochrome_enabled: false,
};

const STORAGE_BUCKET = "site-config";
const STORAGE_PATH = "settings.json";

function isMissingTableError(error: { code?: string; message?: string }) {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.message?.includes("site_settings") ||
    error.message?.includes("Could not find the table")
  );
}

async function ensureConfigBucket() {
  const supabase = createServiceClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((bucket) => bucket.name === STORAGE_BUCKET);

  if (!exists) {
    const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: true,
    });
    if (error && !error.message.includes("already exists")) {
      throw error;
    }
  }
}

async function getSettingsFromStorage(): Promise<SiteSettings> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(STORAGE_PATH);

    if (error) {
      if (error.message.includes("not found") || error.message.includes("Object not found")) {
        return DEFAULT_SETTINGS;
      }
      throw error;
    }

    const text = await data.text();
    const parsed = JSON.parse(text) as Partial<SiteSettings>;
    return {
      monochrome_enabled: Boolean(parsed.monochrome_enabled),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function saveSettingsToStorage(
  settings: Partial<SiteSettings>
): Promise<SiteSettings> {
  await ensureConfigBucket();
  const supabase = createServiceClient();
  const current = await getSettingsFromStorage();
  const next = { ...current, ...settings };

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(STORAGE_PATH, JSON.stringify(next), {
      upsert: true,
      contentType: "application/json",
    });

  if (error) throw error;
  return next;
}

async function fetchSiteSettingsUncached(): Promise<SiteSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("monochrome_enabled")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        return getSettingsFromStorage();
      }
      throw error;
    }

    if (!data) return DEFAULT_SETTINGS;

    return {
      monochrome_enabled: Boolean(data.monochrome_enabled),
    };
  } catch {
    return getSettingsFromStorage();
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return fetchSiteSettingsUncached();
}

export async function updateSiteSettings(
  settings: Partial<SiteSettings>
): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .upsert(
      {
        id: 1,
        ...settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("monochrome_enabled")
    .single();

  if (!error) {
    return {
      monochrome_enabled: Boolean(data.monochrome_enabled),
    };
  }

  if (isMissingTableError(error)) {
    return saveSettingsToStorage(settings);
  }

  throw error;
}
