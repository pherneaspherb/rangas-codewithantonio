import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/sign-in", "/sign-up"];

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId } = await auth();
  const pathname = req.nextUrl.pathname;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Not logged in → sign in
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Allow organization routes to load
  if (pathname.startsWith("/organization")) {
    return NextResponse.next();
  }

  // Root → redirect to org if exists
  if (pathname === "/" && orgId) {
    return NextResponse.redirect(
      new URL(`/organization/${orgId}`, req.url)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};