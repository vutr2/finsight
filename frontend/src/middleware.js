import { authMiddleware } from "@descope/nextjs-sdk/server";

export default authMiddleware({
  projectId: process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID,
  // Redirect unauthenticated users to login
  redirectUrl: "/login",
  // These paths are accessible without authentication
  publicRoutes: ["/", "/login", "/api/auth/(.*)", "/api/stocks(.*)", "/api/news(.*)"],
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
