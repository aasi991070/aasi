import { getDashboardStats, getRecentProducts } from "@/lib/queries/products";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export default async function AdminDashboardPage() {
  const [stats, recentProducts] = await Promise.all([
    getDashboardStats(),
    getRecentProducts(10),
  ]);

  return (
    <AdminDashboardClient stats={stats} recentProducts={recentProducts} />
  );
}
