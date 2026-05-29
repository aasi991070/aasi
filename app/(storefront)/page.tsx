import { REVALIDATE_SECONDS } from "@/constants";
import { HomePageClient } from "@/components/storefront/HomePageClient";
import {
  getCategoriesByLevel,
  getChildCategories,
} from "@/lib/queries/categories";
import {
  getFeaturedProducts,
  getNewArrivals,
} from "@/lib/queries/products";

export const revalidate = REVALIDATE_SECONDS;

export default async function HomePage() {
  const [featured, newArrivals, level1Categories] = await Promise.all([
    getFeaturedProducts(8),
    getNewArrivals(12),
    getCategoriesByLevel(1, true),
  ]);

  const categoryCards = await Promise.all(
    level1Categories.map(async (l1) => {
      const children = await getChildCategories(l1.id, true);
      return { l1, children: children.slice(0, 3) };
    })
  );

  return (
    <HomePageClient
      featured={featured}
      newArrivals={newArrivals}
      categoryCards={categoryCards}
    />
  );
}
