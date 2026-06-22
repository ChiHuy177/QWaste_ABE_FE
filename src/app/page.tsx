import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const AUTH_COOKIE_NAME = 'bff_access_token';
const DEFAULT_AUTHENTICATED_ROUTE = '/admin/space-monitoring';
const LOGIN_ROUTE = '/login';

export default async function Home() {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.has(AUTH_COOKIE_NAME);

    redirect(isAuthenticated ? DEFAULT_AUTHENTICATED_ROUTE : LOGIN_ROUTE);
}
