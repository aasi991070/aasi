import { RemoteImage } from "@/components/shared/RemoteImage";
import { cn } from "@/lib/utils";
import { resolveProductImageList } from "@/lib/storage/images";

interface ProductImageGalleryProps {
  images?: string[] | null;
  thumbnailUrl?: string | null;
  productName: string;
}

const MAIN_PANEL_VISIBILITY = [
  "peer-checked/img0:block",
  "peer-checked/img1:block",
  "peer-checked/img2:block",
  "peer-checked/img3:block",
] as const;

export function ProductImageGallery({
  images,
  thumbnailUrl,
  productName,
}: ProductImageGalleryProps) {
  const resolvedImages = resolveProductImageList({
    images,
    thumbnail_url: thumbnailUrl,
  });
  const thumbs = resolvedImages.slice(0, 4);
  const groupId = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  return (
    <div className="v18-card overflow-hidden p-4">
      {thumbs.map((_, index) => (
        <input
          key={`radio-${index}`}
          type="radio"
          name={`gallery-${groupId}`}
          id={`gallery-img${index}`}
          defaultChecked={index === 0}
          className={`peer/img${index} sr-only`}
        />
      ))}

      <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-v18-stat)] bg-slate-100">
        {thumbs.map((src, index) => (
          <div
            key={`main-${src}`}
            className={cn(
              "absolute inset-0 hidden",
              MAIN_PANEL_VISIBILITY[index]
            )}
          >
            <RemoteImage
              src={src}
              alt={`${productName} — image ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {thumbs.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {thumbs.map((src, index) => (
            <label
              key={`thumb-${src}`}
              htmlFor={`gallery-img${index}`}
              className="relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 border-store-border transition-colors hover:border-store-ink"
            >
              <RemoteImage
                src={src}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="100px"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
