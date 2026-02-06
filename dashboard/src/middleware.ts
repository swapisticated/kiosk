import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

// Protect dashboard and onboarding routes
export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};
