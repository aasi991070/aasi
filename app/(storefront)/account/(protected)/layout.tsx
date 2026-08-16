import { AccountNav } from "@/components/storefront/account/AccountNav";

export default function AccountProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
      <AccountNav />
      <div className="mt-10">{children}</div>
    </div>
  );
}
