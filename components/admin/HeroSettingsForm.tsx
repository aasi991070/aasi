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

export function HeroSettingsForm({ initial }: HeroSettingsFormProps) {
  const router = useRouter();
  const { showToast } = useUiStore();
  const updateSettings = useUpdateSiteSettings();

  const [title, setTitle] = useState(initial.hero_title);
  const [subtitle, setSubtitle] = useState(initial.hero_subtitle);
  const [ctaLabel, setCtaLabel] = useState(initial.hero_cta_label);
  const [ctaHref, setCtaHref] = useState(initial.hero_cta_href);
  const [imagePath, setImagePath] = useState(
    initial.hero_image_url.startsWith("http") ||
      initial.hero_image_url.startsWith("products/")
      ? initial.hero_image_url
      : ""
  );
  const [imagePaths, setImagePaths] = useState<string[]>(
    imagePath && !imagePath.startsWith("http") ? [imagePath] : []
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const hero_image_url =
        imagePaths[0] ??
        (imagePath.startsWith("http") ? imagePath : initial.hero_image_url);

      await updateSettings.mutateAsync({
        hero_title: title,
        hero_subtitle: subtitle,
        hero_cta_label: ctaLabel,
        hero_cta_href: ctaHref,
        hero_image_url,
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
        <Label>Hero image</Label>
        <ImageUploader
          value={imagePaths}
          onChange={(paths) => {
            setImagePaths(paths);
            if (paths[0]) setImagePath(paths[0]);
          }}
          folder="hero"
        />
        <p className="text-xs v18-text-muted">
          Or paste an external image URL:
        </p>
        <Input
          value={imagePath.startsWith("http") ? imagePath : ""}
          onChange={(e) => setImagePath(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <Button type="submit" disabled={updateSettings.isPending}>
        {updateSettings.isPending ? "Saving..." : "Save hero banner"}
      </Button>
    </form>
  );
}
