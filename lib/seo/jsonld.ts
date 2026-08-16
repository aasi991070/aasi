import {
  BRAND_LOGO_PATH,
  BRAND_NAME,
  CURRENCY_CODE,
  SITE_URL,
  SOCIAL_LINKS,
  SUPPORT_EMAIL,
} from "@/constants";
import {
  getProductImagePaths,
  resolveImageUrl,
} from "@/lib/storage/images";
import type { Category, Product, ProductReview, ReviewSummary } from "@/types";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

type JsonLd = Record<string, unknown>;

function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

function priceValidUntilDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

export function categoriesToBreadcrumbPath(
  categories: Category[]
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ name: "Home", url: absoluteUrl("/") }];

  categories.forEach((category, index) => {
    const slugPath = categories
      .slice(0, index + 1)
      .map((entry) => entry.slug)
      .join("/");
    items.push({
      name: category.name,
      url: absoluteUrl(`/category/${slugPath}`),
    });
  });

  return items;
}

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    url: SITE_URL,
    logo: absoluteUrl(BRAND_LOGO_PATH),
    sameAs: SOCIAL_LINKS.map((link) => link.href),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SUPPORT_EMAIL,
      availableLanguage: ["English"],
    },
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

function formatCategoryPath(categories: Category[]): string | undefined {
  if (!categories.length) return undefined;
  return categories.map((category) => category.name).join(" > ");
}

export function productJsonLd(
  product: Product,
  reviewSummary: ReviewSummary,
  reviews: ProductReview[],
  categoryPath: Category[]
): JsonLd {
  const productUrl = absoluteUrl(`/product/${product.slug}`);
  const price = product.sale_price ?? product.price;
  const images = getProductImagePaths(product).map((path) =>
    resolveImageUrl(path)
  );
  const description =
    product.description?.trim() ||
    `Shop ${product.name} at ${BRAND_NAME}.`;

  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    image: images.length ? images : undefined,
    sku: product.id,
    // TODO(23): switch to hasVariant / ProductGroup with per-variant SKUs.
    brand: {
      "@type": "Brand",
      name: BRAND_NAME,
    },
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: CURRENCY_CODE,
      availability:
        product.in_stock && product.stock_count > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: productUrl,
      priceValidUntil: priceValidUntilDate(),
    },
  };

  const categoryLabel = formatCategoryPath(categoryPath);
  if (categoryLabel) {
    data.category = categoryLabel;
  }

  if (reviewSummary.count > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviewSummary.average,
      reviewCount: reviewSummary.count,
      bestRating: 5,
    };
  }

  const approvedReviews = reviews.slice(0, 5);
  if (approvedReviews.length) {
    data.review = approvedReviews.map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.author_name,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
      },
      reviewBody: review.body,
      datePublished: review.created_at.slice(0, 10),
    }));
  }

  return data;
}

export function breadcrumbJsonLd(path: BreadcrumbItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: path.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function itemListJsonLd(products: Product[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/product/${product.slug}`),
      name: product.name,
    })),
  };
}
