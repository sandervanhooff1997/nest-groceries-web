'use client';

import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components';
import { useTranslations } from '@/src/lib/use-translations';

export default function LoginPage() {
  const { t } = useTranslations();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Welkom terug</h1>
        <p className="text-gray-600 mb-6">
          Log in met Kinde om door te gaan naar je boodschappenlijsten.
        </p>
        <div className="flex flex-col gap-3">
          <LoginLink
            postLoginRedirectURL="/dashboard"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
{t('login')} met Kinde
          </LoginLink>
          <RegisterLink
            postLoginRedirectURL="/dashboard"
            className="px-6 py-3 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition"
          >
Maak een account aan
          </RegisterLink>
        </div>
      </div>
    </div>
  );
}
