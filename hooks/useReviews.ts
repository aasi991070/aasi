"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProductReview } from "@/types";

async function fetchReviews(productId: string): Promise<ProductReview[]> {
  const res = await fetch(`/api/reviews?product_id=${productId}`);
  if (!res.ok) return [];
  return res.json();
}

export interface ReviewSubmissionAck {
  message: string;
  verified?: boolean;
}

/**
 * Returns an acknowledgement, not a review: submissions are created as
 * 'pending' and are not readable until an admin approves them.
 */
async function submitReview(input: {
  product_id: string;
  author_name: string;
  rating: number;
  body: string;
}): Promise<ReviewSubmissionAck> {
  const res = await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Failed to submit review");
  }
  return res.json();
}

export function useReviews(productId: string, initialReviews: ProductReview[]) {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => fetchReviews(productId),
    initialData: initialReviews,
  });
}

export function useSubmitReview(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    },
  });
}
