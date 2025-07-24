import React, { useMemo, useState, useEffect } from "react";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { showErrorToast } from "@/components/useErrorToast";

type ChatHistory = Array<{ user: string; ai: string }>;

interface ChatDocument {
    docId: string;
    chat: ChatHistory;
}

export default function ViewHistory() {
    const [chatHistory, setChatHistory] = useState<ChatDocument[]>([]);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const response = await fetch("/api/manage-data", {
                    method: "POST",
                    body: JSON.stringify({ action: "get-all-chats" }),
                });
                const data = await response.json();
                if (data.success) {
                    const result = data.chats.map((doc: any) => ({
                        docId: doc.docId,
                        chat: doc.chatHistory
                            .slice(1)
                            .filter((_: any, i: any) => i % 2 === 0)
                            .map((userMessage: any, i: any) => ({
                                user: userMessage.text,
                                ai: doc.chatHistory[i * 2 + 2].text,
                            })),
                    }));
                    setChatHistory(result);
                } else {
                    showErrorToast(data.error, "Failed to fetch chat history");
                }
            } catch (error: any) {
                showErrorToast(error, "Failed to fetch chat history");
            }
        };
        fetchChats();
    }, []);

    const handleDelete = async (docId: string) => {
        setDeletingId(docId);
        try {
            const response = await fetch("/api/manage-data", {
                method: "POST",
                body: JSON.stringify({ action: "delete-chat", docId: docId }),
            });
            const data = await response.json();
            if (data.success) {
                setChatHistory((prev) =>
                    prev.filter((chat) => chat.docId !== docId)
                );
                setDeletingId(null);
            } else {
                showErrorToast(data.error, "Failed to delete chat");
                setDeletingId(null);
            }
        } catch (error: any) {
            showErrorToast(error, "Failed to delete chat");
            setDeletingId(null);
        }
    };

    if (!chatHistory || chatHistory.length === 0) {
        return (
            <section
                className="h-full p-4 overflow-y-auto"
                aria-labelledby="chat-history-heading"
            >
                <h2 className="sr-only">Admin Chat History</h2>
                No chat history available.
            </section>
        );
    }

    return (
        <section
            className="h-full p-4 overflow-y-auto"
            aria-labelledby="chat-history-heading"
        >
            <h2 className="sr-only">Admin Chat History</h2>
            <header>
                <h2
                    id="chat-history-heading"
                    className="text-lg font-semibold text-gray-700 mb-2"
                >
                    Chat History
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    View history of chats to see what to add/change inside of
                    the database.
                </p>
            </header>
            <div className="space-y-8">
                {chatHistory.map((chat, chatIdx) => (
                    <article
                        key={chat.docId}
                        aria-label={`Chat session ${chatIdx + 1}`}
                        className={`relative rounded shadow-sm ${
                            deletingId === chat.docId ? "opacity-50" : ""
                        }`}
                    >
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Delete chat history"
                            onClick={() => handleDelete(chat.docId)}
                            disabled={deletingId === chat.docId}
                            className="absolute top-0.5 right-2 z-10 w-6 h-6 rounded-full text-gray-400 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                        >
                            &#10005;
                        </Button>
                        <ChatTable chat={chat.chat} chatIdx={chat.docId} />
                    </article>
                ))}
            </div>
        </section>
    );
}

function ChatTable({ chat, chatIdx }: { chat: ChatHistory; chatIdx: string }) {
    const columns = useMemo(
        () => [
            {
                accessorKey: "user",
                header: () => <Label>User</Label>,
                cell: (info: any) => info.getValue(),
            },
            {
                accessorKey: "ai",
                header: () => <Label>AI</Label>,
                cell: (info: any) => info.getValue(),
            },
        ],
        []
    );

    const table = useReactTable({
        data: chat,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <table
            className="min-w-full text-sm border-separate border-spacing-0"
            aria-describedby={`chat-session-caption-${chatIdx}`}
        >
            <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="bg-gray-100">
                        {headerGroup.headers.map((header) => (
                            <th
                                key={header.id}
                                className="px-4 py-2 border-b font-semibold text-left"
                                scope="col"
                            >
                                {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                )}
                            </th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody>
                {table.getRowModel().rows.map((row) => (
                    <tr
                        key={row.id}
                        className="hover:bg-gray-50 [&:not(:last-child)>td]:border-b"
                    >
                        {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-4 py-2 align-top">
                                {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                )}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
