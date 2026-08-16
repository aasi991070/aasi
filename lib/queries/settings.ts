import { unstable_cache } from "next/cache";
import { REVALIDATE_SECONDS } from "@/constants";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { DEFAULT_HERO } from "@/constants";
import type { SiteSettings } from "@/types";

const DEFAULT_SETTINGS: SiteSettings = {
  monochrome_enabled: false,
  ...DEFAULT_HERO,
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

function normalizeHeroImageUrls(raw: Partial<SiteSettings>): string[] | undefined {
  if (!Array.isArray(raw.hero_image_urls)) return undefined;

  const urls = raw.hero_image_urls
    .map((url) => (typeof url === "string" ? url.trim() : ""))
    .filter(Boolean);

  return urls.length > 0 ? urls : undefined;
}

function normalizeSettings(raw: Partial<SiteSettings>): SiteSettings {
  const hero_image_url = raw.hero_image_url?.trim() || DEFAULT_HERO.hero_image_url;
  const hero_image_urls = normalizeHeroImageUrls(raw);

  return {
    monochrome_enabled: Boolean(raw.monochrome_enabled),
    hero_title: raw.hero_title?.trim() || DEFAULT_HERO.hero_title,
    hero_subtitle: raw.hero_subtitle?.trim() || DEFAULT_HERO.hero_subtitle,
    hero_cta_label: raw.hero_cta_label?.trim() || DEFAULT_HERO.hero_cta_label,
    hero_cta_href: raw.hero_cta_href?.trim() || DEFAULT_HERO.hero_cta_href,
    hero_image_url,
    ...(hero_image_urls ? { hero_image_urls } : {}),
  };
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
      if (
        error.message.includes("not found") ||
        error.message.includes("Object not found")
      ) {
        return DEFAULT_SETTINGS;
      }
      throw error;
    }

    const text = await data.text();
    const parsed = JSON.parse(text) as Partial<SiteSettings>;
    return normalizeSettings(parsed);
  } catch (error) {
    // Deliberate fallback — the site must still render with default copy —
    // but never a silent one.
    console.error("[settings] storage fallback failed, using built-in defaults", error);
    return DEFAULT_SETTINGS;
  }
}

async function saveSettingsToStorage(
  settings: Partial<SiteSettings>
): Promise<SiteSettings> {
  await ensureConfigBucket();
  const supabase = createServiceClient();
  const current = await getSettingsFromStorage();
  const next = normalizeSettings({ ...current, ...settings });

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(STORAGE_PATH, JSON.stringify(next), {
      upsert: true,
      contentType: "application/json",
    });

  if (error) throw error;
  return next;
}

const SETTINGS_SELECT =
  "monochrome_enabled, hero_title, hero_subtitle, hero_cta_label, hero_cta_href, hero_image_url";

/**
 * The one query allowed to fall back instead of throwing: site chrome must
 * render even when settings are unavailable, and every field has a sane
 * default. The fallback is logged with its reason so it is visible rather than
 * silent.
 */
async function fetchSiteSettingsUncached(): Promise<SiteSettings> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select(SETTINGS_SELECT)
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        console.warn(
          "[settings] site_settings table missing, falling back to storage",
          error.message
        );
        return getSettingsFromStorage();
      }
      throw error;
    }

    if (!data) return DEFAULT_SETTINGS;

    const fromDb = normalizeSettings(data as Partial<SiteSettings>);
    // Multi-image hero lives in storage JSON (no DB column yet).
    const fromStorage = await getSettingsFromStorage();
    if (fromStorage.hero_image_urls?.length) {
      return normalizeSettings({
        ...fromDb,
        hero_image_urls: fromStorage.hero_image_urls,
        hero_image_url: fromStorage.hero_image_urls[0] ?? fromDb.hero_image_url,
      });
    }

    return fromDb;
  } catch (error) {
    console.error("[settings] read failed, falling back to storage", error);
    return getSettingsFromStorage();
  }
}

export const getSiteSettings = unstable_cache(
  fetchSiteSettingsUncached,
  ["site-settings"],
  { tags: ["settings"], revalidate: REVALIDATE_SECONDS }
);

export async function updateSiteSettings(
  settings: Partial<SiteSettings>
): Promise<SiteSettings> {
  const { hero_image_urls, ...dbFields } = settings;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .upsert(
      {
        id: 1,
        ...dbFields,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select(SETTINGS_SELECT)
    .single();

  if (!error) {
    const fromDb = normalizeSettings(data as Partial<SiteSettings>);
    // Persist multi-image list in storage so it survives without a DB column.
    return saveSettingsToStorage({
      ...fromDb,
      ...settings,
      ...(hero_image_urls !== undefined ? { hero_image_urls } : {}),
    });
  }

  if (isMissingTableError(error)) {
    return saveSettingsToStorage(settings);
  }

  throw error;
}
