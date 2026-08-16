import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { FailedEmailTable } from "@/components/admin/FailedEmailTable";
import { getFailedEmailLogs } from "@/lib/email/log";

export default async function AdminEmailsPage() {
  const entries = await getFailedEmailLogs();

  return (
    <>
      <PageHeader
        surface="admin"
        as="h1"
        title="Email failures"
        subtitle="Failed transactional sends with manual resend"
        variant="onGradient"
      />

      {entries.length ? (
        <FailedEmailTable entries={entries} />
      ) : (
        <EmptyState
          surface="admin"
          title="No failed emails"
          description="When a send fails it will appear here with the provider error."
        />
      )}
    </>
  );
}
