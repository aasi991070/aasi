"use client";

import Link from "next/link";
import {
  AlertTriangle,
  FolderTree,
  IndianRupee,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Star,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProductTable } from "@/components/admin/ProductTable";
import { StatCard } from "@/components/admin/StatCard";
import { formatPrice } from "@/lib/utils/formatPrice";
import type { Product, SalesMetrics } from "@/types";

interface AdminDashboardClientProps {
  metrics: SalesMetrics;
  recentProducts: Product[];
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function AdminDashboardClient({
  metrics,
  recentProducts,
}: AdminDashboardClientProps) {
  return (
    <>
      <PageHeader
        surface="admin"
        as="h1"
        title="Dashboard"
        subtitle="Overview of your store performance"
        variant="onGradient"
      />

      <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue today"
          value={formatPrice(metrics.revenue.today)}
          icon={IndianRupee}
        />
        <StatCard
          label="Orders (7d)"
          value={formatCount(metrics.orders.last_7d)}
          icon={ShoppingBag}
        />
        <StatCard
          label="AOV (30d)"
          value={formatPrice(metrics.aov.last_30d)}
          icon={LayoutDashboard}
        />
        <StatCard
          label="Pending reviews"
          value={formatCount(metrics.pending_reviews)}
          icon={Star}
        />
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Products"
          value={metrics.catalog.totalProducts}
          icon={Package}
        />
        <StatCard
          label="Active Products"
          value={metrics.catalog.activeProducts}
          icon={LayoutDashboard}
        />
        <StatCard
          label="Out of Stock"
          value={metrics.catalog.outOfStock}
          icon={AlertTriangle}
        />
        <StatCard
          label="Total Categories"
          value={metrics.catalog.totalCategories}
          icon={FolderTree}
        />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="v18-card p-6">
          <PageHeader
            surface="admin"
            title="Top products (30d)"
            subtitle="By units sold"
          />
          {metrics.top_by_units.length ? (
            <ul className="space-y-3 text-sm">
              {metrics.top_by_units.map((product) => (
                <li
                  key={`${product.product_id ?? product.name}-units`}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <span>{product.name}</span>
                  <span className="text-slate-500">
                    {formatCount(product.units)} units
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No paid orders yet.</p>
          )}
        </div>

        <div className="v18-card p-6">
          <PageHeader
            surface="admin"
            title="Low stock alerts"
            subtitle="Variants at or below threshold"
          />
          {metrics.low_stock_variants.length ? (
            <ul className="space-y-3 text-sm">
              {metrics.low_stock_variants.map((variant) => (
                <li
                  key={variant.variant_id}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <span>
                    {variant.product_name}
                    {(variant.size || variant.color) &&
                      ` · ${[variant.size, variant.color].filter(Boolean).join(" / ")}`}
                  </span>
                  <span className="text-slate-500">{variant.stock_count} left</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No low-stock variants.</p>
          )}
        </div>
      </div>

      <div>
        <PageHeader surface="admin" title="Recent Products" subtitle="Latest catalog updates" />
        <ProductTable products={recentProducts} />
        <div className="mt-4">
          <Link href="/admin/dashboard/orders" className="text-sm text-v18-primary hover:underline">
            View all orders
          </Link>
        </div>
      </div>
    </>
  );
}
