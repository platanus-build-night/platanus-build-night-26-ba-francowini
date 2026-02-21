export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/squad/:path*",
    "/matchday/:path*",
    "/leaderboard/:path*",
    "/transfers/:path*",
    "/leagues/:path*",
    "/wallet/:path*",
    "/profile/:path*",
  ],
};
