import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/sign-in", "/sign-up"];

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId } = await auth();
  const pathname = req.nextUrl.pathname;

  // Allow auth pages
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Not logged in → sign in
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Root → redirect to active org
  if (pathname === "/" && orgId) {
    return NextResponse.redirect(
      new URL(`/organization/${orgId}`, req.url)
    );
  }

  // Logged in but no org → select org
  if (!orgId && pathname !== "/select-org") {
    return NextResponse.redirect(new URL("/select-org", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
