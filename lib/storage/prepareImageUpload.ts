const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_UPLOAD_EDGE = 2400;
export const UPLOAD_WEBP_QUALITY = 0.85;

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageUploadError";
  }
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageUploadError(`Could not read "${file.name}".`));
    };
    image.src = url;
  });
}

function canvasToWebpBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new ImageUploadError("Could not encode image as WebP."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      UPLOAD_WEBP_QUALITY
    );
  });
}

/**
 * Validates, downscales, and re-encodes an upload to WebP before it reaches
 * storage. Keeps the original filename stem in the returned File name.
 */
export async function prepareImageUpload(file: File): Promise<File> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new ImageUploadError(
      `"${file.name}" must be JPEG, PNG, WebP, or AVIF.`
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageUploadError(
      `"${file.name}" exceeds the 8 MB limit.`
    );
  }

  const image = await loadImageFromFile(file);
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
  const scale =
    longestEdge > MAX_UPLOAD_EDGE ? MAX_UPLOAD_EDGE / longestEdge : 1;

  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new ImageUploadError("Canvas is not available in this browser.");
  }

  context.drawImage(image, 0, 0, width, height);
  const blob = await canvasToWebpBlob(canvas);

  const stem = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${stem}.webp`, { type: "image/webp" });
}
