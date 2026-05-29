import { PageHeader } from "@/components/admin/PageHeader";
import { REVALIDATE_SECONDS } from "@/constants";

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Store configuration and cache settings"
        variant="onGradient"
      />

      <div className="max-w-2xl v18-card p-6">
        <h2 className="text-lg font-semibold v18-text-heading">Store</h2>
        <p className="mt-2 text-sm v18-text-muted">
          Atelier — Luxury Clothing Store
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
          Configure Supabase credentials in <code className="rounded bg-slate-100 px-1">.env.local</code>.
          Set <code className="rounded bg-slate-100 px-1">REVALIDATE_SECRET</code> for
          secure cache invalidation.
        </p>
      </div>
    </>
  );
}
