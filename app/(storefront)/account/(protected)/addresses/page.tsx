import { getUserAddresses } from "@/lib/queries/addresses";
import { requireCustomer } from "@/lib/auth/customer";
import { AddressBookClient } from "@/components/storefront/account/AddressBookClient";

export default async function AccountAddressesPage() {
  const { user } = await requireCustomer();
  const addresses = await getUserAddresses(user.id);

  return (
    <div>
      <h1 className="font-display text-3xl text-store-ink">Addresses</h1>
      <p className="mt-3 font-sans text-sm text-store-ink-muted">
        Save delivery addresses for faster checkout.
      </p>
      <div className="mt-10">
        <AddressBookClient initialAddresses={addresses} />
      </div>
    </div>
  );
}
