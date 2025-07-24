import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { Pinecone } from "@pinecone-database/pinecone";
import { createPineconeIndex, updatePinecone } from "@/lib/vector/pinecone";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = formData.getAll("files") as File[];

        if (!files.length) {
            return NextResponse.json(
                { success: false, error: { message: "No files uploaded" } },
                { status: 400 }
            );
        }

        const adminDb = await initAdmin();

        const firestoreWrites = [];
        const docsForPinecone = [];

        for (const file of files) {
            const fileName = file.name || "";

            if (!fileName.endsWith(".txt")) {
                return NextResponse.json(
                    {
                        success: false,
                        error: { message: "Only .txt files are accepted." },
                    },
                    { status: 400 }
                );
            }

            // Check if file with this name already exists
            const existing = await adminDb
                .collection("admin_files")
                .where("fileName", "==", fileName)
                .limit(1)
                .get();

            if (!existing.empty) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            message: `File "${fileName}" has already been uploaded.`,
                        },
                    },
                    { status: 409 }
                );
            }

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const tempPath = path.join(os.tmpdir(), file.name);

            await writeFile(tempPath, buffer);

            const loader = new TextLoader(tempPath);
            const docs = await loader.load();

            // Save to Firestore and prepare for Pinecone
            for (const doc of docs) {
                firestoreWrites.push(
                    await adminDb.collection("admin_files").add({
                        fileName: file.name,
                        text: doc.pageContent,
                        uploadedAt: new Date(),
                        id: crypto.randomUUID(),
                    })
                );
                docsForPinecone.push(doc);
            }

            await unlink(tempPath);
        }
        await Promise.all(firestoreWrites);

        // 2. Send to Pinecone (ensure index exists first)
        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
        await createPineconeIndex(pc);
        await updatePinecone(pc, docsForPinecone);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: { message: "Internal server error" },
            },
            { status: 500 }
        );
    }
}
