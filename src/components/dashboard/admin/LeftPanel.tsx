"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import AddNewData from "./AddNewData";
import CleanDatabase from "./CleanDatabase";
import ViewHistory from "./ViewHistory";

export default function LeftPanel() {
    return (
        <aside className="h-full">
            <PanelGroup direction="vertical">
                <Panel minSize={20} defaultSize={33}>
                    <div className="h-full overflow-auto">
                        <AddNewData />
                    </div>
                </Panel>
                <PanelResizeHandle className="h-1 bg-gray-300 hover:bg-gray-500 transition-colors cursor-col-resize" />
                <Panel minSize={20} defaultSize={33}>
                    <div className="h-full overflow-auto">
                        <CleanDatabase />
                    </div>
                </Panel>
                <PanelResizeHandle className="h-1 bg-gray-300 hover:bg-gray-500 transition-colors cursor-col-resize" />
                <Panel minSize={20} defaultSize={34}>
                    <div className="h-full overflow-auto">
                        <ViewHistory />
                    </div>
                </Panel>
            </PanelGroup>
        </aside>
    );
}
