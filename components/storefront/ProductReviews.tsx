"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/storefront/StarRating";
import { useReviews, useSubmitReview } from "@/hooks/useReviews";
import { useUiStore } from "@/hooks/useUiStore";
import type { ProductReview, ReviewSummary } from "@/types";

interface ProductReviewsProps {
  productId: string;
  initialReviews: ProductReview[];
  initialSummary: ReviewSummary;
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

  const summary =
    reviews.length > 0
      ? {
          average:
            Math.round(
              (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
            ) / 10,
          count: reviews.length,
        }
      : initialSummary;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      showToast("Review submitted", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to submit review",
        "error"
      );
    }
  };

  return (
    <section className="v18-card mt-8 p-6">
      <h2 className="text-lg font-semibold v18-text-heading">Customer Reviews</h2>

      <div className="mt-4 flex items-center gap-3">
        <StarRating value={summary.average} showValue />
        <span className="text-sm v18-text-muted">
          {summary.count} review{summary.count === 1 ? "" : "s"}
        </span>
      </div>

      {reviews.length > 0 && (
        <ul className="mt-6 space-y-4 border-t border-v18-border pt-6">
          {reviews.map((review) => (
            <li key={review.id} className="border-b border-v18-border pb-4 last:border-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium v18-text-heading">{review.author_name}</p>
                <StarRating value={review.rating} size="sm" />
              </div>
              <p className="mt-2 text-sm leading-relaxed v18-text-muted">
                {review.body}
              </p>
              <p className="mt-1 text-xs v18-text-muted">
                {new Date(review.created_at).toLocaleDateString("en-IN")}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 border-t border-v18-border pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider v18-text-muted">
          Write a review
        </h3>

        <div className="space-y-2">
          <Label htmlFor="review-name">Your name</Label>
          <Input
            id="review-name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
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
            onChange={(e) => setBody(e.target.value)}
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
