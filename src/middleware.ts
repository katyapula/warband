import { withAuth } from "next-auth/middleware";

// First line of defence: these pages need a signed-in member. The admin role
// is checked from the database by each admin page and server action
// (requireAdminPage / requireAdmin), because the cookie doesn't carry it.
export default withAuth({
  callbacks: { authorized: ({ token }) => Boolean(token) },
  pages: { signIn: "/signin" },
});

export const config = { matcher: ["/admin/:path*", "/profile", "/my-bookings"] };
