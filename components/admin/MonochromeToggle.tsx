"use client";

import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMonochrome } from "@/components/providers/MonochromeProvider";
import { useUpdateSiteSettings } from "@/hooks/useSiteSettings";
import { useUiStore } from "@/hooks/useUiStore";

interface MonochromeToggleProps {
  initialEnabled: boolean;
}

export function MonochromeToggle({ initialEnabled }: MonochromeToggleProps) {
  const router = useRouter();
  const { showToast } = useUiStore();
  const { monochrome, setMonochrome } = useMonochrome();
  const updateSettings = useUpdateSiteSettings();

  const enabled = monochrome ?? initialEnabled;

  const handleChange = async (checked: boolean) => {
    const previous = enabled;
    setMonochrome(checked);

    try {
      await updateSettings.mutateAsync({ monochrome_enabled: checked });
      showToast(
        checked ? "Monochrome mode enabled" : "Monochrome mode disabled",
        "success"
      );
      router.refresh();
    } catch (error) {
      setMonochrome(previous);
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to update monochrome setting",
        "error"
      );
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-v18-input)] border border-v18-border p-4">
      <div className="space-y-1">
        <Label htmlFor="monochrome-toggle" className="text-base font-medium">
          Monochrome mode
        </Label>
        <p className="text-sm v18-text-muted">
          Switch the entire UI (storefront, admin, and login) to a grayscale
          palette. Product photos and color swatches stay in full color.
        </p>
      </div>
      <Switch
        id="monochrome-toggle"
        checked={enabled}
        onCheckedChange={handleChange}
        disabled={updateSettings.isPending}
        aria-label="Toggle monochrome mode"
      />
    </div>
  );
}
