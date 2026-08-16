import { redirect } from "next/navigation";

interface CheckoutPendingRedirectProps {
  searchParams: {
    order?: string;
  };
}

export default function CheckoutPendingRedirect({
  searchParams,
}: CheckoutPendingRedirectProps) {
  const orderNumber = searchParams.order?.trim();

  if (orderNumber) {
    redirect(
      `/order/${encodeURIComponent(orderNumber)}?status=processing`
    );
  }

  redirect("/cart");
}
