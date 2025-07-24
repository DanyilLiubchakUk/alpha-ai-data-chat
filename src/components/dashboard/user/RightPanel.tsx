"use client";
import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { showErrorToast } from "@/components/useErrorToast";

const UserAvatar = () => (
    <Avatar className="w-8 h-8">
        <AvatarImage
            //  src="/ai-avatar.png"
            alt="AI Assistant"
        />
        <AvatarFallback className="bg-blue-500 text-white font-bold">
            U
        </AvatarFallback>
    </Avatar>
);

const AIAvatar = () => (
    <Avatar className="w-8 h-8">
        <AvatarImage
            //  src="/ai-avatar.png"
            alt="AI Assistant"
        />
        <AvatarFallback className="bg-green-500 text-white font-bold">
            AI
        </AvatarFallback>
    </Avatar>
);

interface Message {
    id: string;
    sender: "user" | "ai";
    text: string;
    timestamp: number;
}

export default function RightPanel() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: generateId("ai"),
            sender: "ai",
            text: process.env.NEXT_PUBLIC_AI_ASSISTANT_INTRO_MESSAGE!,
            timestamp: Date.now(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [typingAnimationText, setTypingAnimationText] = useState("");
    const [docId, setDocId] = useState<string | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 60);
        return () => clearTimeout(timeout);
    }, [messages, isTyping, typingAnimationText]);

    useEffect(() => {
        if (!isTyping && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isTyping]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    function generateId(prefix: "user" | "ai") {
        return `${prefix}-${crypto.randomUUID()}`;
    }

    const fetchAIResponse = async (userMessage: string, history: Message[]) => {
        try {
            const response = await fetch("/api/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify([userMessage, history]),
            });
            const data = await response.json();
            if (!data.success) {
                showErrorToast(data.error, "Error fetching AI response");
                throw new Error(data.error.message);
            }
            return data.data;
        } catch (error: any) {
            showErrorToast(error, "Error fetching AI response");
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const userMessage = input.trim();
        if (!userMessage || isTyping) {
            if (!userMessage) {
                showErrorToast(null, "Please enter a message before sending.");
            }
            return;
        }

        const userMsgObj: Message = {
            id: generateId("user"),
            sender: "user",
            text: userMessage,
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMsgObj]);
        setInput("");
        setIsTyping(true);
        setTypingAnimationText("");

        try {
            const aiText = await fetchAIResponse(userMessage, [
                ...messages,
                userMsgObj,
            ]);

            // Animate character-by-character with a small delay
            let animatedText = "";
            const timeout = setInterval(() => {
                chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 60);

            const basePause = 30;
            const pauseJitter = 10;
            const minBurst = 4;
            const maxBurst = 8;
            const burstCharDelay = 1;
            const burstCharJitter = 2;

            let i = 0;
            while (i < aiText.length) {
                await new Promise((resolve) =>
                    setTimeout(resolve, basePause + Math.random() * pauseJitter)
                );
                const burstLength = Math.min(
                    Math.floor(Math.random() * (maxBurst - minBurst + 1)) +
                        minBurst,
                    aiText.length - i
                );
                for (let j = 0; j < burstLength; j++, i++) {
                    animatedText += aiText[i];
                    setTypingAnimationText(animatedText);
                    await new Promise((resolve) =>
                        setTimeout(
                            resolve,
                            burstCharDelay + Math.random() * burstCharJitter
                        )
                    );
                }
            }
            clearTimeout(timeout);

            setTypingAnimationText("");
            setIsTyping(false);

            setMessages((prev) => [
                ...prev,
                {
                    id: generateId("ai"),
                    sender: "ai",
                    text: aiText,
                    timestamp: Date.now(),
                },
            ]);
            try {
                const res = await fetch("/api/manage-data", {
                    method: "POST",
                    body: JSON.stringify({
                        action: "uploud-chat-history",
                        chatHistory: [
                            ...messages,
                            userMsgObj,
                            {
                                id: generateId("ai"),
                                sender: "ai",
                                text: aiText,
                                timestamp: Date.now(),
                            },
                        ],
                        docId: docId,
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    setDocId(data.docId);
                } else {
                    showErrorToast(data.error, "Failed to save chat history");
                }
            } catch (err: any) {
                showErrorToast(err, "Failed to save chat history");
            }
        } catch (err: any) {
            showErrorToast(err, "Error fetching AI response");
            setTypingAnimationText("");
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const form = e.currentTarget.form;
            if (form) {
                form.requestSubmit();
            }
        }
    };

    return (
        <main
            className="h-full bg-white p-4 flex flex-col"
            role="main"
            aria-label="AI Chat Interface"
        >
            <section className="mb-4">
                <Label
                    className="text-xl font-semibold text-gray-900"
                    htmlFor="message-textarea"
                >
                    AI Chat Assistant
                </Label>
            </section>
            <Separator className="mb-2" />
            <ScrollArea
                className="flex-1 overflow-y-auto space-y-4 mb-4"
                role="status"
                aria-live="assertive"
                aria-label="Chat conversation history"
            >
                {messages.map((message) => (
                    <article
                        key={message.id}
                        className={`flex items-end gap-2 mb-3 ${
                            message.sender === "user"
                                ? "justify-end ml-10"
                                : "justify-start mr-10"
                        }`}
                        aria-label={`${message.sender === "user" ? "User" : "AI assistant"} message`}
                    >
                        {message.sender === "ai" && <AIAvatar />}
                        <div className="flex flex-col gap-1">
                            <div
                                className={`px-4 py-2 rounded-lg max-w-xs break-words ${
                                    message.sender === "user"
                                        ? "bg-blue-500 text-white rounded-br-none"
                                        : "bg-gray-100 text-gray-900 rounded-bl-none"
                                }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">
                                    {message.text}
                                </p>
                            </div>
                        </div>
                        {message.sender === "user" && <UserAvatar />}
                    </article>
                ))}

                {isTyping && typingAnimationText && (
                    <article className="flex items-end gap-2 mb-3 justify-start mr-10">
                        <AIAvatar />
                        <div className="flex flex-col gap-1">
                            <div className="px-4 py-2 rounded-lg max-w-xs bg-gray-100 text-gray-900 rounded-bl-none break-words animate-pulse">
                                <p className="text-sm whitespace-pre-wrap">
                                    {typingAnimationText}
                                </p>
                            </div>
                        </div>
                    </article>
                )}

                {isTyping && !typingAnimationText && (
                    <div className="flex items-center gap-2">
                        <AIAvatar />
                        <Badge variant="secondary" className="animate-pulse">
                            AI is typing...
                        </Badge>
                    </div>
                )}

                <div ref={chatEndRef} aria-hidden="true" />
            </ScrollArea>
            <Separator className="mb-2" />
            <form
                onSubmit={handleSubmit}
                className="flex items-end gap-2 border-t pt-4"
                aria-label="Send message form"
                autoComplete="off"
            >
                <div className="flex-1 relative">
                    <Label htmlFor="message-textarea" className="sr-only">
                        Type your message to the AI assistant
                    </Label>
                    <Textarea
                        ref={textareaRef}
                        id="message-textarea"
                        name="message"
                        placeholder={
                            isTyping
                                ? "AI is responding..."
                                : "Ask me anything... (Press Enter to send, Shift+Enter for new line)"
                        }
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="min-h-[76px] max-h-[120px] resize-none pr-12"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="sentences"
                        maxLength={2000}
                        rows={2}
                        aria-label="Type your message to the AI assistant"
                    />
                    <Badge
                        variant="secondary"
                        className="absolute bottom-2 right-2 text-xs"
                    >
                        {input.length}/2000
                    </Badge>
                    <Button
                        type="submit"
                        disabled={isTyping || !input.trim()}
                        className={`absolute top-2 right-4 p-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 opacity-50 ${
                            isTyping || !input.trim()
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-blue-500 hover:bg-blue-50 active:bg-blue-100 hover:opacity-100 focus-visible:opacity-100"
                        }`}
                        aria-label="Send message to AI assistant"
                        size="icon"
                        variant="ghost"
                    >
                        {isTyping ? (
                            <svg
                                className="animate-spin h-4 w-4 text-blue-500"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8z"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                            </svg>
                        )}
                    </Button>
                </div>
            </form>
        </main>
    );
}
