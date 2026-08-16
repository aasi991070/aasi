import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ReviewModerationClient } from "@/components/admin/ReviewModerationClient";
import { getPendingReviews } from "@/lib/queries/reviews";

export default async function AdminReviewsPage() {
  const reviews = await getPendingReviews();

  return (
    <>
      <PageHeader
        surface="admin"
        as="h1"
        title="Reviews"
        subtitle="Moderate pending submissions from the storefront"
        variant="onGradient"
      />

      {reviews.length ? (
        <ReviewModerationClient reviews={reviews} />
      ) : (
        <EmptyState
          surface="admin"
          title="Moderation queue is empty"
          description="Verified purchase reviews publish automatically. Anonymous submissions wait here."
        />
      )}
    </>
  );
}
