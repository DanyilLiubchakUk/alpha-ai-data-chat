"use client";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push("/admin/signin");
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return <>{children}</>;
}
