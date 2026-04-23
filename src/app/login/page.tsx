import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome back</h1>
        <p className="text-gray-600 mb-6">
          Sign in with Kinde to continue to your shopping lists.
        </p>
        <div className="flex flex-col gap-3">
          <LoginLink
            postLoginRedirectURL="/dashboard"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Sign in with Kinde
          </LoginLink>
          <RegisterLink
            postLoginRedirectURL="/dashboard"
            className="px-6 py-3 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition"
          >
            Create an account
          </RegisterLink>
        </div>
      </div>
    </div>
  );
}
