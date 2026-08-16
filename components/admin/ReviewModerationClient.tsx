"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { StarRating } from "@/components/storefront/StarRating";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  approveReviewAction,
  bulkApproveReviewsAction,
  rejectReviewAction,
} from "@/lib/actions/reviews";
import { useUiStore } from "@/hooks/useUiStore";
import type { ProductReview } from "@/types";

interface ReviewModerationClientProps {
  reviews: ProductReview[];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ReviewModerationClient({
  reviews,
}: ReviewModerationClientProps) {
  const router = useRouter();
  const { showToast } = useUiStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const toggleSelected = (id: string, checked: boolean) => {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((value) => value !== id)
    );
  };

  const run = (action: () => Promise<{ ok: boolean; message?: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        showToast("Review updated", "success");
        setSelected([]);
        router.refresh();
        return;
      }
      showToast(result.message ?? "Action failed", "error");
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={isPending || !selected.length}
          onClick={() =>
            run(async () => {
              const result = await bulkApproveReviewsAction(selected);
              return result.ok
                ? { ok: true }
                : { ok: false, message: result.message };
            })
          }
        >
          Approve selected ({selected.length})
        </Button>
      </div>

      <div className="v18-card overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10" />
              <TableHead>Product</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.includes(review.id)}
                    onChange={(event) =>
                      toggleSelected(review.id, event.target.checked)
                    }
                    aria-label={`Select review by ${review.author_name}`}
                    className="size-4 rounded border-slate-300"
                  />
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {review.product_id.slice(0, 8)}…
                </TableCell>
                <TableCell>{review.author_name}</TableCell>
                <TableCell>
                  <StarRating value={review.rating} size="sm" />
                </TableCell>
                <TableCell className="max-w-md whitespace-pre-wrap text-sm">
                  {review.body}
                </TableCell>
                <TableCell>{formatDate(review.created_at)}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() =>
                      run(async () => {
                        const result = await approveReviewAction(review.id);
                        return result.ok
                          ? { ok: true }
                          : { ok: false, message: result.message };
                      })
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() =>
                      run(async () => {
                        const result = await rejectReviewAction(review.id);
                        return result.ok
                          ? { ok: true }
                          : { ok: false, message: result.message };
                      })
                    }
                  >
                    Reject
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
