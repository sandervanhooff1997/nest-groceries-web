import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/components';

export default function LogoutPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Logout</h1>
      <LogoutLink className="px-4 py-2 bg-red-600 text-white rounded">Sign out</LogoutLink>
    </div>
  );
}
