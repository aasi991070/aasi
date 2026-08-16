import { profileFromUser, requireCustomer } from "@/lib/auth/customer";
import { ProfileForm } from "@/components/storefront/account/ProfileForm";

export default async function AccountProfilePage() {
  const { user } = await requireCustomer();
  const profile = profileFromUser(user);

  return (
    <div>
      <h1 className="font-display text-3xl text-store-ink">Profile</h1>
      <p className="mt-3 font-sans text-sm text-store-ink-muted">
        Update your contact details and preferences.
      </p>
      <div className="mt-10">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
