"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { showErrorToast } from "@/components/useErrorToast";
import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { useFilesStore } from "@/store/filesStore";

export default function AddNewData() {
    const { refreshFiles } = useFilesStore();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const files = fileInputRef.current?.files;
        if (!files || files.length === 0) {
            showErrorToast(
                null,
                "Please select at least one .txt file to upload."
            );
            return;
        }

        // Check if all files are .txt
        const invalidFile = Array.from(files).find(
            (file) => !file.name.toLowerCase().endsWith(".txt")
        );
        if (invalidFile) {
            showErrorToast(null, "Only .txt files are allowed");
            return;
        }

        const formData = new FormData();
        Array.from(files).forEach((file) => {
            formData.append("files", file);
        });

        setUploading(true);

        try {
            const response = await fetch("/api/upload-data", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            if (!result.success) {
                showErrorToast(result.error, "Upload failed");
                return;
            }

            refreshFiles();
            showErrorToast(null, "Files uploaded successfully");

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (err: any) {
            console.error(err);
            showErrorToast(err, "Upload error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <section
            className="p-4 flex flex-col items-center"
            aria-labelledby="add-data-heading"
        >
            <h1
                id="add-data-heading"
                className="text-2xl font-semibold mb-4 text-center"
            >
                Upload New Company Data
            </h1>
            <form
                onSubmit={handleFileUpload}
                aria-labelledby="add-data-heading"
                className="flex flex-col items-center w-full"
            >
                <Label htmlFor="file-upload" className="mb-2 w-full text-left">
                    Select .txt files to upload
                </Label>
                <input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    accept=".txt"
                    multiple
                    disabled={uploading}
                    className="border p-2 mb-2 w-full rounded"
                />
                <Button
                    type="submit"
                    disabled={uploading}
                    aria-busy={uploading}
                    className="bg-blue-500 text-white px-4 py-2 rounded w-full flex items-center justify-center max-w-min"
                >
                    {uploading ? (
                        <span className="flex items-center">Uploading...</span>
                    ) : (
                        "Upload"
                    )}
                </Button>
            </form>
        </section>
    );
}
