import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

// First line of defence for admin pages. Server actions still call requireAdmin().
// Visitors are sent to sign in; signed-in non-admins are sent home.
export default withAuth(
  function middleware(req) {
    if (req.nextauth.token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => Boolean(token) },
    pages: { signIn: "/signin" },
  },
);

export const config = { matcher: ["/admin/:path*"] };
