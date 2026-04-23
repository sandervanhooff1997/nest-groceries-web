import { handleAuth } from '@kinde-oss/kinde-auth-nextjs/server';

// App Router dynamic catch-all for Kinde auth endpoints
// (/api/auth/login, /api/auth/register, /api/auth/logout,
//  /api/auth/kinde_callback, /api/auth/setup, etc.)
export const GET = handleAuth();
