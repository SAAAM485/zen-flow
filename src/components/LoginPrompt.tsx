'use client';

import { useContext } from 'react';
import { signIn } from 'next-auth/react';
import { LoginPromptContext } from '@/context/LoginPromptContext';

const LoginPrompt: React.FC = () => {
  const { showLoginPrompt, setShowLoginPrompt } = useContext(LoginPromptContext);

  if (!showLoginPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-primary-text bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-secondary-bg p-8 rounded-lg shadow-lg max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold mb-4 text-primary-text">喜歡這篇貼文嗎？</h2>
        <p className="mb-6 text-primary-text">透過 Google/GitHub 加入我們，只需要 10 秒鐘！</p>
        <div className="flex flex-col space-y-3">
          <button
            onClick={() => signIn('github', { callbackUrl: '/' })}
            className="px-6 py-3 bg-secondary-text text-secondary-bg rounded-lg shadow-md hover:bg-primary-text transition-colors"
          >
            使用 GitHub 登入
          </button>
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="px-6 py-3 bg-secondary-text text-secondary-bg rounded-lg shadow-md hover:bg-primary-text transition-colors"
          >
            使用 Google 登入
          </button>
          <button
            onClick={() => setShowLoginPrompt(false)}
            className="mt-4 text-primary-text hover:text-secondary-text"
          >
            稍後再說
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPrompt;
