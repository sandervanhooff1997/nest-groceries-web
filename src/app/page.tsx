'use client';

import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="text-center text-white px-6">
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-4">🛒 Nest Groceries</h1>
          <p className="text-xl text-blue-100">Your intelligent shopping list companion</p>
        </div>

        <div className="flex gap-4 justify-center mt-8">
          <LoginLink
            postLoginRedirectURL="/dashboard"
            className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition shadow-lg"
          >
            Sign In
          </LoginLink>
          <RegisterLink
            postLoginRedirectURL="/dashboard"
            className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition shadow-lg border-2 border-white"
          >
            Create Account
          </RegisterLink>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-blue-700 bg-opacity-50 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-3xl mb-2">📝</div>
            <h3 className="font-semibold mb-2">Create Lists</h3>
            <p className="text-sm text-blue-100">Organize shopping by category or store</p>
          </div>
          <div className="bg-blue-700 bg-opacity-50 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-3xl mb-2">✓</div>
            <h3 className="font-semibold mb-2">Track Items</h3>
            <p className="text-sm text-blue-100">Check off items as you shop</p>
          </div>
          <div className="bg-blue-700 bg-opacity-50 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-3xl mb-2">🔄</div>
            <h3 className="font-semibold mb-2">Sync & Share</h3>
            <p className="text-sm text-blue-100">Keep lists updated in real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
}
