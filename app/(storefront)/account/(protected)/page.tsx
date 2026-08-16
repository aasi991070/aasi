import Link from "next/link";
import { profileFromUser, requireCustomer } from "@/lib/auth/customer";
import { countCustomerOrders } from "@/lib/queries/orders";
import { signOutAction } from "@/lib/actions/account";

export default async function AccountOverviewPage() {
  const { user } = await requireCustomer();
  const profile = profileFromUser(user);
  const orderCount = await countCustomerOrders();

  return (
    <div>
      <h1 className="font-display text-3xl text-store-ink">Your account</h1>
      <p className="mt-3 font-sans text-sm text-store-ink-muted">
        Signed in as {profile.email}
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Link
          href="/account/orders"
          className="border border-store-border p-6 font-sans text-sm text-store-ink transition-colors hover:border-store-ink"
        >
          <p className="text-xs uppercase tracking-[0.15em] text-store-ink-muted">
            Orders
          </p>
          <p className="mt-2 text-2xl font-medium">{orderCount}</p>
        </Link>
        <Link
          href="/account/addresses"
          className="border border-store-border p-6 font-sans text-sm text-store-ink transition-colors hover:border-store-ink"
        >
          <p className="text-xs uppercase tracking-[0.15em] text-store-ink-muted">
            Addresses
          </p>
          <p className="mt-2 text-base">Manage delivery addresses</p>
        </Link>
        <Link
          href="/account/profile"
          className="border border-store-border p-6 font-sans text-sm text-store-ink transition-colors hover:border-store-ink"
        >
          <p className="text-xs uppercase tracking-[0.15em] text-store-ink-muted">
            Profile
          </p>
          <p className="mt-2 text-base">{profile.fullName || "Update details"}</p>
        </Link>
      </div>

      <form action={signOutAction} className="mt-10">
        <button
          type="submit"
          className="font-sans text-xs uppercase tracking-[0.15em] text-store-ink-muted underline-offset-4 hover:text-store-ink hover:underline"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
