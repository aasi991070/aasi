import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { ProductReview, ReviewSummary } from "@/types";

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
      .select("*")
      .eq("product_id", productId)
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
}): Promise<ProductReview> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .insert(input)
    .select()
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      throw new Error(
        "product_reviews table not found. Run supabase/migrations/002_product_reviews.sql in Supabase SQL Editor."
      );
    }
    throw error;
  }

  return data as ProductReview;
}
