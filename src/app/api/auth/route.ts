// import NextAuth from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
//
// const handler = NextAuth({
//   providers: [
//     GoogleProvider({
//       clientId:
//         clientId,
//       clientSecret: clientSecret,
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, user, account, profile }) {
//       // Example: Set role based on email or fetch from DB
//       if (user?.email === "katyapula@gmail.com") {
//         token.role = "admin";
//       } else {
//         token.role = "user";
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       // Pass the role into the session
//       session.user.role = token.role;
//       return session;
//     },
//   },
//   secret: secret,
// });
//
// export { handler as GET, handler as POST };
