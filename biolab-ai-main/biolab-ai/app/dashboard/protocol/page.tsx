import { ProtocolWorkspace } from "@/components/dashboard/ProtocolWorkspace";
import { getWorkspaceConfig } from "@/lib/dashboard-workspaces";

export default function ProtocolPage() {
    return <ProtocolWorkspace config={getWorkspaceConfig("protocol")} />;
}

