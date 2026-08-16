import { ImageResponse } from "next/og";
import { BRAND_NAME } from "@/constants";
import { getProductBySlug } from "@/lib/queries/products";
import { formatPrice } from "@/lib/utils/formatPrice";
import {
  getProductImagePaths,
  resolveImageUrl,
} from "@/lib/storage/images";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STORE_SURFACE = "#fafaf8";
const STORE_INK = "#1a1a1a";

export default async function ProductOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            height: "100%",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: STORE_SURFACE,
            color: STORE_INK,
            fontSize: 48,
          }}
        >
          {BRAND_NAME}
        </div>
      ),
      { ...size }
    );
  }

  const imagePath = getProductImagePaths(product)[0];
  const imageUrl = imagePath ? resolveImageUrl(imagePath) : null;
  const price = formatPrice(product.sale_price ?? product.price);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          backgroundColor: STORE_SURFACE,
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            width={630}
            height={630}
            style={{ objectFit: "cover" }}
          />
        ) : null}
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            padding: "48px 64px",
            color: STORE_INK,
          }}
        >
          <div
            style={{
              fontSize: 20,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#666",
              marginBottom: 16,
            }}
          >
            {BRAND_NAME}
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 400,
              lineHeight: 1.15,
              marginBottom: 24,
            }}
          >
            {product.name}
          </div>
          <div style={{ fontSize: 36, fontWeight: 500 }}>{price}</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
