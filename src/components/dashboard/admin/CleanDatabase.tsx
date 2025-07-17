"use client";

import React, { useState, useMemo } from "react";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function CleanDatabase() {
    // Placeholder data for demonstration
    const placeholderData: Record<string, any[]> = {
        users: [
            { id: 1, name: "Alice", email: "alice@example.com" },
            { id: 2, name: "Bob", email: "bob@example.com" },
        ],
        posts: [
            { id: 1, title: "Hello World", content: "This is a post." },
            { id: 2, title: "Another Post", content: "More content here." },
        ],
    };

    // State management
    const [data, setData] = useState<Record<string, any[]>>({});
    const [fetched, setFetched] = useState(false);
    const [editingCollection, setEditingCollection] = useState<string | null>(
        null
    );
    const [editCollectionValue, setEditCollectionValue] = useState<string>("");

    // Fetch all collections (placeholder)
    const fetchAllCollections = () => {
        setData(placeholderData);
        setFetched(true);
    };

    // Handle collection name editing
    const handleEditCollection = (collectionName: string) => {
        setEditingCollection(collectionName);
        setEditCollectionValue(collectionName);
    };

    const handleSaveCollection = (oldName: string, newName: string) => {
        // TODO: Implement collection renaming logic
        console.log("Update collection name", { oldName, newName });
        setEditingCollection(null);
    };

    return (
        <section
            className="h-full p-4 overflow-y-auto"
            aria-labelledby="clean-database-heading"
        >
            <header>
                <h2
                    id="clean-database-heading"
                    className="text-lg font-semibold text-gray-700 mb-2"
                >
                    Clean Database
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    View and edit your database collections. (Demo data)
                </p>
            </header>
            {!fetched ? (
                <Button
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={fetchAllCollections}
                    aria-label="Show all data collections"
                >
                    Show All Data
                </Button>
            ) : (
                <div aria-live="polite">
                    {Object.entries(data).map(([collectionName, docs]) => (
                        <section
                            key={collectionName}
                            className="mb-8"
                            aria-labelledby={`collection-${collectionName}`}
                        >
                            <CollectionNameHeader
                                collectionName={collectionName}
                                isEditing={editingCollection === collectionName}
                                editValue={editCollectionValue}
                                onEdit={() =>
                                    handleEditCollection(collectionName)
                                }
                                onEditChange={setEditCollectionValue}
                                onSave={() =>
                                    handleSaveCollection(
                                        collectionName,
                                        editCollectionValue
                                    )
                                }
                            />
                            <CollectionTable
                                collectionName={collectionName}
                                data={docs}
                                setData={setData}
                            />
                        </section>
                    ))}
                </div>
            )}
        </section>
    );
}

/**
 * CollectionNameHeader
 * Renders the collection name with inline editing.
 */
function CollectionNameHeader({
    collectionName,
    isEditing,
    editValue,
    onEdit,
    onEditChange,
    onSave,
}: {
    collectionName: string;
    isEditing: boolean;
    editValue: string;
    onEdit: () => void;
    onEditChange: (v: string) => void;
    onSave: () => void;
}) {
    return (
        <div className="flex items-center gap-2 group mb-2 mt-4">
            {isEditing ? (
                <>
                    <Label
                        htmlFor={`edit-collection-${collectionName}`}
                        className="sr-only"
                    >
                        Edit collection name
                    </Label>
                    <Input
                        id={`edit-collection-${collectionName}`}
                        className="border px-1 py-0.5 text-sm rounded"
                        value={editValue}
                        onChange={(e) => onEditChange(e.target.value)}
                        autoFocus
                        aria-label="Collection name"
                    />
                    <Button
                        className="px-2 py-0.5 bg-green-500 text-white rounded text-xs"
                        onClick={onSave}
                        aria-label="Save collection name"
                        size="sm"
                    >
                        Save
                    </Button>
                </>
            ) : (
                <>
                    <h2
                        id={`collection-${collectionName}`}
                        className="text-xl font-bold"
                    >
                        {collectionName}
                    </h2>
                    <Button
                        className="ml-1 px-2 py-0.5 bg-gray-300 text-xs rounded opacity-0 group-hover:opacity-100 transition"
                        style={{ pointerEvents: "auto" }}
                        onClick={onEdit}
                        aria-label={`Edit collection name: ${collectionName}`}
                        size="sm"
                        variant="secondary"
                    >
                        Edit
                    </Button>
                </>
            )}
        </div>
    );
}

