"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { RemoteImageWithFallback } from "@/components/shared/RemoteImageWithFallback";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteProductAction } from "@/lib/actions/catalog";
import { formatPrice } from "@/lib/utils/formatPrice";
import { getProductImagePaths, resolveImageUrl } from "@/lib/storage/images";
import { useUiStore } from "@/hooks/useUiStore";
import type { Product } from "@/types";

interface ProductTableProps {
  products: Product[];
}

export function ProductTable({ products }: ProductTableProps) {
  const router = useRouter();
  const { showToast } = useUiStore();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!confirm("Delete this product?")) return;

    startTransition(async () => {
      const result = await deleteProductAction(id);
      if (result.ok) {
        showToast("Product deleted", "success");
        router.refresh();
        return;
      }
      showToast(result.message, "error");
    });
  };

  return (
    <div className="v18-card overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-14">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const imagePath = getProductImagePaths(product)[0];
            const imageUrl = imagePath ? resolveImageUrl(imagePath) : null;

            return (
              <TableRow key={product.id} className="hover:bg-slate-50">
                <TableCell>
                  <div className="relative size-10 overflow-hidden rounded-md bg-slate-100">
                    {imageUrl ? (
                      <RemoteImageWithFallback
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-medium v18-text-heading">{product.name}</p>
                  <p className="text-xs v18-text-muted">{product.slug}</p>
                </TableCell>
                <TableCell className="text-sm v18-text-muted">
                  {product.category?.name ?? "—"}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {formatPrice(product.sale_price ?? product.price)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      product.in_stock
                        ? "v18-status-success"
                        : "v18-status-danger"
                    }
                  >
                    {product.in_stock
                      ? `${product.stock_count} in stock`
                      : "Out of stock"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      product.is_active
                        ? "v18-status-info"
                        : "border-slate-200 v18-text-muted"
                    }
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/admin/dashboard/products/${product.id}`}
                      className="rounded-lg p-2 v18-text-muted hover:bg-slate-100 v18-hover-accent"
                    >
                      <Pencil className="size-4" />
                    </Link>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(product.id)}
                      className="rounded-lg p-2 v18-text-muted v18-hover-danger disabled:opacity-50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
