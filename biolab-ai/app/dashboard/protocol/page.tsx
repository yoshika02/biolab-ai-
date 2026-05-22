import { ModuleWorkspace } from "@/components/dashboard/ModuleWorkspace";
import { getWorkspaceConfig } from "@/lib/dashboard-workspaces";

export default function ProtocolPage() {
    return <ModuleWorkspace config={getWorkspaceConfig("protocol")} />;
}

