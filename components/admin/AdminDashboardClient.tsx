"use client";

import { Package, FolderTree, AlertTriangle, LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductTable } from "@/components/admin/ProductTable";
import { StatCard } from "@/components/admin/StatCard";
import type { DashboardStats, Product } from "@/types";

interface AdminDashboardClientProps {
  stats: DashboardStats;
  recentProducts: Product[];
}

export function AdminDashboardClient({
  stats,
  recentProducts,
}: AdminDashboardClientProps) {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your store performance"
        variant="onGradient"
      />

      <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Products" value={stats.totalProducts} icon={Package} />
        <StatCard label="Active Products" value={stats.activeProducts} icon={LayoutDashboard} />
        <StatCard label="Out of Stock" value={stats.outOfStock} icon={AlertTriangle} />
        <StatCard label="Total Categories" value={stats.totalCategories} icon={FolderTree} />
      </div>

      <div>
        <PageHeader title="Recent Products" subtitle="Latest catalog updates" />
        <ProductTable products={recentProducts} />
      </div>
    </>
  );
}
