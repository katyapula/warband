import type { DefaultSession } from "next-auth";

// The session only carries the member's id. Username and role are read from
// the database on each request (shared/lib/auth/session.ts), so profile edits
// and promotions apply without signing in again.
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
