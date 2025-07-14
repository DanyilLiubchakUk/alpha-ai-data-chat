import { toast } from "sonner";
import { Toaster } from "sonner";

export function showErrorToast(
    error: any,
    fallback: string = "Something went wrong"
) {
    const message = (error && error.message) || fallback;
    toast.error(message);
}
export { Toaster };
