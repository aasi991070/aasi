import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { ProductReview, ReviewSummary } from "@/types";

/**
 * Explicit column list rather than `*`: `ip_hash` must never leave the server,
 * and selecting it by accident is exactly the kind of thing `*` invites.
 */
const PUBLIC_REVIEW_COLUMNS =
  "id, product_id, author_name, rating, body, status, order_id, created_at, updated_at";

function isMissingTableError(error: { code?: string; message?: string }) {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.message?.includes("product_reviews")
  );
}

export async function getReviewsByProductId(
  productId: string
): Promise<ProductReview[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_reviews")
      .select(PUBLIC_REVIEW_COLUMNS)
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as ProductReview[];
  } catch {
    return [];
  }
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

export async function createReview(input: {
  product_id: string;
  author_name: string;
  rating: number;
  body: string;
  ip_hash: string;
}): Promise<{ id: string }> {
  // TODO(27c): replace this service-role insert with an RLS-backed insert
  // scoped to a verified purchase. The service role bypasses RLS entirely, so
  // moderation status and the rate limit are the only things standing between
  // this endpoint and unlimited anonymous writes.
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .insert({ ...input, status: "pending" })
    .select("id")
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      throw new Error(
        "product_reviews table not found. Run supabase/migrations/002_product_reviews.sql and 004_review_moderation.sql in Supabase SQL Editor."
      );
    }
    throw error;
  }

  return data as { id: string };
}
