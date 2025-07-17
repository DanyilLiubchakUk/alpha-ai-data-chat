"use client";
import AuthProvider from "@/components/AuthProvider";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import LeftPanel from "@/components/dashboard/admin/LeftPanel";
import RightPanel from "@/components/dashboard/user/RightPanel";
import { useDeviceStore } from "@/store/deviceStore";

export default function DashboardPage() {
    const isMobile = useDeviceStore((state) => state.isMobile);

    return (
        <AuthProvider>
            <div className="h-screen">
                <PanelGroup direction={isMobile ? "vertical" : "horizontal"}>
                    <Panel defaultSize={60} minSize={20} maxSize={80}>
                        <LeftPanel />
                    </Panel>
                    <PanelResizeHandle
                        className={`${
                            isMobile ? "h-1.5" : "w-1.5"
                        } bg-gray-300 hover:bg-gray-500 transition-colors cursor-col-resize`}
                    />
                    <Panel defaultSize={40} minSize={isMobile ? 35 : 20}>
                        <RightPanel />
                    </Panel>
                </PanelGroup>
            </div>
        </AuthProvider>
    );
}
