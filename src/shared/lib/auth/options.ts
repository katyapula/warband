import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getConfig } from "@/shared/config";
import { syncMemberOnSignIn } from "@/entities/user/repository";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    async signIn({ user }) {
      // Google always returns an email; refuse sign-in if it somehow doesn't.
      return Boolean(user.email);
    },
    async jwt({ token, user }) {
      // `user` is only present on sign-in: find or create the member and apply ADMIN_EMAILS.
      if (user?.email) {
        token.id = await syncMemberOnSignIn(
          { email: user.email, name: user.name, image: user.image },
          getConfig().adminEmails,
        );
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id;
      return session;
    },
  },
};
