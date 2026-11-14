import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getConfig } from "@/shared/config";
import { prisma } from "@/shared/lib/prisma";
import { roleForEmail } from "./roles";

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
      // `user` is only present on sign-in: sync the member and apply their role.
      if (user?.email) {
        const email = user.email.trim().toLowerCase();
        const role = roleForEmail(email, getConfig().adminEmails);
        const member = await prisma.user.upsert({
          where: { email },
          create: { email, name: user.name ?? email, image: user.image, role },
          update: { name: user.name ?? undefined, image: user.image, role },
        });
        token.id = member.id;
        token.role = member.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
