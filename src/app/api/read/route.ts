import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { queryPineconeVectorStoreAndQueryLLM } from "@/lib/vector/pinecone";

export async function POST(req: NextRequest) {
    try {
        const [body, history] = await req.json();
        const pc = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!,
        });

        const text = await queryPineconeVectorStoreAndQueryLLM(
            pc,
            body,
            history
        );

        return NextResponse.json({
            success: true,
            data: text,
        });
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
