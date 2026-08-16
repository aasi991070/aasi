"use client";

type AddToCartButtonProps = {
  disabled?: boolean;
  label?: string;
};

// TODO(24b): wire to cart actions and enable when variants are selected.
export function AddToCartButton({
  disabled = true,
  label = "Add to Cart",
}: AddToCartButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="store-btn w-full py-2.5 font-sans text-xs uppercase tracking-[0.1em] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}
