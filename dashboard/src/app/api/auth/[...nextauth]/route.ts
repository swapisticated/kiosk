import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      try {
        // Call our backend to create/get user
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
          }/auth/user`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-dashboard-secret":
                process.env.NEXT_PUBLIC_DASHBOARD_SECRET || "",
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name || "",
              image: user.image || "",
              provider: account?.provider || "google",
              providerAccountId: account?.providerAccountId || "",
            }),
          }
        );

        if (!res.ok) {
          console.error("Failed to create/get user");
          return false;
        }

        const data = await res.json();
        // Store user ID for later use
        user.id = data.user.id;

        return true;
      } catch (err) {
        console.error("Auth error:", err);
        return false;
      }
    },

    async jwt({ token, user }) {
      // Persist user id to token
      if (user?.id) {
        token.userId = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      // Add user id to session
      if (session.user && token.userId) {
        (session.user as { id?: string }).id = token.userId as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // After sign in, always go to dashboard first
      // Dashboard will check for tenant and redirect to onboarding if needed
      if (url === baseUrl || url === `${baseUrl}/login`) {
        return `${baseUrl}/dashboard`;
      }
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
});

export { handler as GET, handler as POST };
