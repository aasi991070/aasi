"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/storefront/StarRating";
import { useReviews, useSubmitReview } from "@/hooks/useReviews";
import { useUiStore } from "@/hooks/useUiStore";
import { cn } from "@/lib/utils";
import type { ProductReview, ReviewSummary } from "@/types";

const PAGE_SIZE = 10;

type SortOption = "newest" | "highest" | "lowest";

interface ProductReviewsProps {
  productId: string;
  initialReviews: ProductReview[];
  initialSummary: ReviewSummary;
}

function sortReviews(reviews: ProductReview[], sort: SortOption): ProductReview[] {
  const sorted = [...reviews];

  switch (sort) {
    case "newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case "highest":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "lowest":
      return sorted.sort((a, b) => a.rating - b.rating);
    default: {
      const unreachable: never = sort;
      return unreachable;
    }
  }
}

function buildDistribution(reviews: ProductReview[]) {
  const counts = [0, 0, 0, 0, 0];
  for (const review of reviews) {
    const index = Math.min(5, Math.max(1, review.rating)) - 1;
    counts[index] += 1;
  }
  const total = reviews.length || 1;
  return counts
    .map((count, index) => ({
      stars: 5 - index,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .reverse();
}

export function ProductReviews({
  productId,
  initialReviews,
  initialSummary,
}: ProductReviewsProps) {
  const { showToast } = useUiStore();
  const { data: reviews = initialReviews } = useReviews(productId, initialReviews);
  const submitReview = useSubmitReview(productId);

  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);

  const summary =
    reviews.length > 0
      ? {
          average:
            Math.round(
              (reviews.reduce((total, review) => total + review.rating, 0) /
                reviews.length) *
                10
            ) / 10,
          count: reviews.length,
        }
      : initialSummary;

  const sortedReviews = useMemo(
    () => sortReviews(reviews, sort),
    [reviews, sort]
  );
  const totalPages = Math.max(1, Math.ceil(sortedReviews.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleReviews = sortedReviews.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const distribution = buildDistribution(reviews);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await submitReview.mutateAsync({
        product_id: productId,
        author_name: authorName,
        rating,
        body,
      });
      setAuthorName("");
      setRating(5);
      setBody("");
      showToast("Thanks — your review will appear once it's approved", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to submit review",
        "error"
      );
    }
  };

  return (
    <section className="mt-20 border-t border-store-border pt-12">
      <h2 className="font-display text-3xl font-normal text-store-ink">
        Customer Reviews
      </h2>

      <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,240px)_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <StarRating value={summary.average} showValue />
            <span className="font-sans text-sm text-store-ink-muted">
              {summary.count} review{summary.count === 1 ? "" : "s"}
            </span>
          </div>

          <ul className="mt-6 space-y-2">
            {distribution.map((row) => (
              <li key={row.stars} className="grid grid-cols-[3rem_1fr_2rem] items-center gap-3">
                <span className="font-sans text-xs text-store-ink-muted">
                  {row.stars}★
                </span>
                <div className="h-2 bg-store-surface">
                  <div
                    className="h-full bg-store-accent"
                    style={{ width: `${row.percentage}%` }}
                  />
                </div>
                <span className="font-sans text-xs text-store-ink-muted">
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          {reviews.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-store-border pb-4">
                <label className="flex items-center gap-2 font-sans text-sm text-store-ink-muted">
                  Sort by
                  <select
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value as SortOption);
                      setPage(1);
                    }}
                    className="border-b border-store-border bg-transparent px-1 py-1 text-store-ink focus-visible:border-store-accent-dark focus-visible:outline-none"
                  >
                    <option value="newest">Newest</option>
                    <option value="highest">Highest rated</option>
                    <option value="lowest">Lowest rated</option>
                  </select>
                </label>
                <p className="font-sans text-xs text-store-ink-muted">
                  Page {currentPage} of {totalPages}
                </p>
              </div>

              <ul className="divide-y divide-store-border">
                {visibleReviews.map((review) => (
                  <li key={review.id} className="py-6">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-sans text-sm font-medium text-store-ink">
                        {review.author_name}
                      </p>
                      <StarRating value={review.rating} size="sm" />
                    </div>
                    <p className="mt-3 font-sans text-sm leading-relaxed text-store-ink-muted">
                      {review.body}
                    </p>
                    <p className="mt-2 font-sans text-xs text-store-ink-muted">
                      {new Date(review.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </li>
                ))}
              </ul>

              {totalPages > 1 ? (
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    className={cn(
                      "inline-flex min-h-11 min-w-11 items-center justify-center font-sans text-xs uppercase tracking-[0.2em]",
                      currentPage <= 1
                        ? "cursor-not-allowed text-store-ink-muted"
                        : "text-store-ink"
                    )}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setPage((value) => Math.min(totalPages, value + 1))
                    }
                    className={cn(
                      "inline-flex min-h-11 min-w-11 items-center justify-center font-sans text-xs uppercase tracking-[0.2em]",
                      currentPage >= totalPages
                        ? "cursor-not-allowed text-store-ink-muted"
                        : "text-store-ink"
                    )}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <p className="font-sans text-sm text-store-ink-muted">
              No reviews yet. Be the first to share your experience.
            </p>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-12 space-y-4 border-t border-store-border pt-8"
      >
        <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
          Write a review
        </h3>
        <p className="font-sans text-sm text-store-ink-muted">
          Reviews are moderated before they appear on the storefront.
        </p>

        <div className="space-y-2">
          <Label htmlFor="review-name">Your name</Label>
          <Input
            id="review-name"
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            required
            minLength={2}
            maxLength={80}
          />
        </div>

        <div className="space-y-2">
          <Label>Rating</Label>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-body">Review</Label>
          <Textarea
            id="review-body"
            rows={4}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            minLength={10}
            maxLength={2000}
            placeholder="Share your experience with this product..."
          />
        </div>

        <Button type="submit" disabled={submitReview.isPending}>
          {submitReview.isPending ? "Submitting..." : "Submit review"}
        </Button>
      </form>
    </section>
  );
}
