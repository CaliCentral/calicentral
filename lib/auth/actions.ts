"use server";

import { signOutCurrentSession } from "@/lib/auth/session";

// The public header is a client component with no server-component parent
// passing it a bound sign-out action (unlike the account/admin portal
// shells, which already receive one as a prop) -- this gives it a server
// action it can import and call directly, still going through the same
// provider-aware signOutCurrentSession dispatcher.
export async function signOutFromPublicHeader(): Promise<void> {
  await signOutCurrentSession("/");
}
