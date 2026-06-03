import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_HERO } from "@/constants";
import { getSiteSettings, updateSiteSettings } from "@/lib/queries/settings";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({
      monochrome_enabled: false,
      ...DEFAULT_HERO,
    });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const settings = await updateSiteSettings({
      ...(body.monochrome_enabled !== undefined && {
        monochrome_enabled: Boolean(body.monochrome_enabled),
      }),
      ...(body.hero_title !== undefined && {
        hero_title: String(body.hero_title),
      }),
      ...(body.hero_subtitle !== undefined && {
        hero_subtitle: String(body.hero_subtitle),
      }),
      ...(body.hero_cta_label !== undefined && {
        hero_cta_label: String(body.hero_cta_label),
      }),
      ...(body.hero_cta_href !== undefined && {
        hero_cta_href: String(body.hero_cta_href),
      }),
      ...(body.hero_image_url !== undefined && {
        hero_image_url: String(body.hero_image_url),
      }),
    });

    revalidatePath("/", "layout");

    return NextResponse.json(settings);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update settings";
    return NextResponse.json({ message }, { status: 500 });
  }
}
