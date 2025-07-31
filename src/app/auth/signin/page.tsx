'use client';

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Sign In to Zen Flow</h1>
      <div className="flex flex-col space-y-4">
        <button
          onClick={() => signIn("github")}
          className="px-6 py-3 bg-gray-800 text-white rounded-lg shadow-md hover:bg-gray-700 transition-colors"
        >
          Sign in with GitHub
        </button>
        <button
          onClick={() => signIn("google")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-500 transition-colors"
        >
          Sign in with Google
        </button>
        <button
          onClick={() => signIn("credentials", { guest: "true", callbackUrl: "/" })}
          className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-500 transition-colors"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
