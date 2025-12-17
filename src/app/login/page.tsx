"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const res = await signIn("credentials", {
            username,
            password,
            redirect: false,
        });
        setIsLoading(false);

        if (res?.error) {
            setError("Invalid username or password");
        } else {
            // Check role to redirect
            const userRes = await fetch("/api/auth/session"); // Or just optimistic redirect based on expectation?
            // Better to just refresh and let the server/middleware or next client load handle.
            // But user requested SPECIFIC redirect.
            // Since `signIn` is client side and we don't know the role immediately without decoding token or fetching session,
            // it's safer to just router.refresh() and let middleware/page logic handle, OR fetch session.
            // However, usually we can just push to / and let the root page redirect if needed, OR
            // we can't easily get the role here synchronously from `signIn` response (res doesn't contain user info).
            // Let's reload to ensure session is active, then simple logic:

            // Force hard reload or simple router push
            router.refresh();
            // We'll rely on the fact that if they are HOD, they can land on home but might see nothing if we hide home?
            // Actually user said "directly the HOD user will be opened to the history page".
            // Let's try to fetch the session to get the role.

            router.push("/");
            // Ideally we would check role here. Let's assume standard flow for now and handle "Home Page for HOD"
            // The Home Page currently shows Attendance. HOD shouldn't see it.
            // So on the Home Page, if HOD, we should redirect!
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-900/5"
            >
                <div className="bg-blue-600 p-8 text-center">
                    <h1 className="text-3xl font-bold text-white">GVP SMS</h1>
                    <p className="mt-2 text-blue-100">Student Attendance Management</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Enter username"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-100">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-lg bg-blue-600 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>
                </div>
                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-500">© 2024 Gayatri Vidya Parishad</p>
                </div>
            </motion.div>
        </div>
    );
}
