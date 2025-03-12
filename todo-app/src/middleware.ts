import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

const secret = process.env.AUTH_SECRET;

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret });
  const { pathname } = req.nextUrl;

  // Jika tidak ada token dan bukan di halaman login, redirect ke login
  if (!token && pathname !== "/login") {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (token && pathname === "/login") {
    const homeUrl = new URL("/", req.url);
    return NextResponse.redirect(homeUrl);
  }

  if (token) {
    interface RoleAccessMap {
      [key: string]: string[];
    }

    const userRole = token.role as string;
    const roleAccess: RoleAccessMap = {
      Lead: ["/", "/tasks"],
      Team: ["/", "/tasks"],
    };

    const allowedPaths = roleAccess[userRole] || [];
    const isAllowed = allowedPaths.includes(pathname);

    const existingPaths = ["/", "/tasks"];

    if (!existingPaths.includes(pathname)) {
      return NextResponse.rewrite(new URL("/404", req.url));
    }

    if (!isAllowed && pathname !== "/forbidden" && pathname !== "/login") {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|favicon.ico|images/).*)"],
};
