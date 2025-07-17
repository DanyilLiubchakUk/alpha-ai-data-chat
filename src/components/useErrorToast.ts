import { toast } from "sonner";

export function showErrorToast(
    error: any,
    fallback: string = "Something went wrong"
) {
    const message = (error && error.message) || fallback;
    toast.error(message);
}
