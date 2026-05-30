"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SiteSettings } from "@/types";

async function fetchSiteSettings(): Promise<SiteSettings> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

async function patchSiteSettings(
  settings: Partial<SiteSettings>
): Promise<SiteSettings> {
  const res = await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Failed to update settings");
  }
  return res.json();
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
  });
}

export function useUpdateSiteSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchSiteSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(["site-settings"], data);
    },
  });
}
