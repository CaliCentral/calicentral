import type { DefaultSession } from "next-auth";

import type {
  AccessStatus,
  AuthProviderId,
  PortalRole,
} from "@/lib/auth/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      displayName: string;
      role: PortalRole;
      accessStatus: AccessStatus;
      authProvider: AuthProviderId | null;
      profileConfigured: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: PortalRole;
    accessStatus?: AccessStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    authProvider?: AuthProviderId;
    providerAccountId?: string;
  }
}
