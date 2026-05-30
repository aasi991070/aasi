import { PageHeader } from "@/components/admin/PageHeader";
import { MonochromeToggle } from "@/components/admin/MonochromeToggle";
import { BRAND_NAME, BRAND_TAGLINE, REVALIDATE_SECONDS } from "@/constants";
import { getSiteSettings } from "@/lib/queries/settings";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Store configuration and appearance"
        variant="onGradient"
      />

      <div className="max-w-2xl space-y-6">
        <div className="v18-card p-6">
          <h2 className="text-lg font-semibold v18-text-heading">Appearance</h2>
          <p className="mt-1 text-sm v18-text-muted">
            Control global visual settings for the storefront and admin.
          </p>
          <div className="mt-6">
            <MonochromeToggle initialEnabled={settings.monochrome_enabled} />
          </div>
        </div>

        <div className="v18-card p-6">
          <h2 className="text-lg font-semibold v18-text-heading">Store</h2>
          <p className="mt-2 text-sm v18-text-muted">
            {BRAND_NAME} — {BRAND_TAGLINE} Store
          </p>

          <h2 className="mt-8 text-lg font-semibold v18-text-heading">
            Cache Revalidation
          </h2>
          <p className="mt-2 text-sm v18-text-muted">
            Storefront pages use ISR with a revalidation interval of{" "}
            {REVALIDATE_SECONDS} seconds. Admin saves trigger on-demand revalidation
            via the <code className="rounded bg-slate-100 px-1">/api/revalidate</code>{" "}
            endpoint.
          </p>

          <h2 className="mt-8 text-lg font-semibold v18-text-heading">
            Environment
          </h2>
          <p className="mt-2 text-sm v18-text-muted">
            Configure Supabase credentials in{" "}
            <code className="rounded bg-slate-100 px-1">.env.local</code>. Set{" "}
            <code className="rounded bg-slate-100 px-1">REVALIDATE_SECRET</code> for
            secure cache invalidation and{" "}
            <code className="rounded bg-slate-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            on Vercel so admin settings can persist. Optionally run{" "}
            <code className="rounded bg-slate-100 px-1">
              supabase/migrations/001_site_settings.sql
            </code>{" "}
            for database-backed settings (otherwise settings are stored in Supabase
            Storage automatically).
          </p>
        </div>
      </div>
    </>
  );
}
