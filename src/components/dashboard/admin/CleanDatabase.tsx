"use client";

import { useState, useEffect, useMemo } from "react";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    ColumnDef,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { showErrorToast } from "@/components/useErrorToast";
import { useFilesStore } from "@/store/filesStore";
import JSZip from "jszip";

export default function CleanDatabase() {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingIndex, setDeletingIndex] = useState<string | null>(null);
    const { files, setFiles, refreshFiles } = useFilesStore();

    useEffect(() => {
        (async () => {
            try {
                await refreshFiles();
            } catch (error: any) {
                showErrorToast(error, "Failed to fetch files");
            }
        })();
    }, []);

    const columns = useMemo<ColumnDef<any>[]>(
        () => [
            {
                header: "Filename",
                accessorKey: "fileName",
                cell: () => null,
            },
        ],
        []
    );

    const deleteFile = async (id: string) => {
        setDeletingIndex(id);
        setIsDeleting(true);
        try {
            const res = await fetch("/api/manage-data", {
                method: "POST",
                body: JSON.stringify({
                    action: "delete",
                    fileName:
                        files.find((file) => file.docId === id)?.fileName || "",
                    docId: id,
                }),
            });
            const response = await res.json();

            if (!response.success) {
                showErrorToast(response.error, "Failed to delete file");
            } else {
                setFiles(files.filter((file) => file.docId !== id));
                showErrorToast(null, "File deleted successfully");
            }
        } catch (error: any) {
            showErrorToast(error, "Failed to delete file");
        } finally {
            setDeletingIndex(null);
            setIsDeleting(false);
        }
    };

    const downloadFile = async (id: string) => {
        try {
            const file = files.find((f) => f.docId === id);
            if (!file) {
                showErrorToast(null, "File not found");
                return;
            }
            const blob = new Blob([file.text], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.fileName || "file.txt";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error: any) {
            showErrorToast(error, "Failed to download file");
        }
    };

    const handleDeleteAll = async () => {
        setDeletingIndex("all");
        setIsDeleting(true);
        try {
            const response = await fetch("/api/manage-data", {
                method: "POST",
                body: JSON.stringify({ action: "delete-all" }),
            });

            const result = await response.json();
            if (!result.success) {
                showErrorToast(result.error, "Failed to delete all files");
            } else {
                setFiles([]);
                showErrorToast(null, "All files deleted successfully");
            }
        } catch (error: any) {
            showErrorToast(error, "Failed to delete all files");
        } finally {
            setDeletingIndex(null);
            setIsDeleting(false);
        }
    };

    const handleDownloadZip = async () => {
        try {
            const zip = new JSZip();
            files.forEach((file) => {
                zip.file(file.fileName, file.text);
            });
            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = "all_files.zip";
            a.click();
            URL.revokeObjectURL(url);
        } catch (error: any) {
            showErrorToast(error, "Failed to download zip");
        }
    };

    const table = useReactTable({
        data: files,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <section
            className="p-4 overflow-y-auto"
            aria-labelledby="clean-database-heading"
        >
            <header>
                <h2
                    id="clean-database-heading"
                    className="text-lg font-semibold text-gray-700 mb-2"
                >
                    View and edit
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    View and edit your database collections. (Demo data)
                </p>
            </header>
            {files.length > 0 ? (
                <table className="min-w-full border">
                    <thead className="group">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-4 py-2 border-b relative"
                                    >
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                        <div
                                            className={`
                                                    absolute right-2 top-1/2 -translate-y-1/2
                                                    flex gap-2
                                                    opacity-0 group-hover:opacity-100 ${isDeleting && deletingIndex === "all" ? "opacity-100" : ""}
                                                    transition-opacity
                                                    bg-white
                                                    px-2
                                                `}
                                        >
                                            <Button
                                                variant="outline"
                                                className={`bg-red-500 hover:bg-red-800 text-white ${isDeleting && deletingIndex === "all" ? "bg-red-800 animate-pulse cursor-not-allowed" : ""}`}
                                                onClick={handleDeleteAll}
                                                disabled={
                                                    isDeleting &&
                                                    deletingIndex === "all"
                                                }
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="16"
                                                    height="16"
                                                    fill="currentColor"
                                                    viewBox="0 0 16 16"
                                                >
                                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                                                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                                                </svg>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className={`bg-blue-500 hover:bg-blue-800 text-white`}
                                                onClick={handleDownloadZip}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="16"
                                                    height="16"
                                                    fill="currentColor"
                                                    viewBox="0 0 16 16"
                                                >
                                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                                                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z" />
                                                </svg>
                                            </Button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                className="group relative hover:bg-gray-50"
                            >
                                {row.getVisibleCells().map((cell, idx) => (
                                    <td
                                        key={cell.id}
                                        className={
                                            "px-4 py-2 border-b " +
                                            (idx === 0 ? "w-full relative" : "")
                                        }
                                    >
                                        {idx === 0 ? (
                                            <>
                                                <span className="block truncate pr-28">
                                                    {row.original.fileName}
                                                </span>
                                                <div
                                                    className={`
                                                    absolute right-2 top-1/2 -translate-y-1/2
                                                    flex gap-2
                                                    opacity-0 group-hover:opacity-100 ${isDeleting && deletingIndex === row.original.docId ? "opacity-100" : ""}
                                                    transition-opacity
                                                    bg-white
                                                    px-2
                                                `}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        className={`hover:bg-red-500 hover:text-white ${isDeleting && deletingIndex === row.original.docId ? "bg-red-500 text-white animate-pulse cursor-not-allowed" : ""}`}
                                                        onClick={() => {
                                                            deleteFile(
                                                                row.original
                                                                    .docId
                                                            );
                                                        }}
                                                        disabled={
                                                            isDeleting &&
                                                            deletingIndex ===
                                                                row.original
                                                                    .docId
                                                        }
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="16"
                                                            height="16"
                                                            fill="currentColor"
                                                            viewBox="0 0 16 16"
                                                        >
                                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                                                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                                                        </svg>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="hover:bg-blue-500 hover:text-white"
                                                        onClick={() => {
                                                            downloadFile(
                                                                row.original
                                                                    .docId
                                                            );
                                                        }}
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="16"
                                                            height="16"
                                                            fill="currentColor"
                                                            viewBox="0 0 16 16"
                                                        >
                                                            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                                                            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z" />
                                                        </svg>
                                                    </Button>
                                                </div>
                                            </>
                                        ) : null}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text-gray-500">No files found</p>
            )}
        </section>
    );
}
