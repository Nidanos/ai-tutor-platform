import AccountHeader from "./AccountHeader";
import ProfileSettings from "./ProfileSettings";
import ConsentSettings from "./ConsentSettings";
import AccountDataActions from "./AccountDataActions";
import type { AuthUser } from "@ai-tutor/types";

type Props = { user: AuthUser | null; onUserUpdated: (user: AuthUser) => void; onDeleted: () => void };

/** Account composition; authenticated identity remains owned by the app shell. */
export default function AccountPage({ user, onUserUpdated, onDeleted }: Props) {
  const isAdult = Boolean(user?.dateOfBirth && isAtLeastEighteen(user.dateOfBirth));
  return <main className="min-w-0 space-y-5 text-white">
    <AccountHeader />
    <ProfileSettings key={user?.id ?? "signed-out"} user={user} onUpdated={onUserUpdated} />
    {user && isAdult && <ConsentSettings key={user.id} enabled />}
    <AccountDataActions enabled={Boolean(user)} onDeleted={onDeleted} />
  </main>;
}

/** The pilot consent controls are restricted to adult accounts by the API contract. */
function isAtLeastEighteen(value: string): boolean {
  const birth = new Date(`${value}T00:00:00`);
  const today = new Date();
  const cutoff = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return Number.isFinite(birth.getTime()) && birth <= cutoff;
}
