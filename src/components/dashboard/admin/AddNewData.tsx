"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { showErrorToast } from "@/components/useErrorToast";

const collectionOptions = [
    { value: "let-ai", label: "AI decides" },
    { value: "users", label: "Users" },
    { value: "orders", label: "Orders" },
    { value: "products", label: "Products" },
];

const formSchema = z.object({
    data: z
        .string()
        .min(1, "Data is required")
        .refine((val) => val.trim().length !== 0, {
            message: "No empty data",
        }),
    ai: z.boolean(),
    collection: z.string().min(1, "Collection is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddNewData() {
    const {
        control,
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            data: "",
            ai: true,
            collection: "",
        },
    });

    const aiValue = watch("ai");

    useEffect(() => {
        if (errors.data) showErrorToast(errors.data);
        if (errors.collection) showErrorToast(errors.collection);
    }, [errors]);

    const onSubmit = async (values: FormValues) => {
        try {
            // Add to the selected collection in Firestore

            reset();
        } catch (error: any) {
            showErrorToast(error.message || "Failed to add data.");
        }
    };

    return (
        <section
            className="h-full p-4 overflow-y-auto"
            aria-labelledby="manager-panel-heading"
        >
            <header>
                <h1
                    id="manager-panel-heading"
                    className="text-lg font-semibold mb-2"
                >
                    Manager Panel
                </h1>
                <h2 className="text-sm text-gray-500 mb-4">
                    Add new data to the database.
                </h2>
            </header>
            <form
                className="space-y-4"
                onSubmit={handleSubmit(onSubmit)}
                aria-label="Manager Data Form"
            >
                <div className="flex flex-col gap-2">
                    <Label htmlFor="data" className="block pl-2">
                        New Data
                    </Label>
                    <Textarea
                        id="data"
                        placeholder="Put new data"
                        {...register("data")}
                        className="resize-none max-h-48"
                        rows={4}
                        aria-required="true"
                        aria-invalid={!!errors.data}
                    />
                </div>
                <div className="flex gap-8 pl-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="ai"
                            {...register("ai")}
                            defaultChecked
                            aria-checked={aiValue}
                        />
                        <Label htmlFor="ai">AI</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Controller
                            name="collection"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <SelectTrigger
                                        id="collection"
                                        aria-required="true"
                                        aria-invalid={!!errors.collection}
                                    >
                                        <SelectValue placeholder="Select a collection" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-100">
                                        {collectionOptions.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        <Label htmlFor="collection" className="mb-1 block">
                            Database Collection
                        </Label>
                    </div>
                </div>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                    aria-busy={isSubmitting}
                >
                    {isSubmitting ? "Sending..." : "Send"}
                </Button>
            </form>
        </section>
    );
}
