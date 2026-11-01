"use client";

import { useAuth } from "@/features/auth/AuthProvider";
import AccountPage from "@/features/account/components/AccountPage";

export default function Page() {
  const { user, setAuthenticatedUser, reloadUser } = useAuth();
  // PATCH /me returns the profile without placementCourse, so it is merged into the signed-in user.
  // After a deletion the API has cleared the session: reloading the user sends the page to /login.
  return <AccountPage user={user} onUserUpdated={(updated) => setAuthenticatedUser({ ...user!, ...updated })} onDeleted={() => void reloadUser()} />;
}
