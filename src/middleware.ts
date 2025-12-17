import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;
        const role = token?.role;

        // 1. Student Management -> Admin or HOD
        if (path.startsWith("/admin/students")) {
            if (role !== "ADMIN" && role !== "HOD") {
                return NextResponse.redirect(new URL("/", req.url));
            }
            return;
        }

        // 2. Promotion -> Admin Only
        if (path.startsWith("/admin/promote")) {
            if (role !== "ADMIN") {
                return NextResponse.redirect(new URL("/", req.url));
            }
            return;
        }

        // 3. General Admin -> Admin Only (Users, Departments, Sections, Alumni)
        if (path.startsWith("/admin")) {
            if (role !== "ADMIN") {
                return NextResponse.redirect(new URL("/", req.url));
            }
            return;
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: [
        "/((?!login|api/auth|_next/static|_next/image|favicon.ico|manifest.json).*)",
    ],
};
