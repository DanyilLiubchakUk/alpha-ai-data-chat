"use client";

import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push("/admin");
            } else {
                router.push("/admin/signin");
            }
        });

        return () => unsubscribe();
    }, [router]);

    return <div>Loading...</div>;
}
