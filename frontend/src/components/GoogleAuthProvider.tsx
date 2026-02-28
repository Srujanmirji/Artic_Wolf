"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import React from "react";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

export function GoogleAuthProviderWrapper({ children }: { children: React.ReactNode }) {
    if (!clientId) {
        console.error("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID");
        return <>{children}</>;
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            {children}
        </GoogleOAuthProvider>
    );
}
