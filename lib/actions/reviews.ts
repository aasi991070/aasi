"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import {
  bulkApproveReviews,
  updateReviewStatus,
} from "@/lib/queries/reviews";
import type { ActionResult } from "@/lib/validation/catalog";

export async function approveReviewAction(
  reviewId: string
): Promise<ActionResult<undefined>> {
  const admin = await requireAdmin();
  if (!admin.ok) return { ok: false, message: admin.message };

  try {
    await updateReviewStatus(reviewId, "approved");
    revalidatePath("/admin/dashboard/reviews");
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("[approveReviewAction]", error);
    return { ok: false, message: "Could not approve the review." };
  }
}

export async function rejectReviewAction(
  reviewId: string
): Promise<ActionResult<undefined>> {
  const admin = await requireAdmin();
  if (!admin.ok) return { ok: false, message: admin.message };

  try {
    await updateReviewStatus(reviewId, "rejected");
    revalidatePath("/admin/dashboard/reviews");
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("[rejectReviewAction]", error);
    return { ok: false, message: "Could not reject the review." };
  }
}

export async function bulkApproveReviewsAction(
  reviewIds: string[]
): Promise<ActionResult<{ count: number }>> {
  const admin = await requireAdmin();
  if (!admin.ok) return { ok: false, message: admin.message };

  if (!reviewIds.length) {
    return { ok: false, message: "Select at least one review." };
  }

  try {
    const count = await bulkApproveReviews(reviewIds);
    revalidatePath("/admin/dashboard/reviews");
    return { ok: true, data: { count } };
  } catch (error) {
    console.error("[bulkApproveReviewsAction]", error);
    return { ok: false, message: "Could not approve the selected reviews." };
  }
}
