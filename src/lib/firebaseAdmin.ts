import "server-only";

import admin from "firebase-admin";

export async function initAdmin() {
    try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

        if (!projectId || !clientEmail || !privateKey || !storageBucket) {
            throw new Error("Missing Firebase environment variables.");
        }

        if (admin.apps.length > 0) return admin.app().firestore();

        return admin
            .initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: privateKey.replace(/\\n/g, "\n"),
                }),
                projectId,
                storageBucket,
            })
            .firestore();
    } catch (error: any) {
        throw new Error(
            error?.message
                ? `Firebase Admin initialization error: ${error.message}`
                : "Unknown error initializing Firebase Admin."
        );
    }
}
