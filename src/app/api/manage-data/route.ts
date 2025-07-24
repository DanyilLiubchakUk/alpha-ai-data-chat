import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import {
    deleteVectorsByFilename,
    deleteWholeIndex,
} from "@/lib/vector/pinecone";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
    try {
        const { fileName, action, docId, chatHistory } = await req.json();

        const adminDb = await initAdmin();

        switch (action) {
            case "delete": {
                try {
                    const pc = new Pinecone({
                        apiKey: process.env.PINECONE_API_KEY!,
                    });

                    await adminDb.collection("admin_files").doc(docId).delete();
                    await deleteVectorsByFilename(pc, fileName);
                    return NextResponse.json({
                        success: true,
                    });
                } catch (error) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: { message: "Failed to delete file" },
                        },
                        { status: 500 }
                    );
                }
            }
            case "getAllFiles": {
                try {
                    const files = await adminDb.collection("admin_files").get();
                    return NextResponse.json({
                        success: true,
                        files: files.docs.map((doc) => ({
                            docId: doc.id,
                            ...doc.data(),
                        })),
                    });
                } catch (error) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: { message: "Failed to get files" },
                        },
                        { status: 500 }
                    );
                }
            }
            case "delete-all": {
                try {
                    const files = await adminDb.collection("admin_files").get();
                    files.docs.forEach(async (doc) => {
                        await doc.ref.delete();
                    });
                    const pc = new Pinecone({
                        apiKey: process.env.PINECONE_API_KEY!,
                    });
                    await deleteWholeIndex(pc);
                    return NextResponse.json({
                        success: true,
                    });
                } catch (error) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: { message: "Failed to delete all files" },
                        },
                        { status: 500 }
                    );
                }
            }
            case "uploud-chat-history": {
                try {
                    let sent;
                    if (docId === null) {
                        sent = await adminDb.collection("chat_history").add({
                            chatHistory: chatHistory,
                        });
                        return NextResponse.json({
                            success: true,
                            docId: sent.id,
                        });
                    } else {
                        sent = await adminDb
                            .collection("chat_history")
                            .doc(docId)
                            .update({
                                chatHistory: chatHistory,
                            });
                        return NextResponse.json({
                            success: true,
                            docId: docId,
                        });
                    }
                } catch (error) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: { message: "Failed to upload chat history" },
                        },
                        { status: 500 }
                    );
                }
            }
            case "get-all-chats": {
                try {
                    const chats = await adminDb
                        .collection("chat_history")
                        .get();
                    return NextResponse.json({
                        success: true,
                        chats: chats.docs.map((doc) => ({
                            docId: doc.id,
                            ...doc.data(),
                        })),
                    });
                } catch (error) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: { message: "Failed to get chats" },
                        },
                        { status: 500 }
                    );
                }
            }
            case "delete-chat": {
                try {
                    await adminDb
                        .collection("chat_history")
                        .doc(docId)
                        .delete();
                    return NextResponse.json({
                        success: true,
                    });
                } catch (error) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: { message: "Failed to delete chat" },
                        },
                        { status: 500 }
                    );
                }
            }

            default: {
                return NextResponse.json(
                    {
                        success: false,
                        error: { message: "Invalid action" },
                    },
                    { status: 400 }
                );
            }
        }
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
