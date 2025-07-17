"use client";
import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const UserAvatar = () => (
    <Avatar className="w-8 h-8">
        <AvatarImage src="/user-avatar.png" alt="User" />
        <AvatarFallback className="bg-blue-500 text-white font-bold">
            U
        </AvatarFallback>
    </Avatar>
);

const AIAvatar = () => (
    <Avatar className="w-8 h-8">
        <AvatarImage src="/ai-avatar.png" alt="AI Assistant" />
        <AvatarFallback className="bg-green-500 text-white font-bold">
            AI
        </AvatarFallback>
    </Avatar>
);

const AI_RESPONSES = [
    "Hello! How can I assist you today?",
    "Sure, let me look that up for you.",
    "Here's some information you might find useful.",
    "Can you please clarify your question?",
    "I'm here to help with anything you need.",
];

interface Message {
    id: string;
    sender: "user" | "ai";
    text: string;
    timestamp: number;
}

export default function RightPanel() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            sender: "ai",
            text: "Hi! I'm your AI assistant. How can I help you?",
            timestamp: Date.now(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [responseIndex, setResponseIndex] = useState(0);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMessage = input.trim();
        setInput("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
        const newMessage: Message = {
            id: Date.now().toString(),
            sender: "user",
            text: userMessage,
            timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, newMessage]);
        setIsTyping(true);
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                sender: "ai",
                text: AI_RESPONSES[responseIndex % AI_RESPONSES.length],
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, aiResponse]);
            setResponseIndex((prev) => prev + 1);
            setIsTyping(false);
        }, 2000);
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
                role="log"
                aria-live="polite"
                aria-label="Chat conversation history"
            >
                {messages.map((message) => (
                    <article
                        key={message.id}
                        className={`flex items-end gap-2 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                        aria-label={`${message.sender === "user" ? "User" : "AI assistant"} message`}
                    >
                        {message.sender === "ai" && <AIAvatar />}
                        <div className="flex flex-col gap-1">
                            <div
                                className={`px-4 py-2 rounded-lg max-w-xs break-words ${message.sender === "user" ? "bg-blue-500 text-white rounded-br-none" : "bg-gray-100 text-gray-900 rounded-bl-none"}`}
                            >
                                <p className="text-sm whitespace-pre-wrap">
                                    {message.text}
                                </p>
                            </div>
                        </div>
                        {message.sender === "user" && <UserAvatar />}
                    </article>
                ))}
                {isTyping && (
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
                        className={`absolute top-2 right-4 p-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 opacity-50 ${isTyping || !input.trim() ? "text-gray-400 cursor-not-allowed" : "text-blue-500 hover:bg-blue-50 active:bg-blue-100 hover:opacity-100 focus-visible:opacity-100"}`}
                        aria-label="Send message to AI assistant"
                        size="icon"
                        variant="ghost"
                    >
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
                    </Button>
                </div>
            </form>
        </main>
    );
}
