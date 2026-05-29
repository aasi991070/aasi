"use client";

import Image from "next/image";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/utils/formatPrice";
import { getPublicUrl } from "@/lib/storage/images";
import type { Product } from "@/types";

interface ProductTableProps {
  products: Product[];
  onDelete?: (id: string) => void;
}

export function ProductTable({ products, onDelete }: ProductTableProps) {
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
            const imageUrl = product.thumbnail_url
              ? getPublicUrl(product.thumbnail_url)
              : product.images[0]
                ? getPublicUrl(product.images[0])
                : null;

            return (
              <TableRow key={product.id} className="hover:bg-slate-50">
                <TableCell>
                  <div className="relative size-10 overflow-hidden rounded-md bg-slate-100">
                    {imageUrl && (
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    )}
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
                        ? "border-green-200 bg-green-50 text-v18-success"
                        : "border-red-200 bg-red-50 text-v18-danger"
                    }
                  >
                    {product.in_stock ? `${product.stock_count} in stock` : "Out of stock"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      product.is_active
                        ? "border-blue-200 bg-blue-50 text-v18-primary"
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
                      className="rounded-lg p-2 v18-text-muted hover:bg-slate-100 hover:text-v18-primary"
                    >
                      <Pencil className="size-4" />
                    </Link>
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(product.id)}
                        className="rounded-lg p-2 v18-text-muted hover:bg-red-50 hover:text-v18-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
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
