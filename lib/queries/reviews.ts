import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";
import { REVALIDATE_SECONDS } from "@/constants";
import { assertOk } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import type { ProductReview, ReviewStatus, ReviewSummary } from "@/types";

/**
 * Explicit column list rather than `*`: `ip_hash` must never leave the server,
 * and selecting it by accident is exactly the kind of thing `*` invites.
 */
const PUBLIC_REVIEW_COLUMNS =
  "id, product_id, author_name, rating, body, status, order_id, created_at, updated_at";

const MODERATION_REVIEW_COLUMNS =
  "id, product_id, author_name, rating, body, status, order_id, created_at, updated_at";

function isMissingTableError(error: { code?: string; message?: string }) {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.message?.includes("product_reviews")
  );
}

function getCachedReviews(productId: string): Promise<ProductReview[]> {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("product_reviews")
        .select(PUBLIC_REVIEW_COLUMNS)
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        if (isMissingTableError(error)) {
          console.warn(
            "[reviews] product_reviews table missing — returning empty list until migrations run",
            error.message
          );
          return [];
        }
        assertOk("reviews.byProduct", { data, error });
      }

      return (data ?? []) as ProductReview[];
    },
    ["reviews", productId],
    {
      tags: ["reviews", `reviews:${productId}`],
      revalidate: REVALIDATE_SECONDS,
    }
  )();
}

export async function getReviewsByProductId(
  productId: string
): Promise<ProductReview[]> {
  return getCachedReviews(productId);
}

export async function getReviewSummary(
  productId: string
): Promise<ReviewSummary> {
  const reviews = await getReviewsByProductId(productId);
  if (!reviews.length) return { average: 0, count: 0 };

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}

export async function findVerifiedOrderIdForProduct(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_items!inner(product_id)")
    .eq("user_id", userId)
    .eq("status", "delivered")
    .eq("order_items.product_id", productId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error) || error.message?.includes("orders")) {
      return null;
    }
    assertOk("reviews.verifiedOrder", { data: null, error });
  }

  return data?.id ? String(data.id) : null;
}

export async function createReview(
  input: {
    product_id: string;
    author_name: string;
    rating: number;
    body: string;
    ip_hash: string;
    order_id?: string | null;
  },
  supabase: SupabaseClient
): Promise<{ id: string; status: ReviewStatus }> {
  const status: ReviewStatus = input.order_id ? "approved" : "pending";

  const { data, error } = await supabase
    .from("product_reviews")
    .insert({
      product_id: input.product_id,
      author_name: input.author_name,
      rating: input.rating,
      body: input.body,
      ip_hash: input.ip_hash,
      order_id: input.order_id ?? null,
      status,
    })
    .select("id, status")
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      throw new Error(
        "product_reviews table not found. Run supabase/migrations/002_product_reviews.sql and 004_review_moderation.sql in Supabase SQL Editor."
      );
    }
    throw error;
  }

  if (status === "approved") {
    revalidateTag("reviews");
    revalidateTag(`reviews:${input.product_id}`);
  }

  return data as { id: string; status: ReviewStatus };
}

export async function getPendingReviews(): Promise<ProductReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select(MODERATION_REVIEW_COLUMNS)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    assertOk("reviews.pending", { data: null, error });
  }

  return (data ?? []) as ProductReview[];
}

export async function updateReviewStatus(
  reviewId: string,
  status: ReviewStatus
): Promise<ProductReview> {
  const supabase = await createClient();
  const updated = assertOk(
    "reviews.updateStatus",
    await supabase
      .from("product_reviews")
      .update({ status })
      .eq("id", reviewId)
      .select(MODERATION_REVIEW_COLUMNS)
      .single()
  );

  const review = updated as ProductReview;

  revalidateTag("reviews");
  revalidateTag(`reviews:${review.product_id}`);

  return review;
}

export async function bulkApproveReviews(reviewIds: string[]): Promise<number> {
  if (!reviewIds.length) return 0;

  const supabase = await createClient();
  const updated = assertOk(
    "reviews.bulkApprove",
    await supabase
      .from("product_reviews")
      .update({ status: "approved" })
      .in("id", reviewIds)
      .eq("status", "pending")
      .select("product_id")
  );

  revalidateTag("reviews");
  for (const row of updated ?? []) {
    revalidateTag(`reviews:${String(row.product_id)}`);
  }

  return updated?.length ?? 0;
}
