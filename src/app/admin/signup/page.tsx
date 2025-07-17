"use client";

import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showErrorToast } from "@/components/useErrorToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            router.push("/admin");
        } catch (error: any) {
            showErrorToast(error, "Failed to sign up");
        }
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-2xl mb-4">Sign Up</h1>
            <form
                onSubmit={handleSignUp}
                className="flex flex-col items-center w-full max-w-xs"
            >
                <Label htmlFor="email" className="sr-only">
                    Email
                </Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border p-2 mb-2 w-full"
                    required
                    autoComplete="email"
                />
                <Label htmlFor="password" className="sr-only">
                    Password
                </Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border p-2 mb-2 w-full"
                    required
                    autoComplete="new-password"
                />
                <Button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded w-full"
                >
                    Sign Up
                </Button>
            </form>
        </main>
    );
}
