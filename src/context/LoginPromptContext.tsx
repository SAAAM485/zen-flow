"use client";

import React, { createContext, useState, ReactNode, Dispatch, SetStateAction } from "react";

interface LoginPromptContextType {
    showLoginPrompt: boolean;
    setShowLoginPrompt: Dispatch<SetStateAction<boolean>>;
}

export const LoginPromptContext = createContext<LoginPromptContextType>(
    {} as LoginPromptContextType
);

export const LoginPromptProvider = ({ children }: { children: ReactNode }) => {
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    return (
        <LoginPromptContext.Provider
            value={{ showLoginPrompt, setShowLoginPrompt }}
        >
            {children}
        </LoginPromptContext.Provider>
    );
};
