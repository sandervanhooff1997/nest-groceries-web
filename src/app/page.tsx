'use client';

import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gray-50 w-full min-h-screen flex items-center justify-center">
        <div className="text-center px-6 w-full max-w-2xl">
          <div className="mb-8">
            <h1 className="text-6xl font-bold mb-4 text-gray-900 dark:text-gray-100">🛒 Nest Groceries</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">Your intelligent shopping list companion</p>
          </div>

          <div className="flex gap-4 justify-center mt-8">
            <LoginLink
              postLoginRedirectURL="/dashboard"
              className="px-8 py-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition shadow-lg"
            >
              Sign In
            </LoginLink>
            <RegisterLink
              postLoginRedirectURL="/dashboard"
              className="px-8 py-3 bg-blue-600 dark:bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-400 transition shadow-lg border-2 border-white dark:border-gray-800"
            >
              Create Account
            </RegisterLink>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="text-3xl mb-2">📝</div>
              <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">Create Lists</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Organize shopping by category or store</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="text-3xl mb-2">✓</div>
              <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">Track Items</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Check off items as you shop</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="text-3xl mb-2">🔄</div>
              <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">Sync & Share</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Keep lists updated in real-time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
