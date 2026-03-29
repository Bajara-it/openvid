"use client";

import { AuthProvider } from "@/hooks/useAuth";

export default function EditorLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-neutral-950">
                {children}
            </div>
        </AuthProvider>
    );
}
