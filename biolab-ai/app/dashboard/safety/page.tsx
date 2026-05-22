import { ModuleWorkspace } from "@/components/dashboard/ModuleWorkspace";
import { getWorkspaceConfig } from "@/lib/dashboard-workspaces";

export default function SafetyPage() {
    return <ModuleWorkspace config={getWorkspaceConfig("safety")} />;
}

