"use client";

import { auth } from "@/lib/firebase";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
} from "firebase/auth";
import { showErrorToast } from "@/components/useErrorToast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleSignIn = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/admin");
        } catch (error: any) {
            showErrorToast(error, "Failed to sign in");
        }
    };

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            router.push("/admin");
        } catch (error: any) {
            showErrorToast(error, "Google sign-in failed");
        }
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-2xl mb-4">Sign In</h1>
            <form
                className="flex flex-col items-center"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSignIn();
                }}
                aria-label="Sign in form"
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
                    className="border p-2 mb-2"
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
                    className="border p-2 mb-2"
                    required
                    autoComplete="current-password"
                />
                <Button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Sign In
                </Button>
            </form>
            <Button
                onClick={handleGoogleSignIn}
                className="bg-red-500 text-white px-4 py-2 rounded mt-2"
                aria-label="Sign in with Google"
                variant="default"
            >
                Sign in with Google
            </Button>
            <p className="mt-2">
                Don't have an account?{" "}
                <Link href="/admin/signup" className="text-blue-500 underline">
                    Sign Up
                </Link>
            </p>
        </main>
    );
}
