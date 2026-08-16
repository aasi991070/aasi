"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { useUpdateSiteSettings } from "@/hooks/useSiteSettings";
import { useUiStore } from "@/hooks/useUiStore";
import type { SiteSettings } from "@/types";

interface HeroSettingsFormProps {
  initial: SiteSettings;
}

function initialStoragePaths(settings: SiteSettings): string[] {
  const urls = settings.hero_image_urls?.length
    ? settings.hero_image_urls
    : settings.hero_image_url
      ? [settings.hero_image_url]
      : [];

  return urls.filter(
    (url) =>
      url.startsWith("products/") ||
      url.startsWith("hero/") ||
      (!url.startsWith("http") && url.length > 0)
  );
}

function initialExternalUrl(settings: SiteSettings): string {
  const candidate =
    settings.hero_image_urls?.find((url) => url.startsWith("http")) ??
    (settings.hero_image_url.startsWith("http") ? settings.hero_image_url : "");
  return candidate;
}

export function HeroSettingsForm({ initial }: HeroSettingsFormProps) {
  const router = useRouter();
  const { showToast } = useUiStore();
  const updateSettings = useUpdateSiteSettings();

  const [title, setTitle] = useState(initial.hero_title);
  const [subtitle, setSubtitle] = useState(initial.hero_subtitle);
  const [ctaLabel, setCtaLabel] = useState(initial.hero_cta_label);
  const [ctaHref, setCtaHref] = useState(initial.hero_cta_href);
  const [externalUrl, setExternalUrl] = useState(initialExternalUrl(initial));
  const [imagePaths, setImagePaths] = useState<string[]>(initialStoragePaths(initial));
  const [externalUrlsText, setExternalUrlsText] = useState(
    (initial.hero_image_urls ?? [])
      .filter((url) => url.startsWith("http"))
      .join("\n") || (initialExternalUrl(initial) ? initialExternalUrl(initial) : "")
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pastedUrls = externalUrlsText
        .split(/[\n,]+/)
        .map((url) => url.trim())
        .filter((url) => url.startsWith("http"));

      const singleExternal = externalUrl.trim().startsWith("http")
        ? externalUrl.trim()
        : null;

      const hero_image_urls = [
        ...imagePaths,
        ...pastedUrls,
        ...(singleExternal && !pastedUrls.includes(singleExternal)
          ? [singleExternal]
          : []),
      ].filter(Boolean);

      const uniqueUrls = [...new Set(hero_image_urls)];

      const hero_image_url = uniqueUrls[0] ?? initial.hero_image_url;

      await updateSettings.mutateAsync({
        hero_title: title,
        hero_subtitle: subtitle,
        hero_cta_label: ctaLabel,
        hero_cta_href: ctaHref,
        hero_image_url,
        hero_image_urls: uniqueUrls.length > 0 ? uniqueUrls : undefined,
      });

      showToast("Hero banner updated", "success");
      router.refresh();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save hero settings",
        "error"
      );
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hero-title">Title</Label>
        <Input
          id="hero-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hero-subtitle">Subtitle</Label>
        <Textarea
          id="hero-subtitle"
          rows={2}
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hero-cta-label">Button label</Label>
          <Input
            id="hero-cta-label"
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hero-cta-href">Button link</Label>
          <Input
            id="hero-cta-href"
            value={ctaHref}
            onChange={(e) => setCtaHref(e.target.value)}
            placeholder="/category/mens"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Hero images</Label>
        <ImageUploader
          value={imagePaths}
          onChange={(paths) => {
            setImagePaths(paths);
          }}
          folder="hero"
        />
        <p className="text-xs v18-text-muted">
          Upload multiple images for the homepage slideshow. Or paste external image
          URLs (one per line):
        </p>
        <Textarea
          value={externalUrlsText}
          onChange={(e) => {
            setExternalUrlsText(e.target.value);
            const first = e.target.value
              .split(/[\n,]+/)
              .map((url) => url.trim())
              .find((url) => url.startsWith("http"));
            setExternalUrl(first ?? "");
          }}
          rows={3}
          placeholder={"https://...\nhttps://..."}
        />
      </div>

      <Button type="submit" disabled={updateSettings.isPending}>
        {updateSettings.isPending ? "Saving..." : "Save hero banner"}
      </Button>
    </form>
  );
}
