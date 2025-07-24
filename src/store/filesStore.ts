import { create } from "zustand";
import { showErrorToast } from "@/components/useErrorToast";

type FileType = {
    docId: string;
    fileName: string;
    text: string;
    id: string;
    uploadedAt: string;
};

type FilesStore = {
    files: FileType[];
    setFiles: (files: FileType[]) => void;
    refreshFiles: () => Promise<void>;
};

export const useFilesStore = create<FilesStore>((set) => ({
    files: [],
    setFiles: (files) => set({ files }),
    refreshFiles: async () => {
        try {
            const response = await fetch("/api/manage-data", {
                method: "POST",
                body: JSON.stringify({
                    action: "getAllFiles",
                }),
            });
            const data = await response.json();
            if (data.success && data.files) {
                set({ files: data.files });
            } else {
                showErrorToast(data.error, "Failed to fetch files");
                set({ files: [] });
            }
        } catch (error: any) {
            showErrorToast(error, "Failed to fetch files");
            set({ files: [] }); 
        }
    },
}));
