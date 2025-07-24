import "server-only";
import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";

import { TextLoader } from "langchain/document_loaders/fs/text";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { createPineconeIndex, updatePinecone } from "@/lib/vector/pinecone";

export async function POST() {
    try {
        const loader = new DirectoryLoader("./documents", {
            ".txt": (path) => new TextLoader(path),
        });

        const docs = await loader.load();

        const pc = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!,
        });

        await createPineconeIndex(pc);
        await updatePinecone(pc, docs);

        return NextResponse.json({
            success: true,
            data: "successfully created index and loaded data into pinecone...",
        });
    } catch (err) {
        return NextResponse.json(
            {
                success: false,
                error: { message: "Internal server error" },
            },
            { status: 500 }
        );
    }
}
