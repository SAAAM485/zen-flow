"use client";

import { useContext, useState } from "react";
import { signIn } from "next-auth/react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { LoginPromptContext } from "@/context/LoginPromptContext";

const LoginPrompt: React.FC = () => {
    const { showLoginPrompt, setShowLoginPrompt } =
        useContext(LoginPromptContext);
    const [email, setEmail] = useState("");

    if (!showLoginPrompt) {
        return null;
    }

    const handleMockLogin = (e: React.FormEvent) => {
        e.preventDefault();
        signIn("credentials", { email, callbackUrl: "/" });
    };

    return (
        <div className="fixed inset-0 bg-primary-text bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-secondary-bg p-8 rounded-lg shadow-lg max-w-sm w-full text-center">
                <h2 className="text-2xl font-bold mb-4 text-primary-text">
                    Like this post?
                </h2>
                <p className="mb-6 text-primary-text">
                    Join us to share your flow
                </p>
                <div className="flex flex-col space-y-3">
                    {process.env.VERCEL_ENV !== 'production' && (
                        <>
                            <form onSubmit={handleMockLogin} className="flex flex-col space-y-3">
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter any email for mock login"
                                    className="px-4 py-2 border rounded-lg bg-primary-bg text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-blue"
                                    required
                                />
                                <button 
                                    type="submit"
                                    className="flex items-center justify-center px-6 py-3 bg-accent-blue text-white rounded-lg shadow-md hover:bg-opacity-90 transition-colors"
                                >
                                    Sign in with Mock User
                                </button>
                            </form>
                            <div className="relative flex py-3 items-center">
                                <div className="flex-grow border-t border-gray-600"></div>
                                <span className="flex-shrink mx-4 text-gray-400">or</span>
                                <div className="flex-grow border-t border-gray-600"></div>
                            </div>
                        </>
                    )}
                    <button
                        onClick={() => signIn("github", { callbackUrl: "/" })}
                        className="flex items-center justify-center px-6 py-3 bg-gray-800 text-white rounded-lg shadow-md hover:bg-gray-700 transition-colors"
                    >
                        <FaGithub className="mr-2" />
                        Sign in with GitHub
                    </button>
                    <button
                        onClick={() => signIn("google", { callbackUrl: "/" })}
                        className="flex items-center justify-center px-6 py-3 bg-white text-gray-800 rounded-lg shadow-md hover:bg-gray-200 transition-colors"
                    >
                        <FaGoogle className="mr-2" />
                        Sign in with Google
                    </button>
                    <button
                        onClick={() => setShowLoginPrompt(false)}
                        className="mt-4 text-primary-text hover:text-secondary-text"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPrompt;
