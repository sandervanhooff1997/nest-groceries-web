import { withAuth } from '@kinde-oss/kinde-auth-nextjs/middleware';

// Any page matching the matcher below will be gated by Kinde. If the user
// isn't authenticated they'll be redirected into Kinde's hosted login flow
// before the React tree even renders. The in-app `<ProtectedRoute>` is a
// belt-and-braces fallback for client-only navigations.
export default withAuth;

export const config = {
  matcher: ['/dashboard/:path*', '/shopping-lists/:path*'],
};
