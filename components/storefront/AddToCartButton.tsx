"use client";

// TODO(24b): wire to cart actions and enable when variants are selected.
export function AddToCartButton() {
  return (
    <button
      type="button"
      disabled
      className="store-btn w-full py-2.5 font-sans text-xs uppercase tracking-[0.1em] disabled:cursor-not-allowed disabled:opacity-60"
    >
      Add to Cart
    </button>
  );
}
