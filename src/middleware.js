import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};

export async function middleware(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('__session')?.value;
    const { pathname } = request.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = ['/auth', '/'];
    const isPublicRoute = publicRoutes.includes(pathname);
    
    // Admin routes that require admin privileges
    const isAdminRoute = pathname.startsWith('/admin');
    
    // Protected routes that require authentication (from your (main) route group)
    const protectedRoutes = ['/dashboard', '/game', '/profile'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // If trying to access protected route without token
    if ((isProtectedRoute || isAdminRoute) && !token) {
        return NextResponse.redirect(new URL('/auth', request.url));
    }

    // If trying to access admin route, verify admin claim
    if (isAdminRoute && token) {
        try {
            // Verify token and check admin claim
            const response = await fetch(`${request.nextUrl.origin}/api/auth/verify-admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token })
            });

            if (!response.ok) {
                // Not admin, redirect to dashboard
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        } catch (error) {
            // Token invalid, redirect to auth
            return NextResponse.redirect(new URL('/auth', request.url));
        }
    }

    // If trying to access auth route while authenticated
    if (isPublicRoute && token && pathname === '/auth') {
        // Check if user is admin to redirect appropriately
        try {
            const response = await fetch(`${request.nextUrl.origin}/api/auth/verify-admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token })
            });

            if (response.ok) {
                return NextResponse.redirect(new URL('/admin', request.url));
            } else {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        } catch (error) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}