import AuthProvider from "@/components/AuthProvider";

export default function AdminPage() {
    return (
        <AuthProvider>
            <div>Your admin dashboard content here</div>
        </AuthProvider>
    );
}
