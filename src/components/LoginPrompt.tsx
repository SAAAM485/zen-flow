"use client";

import { useContext } from "react";
import { signIn } from "next-auth/react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { LoginPromptContext } from "@/context/LoginPromptContext";

const LoginPrompt: React.FC = () => {
    const { showLoginPrompt, setShowLoginPrompt } =
        useContext(LoginPromptContext);

    if (!showLoginPrompt) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-primary-text bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-secondary-bg p-8 rounded-lg shadow-lg max-w-sm w-full text-center">
                <h2 className="text-2xl font-bold mb-4 text-primary-text">
                    Like this post?
                </h2>
                <p className="mb-6 text-primary-text">
                    Join us via GitHub / Google
                </p>
                <div className="flex flex-col space-y-3">
                    <button
                        onClick={() => signIn("github", { callbackUrl: "/" })}
                        className="flex items-center justify-center px-6 py-3 bg-secondary-text text-secondary-bg rounded-lg shadow-md hover:bg-primary-text transition-colors"
                    >
                        <FaGithub className="mr-2" />
                        Sign in with GitHub
                    </button>
                    <button
                        onClick={() => signIn("google", { callbackUrl: "/" })}
                        className="flex items-center justify-center px-6 py-3 bg-secondary-text text-secondary-bg rounded-lg shadow-md hover:bg-primary-text transition-colors"
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
