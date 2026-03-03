import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


// enum Roles {
//     Admin = 'admin',
//     Manager = 'manager',
//     Staff = 'staff',
//     DefaultUser = 'user',
// }

// enum adminRoutes {
//     Dashboard = '/api/dashboard',
//     Users = '/api/users',
// }

// enum managerRoutes {
//     Dashboard = '/api/dashboard',
//     Users = '/api/users',
// }

// enum adminMethods {
//     GET = 'GET',
//     POST = 'POST',
//     PUT = 'PUT',
//     DELETE = 'DELETE',
// }

// enum managerMethods {
//     GET = 'GET',
//     POST = 'POST',
//     PUT = 'PUT',
// }

// enum staffMethods {
//     GET = 'GET',
// }

// enum defaultUserMethods {
//     GET = 'GET',
// }



/*
    UPD: 2026-03-01 - Updated

    Next.js updated docs for middleware. Middleware is now middleware to proxy requests to the server.
    - export function middleware() {
    + export function proxy() {
    - middleware.ts
    + proxy.ts

    Middleware to check if the user is authenticated before allowing access to protected routes.
    - If the user is not authenticated, they will be redirected to the login page.
    - Roles routes can be added in the future to restrict access based on user roles (e.g., admin, manager, staff).

    Routes:
    - /api/modelName - Public route for getting data but protected for CRUD operations.
    - /api/modelName/{id} - Public route for getting specific data but protected for CRUD operations.
    - /api/auth/* - Public routes for authentication (login, register, etc.). 

    Access Control:
    - Admin: Full access to all routes and methods.
    - Manager: Access to dashboard and users routes with GET, POST, PUT methods.
    - Staff: Access to dashboard route with GET method only.
    - Default User: Access to public routes with GET method only.
*/
export function proxy() {
    // const { pathname } = request.nextUrl;
    // const isAuthenticated = true; // Placeholder for authentication check logic

    // if (!isAuthenticated) {
    //     return NextResponse.redirect(new URL('/api/auth/login', request.url));
    // }

    // if (pathname === '/api/auth/login' || pathname === '/api/auth/register') {
    //     return NextResponse.next();
    // }

    


    return NextResponse.next();

}