function CollectionTable({
    collectionName,
    data,
    setData,
}: {
    collectionName: string;
    data: any[];
    setData: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}) {
    // Compute columns from data
    const columns = useMemo(() => {
        const keys = new Set<string>();
        data.forEach((row) => Object.keys(row).forEach((k) => keys.add(k)));
        return Array.from(keys).map((key) => ({
            accessorKey: key,
            header: key,
            cell: (info: any) => String(info.getValue() ?? ""),
        }));
    }, [data]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    // Cell editing state
    const [editingCell, setEditingCell] = useState<{
        rowIndex: number;
        colKey: string;
    } | null>(null);
    const [editValue, setEditValue] = useState<string>("");

    // Update cell value
    const updateCell = (rowIndex: number, colKey: string, value: string) => {
        const updatedData = [...data];
        updatedData[rowIndex][colKey] = value;
        setData((prevData) => ({
            ...prevData,
            [collectionName]: updatedData,
        }));
        setEditingCell(null);
    };

    // Cancel cell editing
    const cancelEdit = () => {
        setEditingCell(null);
        setEditValue("");
    };

    if (!data.length) {
        return <div className="text-gray-500">No data</div>;
    }

    return (
        <div
            className="overflow-x-auto border rounded"
            tabIndex={0}
            aria-label={`Table for ${collectionName}`}
        >
            <table
                className="min-w-full text-sm"
                aria-describedby={`collection-${collectionName}`}
            >
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="bg-gray-100">
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    className="px-2 py-1 border-b font-semibold text-left"
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
                    {table.getRowModel().rows.map((row, rowIndex) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                            {row.getVisibleCells().map((cell) => {
                                const colKey = cell.column.id;
                                const isEditing =
                                    editingCell &&
                                    editingCell.rowIndex === rowIndex &&
                                    editingCell.colKey === colKey;
                                return (
                                    <td
                                        key={cell.id}
                                        className="px-2 py-1 border-b relative group"
                                    >
                                        {isEditing ? (
                                            <div className="flex items-center gap-1">
                                                <Label
                                                    htmlFor={`edit-cell-${collectionName}-${rowIndex}-${colKey}`}
                                                    className="sr-only"
                                                >
                                                    Edit {colKey}
                                                </Label>
                                                <Input
                                                    id={`edit-cell-${collectionName}-${rowIndex}-${colKey}`}
                                                    className="border px-1 py-0.5 text-xs rounded focus:ring-2 focus:ring-blue-300"
                                                    value={editValue}
                                                    onChange={(e) =>
                                                        setEditValue(
                                                            e.target.value
                                                        )
                                                    }
                                                    autoFocus
                                                    aria-label={`Edit ${colKey}`}
                                                />
                                                <Button
                                                    className="ml-1 px-2 py-0.5 bg-green-500 text-white rounded text-xs transition-all duration-150"
                                                    onClick={() =>
                                                        updateCell(
                                                            rowIndex,
                                                            colKey,
                                                            editValue
                                                        )
                                                    }
                                                    aria-label="Save cell"
                                                    size="sm"
                                                >
                                                    Save
                                                </Button>
                                                <Button
                                                    className="ml-1 px-2 py-0.5 bg-gray-500 text-white rounded text-xs transition-all duration-150"
                                                    onClick={cancelEdit}
                                                    aria-label="Cancel edit"
                                                    size="sm"
                                                    variant="secondary"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <span>
                                                    {flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext()
                                                    )}
                                                </span>
                                                <Button
                                                    className="ml-1 px-2 py-0.5 bg-blue-300 text-xs rounded opacity-0 group-hover:opacity-100 transition"
                                                    style={{
                                                        pointerEvents: "auto",
                                                    }}
                                                    onClick={() => {
                                                        setEditingCell({
                                                            rowIndex,
                                                            colKey,
                                                        });
                                                        setEditValue(
                                                            String(
                                                                cell.getValue() ??
                                                                    ""
                                                            )
                                                        );
                                                    }}
                                                    aria-label={`Edit ${colKey}`}
                                                    size="sm"
                                                    variant="secondary"
                                                >
                                                    Edit
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
