import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/types";

const DEFAULT_SETTINGS: SiteSettings = {
  monochrome_enabled: false,
};

async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("monochrome_enabled")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return DEFAULT_SETTINGS;

    return {
      monochrome_enabled: Boolean(data.monochrome_enabled),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const getSiteSettings = unstable_cache(
  fetchSiteSettings,
  ["site-settings"],
  { revalidate: 60, tags: ["site-settings"] }
);

export async function updateSiteSettings(
  settings: Partial<SiteSettings>
): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .update({
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .select("monochrome_enabled")
    .single();

  if (error) throw error;

  return {
    monochrome_enabled: Boolean(data.monochrome_enabled),
  };
}
