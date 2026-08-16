import { getRecentProducts, getSalesMetrics } from "@/lib/queries/products";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export default async function AdminDashboardPage() {
  const [metrics, recentProducts] = await Promise.all([
    getSalesMetrics(),
    getRecentProducts(10),
  ]);

  return (
    <AdminDashboardClient metrics={metrics} recentProducts={recentProducts} />
  );
}
